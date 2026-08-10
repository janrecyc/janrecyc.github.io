/* ============================================================
   components/search-bar.js — search icon button (mounted in the
   page header) + a collapsible text input (mounted in content).
   Purely presentational: calls onInput(text) as the user types.
   Reusable for any future page that needs a search box.
   ============================================================ */
function renderSearchBar({ headerMountId, inputMountId, placeholder, onInput }) {
  const headerMount = document.getElementById(headerMountId);
  const inputMount = document.getElementById(inputMountId);
  if (!headerMount || !inputMount) return;

  headerMount.innerHTML = `
    <button class="icon-btn" id="search-toggle" aria-label="ค้นหา">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
      </svg>
    </button>`;

  inputMount.innerHTML = `
    <div class="search-row" id="search-row" hidden>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
      </svg>
      <input type="text" class="search-input" id="search-input" placeholder="${placeholder || 'ค้นหา'}">
    </div>`;

  const toggleBtn = headerMount.querySelector('#search-toggle');
  const searchRow = inputMount.querySelector('#search-row');
  const searchInput = inputMount.querySelector('#search-input');

  toggleBtn.addEventListener('click', () => {
    const isHidden = searchRow.hasAttribute('hidden');
    if (isHidden) {
      searchRow.removeAttribute('hidden');
      searchInput.focus();
    } else {
      searchRow.setAttribute('hidden', '');
      searchInput.value = '';
      onInput('');
    }
  });

  searchInput.addEventListener('input', () => onInput(searchInput.value.trim()));
}
