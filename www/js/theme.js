/* ============================================================
   theme.js — theme preference can be 'light' | 'dark' | 'system'.
   Applies before paint (no flash) and exposes get/set helpers so
   any component (e.g. the settings option list) can read/change
   it without knowing about localStorage or matchMedia.
   ============================================================ */
(function () {
  function resolveTheme(pref) {
    if (pref === 'system') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return pref;
  }

  function applyTheme(pref) {
    document.documentElement.setAttribute('data-theme', resolveTheme(pref));
  }

  function getThemePref() {
    return localStorage.getItem('theme') || 'system';
  }

  function setThemePref(pref) {
    localStorage.setItem('theme', pref);
    applyTheme(pref);
  }

  applyTheme(getThemePref());

  // Live-update if the pref is "system" and the OS theme changes.
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme('system');
  });

  window.getThemePref = getThemePref;
  window.setThemePref = setThemePref;
})();
