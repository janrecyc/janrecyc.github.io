/* ============================================================
   pages/schedule-page.js — glues together the schedule page's
   pieces: tab chips (tab-filter.js, shared with shop-page.js),
   the search box (search-bar.js), and the job list
   (schedule-job-list.js).

   Filtering logic here is slightly different from shop-page.js:
   "วันนี้" filters by job.date === today, the other 3 tabs filter
   by job.status. Both live in this one applyView() function —
   the components it calls don't know the difference.
   ============================================================ */
function initSchedulePage() {
  const state = {
    activeTab: 'today',
    searchText: ''
  };

  function todayStr() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  function applyView() {
    const filtered = SCHEDULE_JOBS.filter(job => {
      const matchesTab = state.activeTab === 'today'
        ? job.date === todayStr()
        : job.status === state.activeTab;

      const q = state.searchText.toLowerCase();
      const matchesSearch = !q ||
        job.customer.toLowerCase().includes(q) ||
        (job.address || '').toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });

    renderScheduleJobList(filtered);
  }

  function selectTab(tabId) {
    state.activeTab = tabId;
    renderTabFilter(SCHEDULE_TABS, state.activeTab, 'filters-mount', selectTab);
    applyView();
  }

  renderTabFilter(SCHEDULE_TABS, state.activeTab, 'filters-mount', selectTab);

  renderSearchBar({
    headerMountId: 'search-toggle-mount',
    inputMountId: 'search-mount',
    placeholder: 'ค้นหาลูกค้า/ที่อยู่',
    onInput: (text) => {
      state.searchText = text;
      applyView();
    }
  });

  applyView();
}
