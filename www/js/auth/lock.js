/* ============================================================
   auth/lock.js — bank-app-style app lock. Include on every
   PROTECTED page (same set as guard.js), right after guard.js.

   guard.js only checks once, at page load — it can't catch a user
   who backgrounds the app and comes back to a page that's still
   sitting alive in the WebView. This file covers that case:

     - App goes to background (isActive: false) → clear the
       session IMMEDIATELY. Not "mark for later" — gone right
       away, so even inspecting local storage while backgrounded
       shows no live session.
     - App comes back to foreground (isActive: true) → if login is
       required and there's no session, redirect to login.html
       right now, without waiting for the user to tap anything.

   Only runs when "เปิดใช้งานการเข้าสู่ระบบ" is ON — if login isn't
   required at all, this does nothing (same opt-in pattern as
   guard.js).

   🌐 BROWSER FALLBACK: window.Capacitor.Plugins.App only exists
   inside the native app (needs @capacitor/app, added to
   package.json — no native code changes needed, `cap sync`
   detects and links it automatically same as the sqlite plugin
   already does). Opening these HTML files directly in a browser
   has no app-background concept at all, so this file detects that
   and does nothing — same fallback pattern as db.js/theme.js.
   ============================================================ */
(function () {
  const appPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!appPlugin) return; // browser fallback — no-op, see note above

  appPlugin.addListener('appStateChange', ({ isActive }) => {
    if (!window.AuthSession || !window.AuthSession.isLoginRequired()) return;

    if (!isActive) {
      // App just left the foreground (home button, app switcher,
      // notification shade, phone call, etc.) — lock right now.
      window.AuthSession.clearSession();
      return;
    }

    // App just came back to the foreground. If there's still no
    // session (there won't be, since we just cleared it — this
    // also covers a session that expired/was cleared some other
    // way), force back to login instead of leaving whatever page
    // was open on screen visible underneath.
    if (!window.AuthSession.getSession() && !location.pathname.endsWith('login.html')) {
      location.replace('login.html');
    }
  });
})();
