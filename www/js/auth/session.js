/* ============================================================
   auth/session.js — the CURRENT logged-in user and the
   "require login" app-level flag. Both are simple device-local
   preferences (not "member data"), so they live in localStorage —
   same pattern as theme.js — NOT in the SQLite users table.

   Available everywhere as window.AuthSession.{
     getSession, setSession, clearSession,
     isLoginRequired, setLoginRequired
   }
   ============================================================ */
(function () {
  const SESSION_KEY = 'auth_session';       // JSON: { userId, name, role }
  const REQUIRE_LOGIN_KEY = 'auth_require_login'; // 'true' | 'false'

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      userId: user.id,
      name: user.name,
      role: user.role
    }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoginRequired() {
    // Default OFF — installing this update shouldn't suddenly lock
    // an existing shop out of their own app with no users set up yet.
    return localStorage.getItem(REQUIRE_LOGIN_KEY) === 'true';
  }

  function setLoginRequired(isOn) {
    localStorage.setItem(REQUIRE_LOGIN_KEY, isOn ? 'true' : 'false');
  }

  window.AuthSession = {
    getSession, setSession, clearSession,
    isLoginRequired, setLoginRequired
  };
})();
