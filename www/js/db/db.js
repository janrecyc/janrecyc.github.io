/* ============================================================
   db/db.js — wraps @capacitor-community/sqlite for the `users`
   table (see db/schema.sql). Exposes window.AuthDB with:
     - initDatabase(): open db, create table if missing, seed a
       demo user on first run
     - getAllUsers(): active users for the login picker — never
       returns pin_hash/pin_salt
     - verifyPin(userId, pin): true/false
     - getAllUsersForManagement(): active + inactive, for the
       "จัดการผู้ใช้งาน" admin list
     - createUser({name, role, pin}): adds a new user
     - updateUserInfo(userId, {name, role}): edits name/role
     - updateUserPin(userId, newPin): resets a user's PIN
     - setUserActive(userId, isActive): soft delete/restore

   ⚠️ PLUGIN API PARTIALLY DEVICE-TESTED. This calls the raw
   Capacitor.Plugins.CapacitorSQLite bridge directly (no bundler/
   import — matches this project's plain <script> tag setup, no
   build step). A real device test confirmed the login/verify path
   above works correctly. The user-management functions added
   after that (createUser/updateUserInfo/updateUserPin/
   setUserActive) follow the exact same query/run call shape as the
   already-confirmed-working functions, so they're the same low
   risk — but they haven't been exercised on a device themselves
   yet. If one throws, the error now shows on screen (see
   manage-users-page.js / change-pin-page.js), and every plugin
   call in the app still lives only in this one file.

   🌐 BROWSER FALLBACK: CapacitorSQLite only exists inside the
   native app. Opening these HTML files directly in a browser (like
   the README's "ทดสอบในเบราว์เซอร์ก่อน" step) has no SQLite at all —
   this file detects that and falls back to an in-memory user list
   (same shape, one demo user) so the login flow is still clickable
   and testable without a device. It resets every page reload;
   that's expected in this fallback, not a bug.

   🔑 DEFAULT DEMO PIN: the seeded demo user's PIN is 000000 — this
   is ONLY so the login flow has something to test end-to-end.
   Now that "จัดการผู้ใช้งาน" is built, use it to add a real owner
   account and deactivate/delete this demo user before shipping to
   a real shop.

   🔒 DATABASE ENCRYPTION (SQLCipher, via this plugin's `encrypted`
   option) — NOT DEVICE-TESTED YET, same "errors show on screen"
   safety net as the user-management functions above applies here
   too. What this does and doesn't defend against:
     - DOES stop someone who copies the raw .db file off the device
       (e.g. an unencrypted phone backup, a forensic file-pull, or
       just browsing app data with a file manager on an old rooted
       Android where WebView storage isn't readable) from opening it
       in a normal SQLite browser and reading pin_hash/pin_salt/names
       straight out.
     - Does NOT defend against a fully rooted device where the
       attacker can also read this app's OTHER storage — the
       encryption passphrase itself lives in localStorage (see
       getOrCreateDbSecret() below), which is the same trust level
       the raw .db file used to be at. Root access that can read one
       can read the other. True protection against that threat needs
       the passphrase in Android Keystore (hardware-backed), which
       needs custom native code beyond this plain-<script>-tag
       template — flagging this honestly rather than overselling it.
   ============================================================ */
const AuthDB = (function () {
  const DB_NAME = 'shopapp';
  const DB_SECRET_KEY = 'shopapp_db_secret'; // localStorage key — see 🔒 note above for what this is/isn't safe from
  let usingRealSqlite = false;
  let sqlitePlugin = null;

  // Random per-install passphrase for the encrypted database. Generated
  // once, then reused on every launch — losing it (e.g. clearing app
  // storage without exporting first) makes the existing DB unreadable,
  // same as forgetting any encryption password.
  function getOrCreateDbSecret() {
    let secret = localStorage.getItem(DB_SECRET_KEY);
    if (!secret) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      secret = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(DB_SECRET_KEY, secret);
    }
    return secret;
  }

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
  let fallbackNextId = 2;

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

    // Register the passphrase with the plugin before touching the
    // connection at all — the plugin needs this in place first for
    // both encrypting a brand-new DB and re-opening an existing one.
    const secret = getOrCreateDbSecret();
    try {
      const stored = await sqlitePlugin.isSecretStored();
      if (!stored || !stored.result) {
        await sqlitePlugin.setEncryptionSecret({ passphrase: secret });
      }
    } catch (err) {
      console.error('setEncryptionSecret() failed:', err);
      throw err;
    }

    // mode 'secret' vs 'encryption': 'secret' is for the FIRST TIME a
    // database is created/encrypted using the passphrase just set
    // above; 'encryption' is for re-opening an already-encrypted DB
    // on every later launch. Check whether the DB file already exists
    // to pick the right one.
    let dbAlreadyExists = false;
    try {
      const existsResult = await sqlitePlugin.isDatabaseExist({ database: DB_NAME });
      dbAlreadyExists = !!(existsResult && existsResult.result);
    } catch (err) {
      console.error('isDatabaseExist() failed:', err);
      throw err;
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
        encrypted: true,
        mode: dbAlreadyExists ? 'encryption' : 'secret',
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

  // ---- User management (จัดการผู้ใช้งาน) ----

  async function getAllUsersForManagement() {
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

  async function createUser({ name, role, pin }) {
    const salt = window.AuthPinHash.generateSalt();
    const hash = await window.AuthPinHash.hashPin(pin, salt);

    if (!usingRealSqlite) {
      const user = {
        id: fallbackNextId++,
        name,
        role: role || 'staff',
        avatar_icon: '👤',
        pin_hash: hash,
        pin_salt: salt,
        active: 1
      };
      fallbackUsers.push(user);
      return user;
    }

    await sqlitePlugin.run({
      database: DB_NAME,
      statement: 'INSERT INTO users (name, role, avatar_icon, pin_hash, pin_salt) VALUES (?, ?, ?, ?, ?)',
      values: [name, role || 'staff', '👤', hash, salt]
    });
  }

  async function updateUserInfo(userId, { name, role }) {
    if (!usingRealSqlite) {
      const user = fallbackUsers.find(u => u.id === userId);
      if (user) {
        user.name = name;
        user.role = role;
      }
      return;
    }

    await sqlitePlugin.run({
      database: DB_NAME,
      statement: 'UPDATE users SET name = ?, role = ? WHERE id = ?',
      values: [name, role, userId]
    });
  }

  async function updateUserPin(userId, newPin) {
    const salt = window.AuthPinHash.generateSalt();
    const hash = await window.AuthPinHash.hashPin(newPin, salt);

    if (!usingRealSqlite) {
      const user = fallbackUsers.find(u => u.id === userId);
      if (user) {
        user.pin_hash = hash;
        user.pin_salt = salt;
      }
      return;
    }

    await sqlitePlugin.run({
      database: DB_NAME,
      statement: 'UPDATE users SET pin_hash = ?, pin_salt = ? WHERE id = ?',
      values: [hash, salt, userId]
    });
  }

  async function setUserActive(userId, isActive) {
    if (!usingRealSqlite) {
      const user = fallbackUsers.find(u => u.id === userId);
      if (user) user.active = isActive ? 1 : 0;
      return;
    }

    await sqlitePlugin.run({
      database: DB_NAME,
      statement: 'UPDATE users SET active = ? WHERE id = ?',
      values: [isActive ? 1 : 0, userId]
    });
  }

  return {
    initDatabase,
    getAllUsers,
    verifyPin,
    getAllUsersForManagement,
    createUser,
    updateUserInfo,
    updateUserPin,
    setUserActive
  };
})();

window.AuthDB = AuthDB;
