/* ============================================================
   auth/guard.js — include this on every PROTECTED page (index,
   shop, schedule, settings — not login.html itself) as the very
   first script in <head>, right after auth/session.js. Runs
   before paint, same timing as theme.js, so a locked-out user
   never sees a flash of the real page before being redirected.
   ============================================================ */
(function () {
  if (window.AuthSession && window.AuthSession.isLoginRequired() && !window.AuthSession.getSession()) {
    location.replace('login.html');
  }
})();
