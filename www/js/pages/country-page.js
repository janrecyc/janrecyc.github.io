/* ============================================================
   pages/country-page.js — glues together the country page's
   pieces: filter chips (country-filters.js), the search box
   (search-bar.js), and the list (country-list.js).

   This is the one file that knows "country page" as a whole —
   the pieces it calls don't know about each other. When the 4
   filter chips grow into real sub-pages later (their own layout,
   not just a filtered list), this is the file to extend: swap
   the `applyView()` body for a router that swaps content per tab.
   ============================================================ */
function initCountryPage() {
  const state = {
    activeFilter: 'all',
    searchText: ''
  };

  function applyView() {
    const activeTag = (COUNTRY_FILTERS.find(f => f.id === state.activeFilter) || {}).tag;

    const filtered = COUNTRY_ITEMS.filter(item => {
      const matchesFilter = !activeTag || (item.tags || []).includes(activeTag);
      const matchesSearch = !state.searchText ||
        item.name.toLowerCase().includes(state.searchText.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    renderCountryList(filtered);
  }

  function selectFilter(filterId) {
    state.activeFilter = filterId;
    renderCountryFilters(state.activeFilter, selectFilter);
    applyView();
  }

  renderCountryFilters(state.activeFilter, selectFilter);

  renderSearchBar({
    headerMountId: 'search-toggle-mount',
    inputMountId: 'search-mount',
    placeholder: 'ค้นหาประเทศ',
    onInput: (text) => {
      state.searchText = text;
      applyView();
    }
  });

  applyView();
}
