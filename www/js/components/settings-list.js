/* ============================================================
   components/settings-list.js — builds settings.html from
   SETTINGS_SECTIONS. Add a new `case` in renderRow() only when
   you introduce a genuinely new row TYPE — adding another row
   or section of an existing type never touches this file.
   ============================================================ */
function renderSettingsList() {
  const mount = document.getElementById('settings-mount');
  if (!mount || typeof SETTINGS_SECTIONS === 'undefined') return;

  if (SETTINGS_SECTIONS.length === 0) {
    mount.innerHTML = '<div class="empty-state">ยังไม่มีรายการตั้งค่า</div>';
    return;
  }

  mount.innerHTML = SETTINGS_SECTIONS.map(section => `
    <div class="settings-section">
      <div class="section-title">${section.title}</div>
      <div class="section-rows">
        ${section.items.map(renderRow).join('')}
      </div>
    </div>
  `).join('');

  bindSelectRows(mount);
  bindToggleRows(mount);
}

function renderRow(item) {
  switch (item.type) {
    case 'select': {
      const current = item.get ? item.get() : item.value;
      const currentLabel = (item.options.find(o => o.value === current) || {}).label || '';
      return `
        <details class="list-row select-row" data-select-id="${item.id}">
          <summary>
            <span class="row-label">${item.label}</span>
            <span class="row-value-group">
              <span class="row-value" data-select-value="${item.id}">${currentLabel}</span>
              <span class="row-chevron">›</span>
            </span>
          </summary>
          <div class="select-options">
            ${item.options.map(opt => `
              <div class="option-row" data-select-id="${item.id}" data-value="${opt.value}">
                <span>${opt.label}</span>
                <span class="option-check">${opt.value === current ? '✓' : ''}</span>
              </div>
            `).join('')}
          </div>
        </details>`;
    }
    case 'toggle': {
      const isOn = item.get ? item.get() : !!item.value;
      return `
        <div class="list-row">
          <span class="row-label">${item.label}</span>
          <label class="switch">
            <input type="checkbox" data-toggle-id="${item.id}" ${isOn ? 'checked' : ''}>
            <span class="switch-track"></span>
          </label>
        </div>`;
    }
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
}

// Wires up every "select" row: clicking an option calls that row's
// `set(value)`, updates the checkmark + summary text, and closes it.
function bindSelectRows(root) {
  root.querySelectorAll('.option-row').forEach(optionEl => {
    optionEl.addEventListener('click', () => {
      const selectId = optionEl.dataset.selectId;
      const value = optionEl.dataset.value;
      const item = findSettingItem(selectId);
      if (!item) return;

      if (item.set) item.set(value);

      const details = root.querySelector(`details[data-select-id="${selectId}"]`);
      if (details) {
        details.querySelectorAll('.option-check').forEach(el => (el.textContent = ''));
        optionEl.querySelector('.option-check').textContent = '✓';
        const valueLabel = root.querySelector(`[data-select-value="${selectId}"]`);
        if (valueLabel) valueLabel.textContent = optionEl.querySelector('span').textContent;
        details.removeAttribute('open');
      }
    });
  });
}

function findSettingItem(id) {
  for (const section of SETTINGS_SECTIONS) {
    const found = section.items.find(i => i.id === id);
    if (found) return found;
  }
  return null;
}

// Wires up every "toggle" row: flipping the switch calls that
// row's `set(isOn)` — works for theme or any future on/off setting.
function bindToggleRows(root) {
  root.querySelectorAll('[data-toggle-id]').forEach(inputEl => {
    inputEl.addEventListener('change', () => {
      const item = findSettingItem(inputEl.dataset.toggleId);
      if (item && item.set) item.set(inputEl.checked);
    });
  });
}
