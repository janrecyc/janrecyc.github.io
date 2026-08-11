/* ============================================================
   components/country-list.js — builds country.html's rows from
   whatever array it's given (already filtered/searched by the
   page controller). Shows a placeholder when the list is empty.
   ============================================================ */
function renderCountryList(items) {
  const mount = document.getElementById('country-mount');
  if (!mount) return;

  const list = items || [];

  if (list.length === 0) {
    mount.innerHTML = '<div class="empty-state">ไม่พบประเทศที่ตรงกับเงื่อนไข</div>';
    return;
  }

  mount.innerHTML = list.map(item => `
    <div class="list-row">
      <span class="row-label">${item.flag} ${item.name}</span>
      <span class="row-value">${item.ping}</span>
    </div>
  `).join('');
}
