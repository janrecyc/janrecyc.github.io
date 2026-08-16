/* ============================================================
   components/schedule-job-list.js — builds schedule.html's job
   cards from whatever array it's given (already filtered/searched
   by the page controller). Shows a placeholder when empty.
   ============================================================ */
const SCHEDULE_STATUS_LABELS = {
  pending: 'รอดำเนินการ',
  done: 'เสร็จแล้ว',
  cancelled: 'ยกเลิก'
};

const SCHEDULE_ICONS = {
  location: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  phone: '<path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L7.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2.1z"/>'
};

function renderScheduleJobList(jobs) {
  const mount = document.getElementById('schedule-mount');
  if (!mount) return;

  const list = jobs || [];

  if (list.length === 0) {
    mount.innerHTML = '<div class="empty-state">ยังไม่มีงานนัดหมาย</div>';
    return;
  }

  mount.innerHTML = list.map(job => `
    <div class="job-card">
      <div class="job-card-header">
        <span class="job-customer">${job.customer}</span>
        <span class="job-status-badge ${job.status}">${SCHEDULE_STATUS_LABELS[job.status] || job.status}</span>
      </div>
      <div class="job-detail-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${SCHEDULE_ICONS.location}</svg>
        <span>${job.address}</span>
      </div>
      <div class="job-detail-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${SCHEDULE_ICONS.clock}</svg>
        <span>${job.date} · ${job.time}</span>
      </div>
      <div class="job-detail-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${SCHEDULE_ICONS.phone}</svg>
        <span>${job.phone}</span>
      </div>
      ${job.note ? `<div class="job-note">${job.note}</div>` : ''}
    </div>
  `).join('');
}
