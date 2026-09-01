/* ============================================================
   pages/shop-page.js — glues together the shop page's pieces:
   tab chips (shop-tabs.js), the search box (search-bar.js), and
   the item list (shop-item-list.js) — OR, for tabs that have their
   own real ported sub-view (currently "รับซื้อ" via buy-tab.js and
   "ประวัติการซื้อขาย" via history-tab.js — both ported from
   ScrapPOS, backed by ScrapDB, see their own header comments),
   that sub-view's init function instead. applyView() below is the
   router: SPECIAL_TABS maps a tab id to { init, onSearch }; any
   tab id NOT in that map falls through to the shared item-list
   path (still just filtered views over data/shop-items.js —
   "ขายออก" and "คัดแยก" for now, until they get ported too).

   There is only ONE search box on this page — the shared one
   below (search-bar.js) — every tab reuses it instead of growing
   its own. A special tab that can use it wires its filtering
   through `onSearch(text)` (see buy-tab.js's applyBuySearch);
   one that can't (history has its own filter pills instead, a
   different kind of filter, not text search) sets `onSearch: null`
   and updateSearchVisibility() below hides the search icon
   entirely for it, rather than leaving a search box visible that
   does nothing.
   ============================================================ */
const SPECIAL_TABS = {
  'buy-in':   { init: BuyTab.initBuyTab,   onSearch: (text) => BuyTab.applyBuySearch(text) },
  'sell-out': { init: SellTab.initSellTab, onSearch: (text) => SellTab.applySellSearch(text) },
  'history':  { init: initHistoryTab, onSearch: null }
};

function initShopPage() {
  const state = {
    activeTab: 'buy-in',
    searchText: '',
    specialTabLoaded: null // which SPECIAL_TABS id (if any) is currently
                            // rendered in #shop-mount — avoids reloading
                            // it on every search keystroke while it's
                            // active (search routes through onSearch
                            // instead of a full reload — see below)
  };

  function applyView() {
    const special = SPECIAL_TABS[state.activeTab];
    if (special) {
      if (state.specialTabLoaded !== state.activeTab) {
        state.specialTabLoaded = state.activeTab;
        special.init('shop-mount');
      }
      return;
    }
    state.specialTabLoaded = null; // switching back later should reload fresh

    const activeTag = (SHOP_TABS.find(t => t.id === state.activeTab) || {}).tag;

    const filtered = SHOP_ITEMS.filter(item => {
      const matchesTab = !activeTag || (item.tags || []).includes(activeTag);
      const matchesSearch = !state.searchText ||
        item.name.toLowerCase().includes(state.searchText.toLowerCase());
      return matchesTab && matchesSearch;
    });

    renderShopList(filtered);
  }

  // Shows the shared search icon only on tabs that can actually use it;
  // clears/collapses it first so switching to a tab without search
  // never leaves a stale open search box behind.
  function updateSearchVisibility() {
    const special = SPECIAL_TABS[state.activeTab];
    const supportsSearch = !special || !!special.onSearch;

    const searchRow = document.getElementById('search-row');
    const searchInput = document.getElementById('search-input');
    if (searchRow && !searchRow.hasAttribute('hidden')) {
      searchRow.setAttribute('hidden', '');
      if (searchInput) searchInput.value = '';
    }

    const toggleMount = document.getElementById('search-toggle-mount');
    if (toggleMount) toggleMount.style.display = supportsSearch ? '' : 'none';
  }

  function selectTab(tabId) {
    state.activeTab = tabId;
    state.searchText = '';
    renderTabFilter(SHOP_TABS, state.activeTab, 'filters-mount', selectTab);
    updateSearchVisibility();
    applyView();
  }

  renderTabFilter(SHOP_TABS, state.activeTab, 'filters-mount', selectTab);

  renderSearchBar({
    headerMountId: 'search-toggle-mount',
    inputMountId: 'search-mount',
    placeholder: 'ค้นหารายการ',
    onInput: (text) => {
      state.searchText = text;
      const special = SPECIAL_TABS[state.activeTab];
      if (special && special.onSearch) {
        special.onSearch(text);
      } else if (!special) {
        applyView();
      }
      // else: a special tab with no onSearch (history) — search icon is
      // hidden for it anyway, so onInput can't actually fire here
    }
  });

  updateSearchVisibility();
  applyView();
}
