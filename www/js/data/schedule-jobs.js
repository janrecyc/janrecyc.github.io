/* ============================================================
   data/schedule-jobs.js — the list of pickup jobs (going out to
   collect scrap from a customer's location) shown on schedule.html.
   Empty for now. When ready, add objects like:
     {
       customer: 'ลุงสมชาย',
       phone: '081-234-5678',
       address: 'บ้านเลขที่ 12 ถ.สุขุมวิท ต.บางนา',
       date: '2026-08-15',      // YYYY-MM-DD
       time: '14:00',
       status: 'pending',        // 'pending' | 'done' | 'cancelled'
       note: 'เศษเหล็กประมาณ 200 กก.'   // optional
     }
   components/schedule-job-list.js renders whatever list it's
   given — no HTML changes needed on schedule.html.
   ============================================================ */
const SCHEDULE_JOBS = [];
