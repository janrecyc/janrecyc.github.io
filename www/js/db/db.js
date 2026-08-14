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

  return { initDatabase, getAllUsers, verifyPin };
})();

window.AuthDB = AuthDB;
