/* ============================================================
   components/shop-tabs.js — renders the tab chip row (รับซื้อ /
   ขายออก / คัดแยก / ประวัติการซื้อขาย). Purely presentational:
   calls onSelect(tabId) and lets the page controller
   (js/pages/shop-page.js) decide what to do.
   ============================================================ */
function renderShopTabs(activeId, onSelect) {
  const mount = document.getElementById('filters-mount');
  if (!mount || typeof SHOP_TABS === 'undefined') return;

  mount.innerHTML = SHOP_TABS.map(t => `
    <button class="filter-chip ${t.id === activeId ? 'active' : ''}" data-tab-id="${t.id}">
      ${t.label}
    </button>
  `).join('');

  mount.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => onSelect(chip.dataset.tabId));
  });
}
