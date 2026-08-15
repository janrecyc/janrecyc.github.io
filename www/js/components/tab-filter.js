/* ============================================================
   components/tab-filter.js — renders a row of filter/tab chips
   from any `tabs` array shaped like [{ id, label }, ...] into
   any mount element. Purely presentational: calls onSelect(tabId)
   and lets the page controller decide what that means.

   Used by shop-page.js (SHOP_TABS) and schedule-page.js
   (SCHEDULE_TABS) — reuse this for any future tabbed list page
   instead of writing a new render function.
   ============================================================ */
function renderTabFilter(tabs, activeId, mountId, onSelect) {
  const mount = document.getElementById(mountId);
  if (!mount || !tabs) return;

  mount.innerHTML = tabs.map(t => `
    <button class="filter-chip ${t.id === activeId ? 'active' : ''}" data-tab-id="${t.id}">
      ${t.label}
    </button>
  `).join('');

  mount.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => onSelect(chip.dataset.tabId));
  });
}
