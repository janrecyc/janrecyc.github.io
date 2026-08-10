/* ============================================================
   components/country-list.js — builds country.html's rows from
   COUNTRY_ITEMS. Shows a placeholder until real data is added.
   ============================================================ */
function renderCountryList() {
  const mount = document.getElementById('country-mount');
  if (!mount || typeof COUNTRY_ITEMS === 'undefined') return;

  if (COUNTRY_ITEMS.length === 0) {
    mount.innerHTML = '<div class="empty-state">ยังไม่มีข้อมูลประเทศ</div>';
    return;
  }

  mount.innerHTML = COUNTRY_ITEMS.map(item => `
    <div class="list-row">
      <span class="row-label">${item.flag} ${item.name}</span>
      <span class="row-value">${item.ping}</span>
    </div>
  `).join('');
}
