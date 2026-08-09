// ══════════════════════════════════════════
//  history.js — Logic for history.html (ประวัติการซื้อขาย)
//  ScrapPOS
// ══════════════════════════════════════════

async function sbFetch(path, opts = {}) {
  return localRest(path, opts);
}

const TYPE_META = {
  buy:      { icon: 'ph-download-simple', color: '#0A84FF', bg: 'rgba(10,132,255,0.10)', label: 'รับซื้อ' },
  sell:     { icon: 'ph-upload-simple',   color: '#FF6B00', bg: 'rgba(255,107,0,0.10)',  label: 'ขายออก' },
  sort:     { icon: 'ph-recycle',         color: '#00B86B', bg: 'rgba(0,184,107,0.10)',  label: 'คัดแยก' },
  deposit:  { icon: 'ph-plus-circle',     color: '#00C853', bg: 'rgba(0,200,83,0.10)',   label: 'เติมเงิน' },
  withdraw: { icon: 'ph-minus-circle',    color: '#FF3B30', bg: 'rgba(255,59,48,0.10)',  label: 'ถอนเงิน' },
};

let ALL_TXNS = [];
let activeFilter = 'all';

function fmtB(n) {
  const v = Number(n || 0);
  return v === Math.floor(v)
    ? v.toLocaleString('th-TH')
    : v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function safeParse(s) {
  try { return s ? JSON.parse(s) : null; } catch (_) { return null; }
}

// ══════════════════════════════════════════
//  โหลดข้อมูล
// ══════════════════════════════════════════
async function loadHistory() {
  const wrap = document.getElementById('tl-wrap');
  wrap.innerHTML = `<div class="tl-loading"><i class="ph ph-spinner-gap spin"></i> กำลังโหลด...</div>`;
  try {
    ALL_TXNS = await sbFetch(
      'transactions?select=id,type,total_amount,total_kg,factory_name,lines,created_at&order=created_at.desc'
    ) || [];
  } catch (err) {
    wrap.innerHTML = `<div class="tl-empty"><i class="ph ph-warning-circle"></i><div>โหลดข้อมูลไม่สำเร็จ</div></div>`;
    return;
  }
  render();
}

window.setFilter = function(btn, type) {
  document.querySelectorAll('.hf-pill').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  activeFilter = type;
  render();
};

// ══════════════════════════════════════════
//  เรนเดอร์ไทม์ไลน์ (จัดกลุ่มตามวันที่)
// ══════════════════════════════════════════
function render() {
  const wrap = document.getElementById('tl-wrap');
  const rows = activeFilter === 'all'    ? ALL_TXNS
             : activeFilter === 'cash'   ? ALL_TXNS.filter(t => t.type === 'deposit' || t.type === 'withdraw')
             : ALL_TXNS.filter(t => t.type === activeFilter);

  if (!rows.length) {
    wrap.innerHTML = `<div class="tl-empty"><i class="ph ph-receipt"></i><div>ยังไม่มีรายการ</div></div>`;
    return;
  }

  const groups = [];
  let lastKey = null;
  for (const t of rows) {
    const key = new Date(t.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    if (key !== lastKey) { groups.push({ key, items: [] }); lastKey = key; }
    groups[groups.length - 1].items.push(t);
  }

  wrap.innerHTML = groups.map(g => `
    <div class="tl-date-header">${g.key}</div>
    <div class="tl-group">
      ${g.items.map((t, i) => renderItem(t, i === g.items.length - 1)).join('')}
    </div>
  `).join('');
}

function summarize(t) {
  const time = new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const lines = safeParse(t.lines);

  if (t.type === 'buy' || t.type === 'sell') {
    const arr = Array.isArray(lines) ? lines : [];
    const names = arr.map(l => l.item_name).filter(Boolean);
    const nameStr = names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
    const kgStr = t.total_kg ? ` • ${fmtB(t.total_kg)} กก.` : '';
    const title = t.type === 'buy'
      ? `รับซื้อ ${arr.length} รายการ`
      : `ส่งขาย${t.factory_name ? ' — ' + t.factory_name : ''}`;
    return { title, sub: `${nameStr}${kgStr} • ${time} น.` };
  }
  if (t.type === 'sort') {
    const from = (lines && lines.from) || {};
    const results = (lines && lines.results) || [];
    const title = `คัดแยก${from.name ? ' — ' + from.name : ''}`;
    return { title, sub: `แยกเป็น ${results.length} รายการ • ${fmtB(t.total_kg || 0)} กก. • ${time} น.` };
  }
  const title = t.factory_name || (t.type === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน');
  return { title, sub: `${time} น.` };
}

function renderItem(t, isLast) {
  const meta = TYPE_META[t.type] || TYPE_META.buy;
  const { title, sub } = summarize(t);

  let amtHtml;
  if (t.type === 'sort') {
    amtHtml = `<div class="tl-card-amt neutral">${fmtB(t.total_kg || 0)} กก.</div>`;
  } else {
    const isPlus = t.type === 'sell' || t.type === 'deposit';
    amtHtml = `<div class="tl-card-amt ${isPlus ? 'plus' : 'minus'}">${isPlus ? '+' : '−'}฿${fmtB(t.total_amount)}</div>`;
  }

  return `
    <div class="tl-item" onclick="openDetail(${t.id})">
      <div class="tl-track">
        <div class="tl-dot" style="background:${meta.bg};color:${meta.color};"><i class="ph ${meta.icon}"></i></div>
        ${isLast ? '' : '<div class="tl-line"></div>'}
      </div>
      <div class="tl-card">
        <div class="tl-card-top">
          <div class="tl-card-title">${esc(title)}</div>
          ${amtHtml}
        </div>
        <div class="tl-card-sub">${esc(sub)}</div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════
//  DETAIL SHEET — กดรายการเพื่อดูรายละเอียด
// ══════════════════════════════════════════
window.openDetail = function(id) {
  const t = ALL_TXNS.find(x => Number(x.id) === Number(id));
  if (!t) return;
  const meta = TYPE_META[t.type] || TYPE_META.buy;
  const lines = safeParse(t.lines);

  const dateStr = new Date(t.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  let bodyHtml = '';
  if (t.type === 'buy' || t.type === 'sell') {
    const arr = Array.isArray(lines) ? lines : [];
    const factoryHtml = (t.type === 'sell' && t.factory_name)
      ? `<div class="hd-factory"><i class="ph ph-factory"></i> ${esc(t.factory_name)}</div>` : '';
    bodyHtml = factoryHtml + arr.map(l => `
      <div class="hd-line">
        <div class="hd-line-left">
          <div class="hd-line-name">${esc(l.item_name)}</div>
          <div class="hd-line-detail">${fmtB(l.qty)} ${esc(l.unit_label || (l.mode === 'kg' ? 'กก.' : 'ชิ้น'))} × ฿${fmtB(l.price)}</div>
        </div>
        <div class="hd-line-amt">฿${fmtB(l.subtotal)}</div>
      </div>`).join('');
  } else if (t.type === 'sort') {
    const from = (lines && lines.from) || {};
    const results = (lines && lines.results) || [];
    bodyHtml = `
      <div class="hd-sort-from"><i class="ph ph-arrow-fat-line-down"></i> จาก: <b>${esc(from.name || '—')}</b> ${fmtB(from.kg || 0)} กก.</div>
      ${results.map(r => `
        <div class="hd-line">
          <div class="hd-line-left">
            <div class="hd-line-name"><i class="ph ph-arrow-elbow-down-right"></i> ${esc(r.item_name || '—')}</div>
          </div>
          <div class="hd-line-amt">${fmtB(r.kg)} กก.</div>
        </div>`).join('')}`;
  } else {
    bodyHtml = `<div class="hd-note">${esc(t.factory_name || (t.type === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน'))}</div>`;
  }

  const iconEl = document.getElementById('hd-icon');
  iconEl.style.background = meta.bg;
  iconEl.style.color = meta.color;
  iconEl.innerHTML = `<i class="ph ${meta.icon}"></i>`;
  document.getElementById('hd-title').textContent = meta.label;
  document.getElementById('hd-date').textContent = `${dateStr} • ${timeStr} น.`;
  document.getElementById('hd-amt').textContent =
    t.type === 'sort' ? `${fmtB(t.total_kg || 0)} กก.` : `฿${fmtB(t.total_amount)}`;
  document.getElementById('hd-amt').className = 'hd-amt ' + (t.type === 'sell' || t.type === 'deposit' ? 'plus' : t.type === 'sort' ? 'neutral' : 'minus');
  document.getElementById('hd-body').innerHTML = bodyHtml;

  document.getElementById('hd-backdrop').classList.add('show');
  document.getElementById('hd-sheet').classList.add('show');
  document.body.style.overflow = 'hidden';
};

window.closeDetail = function() {
  document.getElementById('hd-backdrop').classList.remove('show');
  document.getElementById('hd-sheet').classList.remove('show');
  document.body.style.overflow = '';
};

loadHistory();
