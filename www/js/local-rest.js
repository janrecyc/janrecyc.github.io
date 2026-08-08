// ══════════════════════════════════════════
//  local-rest.js
//  แปลง path/opts สไตล์ Supabase REST (PostgREST) ให้ทำงานกับ
//  SQLite ในเครื่องแทน — ไม่ต้องแก้ logic เดิมในหน้า buy/sell/sort/items/dashboard
//  เพราะไฟล์เหล่านั้นเรียกผ่านฟังก์ชัน sbFetch()/sb() ที่ path เดียวกันอยู่แล้ว
// ══════════════════════════════════════════

const KNOWN_TABLES = ['items', 'categories', 'transactions', 'factories', 'profiles'];

function _nowIso() { return new Date().toISOString(); }

// แปลงค่า filter แบบ PostgREST เช่น "eq.5" "in.(a,b)" "gte.10"
function _parseFilterValue(raw) {
  if (raw.startsWith('eq.'))  return { op: '=',  val: _coerce(raw.slice(3)) };
  if (raw.startsWith('neq.')) return { op: '!=', val: _coerce(raw.slice(4)) };
  if (raw.startsWith('gte.')) return { op: '>=', val: _coerce(raw.slice(4)) };
  if (raw.startsWith('lte.')) return { op: '<=', val: _coerce(raw.slice(4)) };
  if (raw.startsWith('gt.'))  return { op: '>',  val: _coerce(raw.slice(3)) };
  if (raw.startsWith('lt.'))  return { op: '<',  val: _coerce(raw.slice(3)) };
  if (raw.startsWith('in.')) {
    const inner = raw.slice(3).replace(/^\(|\)$/g, '');
    const list = inner.split(',').filter(Boolean).map(_coerce);
    return { op: 'IN', val: list };
  }
  return { op: '=', val: _coerce(raw) };
}
function _coerce(v) {
  if (v === 'true') return 1;
  if (v === 'false') return 0;
  if (v !== '' && !isNaN(v)) return Number(v);
  return v;
}

