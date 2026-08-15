/* ============================================================
   db/db.js — wraps @capacitor-community/sqlite for the `users`
   table (see db/schema.sql). Exposes window.AuthDB with:
     - initDatabase(): open db, create table if missing, seed a
       demo user on first run
     - getAllUsers(): active users for the login picker — never
       returns pin_hash/pin_salt
     - verifyPin(userId, pin): true/false

   ⚠️ PLUGIN API PARTIALLY DEVICE-TESTED. This calls the raw
   Capacitor.Plugins.CapacitorSQLite bridge directly (no bundler/
   import — matches this project's plain <script> tag setup, no
   build step). A real device test surfaced one confirmed bug,
   fixed below: open() was being called without createConnection()
   first (the plugin is connection-based; its normal JS wrapper
   class does that step for you, which this hand-written bridge
   version has to do explicitly). If initDatabase() still throws
   after that fix, check the error text shown on screen (login-
   page.js now surfaces it directly, not just to console) against
   the installed @capacitor-community/sqlite version's docs for
   `createConnection`/`open`/`execute`/`query`/`run` — everything
   in the app calls ONLY the functions in this file, so any further
   fix stays contained here.

   🌐 BROWSER FALLBACK: CapacitorSQLite only exists inside the
   native app. Opening these HTML files directly in a browser (like
   the README's "ทดสอบในเบราว์เซอร์ก่อน" step) has no SQLite at all —
   this file detects that and falls back to an in-memory user list
   (same shape, one demo user) so the login flow is still clickable
   and testable without a device. It resets every page reload;
   that's expected in this fallback, not a bug.

   🔑 DEFAULT DEMO PIN: the seeded demo user's PIN is 000000 — this
   is ONLY so the login flow has something to test end-to-end.
   There is no user-management screen to change/add PINs yet (see
   the "จัดการผู้ใช้งาน" placeholder row in data/settings.js) — build
   that before shipping this to a real shop, and remove/replace the
   demo user.
   ============================================================ */
