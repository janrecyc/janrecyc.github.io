/* ============================================================
   components/nav.js — builds the nav markup from NAV_ITEMS.
   Call renderNav('home') etc. with the current page's id.
   ============================================================ */
function renderNav(activeId) {
  const mount = document.getElementById('nav-mount');
  if (!mount || typeof NAV_ITEMS === 'undefined') return;

  mount.innerHTML = NAV_ITEMS.map(item => `
    <a class="nav-item ${item.id === activeId ? 'active' : ''}" href="${item.href}">
      <span class="nav-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${item.icon}</svg>
      </span>
      ${item.label}
    </a>
  `).join('');
}
