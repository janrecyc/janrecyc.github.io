(function () {
  const stored = localStorage.getItem('theme');
  const preferred = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', preferred);

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('theme-switch');
    if (!toggle) return;
    toggle.checked = document.documentElement.getAttribute('data-theme') === 'light';
    toggle.addEventListener('change', () => {
      const next = toggle.checked ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  });
})();
