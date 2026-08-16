/* ============================================================
   data/schedule-tabs.js — the filter chips above the job list on
   schedule.html: วันนี้ (today, by date) / รอดำเนินการ / เสร็จแล้ว /
   ยกเลิก (the last 3, by job.status in data/schedule-jobs.js).

   "วันนี้" is special: it filters by job.date === today's date,
   not by status — a job can be "วันนี้" AND "รอดำเนินการ" at the
   same time. See the matching logic in pages/schedule-page.js.

   To add a new tab later: add one object here, and if it's a
   status-based tab (like เสร็จแล้ว/ยกเลิก), make sure jobs use that
   same string in their `status` field in data/schedule-jobs.js.
   ============================================================ */
const SCHEDULE_TABS = [
  { id: 'today', label: 'วันนี้' },
  { id: 'pending', label: 'รอดำเนินการ' },
  { id: 'done', label: 'เสร็จแล้ว' },
  { id: 'cancelled', label: 'ยกเลิก' }
];
