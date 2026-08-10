/* ============================================================
   components/settings-list.js — builds settings.html's rows from
   SETTINGS_ITEMS. Add a new `case` here only when you introduce a
   genuinely new row TYPE (toggle/value/link already covered) —
   adding another row of an existing type never touches this file.
   ============================================================ */
function renderSettingsList() {
  const mount = document.getElementById('settings-mount');
  if (!mount || typeof SETTINGS_ITEMS === 'undefined') return;

  if (SETTINGS_ITEMS.length === 0) {
    mount.innerHTML = '<div class="empty-state">ยังไม่มีรายการตั้งค่า</div>';
    return;
  }

  mount.innerHTML = SETTINGS_ITEMS.map(item => {
    switch (item.type) {
      case 'toggle':
        return `
          <div class="list-row">
            <span class="row-label">${item.label}</span>
            <label class="switch">
              <input type="checkbox" id="${item.id}">
              <span class="switch-track"></span>
            </label>
          </div>`;
      case 'value':
        return `
          <div class="list-row">
            <span class="row-label">${item.label}</span>
            <span class="row-value">${item.value}</span>
          </div>`;
      case 'link':
        return `
          <div class="list-row is-link" id="${item.id || ''}">
            <span class="row-label">${item.label}</span>
            <span class="row-chevron">›</span>
          </div>`;
      default:
        return '';
    }
  }).join('');
}
