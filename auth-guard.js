// ══════════════════════════════════════════════════════
//  auth-guard.js — ใส่ใน <head> ของทุกหน้า (ยกเว้น login.html)
//  <script src="auth-guard.js"></script>
// ══════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://dhvbbdcsejtvgilcgpfh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodmJiZGNzZWp0dmdpbGNncGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTEwMTMsImV4cCI6MjA5MzY2NzAxM30.B8TSWtXjf6A-Uq1f_JWf2Ghg2I2pCM2N1PV3r8yBlrs';

// ── Session helpers ────────────────────────────────────
function getSession() {
  try { return JSON.parse(localStorage.getItem('sb_session')); }
  catch { return null; }
}
function clearSession() {
  localStorage.removeItem('sb_session');
}
function isExpired(s) {
  if (!s?.expires_at) return true;
  return (Date.now() / 1000) > (s.expires_at - 60);
}
async function refreshSession(s) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      localStorage.setItem('sb_session', JSON.stringify({
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
        expires_at:    data.expires_at || (Date.now()/1000 + data.expires_in),
        user:          data.user,
      }));
      return data;
    }
  } catch {}
  return null;
}

// ── Guard ──────────────────────────────────────────────
(async () => {
  const session = getSession();

  if (!session) {
    window.location.replace('login.html');
    return;
  }

  if (isExpired(session)) {
    const refreshed = await refreshSession(session);
    if (!refreshed) {
      clearSession();
      window.location.replace('login.html');
      return;
    }
  }

  // ผ่าน → expose ให้หน้านั้นใช้ได้
  window.AUTH = {
    session: getSession(),
    user:    getSession()?.user,
    token:   getSession()?.access_token,
    logout:  async () => {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${getSession()?.access_token}`,
          },
        });
      } catch {}
      clearSession();
      window.location.replace('login.html');
    },
  };

  window.SUPABASE_READY = true;
  window.SUPABASE_TOKEN = window.AUTH.token;

  // แจ้งทุกหน้าว่า AUTH พร้อมแล้ว
  window.dispatchEvent(new Event('auth-ready'));
})();
