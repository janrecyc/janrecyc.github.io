// ══════════════════════════════════════════
//  db.js — SQLite ในเครื่อง (offline, ไม่ต้องมีเน็ต)
//  ใช้ @capacitor-community/sqlite ผ่าน Capacitor.Plugins ตรงๆ
// ══════════════════════════════════════════

const DB_NAME = 'scrapposdb';
let _dbReady = false;

function _sqlite() {
  if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.CapacitorSQLite) {
    throw new Error('CapacitorSQLite plugin ไม่พร้อมใช้งาน (ต้องรันบนแอพ Android ที่ sync plugin แล้ว)');
  }
  return window.Capacitor.Plugins.CapacitorSQLite;
}

async function dbInit() {
  if (_dbReady) return;
  const sq = _sqlite();
  try {
    await sq.createConnection({ database: DB_NAME, version: 1, encrypted: false, mode: 'no-encryption', readonly: false });
  } catch (e) { /* connection อาจมีอยู่แล้ว ไม่เป็นไร */ }
  await sq.open({ database: DB_NAME, readonly: false });

  await sq.execute({
    database: DB_NAME,
    statements: `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        icon TEXT
      );
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT,
        cat TEXT,
        buy_price REAL DEFAULT 0,
        sell_price REAL DEFAULT 0,
        stock_qty REAL DEFAULT 0,
        unit TEXT DEFAULT 'กก.',
        sell_mode TEXT DEFAULT 'kg',
        created_at TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        total_amount REAL DEFAULT 0,
        total_kg REAL,
        factory_name TEXT,
        lines TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS factories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        name TEXT,
        phone TEXT,
        line_id TEXT,
        facebook_page TEXT,
        address TEXT,
        open_time TEXT,
        close_time TEXT,
        open_days TEXT,
        maps_url TEXT,
        lat REAL,
        lng REAL,
        is_active INTEGER DEFAULT 1
      );
    `,
    transaction: true
  });
  _dbReady = true;
}

// รัน SQL ที่ไม่คืนค่าแถว (INSERT/UPDATE/DELETE)
async function dbRun(sql, values = []) {
  await dbInit();
  const sq = _sqlite();
  return sq.run({ database: DB_NAME, statement: sql, values });
}

// รัน SQL ที่คืนค่าแถว (SELECT)
async function dbQuery(sql, values = []) {
  await dbInit();
  const sq = _sqlite();
  const res = await sq.query({ database: DB_NAME, statement: sql, values });
  return res.values || [];
}
