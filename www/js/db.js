// ══════════════════════════════════════════
//  db.js — SQLite ในเครื่อง (offline, ไม่ต้องมีเน็ต)
//  ใช้ @capacitor-community/sqlite ผ่าน Capacitor.Plugins ตรงๆ
//  ไม่ต้องมี bundler เพราะ plugin ถูก native runtime inject
//  ให้เป็น window.Capacitor.Plugins.CapacitorSQLite อัตโนมัติ
// ══════════════════════════════════════════

const DB_NAME = 'scrapdb';

const DB = (() => {
  let ready = false;

  function sqlite() {
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.CapacitorSQLite) {
      throw new Error('CapacitorSQLite plugin ไม่พร้อมใช้งาน (ต้องรันบนแอพ Android ที่ sync plugin แล้ว)');
    }
    return window.Capacitor.Plugins.CapacitorSQLite;
  }

  async function init() {
    if (ready) return;
    const sq = sqlite();
    try {
      await sq.createConnection({ database: DB_NAME, version: 1, encrypted: false, mode: 'no-encryption', readonly: false });
    } catch (e) {
      // connection อาจมีอยู่แล้วจากรอบก่อน ไม่เป็นไร
    }
    await sq.open({ database: DB_NAME, readonly: false });

    await sq.execute({
      database: DB_NAME,
      statements: `
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          unit TEXT DEFAULT 'กก.',
          buy_price REAL DEFAULT 0,
          sell_price REAL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,           -- 'buy' หรือ 'sell'
          item_name TEXT NOT NULL,
          qty REAL NOT NULL,
          price_per_unit REAL NOT NULL,
          total REAL NOT NULL,
          created_at TEXT NOT NULL      -- ISO datetime string
        );
      `,
      transaction: true
    });
    ready = true;
  }

  // ── items ──
  async function getItems() {
    await init();
    const sq = sqlite();
    const res = await sq.query({ database: DB_NAME, statement: 'SELECT * FROM items ORDER BY name COLLATE NOCASE ASC;', values: [] });
    return res.values || [];
  }

  async function addItem(name, unit, buyPrice, sellPrice) {
    await init();
    const sq = sqlite();
    await sq.run({
      database: DB_NAME,
      statement: 'INSERT INTO items (name, unit, buy_price, sell_price) VALUES (?, ?, ?, ?);',
      values: [name, unit || 'กก.', buyPrice || 0, sellPrice || 0]
    });
  }

  async function updateItem(id, name, unit, buyPrice, sellPrice) {
    await init();
    const sq = sqlite();
    await sq.run({
      database: DB_NAME,
      statement: 'UPDATE items SET name=?, unit=?, buy_price=?, sell_price=? WHERE id=?;',
      values: [name, unit, buyPrice, sellPrice, id]
    });
  }

  async function deleteItem(id) {
    await init();
    const sq = sqlite();
    await sq.run({ database: DB_NAME, statement: 'DELETE FROM items WHERE id=?;', values: [id] });
  }

  // ── transactions ──
  async function addTransaction(type, itemName, qty, pricePerUnit) {
    await init();
    const sq = sqlite();
    const total = qty * pricePerUnit;
    const now = new Date().toISOString();
    await sq.run({
      database: DB_NAME,
      statement: 'INSERT INTO transactions (type, item_name, qty, price_per_unit, total, created_at) VALUES (?, ?, ?, ?, ?, ?);',
      values: [type, itemName, qty, pricePerUnit, total, now]
    });
    return total;
  }

  async function getTodayTransactions() {
    await init();
    const sq = sqlite();
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const res = await sq.query({
      database: DB_NAME,
      statement: `SELECT * FROM transactions WHERE substr(created_at,1,10)=? ORDER BY created_at DESC;`,
      values: [todayStr]
    });
    return res.values || [];
  }

  async function getAllTransactions() {
    await init();
    const sq = sqlite();
    const res = await sq.query({ database: DB_NAME, statement: 'SELECT * FROM transactions ORDER BY created_at DESC;', values: [] });
    return res.values || [];
  }

  async function deleteTransaction(id) {
    await init();
    const sq = sqlite();
    await sq.run({ database: DB_NAME, statement: 'DELETE FROM transactions WHERE id=?;', values: [id] });
  }

  return {
    init, getItems, addItem, updateItem, deleteItem,
    addTransaction, getTodayTransactions, getAllTransactions, deleteTransaction
  };
})();
