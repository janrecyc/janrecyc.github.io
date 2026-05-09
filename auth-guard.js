// ══════════════════════════════════════════════════════
//  auth-guard.js — ใช้ Supabase JS SDK
//  ใส่ใน <head> ของทุกหน้า (ยกเว้น login.html)
// ══════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://dhvbbdcsejtvgilcgpfh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodmJiZGNzZWp0dmdpbGNncGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTEwMTMsImV4cCI6MjA5MzY2NzAxM30.B8TSWtXjf6A-Uq1f_JWf2Ghg2I2pCM2N1PV3r8yBlrs';

(async () => {
  // โหลด SDK
  const { createClient } = await import(
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
  );

  // สร้าง client — SDK จัดการ session ใน localStorage อัตโนมัติ
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

  // ดึง session ปัจจุบัน
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // ไม่มี session → ไปหน้า login
    window.location.replace('login.html');
    return;
  }

  // มี session → expose ให้ทุกหน้าใช้
  window.supabase = supabase;
  window.AUTH = {
    session,
    user:   session.user,
    token:  session.access_token,
    logout: async () => {
      await supabase.auth.signOut();
      window.location.replace('login.html');
    },
  };

  // แจ้งหน้านั้นว่าพร้อมแล้ว
  window.dispatchEvent(new Event('auth-ready'));
})();
