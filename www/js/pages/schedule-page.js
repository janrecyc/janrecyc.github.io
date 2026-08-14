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
    // ใช้เวลา "ท้องถิ่น" ของเครื่อง ไม่ใช่ toISOString() ที่คืนวันที่แบบ UTC
    // (เดิมพังช่วง 00:00–06:59 น. เวลาไทย เพราะ UTC ยังเป็นเมื่อวาน)
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // YYYY-MM-DD (เวลาท้องถิ่น)
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
