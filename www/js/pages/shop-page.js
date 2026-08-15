/* ============================================================
   pages/shop-page.js — glues together the shop page's pieces:
   tab chips (shop-tabs.js), the search box (search-bar.js), and
   the item list (shop-item-list.js) — OR, for the "ประวัติการซื้อขาย"
   tab specifically, pages/history-tab.js's own real sub-view
   (ported from ScrapPOS, backed by ScrapDB — see that file's
   header comment). applyView() below is the router: it checks
   activeTab === 'history' first and short-circuits to
   initHistoryTab() before falling through to the shared item-list
   path used by the other 3 tabs (รับซื้อ/ขายออก/คัดแยก), which are
   still just filtered views over data/shop-items.js.

   Known gap: the search box (search-bar.js) stays visible on the
   history tab but doesn't do anything there — history has its own
   filter pills instead. Low priority since it's not broken, just
   inert; worth hiding/disabling it for that tab later.
   ============================================================ */
function initShopPage() {
  const state = {
    activeTab: 'buy-in',
    searchText: '',
    historyLoaded: false // avoids reloading history on every search keystroke
                          // while it's the active tab — search doesn't apply
                          // to it anyway (see applyView() below)
  };

  function applyView() {
    if (state.activeTab === 'history') {
      if (!state.historyLoaded) {
        state.historyLoaded = true;
        initHistoryTab('shop-mount');
      }
      return;
    }
    state.historyLoaded = false; // switching back later should reload fresh

    const activeTag = (SHOP_TABS.find(t => t.id === state.activeTab) || {}).tag;

    const filtered = SHOP_ITEMS.filter(item => {
      const matchesTab = !activeTag || (item.tags || []).includes(activeTag);
      const matchesSearch = !state.searchText ||
        item.name.toLowerCase().includes(state.searchText.toLowerCase());
      return matchesTab && matchesSearch;
    });

    renderShopList(filtered);
  }

  function selectTab(tabId) {
    state.activeTab = tabId;
    renderTabFilter(SHOP_TABS, state.activeTab, 'filters-mount', selectTab);
    applyView();
  }

  renderTabFilter(SHOP_TABS, state.activeTab, 'filters-mount', selectTab);

  renderSearchBar({
    headerMountId: 'search-toggle-mount',
    inputMountId: 'search-mount',
    placeholder: 'ค้นหารายการ',
    onInput: (text) => {
      state.searchText = text;
      applyView();
    }
  });

  applyView();
}
