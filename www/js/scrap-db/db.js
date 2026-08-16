// ══════════════════════════════════════════
//  js/scrap-db/db.js — SQLite ในเครื่อง (offline, ไม่ต้องมีเน็ต)
//  ใช้ @capacitor-community/sqlite ผ่าน Capacitor.Plugins ตรงๆ
//
//  ⚠️ ฐานข้อมูลนี้แยกจากฐานข้อมูล "users" (ระบบ login/PIN ของเทมเพลต
//  หลัก ที่ js/db/db.js → window.AuthDB, database name 'shopapp')
//  โดยตั้งใจ — คนละไฟล์ .db คนละ connection กัน:
//    - ล็อกอิน/PIN/จัดการผู้ใช้งาน → 'shopapp'   (window.AuthDB)
//    - สินค้า/หมวดหมู่/รายการซื้อขาย/โรงงาน → 'scrapposdb' (window.ScrapDB, ที่นี่)
//  @capacitor-community/sqlite รองรับหลาย connection พร้อมกันได้อยู่
//  แล้ว (คนละ `database:` name) ไม่ต้องมารวมเป็นไฟล์เดียวเพื่อให้ทำงาน
//  ร่วมกันได้ — หน้าไหนต้องใช้ทั้งสองฐาน (เช่น future: dashboard ที่
//  โชว์ชื่อพนักงานที่ล็อกอินอยู่ด้วย) โหลดสคริปต์ทั้งคู่ได้เลยตรงๆ
//  ไม่ชนกัน เพราะทุกอย่างที่นี่ห่อไว้ใต้ window.ScrapDB แล้ว (ไม่มี
//  ตัวแปร/ฟังก์ชันไหนหลุดออกไปเป็น global เปลือยๆ เหมือนก่อนหน้านี้)
// ══════════════════════════════════════════
const ScrapDB = (function () {

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
        logo TEXT,
        is_active INTEGER DEFAULT 1
      );
    `,
    transaction: true
  });
  await _migrateAddColumn(sq, 'profiles', 'logo', 'TEXT');
  _dbReady = true;
  await _seedDefaults(sq);
}

// เพิ่มคอลัมน์ให้ตารางที่มีอยู่แล้ว (สำหรับแอพที่เคยติดตั้งไปก่อนหน้านี้)
// CREATE TABLE IF NOT EXISTS ด้านบนจะไม่เพิ่มคอลัมน์ใหม่ให้ตารางเดิมที่มีอยู่แล้ว จึงต้องเช็คแยก
async function _migrateAddColumn(sq, table, column, type) {
  try {
    const info = await sq.query({ database: DB_NAME, statement: `PRAGMA table_info(${table})`, values: [] });
    const cols = (info.values || []).map(r => r.name);
    if (!cols.includes(column)) {
      await sq.execute({ database: DB_NAME, statements: `ALTER TABLE ${table} ADD COLUMN ${column} ${type};`, transaction: true });
    }
  } catch (e) { console.warn('_migrateAddColumn:', table, column, e); }
}

// ══════════════════════════════════════════
//  SEED ข้อมูลเริ่มต้น — รันครั้งเดียวตอนตารางว่าง
//  (ป้องกันปัญหา "เปิดแอพครั้งแรกแล้วไม่มีสินค้า/หมวดหมู่ให้เลือก")
// ══════════════════════════════════════════
async function _seedDefaults(sq) {
  const nowIso = new Date().toISOString();

  const catCount = await sq.query({ database: DB_NAME, statement: 'SELECT COUNT(*) as c FROM categories', values: [] });
  if (!((catCount.values && catCount.values[0] && catCount.values[0].c) || 0)) {
    await sq.execute({
      database: DB_NAME,
      statements: `
        INSERT INTO categories (slug, label, icon) VALUES
          ('metal',    'โลหะ',             'ph-nut'),
          ('paper',    'กระดาษ',           'ph-newspaper'),
          ('plastic',  'พลาสติก',          'ph-cube'),
          ('glass',    'แก้ว',             'ph-square'),
          ('electric', 'เครื่องใช้ไฟฟ้า', 'ph-plug-charging');
      `,
      transaction: true
    });
  }

  const itemCount = await sq.query({ database: DB_NAME, statement: 'SELECT COUNT(*) as c FROM items', values: [] });
  if (!((itemCount.values && itemCount.values[0] && itemCount.values[0].c) || 0)) {
    const seedItems = [
      ['เหล็กหนัก',           'ph-nut',           'metal',    4.50, 5.80, 0, 'กก.',  'kg'],
      ['เหล็กบาง',            'ph-pipe',          'metal',    2.80, 3.50, 0, 'กก.',  'kg'],
      ['ทองแดง',              'ph-coins',         'metal',    195,  215,  0, 'กก.',  'kg'],
      ['อลูมิเนียม',          'ph-steps',         'metal',    42,   50,   0, 'กก.',  'kg'],
      ['สแตนเลส',             'ph-gear-six',      'metal',    18,   22,   0, 'กก.',  'kg'],
      ['กระดาษหนังสือพิมพ์', 'ph-newspaper',     'paper',    2.20, 2.80, 0, 'กก.',  'kg'],
      ['กระดาษลัง',           'ph-package',       'paper',    2.50, 3.20, 0, 'กก.',  'kg'],
      ['กระดาษขาว',           'ph-file-text',     'paper',    3.00, 3.80, 0, 'กก.',  'kg'],
      ['พลาสติกขาว',          'ph-cube',          'plastic',  8.50, 11,   0, 'กก.',  'kg'],
      ['ขวด PET',             'ph-flask',         'plastic',  6.00, 8.00, 0, 'กก.',  'kg'],
      ['แก้วใส',              'ph-square',        'glass',    1.20, 1.60, 0, 'กก.',  'kg'],
      ['สายไฟทองแดง',        'ph-plug-charging', 'electric', 85,   100,  0, 'กก.',  'kg'],
      ['มอเตอร์เก่า',         'ph-lightning',     'electric', 25,   32,   0, 'ชิ้น', 'piece'],
    ];
    for (const [name, icon, cat, buy, sell, stock, unit, mode] of seedItems) {
      await sq.run({
        database: DB_NAME,
        statement: `INSERT INTO items (name, icon, cat, buy_price, sell_price, stock_qty, unit, sell_mode, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        values: [name, icon, cat, buy, sell, stock, unit, mode, nowIso, nowIso]
      });
    }
  }

  const facCount = await sq.query({ database: DB_NAME, statement: 'SELECT COUNT(*) as c FROM factories', values: [] });
  if (!((facCount.values && facCount.values[0] && facCount.values[0].c) || 0)) {
    await sq.execute({
      database: DB_NAME,
      statements: `
        INSERT INTO factories (name, location, is_active) VALUES
          ('โรงงาน A', 'อยุธยา',         1),
          ('โรงงาน B', 'สมุทรปราการ',   1),
          ('โรงงาน C', 'ชลบุรี',        1),
          ('โรงงาน D', 'ระยอง',         1);
      `,
      transaction: true
    });
  }
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

  // เฉพาะ 3 ฟังก์ชันนี้ที่ local-rest.js (และโค้ดอื่นในอนาคต) เรียกใช้จริง
  // ส่วน _sqlite/_migrateAddColumn/_seedDefaults เป็นรายละเอียดภายในเท่านั้น
  return { dbInit, dbRun, dbQuery };

})();

window.ScrapDB = ScrapDB;
