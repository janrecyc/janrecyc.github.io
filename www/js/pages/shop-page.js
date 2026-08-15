/* ============================================================
   pages/shop-page.js — glues together the shop page's pieces:
   tab chips (shop-tabs.js), the search box (search-bar.js), and
   the item list (shop-item-list.js).

   This is the one file that knows "shop page" as a whole — the
   pieces it calls don't know about each other. When any of the 4
   tabs (รับซื้อ/ขายออก/คัดแยก/ประวัติการซื้อขาย) grow into a real
   sub-page (its own layout/data, not just a filtered list — see
   the note in data/shop-tabs.js about "ประวัติการซื้อขาย"), this
   is the file to extend: swap the `applyView()` body for a
   router that swaps content per tab.
   ============================================================ */
function initShopPage() {
  const state = {
    activeTab: 'buy-in',
    searchText: ''
  };

  function applyView() {
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
