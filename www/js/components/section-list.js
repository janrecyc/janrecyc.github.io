/* ============================================================
   components/section-list.js — generic renderer for a "grouped
   list of rows" page. Used by settings.html (any future page
   with the same section/row shape can reuse it too — the "บัญชี"
   section on the settings page is a good example of a row group
   that used to live on its own page and now lives here instead)
   — pass in whichever SECTIONS array and mount id you want.

   Add a new `case` in renderRow() only when you introduce a
   genuinely new row TYPE — adding another row or section on
   either page never touches this file.
   ============================================================ */
function renderSectionList(sections, mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  if (!sections || sections.length === 0) {
    mount.innerHTML = '<div class="empty-state">ยังไม่มีรายการ</div>';
    return;
  }

  mount.innerHTML = sections.map(section => `
    <div class="settings-section">
      <div class="section-title">${section.title}</div>
      <div class="section-rows">
        ${section.items.map(renderRow).join('')}
      </div>
    </div>
  `).join('');

  bindSelectRows(mount, sections);
  bindToggleRows(mount, sections);
  bindLinkRows(mount, sections);
}

function renderRow(item) {
  const icon = item.icon
    ? `<span class="row-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${item.icon}</svg></span>`
    : '';

  switch (item.type) {
    case 'select': {
      const current = item.get ? item.get() : item.value;
      const currentLabel = (item.options.find(o => o.value === current) || {}).label || '';
      return `
        <details class="list-row select-row" data-select-id="${item.id}">
          <summary>
            <span class="row-main">
              ${icon}
              <span class="row-label">${item.label}</span>
            </span>
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
          <span class="row-main">
            ${icon}
            <span class="row-label">${item.label}</span>
          </span>
          <label class="switch">
            <input type="checkbox" data-toggle-id="${item.id}" ${isOn ? 'checked' : ''}>
            <span class="switch-track"></span>
          </label>
        </div>`;
    }
    case 'value': {
      const val = item.get ? item.get() : item.value;
      return `
        <div class="list-row">
          <span class="row-main">
            ${icon}
            <span class="row-label">${item.label}</span>
          </span>
          <span class="row-value">${val}</span>
        </div>`;
    }
    case 'link':
      return `
        <div class="list-row is-link" id="${item.id || ''}">
          <span class="row-main">
            ${icon}
            <span class="row-label">${item.label}</span>
          </span>
          <span class="row-chevron">›</span>
        </div>`;
    default:
      return '';
  }
}

// Wires up every "select" row: clicking an option calls that row's
// `set(value)`, updates the checkmark + summary text, and closes it.
function bindSelectRows(root, sections) {
  root.querySelectorAll('.option-row').forEach(optionEl => {
    optionEl.addEventListener('click', () => {
      const selectId = optionEl.dataset.selectId;
      const value = optionEl.dataset.value;
      const item = findSectionItem(selectId, sections);
      if (!item) return;

      if (item.set) {
        item.set(value);
      } else {
        // No real backing store yet (scaffold item) — mutate the
        // in-memory fallback so the choice at least survives
        // until the next full page load.
        item.value = value;
      }

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

function findSectionItem(id, sections) {
  for (const section of sections) {
    const found = section.items.find(i => i.id === id);
    if (found) return found;
  }
  return null;
}

// Wires up every "toggle" row: flipping the switch calls that
// row's `set(isOn)` — works for theme or any future on/off setting.
function bindToggleRows(root, sections) {
  root.querySelectorAll('[data-toggle-id]').forEach(inputEl => {
    inputEl.addEventListener('change', () => {
      const item = findSectionItem(inputEl.dataset.toggleId, sections);
      if (!item) return;
      if (item.set) {
        item.set(inputEl.checked);
      } else {
        // No real backing store yet (scaffold item) — mutate the
        // in-memory fallback so the choice at least survives
        // until the next full page load, same pattern as select rows.
        item.value = inputEl.checked;
      }
    });
  });
}

// Wires up every "link" row that has an `onSelect` callback (e.g.
// logout). Rows without one (most "link" placeholders — see the
// scaffold-status comment in data/settings.js) stay unbound on
// purpose until there's somewhere real for them to navigate to.
function bindLinkRows(root, sections) {
  root.querySelectorAll('.list-row.is-link[id]').forEach(rowEl => {
    const item = findSectionItem(rowEl.id, sections);
    if (item && item.onSelect) {
      rowEl.addEventListener('click', item.onSelect);
    }
  });
}