const AuthDB = (function () {
  const DB_NAME = 'shopapp';
  let usingRealSqlite = false;
  let sqlitePlugin = null;

  // In-memory fallback store (browser testing only — see note above)
  let fallbackUsers = [
    {
      id: 1,
      name: 'ผู้ดูแลระบบ (ตัวอย่าง)',
      role: 'owner',
      avatar_icon: '👤',
      pin_hash: null, // computed lazily on first verify, see ensureFallbackSeeded()
      pin_salt: 'demo-salt-do-not-use-in-production',
      active: 1
    }
  ];
  let fallbackSeeded = false;

  async function ensureFallbackSeeded() {
    if (fallbackSeeded) return;
    fallbackUsers[0].pin_hash = await window.AuthPinHash.hashPin('000000', fallbackUsers[0].pin_salt);
    fallbackSeeded = true;
  }

  async function initDatabase() {
    sqlitePlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorSQLite;
    usingRealSqlite = !!sqlitePlugin;

    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      return;
    }

    // @capacitor-community/sqlite uses a CONNECTION-based API: a
    // connection must be registered with createConnection() before
    // it can be opened. The plugin's normal npm/JS wrapper class
    // (SQLiteConnection) does this step for you automatically —
    // since this project calls the raw native bridge directly (no
    // bundler, see the file header), it has to be done by hand
    // here. Missing this call is the most likely reason
    // initDatabase() throws on a real device.
    try {
      await sqlitePlugin.createConnection({
        database: DB_NAME,
        version: 1,
        encrypted: false,
        mode: 'no-encryption',
        readonly: false
      });
    } catch (err) {
      // "already exists" is fine (e.g. re-running initDatabase() in
      // the same app session) — anything else is a real problem and
      // should still surface to the caller.
      const msg = String((err && err.message) || err).toLowerCase();
      if (!msg.includes('already exist')) throw err;
    }

    const schema = await fetch('js/db/schema.sql').then(r => r.text());

    await sqlitePlugin.open({ database: DB_NAME });
    await sqlitePlugin.execute({ database: DB_NAME, statements: schema });

    // Seed the demo user only if the table is empty (first run)
    const countResult = await sqlitePlugin.query({
      database: DB_NAME,
      statement: 'SELECT COUNT(*) as n FROM users',
      values: []
    });
    const isEmpty = !countResult.values || !countResult.values[0] || countResult.values[0].n === 0;

    if (isEmpty) {
      const salt = window.AuthPinHash.generateSalt();
      const hash = await window.AuthPinHash.hashPin('000000', salt);
      await sqlitePlugin.run({
        database: DB_NAME,
        statement: `INSERT INTO users (name, role, avatar_icon, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)`,
        values: ['ผู้ดูแลระบบ (ตัวอย่าง)', 'owner', '👤', hash, salt]
      });
    }
  }

  async function getAllUsers() {
    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      return fallbackUsers
        .filter(u => u.active)
        .map(({ id, name, role, avatar_icon }) => ({ id, name, role, avatar_icon }));
    }

    const result = await sqlitePlugin.query({
      database: DB_NAME,
      statement: 'SELECT id, name, role, avatar_icon FROM users WHERE active = 1 ORDER BY id',
      values: []
    });
    return result.values || [];
  }

  async function verifyPin(userId, pin) {
    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      const user = fallbackUsers.find(u => u.id === userId);
      if (!user) return false;
      const attemptHash = await window.AuthPinHash.hashPin(pin, user.pin_salt);
      return attemptHash === user.pin_hash;
    }

    const result = await sqlitePlugin.query({
      database: DB_NAME,
      statement: 'SELECT pin_hash, pin_salt FROM users WHERE id = ? AND active = 1',
      values: [userId]
    });
    const row = result.values && result.values[0];
    if (!row) return false;
    const attemptHash = await window.AuthPinHash.hashPin(pin, row.pin_salt);
    return attemptHash === row.pin_hash;
  }

  // ---- User management (จัดการผู้ใช้งาน + เปลี่ยน PIN) ----
  // Everything below follows the same real-SQLite / in-memory-fallback
  // split as the functions above. None of these ever touch pin_hash/
  // pin_salt directly from the outside — callers only ever pass a raw
  // PIN in, hashing happens in here (createUser/setUserPin).

  // Full roster for the management page — unlike getAllUsers() this
  // INCLUDES inactive (disabled) users, so they can be re-enabled.
  async function getAllUsersManaged() {
    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      return fallbackUsers.map(({ id, name, role, avatar_icon, active }) => ({ id, name, role, avatar_icon, active }));
    }

    const result = await sqlitePlugin.query({
      database: DB_NAME,
      statement: 'SELECT id, name, role, avatar_icon, active FROM users ORDER BY id',
      values: []
    });
    return result.values || [];
  }

  async function createUser({ name, role, avatar_icon, pin }) {
    const salt = window.AuthPinHash.generateSalt();
    const hash = await window.AuthPinHash.hashPin(pin, salt);

    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      const nextId = fallbackUsers.reduce((max, u) => Math.max(max, u.id), 0) + 1;
      fallbackUsers.push({ id: nextId, name, role, avatar_icon, pin_hash: hash, pin_salt: salt, active: 1 });
      return nextId;
    }

    const runResult = await sqlitePlugin.run({
      database: DB_NAME,
      statement: `INSERT INTO users (name, role, avatar_icon, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)`,
      values: [name, role, avatar_icon, hash, salt]
    });
    // @capacitor-community/sqlite returns the new row id at
    // changes.lastId on run() — if a future plugin version doesn't,
    // this falls back to a MAX(id) lookup so createUser() still works.
    if (runResult && runResult.changes && runResult.changes.lastId) {
      return runResult.changes.lastId;
    }
    const idResult = await sqlitePlugin.query({
      database: DB_NAME,
      statement: 'SELECT MAX(id) as id FROM users',
      values: []
    });
    return idResult.values && idResult.values[0] && idResult.values[0].id;
  }

  async function updateUserProfile(id, { name, role, avatar_icon }) {
    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      const user = fallbackUsers.find(u => u.id === id);
      if (user) Object.assign(user, { name, role, avatar_icon });
      return;
    }

    await sqlitePlugin.run({
      database: DB_NAME,
      statement: 'UPDATE users SET name = ?, role = ?, avatar_icon = ? WHERE id = ?',
      values: [name, role, avatar_icon, id]
    });
  }

  // Disable/re-enable a user (soft delete — keeps history intact,
  // matches the `active` column's purpose in schema.sql). There is
  // no hard-delete here on purpose.
  async function setUserActive(id, isActive) {
    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      const user = fallbackUsers.find(u => u.id === id);
      if (user) user.active = isActive ? 1 : 0;
      return;
    }

    await sqlitePlugin.run({
      database: DB_NAME,
      statement: 'UPDATE users SET active = ? WHERE id = ?',
      values: [isActive ? 1 : 0, id]
    });
  }

  // Rotates the salt too (not just the hash) — same reasoning as the
  // initial seed: never reuse a salt across a PIN change.
  async function setUserPin(id, newPin) {
    const salt = window.AuthPinHash.generateSalt();
    const hash = await window.AuthPinHash.hashPin(newPin, salt);

    if (!usingRealSqlite) {
      await ensureFallbackSeeded();
      const user = fallbackUsers.find(u => u.id === id);
      if (user) Object.assign(user, { pin_hash: hash, pin_salt: salt });
      return;
    }

    await sqlitePlugin.run({
      database: DB_NAME,
      statement: 'UPDATE users SET pin_hash = ?, pin_salt = ? WHERE id = ?',
      values: [hash, salt, id]
    });
  }

  return {
    initDatabase, getAllUsers, verifyPin,
    getAllUsersManaged, createUser, updateUserProfile, setUserActive, setUserPin
  };
})();

window.AuthDB = AuthDB;
