/* ============================================================
   pages/shop-page.js — glues together the shop page's pieces:
   tab chips (shop-tabs.js), the search box (search-bar.js), and
   the item list (shop-item-list.js) — OR, for tabs that have their
   own real ported sub-view (currently "รับซื้อ" via buy-tab.js and
   "ประวัติการซื้อขาย" via history-tab.js — both ported from
   ScrapPOS, backed by ScrapDB, see their own header comments),
   that sub-view's init function instead. applyView() below is the
   router: SPECIAL_TABS maps a tab id to its init function; any tab
   id NOT in that map falls through to the shared item-list path
   (still just filtered views over data/shop-items.js — "ขายออก"
   and "คัดแยก" for now, until they get ported too).

   Known gap: the search box (search-bar.js) stays visible on
   every special tab but doesn't do anything there — each has its
   own search/filter UI instead (buy-tab.js's search field,
   history-tab.js's filter pills). Low priority since it's not
   broken, just inert; worth hiding/disabling it for those tabs
   later.
   ============================================================ */
const SPECIAL_TABS = {
  'buy-in': initBuyTab,
  'history': initHistoryTab
};

function initShopPage() {
  const state = {
    activeTab: 'buy-in',
    searchText: '',
    specialTabLoaded: null // which SPECIAL_TABS id (if any) is currently
                            // rendered in #shop-mount — avoids reloading
                            // it on every search keystroke while it's
                            // active, since search doesn't apply to any
                            // of them anyway (see applyView() below)
  };

  function applyView() {
    if (SPECIAL_TABS[state.activeTab]) {
      if (state.specialTabLoaded !== state.activeTab) {
        state.specialTabLoaded = state.activeTab;
        SPECIAL_TABS[state.activeTab]('shop-mount');
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
