/* ============================================================
   components/country-filters.js — renders the filter chip row.
   Purely presentational: calls onSelect(filterId) and lets the
   page controller (js/pages/country-page.js) decide what to do.
   ============================================================ */
function renderCountryFilters(activeId, onSelect) {
  const mount = document.getElementById('filters-mount');
  if (!mount || typeof COUNTRY_FILTERS === 'undefined') return;

  mount.innerHTML = COUNTRY_FILTERS.map(f => `
    <button class="filter-chip ${f.id === activeId ? 'active' : ''}" data-filter-id="${f.id}">
      ${f.label}
    </button>
  `).join('');

  mount.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => onSelect(chip.dataset.filterId));
  });
}