function _buildWhere(params) {
  const clauses = [];
  const values = [];
  for (const [key, raw] of params.entries()) {
    if (['select', 'order', 'limit'].includes(key)) continue;
    const { op, val } = _parseFilterValue(raw);
    if (op === 'IN') {
      clauses.push(`${key} IN (${val.map(() => '?').join(',')})`);
      values.push(...val);
    } else {
      clauses.push(`${key} ${op} ?`);
      values.push(val);
    }
  }
  return { sql: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', values };
}

function _buildOrder(params) {
  const order = params.get('order');
  if (!order) return '';
  const parts = order.split(',').map(p => {
    const [col, dir] = p.split('.');
    return `${col} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  });
  return 'ORDER BY ' + parts.join(', ');
}

async function _selectRows(table, params) {
  const select = params.get('select') || '*';
  const { sql: whereSql, values } = _buildWhere(params);
  const orderSql = _buildOrder(params);
  const limit = params.get('limit');
  const sql = `SELECT ${select} FROM ${table} ${whereSql} ${orderSql} ${limit ? 'LIMIT ' + Number(limit) : ''}`.trim();
  return dbQuery(sql, values);
}

async function _insertRow(table, body) {
  const payload = { ...body };
  if (table === 'transactions' && !payload.created_at) payload.created_at = _nowIso();
  const cols = Object.keys(payload);
  const placeholders = cols.map(() => '?').join(',');
  const values = cols.map(c => {
    const v = payload[c];
    return (v === undefined) ? null : v;
  });
  const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
  const res = await dbRun(sql, values);
  const newId = res && res.changes && res.changes.lastId;
  if (newId != null) {
    const rows = await dbQuery(`SELECT * FROM ${table} WHERE id = ?`, [newId]);
    return rows;
  }
  return [];
}

async function _updateRows(table, params, body) {
  const { sql: whereSql, values: whereValues } = _buildWhere(params);
  const cols = Object.keys(body);
  const setSql = cols.map(c => `${c} = ?`).join(', ');
  const setValues = cols.map(c => body[c]);
  const sql = `UPDATE ${table} SET ${setSql} ${whereSql}`;
  await dbRun(sql, [...setValues, ...whereValues]);
  return _selectRows(table, params);
}

async function _deleteRows(table, params) {
  const { sql: whereSql, values } = _buildWhere(params);
  await dbRun(`DELETE FROM ${table} ${whereSql}`, values);
  return null;
}

// ── RPC: การซื้อ/ขาย/คัดแยก ที่ต้องอัปเดตหลายตารางพร้อมกัน ──
async function _rpcRecordBuy(p) {
  const lines = p.p_lines || [];
  const totalAmount = lines.reduce((s, l) => s + (l.subtotal || 0), 0);
  const totalKg = lines.filter(l => l.mode === 'kg').reduce((s, l) => s + (l.qty || 0), 0);
  await dbRun(
    `INSERT INTO transactions (type, total_amount, total_kg, factory_name, lines, created_at) VALUES ('buy', ?, ?, NULL, ?, ?)`,
    [totalAmount, totalKg || null, JSON.stringify(lines), _nowIso()]
  );
  for (const l of lines) {
    await dbRun(`UPDATE items SET stock_qty = COALESCE(stock_qty,0) + ? WHERE id = ?`, [l.qty, l.item_id]);
  }
  return { success: true };
}

async function _rpcRecordSell(p) {
  const lines = p.p_lines || [];
  const totalAmount = lines.reduce((s, l) => s + (l.subtotal || 0), 0);
  const totalKg = lines.filter(l => l.mode === 'kg').reduce((s, l) => s + (l.qty || 0), 0);
  await dbRun(
    `INSERT INTO transactions (type, total_amount, total_kg, factory_name, lines, created_at) VALUES ('sell', ?, ?, ?, ?, ?)`,
    [totalAmount, totalKg || null, p.p_factory_name || null, JSON.stringify(lines), _nowIso()]
  );
  for (const l of lines) {
    await dbRun(`UPDATE items SET stock_qty = MAX(0, COALESCE(stock_qty,0) - ?) WHERE id = ?`, [l.qty, l.item_id]);
  }
  return { success: true };
}

async function _rpcRecordSort(p) {
  const fromKg = p.p_from_kg || 0;
  const results = p.p_results || [];
  await dbRun(`UPDATE items SET stock_qty = MAX(0, COALESCE(stock_qty,0) - ?) WHERE id = ?`, [fromKg, p.p_from_item_id]);
  for (const r of results) {
    await dbRun(`UPDATE items SET stock_qty = COALESCE(stock_qty,0) + ? WHERE id = ?`, [r.kg, r.item_id]);
  }
  await dbRun(
    `INSERT INTO transactions (type, total_amount, total_kg, factory_name, lines, created_at) VALUES ('sort', 0, ?, NULL, ?, ?)`,
    [fromKg, JSON.stringify({ from: { id: p.p_from_item_id, name: p.p_from_item_name, kg: fromKg }, results }), _nowIso()]
  );
  return { success: true };
}

async function _rpcResetAllData() {
  await dbRun(`DELETE FROM transactions`);
  const rows = await dbQuery(`SELECT COUNT(*) as c FROM items`);
  return { success: true, item_count: (rows[0] && rows[0].c) || 0 };
}

// ── ตัวจัดการหลัก ──
async function localRest(path, opts = {}) {
  const [rawPath, queryStr] = path.split('?');
  const params = new URLSearchParams(queryStr || '');
  const method = opts.method || 'GET';

  if (rawPath.startsWith('rpc/')) {
    const rpcName = rawPath.slice(4);
    const body = opts.body || {};
    if (rpcName === 'record_buy_transaction') return _rpcRecordBuy(body);
    if (rpcName === 'record_sell_transaction') return _rpcRecordSell(body);
    if (rpcName === 'record_sort') return _rpcRecordSort(body);
    if (rpcName === 'reset_all_data') return _rpcResetAllData();
    throw new Error(`ไม่รู้จัก RPC: ${rpcName}`);
  }

  const table = rawPath;
  if (!KNOWN_TABLES.includes(table)) {
    // ตารางที่ตัดออกแล้ว (เช่น reviews จาก JANRECYC) — คืนค่าว่างเงียบๆ ไม่ error
    if (method === 'GET') return [];
    return null;
  }

  if (method === 'GET')    return _selectRows(table, params);
  if (method === 'POST')   return _insertRow(table, opts.body || {});
  if (method === 'PATCH')  return _updateRows(table, params, opts.body || {});
  if (method === 'DELETE') return _deleteRows(table, params);
  throw new Error(`ไม่รองรับ method: ${method}`);
}
