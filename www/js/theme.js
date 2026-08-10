/* ============================================================
   theme.js — applies the saved theme before paint (no flash),
   and binds the #theme-switch checkbox whenever it exists on
   the page (rendered statically or via settings-list.js).
   ============================================================ */
(function () {
  const stored = localStorage.getItem('theme');
  const preferred = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', preferred);

  function bindThemeSwitch() {
    const toggle = document.getElementById('theme-switch');
    if (!toggle || toggle.dataset.bound) return;
    toggle.dataset.bound = 'true';
    toggle.checked = document.documentElement.getAttribute('data-theme') === 'light';
    toggle.addEventListener('change', () => {
      const next = toggle.checked ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // Expose so component renderers can call it right after they
  // build the switch markup (e.g. settings-list.js).
  window.bindThemeSwitch = bindThemeSwitch;

  document.addEventListener('DOMContentLoaded', bindThemeSwitch);
})();
