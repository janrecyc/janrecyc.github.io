// ══════════════════════════════════════════════
//  ScrapPOS — Supabase Config & Shared Utils
//  แก้ไข URL และ ANON KEY ให้ตรงกับโปรเจกต์คุณ
// ══════════════════════════════════════════════

const SUPABASE_URL  = 'https://dhvbbdcsejtvgilcgpfh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodmJiZGNzZWp0dmdpbGNncGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTEwMTMsImV4cCI6MjA5MzY2NzAxM30.B8TSWtXjf6A-Uq1f_JWf2Ghg2I2pCM2N1PV3r8yBlrs';

// ── Supabase REST helper ──────────────────────
async function sb(path, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || 'return=representation',
      ...opts.headers,
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Convenience wrappers ──────────────────────
const API = {
  // items catalogue
  getItems:   ()          => sb('items?order=cat,name'),
  getStocks:  ()          => sb('items?select=id,name,icon,cat,buy_price,sell_price,stock_qty&order=cat,name'),

  // transactions
  createBuyTx: (rows)     => sb('transactions', {
    method: 'POST',
    body: { type: 'buy', lines: rows, created_at: new Date().toISOString() },
  }),
  createSellTx: (rows, factory) => sb('transactions', {
    method: 'POST',
    body: { type: 'sell', factory, lines: rows, created_at: new Date().toISOString() },
  }),

  // dashboard
  getSummary: (since)     => sb(`rpc/get_summary?since=${encodeURIComponent(since)}`),
  getWeekly:  ()          => sb('rpc/get_weekly_chart'),
};

// ── Toast (shared across pages) ──────────────
function showToast(msg, type = 'default') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.className = 'toast-show ' + (type === 'error' ? 'toast-error' : '');
  el.textContent = msg;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.className = ''; }, 2200);
}

// ── Format helpers ────────────────────────────
function fmtTHB(n) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}
