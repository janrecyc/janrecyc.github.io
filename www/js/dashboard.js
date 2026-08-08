// ══════════════════════════════════════════
//  dashboard.js — Logic for dashboard.html
//  JanRecyc
// ══════════════════════════════════════════

// ══════════════════════════════════════════
//  DEMO DATA
// ══════════════════════════════════════════
const DEMO_STOCK = [
  {icon:'ph-wrench',        name:'เหล็กหนัก',          buy_price:4.5,  sell_price:5.80,  stock_qty:4200},
  {icon:'ph-pipe',          name:'เหล็กบาง',           buy_price:2.8,  sell_price:3.50,  stock_qty:1800},
  {icon:'ph-coins',         name:'ทองแดง',             buy_price:180,  sell_price:215,   stock_qty:320},
  {icon:'ph-steps',         name:'อลูมิเนียม',         buy_price:40,   sell_price:50,    stock_qty:960},
  {icon:'ph-gear-six',      name:'สแตนเลส',            buy_price:18,   sell_price:22,    stock_qty:550},
  {icon:'ph-newspaper',     name:'กระดาษหนังสือพิมพ์', buy_price:2.0,  sell_price:2.80,  stock_qty:3000},
  {icon:'ph-package',       name:'กระดาษลัง',          buy_price:2.5,  sell_price:3.20,  stock_qty:5200},
  {icon:'ph-cube',          name:'พลาสติกขาว',         buy_price:8,    sell_price:11,    stock_qty:780},
  {icon:'ph-plug-charging', name:'สายไฟทองแดง',        buy_price:80,   sell_price:100,   stock_qty:180},
];

const DEMO_WEEKLY = {
  labels: ['จ','อ','พ','พฤ','ศ','ส','อา'],
  buy:    [12400, 8900,  15600, 11200, 18900, 7800,  9400],
  sell:   [8200,  14500, 9800,  16700, 12300, 21000, 6500],
};

const RANGE_MULT = {today:0.18, week:1, month:4.3, quarter:13, year:52};
let activeRange = 'week';
let STOCK_DATA  = [];
let WEEKLY_DATA = DEMO_WEEKLY;
let ALL_TXNS    = [];   

// ══════════════════════════════════════════
//  SUPABASE REST
// ══════════════════════════════════════════
// เดิมยิง REST ไปที่ Supabase ผ่าน fetch() — ตอนนี้เปลี่ยนไปเรียก
// localRest() ที่อ่าน/เขียน SQLite ในเครื่องแทน
async function sbFetch(path, opts = {}) {
  return localRest(path, opts);
}

// ── ICON / COLOR HELPERS ──
const CAT_COLOR = {
  metal:    {bg:'#E8EDF8', fg:'#3A6CC8'},
  paper:    {bg:'#FFF3E0', fg:'#E07A20'},
  plastic:  {bg:'#E8F5E9', fg:'#2E7D32'},
  glass:    {bg:'#E3F2FD', fg:'#1565C0'},
  electric: {bg:'#FFF9C4', fg:'#F57F17'},
  default:  {bg:'#F3F0FF', fg:'#5E35B1'},
};
function resolveIcon(icon){
  if(!icon) return 'ph-cube';
  if(icon.startsWith('ph-')) return icon;
  const map={'🔩':'ph-nut','🔧':'ph-wrench','🪙':'ph-coins','🫗':'ph-steps','⚙️':'ph-gear-six','⚙':'ph-gear-six','📰':'ph-newspaper','📦':'ph-package','📄':'ph-file-text','🥛':'ph-cube','🍶':'ph-flask','🪟':'ph-square','🔌':'ph-plug-charging','⚡':'ph-lightning','♻️':'ph-recycle','♻':'ph-recycle'};
  return map[icon]||null;
}
function itemColor(cat){ return CAT_COLOR[cat]||CAT_COLOR.default; }
function renderIcon(icon,cat,size=26){
  const ph=resolveIcon(icon); const c=itemColor(cat);
  if(ph) return `<span class="ph-icon-wrap" style="background:${c.bg};color:${c.fg};width:${size+16}px;height:${size+16}px;font-size:${size}px;"><i class="ph-fill ${ph}"></i></span>`;
  return `<span class="ph-icon-wrap" style="background:${c.bg};width:${size+16}px;height:${size+16}px;font-size:${size}px;">${icon}</span>`;
}

// ── CATEGORIES (dynamic) ──
let CATS = [];
function catLabel(s){ return CATS.find(c=>c.slug===s)?.label||s; }
function catIcon(s){  return CATS.find(c=>c.slug===s)?.icon||'ph-package'; }
async function loadCats() {
  try {
    const res = await sbFetch('categories?select=slug,label,icon&order=id');
    if (res && res.length) CATS = res;
  } catch(_) {}
}

// ══════════════════════════════════════════
//  LOAD DATA
// ══════════════════════════════════════════
window.loadDashboard = async function() {
  if (!SUPABASE_READY) {
    document.getElementById('config-banner').style.display = 'flex';
    STOCK_DATA  = DEMO_STOCK;
    WEEKLY_DATA = DEMO_WEEKLY;
    ALL_TXNS    = [];
    render(RANGE_MULT[activeRange]);
    return;
  }

  document.getElementById('config-banner').style.display = 'none';

  try {
    STOCK_DATA = await sbFetch(
      'items?select=name,icon,buy_price,sell_price,stock_qty,unit,cat,sell_mode&order=name'
    ) || [];

    ALL_TXNS = await sbFetch(
      'transactions?select=type,total_amount,total_kg,factory_name,created_at&order=created_at.asc'
    ) || [];

    await loadCats();
    WEEKLY_DATA = buildWeeklyData(ALL_TXNS);
    render(RANGE_MULT[activeRange]);
  } catch (err) {
    toast('❌ โหลดไม่สำเร็จ: ' + err.message);
    STOCK_DATA  = DEMO_STOCK;
    WEEKLY_DATA = DEMO_WEEKLY;
    ALL_TXNS    = [];
    render(RANGE_MULT[activeRange]);
  }
};

// ══════════════════════════════════════════
//  RANGE FILTER
// ══════════════════════════════════════════
function getRangeStart(range) {
  const now = new Date();
  const d   = new Date(now);
  if (range === 'today') {
    d.setHours(0,0,0,0);
  } else if (range === 'week') {
    const dow = d.getDay(); 
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    d.setHours(0,0,0,0);
  } else if (range === 'month') {
    d.setDate(1); d.setHours(0,0,0,0);
  } else if (range === 'quarter') {
    d.setMonth(Math.floor(d.getMonth()/3)*3, 1); d.setHours(0,0,0,0);
  } else if (range === 'year') {
    d.setMonth(0,1); d.setHours(0,0,0,0);
  }
  return d;
}

function buildWeeklyData(txns) {
  const buy  = [0,0,0,0,0,0,0]; 
  const sell = [0,0,0,0,0,0,0];
  const now  = new Date();
  const weekStart = getRangeStart('week');

  txns.forEach(t => {
    const d = new Date(t.created_at);
    if (d >= weekStart && d <= now) {
      const dow = d.getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      const amt = Number(t.total_amount || 0);
      if (t.type === 'buy')  buy[idx]  += amt;
      if (t.type === 'sell') sell[idx] += amt;
    }
  });
  return { labels:['จ','อ','พ','พฤ','ศ','ส','อา'], buy, sell };
}

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
function fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtShort(n) {
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toFixed(0);
}

function animateNum(el, val) {
  if (!el) return;
  el.style.opacity = '0'; el.style.transform = 'translateY(4px)';
  setTimeout(() => {
    el.textContent = val;
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
  }, 150);
}

function compute(mult) {
  let totalBuy, totalSell, totalDeposit = 0, totalWithdraw = 0;

  if (ALL_TXNS.length > 0) {
    const rangeStart = getRangeStart(activeRange);
    let tBuy = 0, tSell = 0, tDep = 0, tWit = 0;
    ALL_TXNS.forEach(t => {
      const d   = new Date(t.created_at);
      const amt = Number(t.total_amount || 0);
      if (t.type === 'deposit')  tDep += amt;
      if (t.type === 'withdraw') tWit += amt;
      if (d >= rangeStart) {
        if (t.type === 'buy')  tBuy  += amt;
        if (t.type === 'sell') tSell += amt;
      }
    });
    totalBuy      = tBuy;
    totalSell     = tSell;
    totalDeposit  = tDep;
    totalWithdraw = tWit;
  } else {
    totalBuy  = WEEKLY_DATA.buy.reduce((a,b)=>a+b,0)  * mult;
    totalSell = WEEKLY_DATA.sell.reduce((a,b)=>a+b,0) * mult;
  }

  let stockCost = 0, stockSellVal = 0;
  STOCK_DATA.forEach(s => {
    stockCost    += Number(s.buy_price)  * Number(s.stock_qty);
    stockSellVal += Number(s.sell_price) * Number(s.stock_qty);
  });

  const netProfit   = totalSell - totalBuy;
  const margin      = totalSell > 0 ? (netProfit / totalSell * 100) : 0;
  const allBuy  = ALL_TXNS.filter(t=>t.type==='buy').reduce((s,t)=>s+Number(t.total_amount||0),0);
  const allSell = ALL_TXNS.filter(t=>t.type==='sell').reduce((s,t)=>s+Number(t.total_amount||0),0);
  const cash        = allSell + totalDeposit - allBuy - totalWithdraw;
  const stockProfit = stockSellVal - stockCost;
  return {totalBuy, totalSell, netProfit, margin, cash, stockCost, stockSellVal, stockProfit};
}

// ══════════════════════════════════════════
//  CASH MODAL
// ══════════════════════════════════════════
let cashType = 'deposit';

window.openCashModal = function(type) {
  cashType = type;
  window.setCashType(type);
  document.getElementById('cash-amount').value = '';
  document.getElementById('cash-note').value   = '';
  document.getElementById('cash-confirm-btn').disabled = true;
  document.getElementById('cash-modal').classList.add('show');
  setTimeout(() => document.getElementById('cash-amount').focus(), 300);
};

window.closeCashModal = function(e) {
  if (e && e.target !== document.getElementById('cash-modal')) return;
  document.getElementById('cash-modal').classList.remove('show');
};

window.setCashType = function(type) {
  cashType = type;
  const isDeposit = type === 'deposit';
  document.getElementById('type-deposit').classList.toggle('on', isDeposit);
  document.getElementById('type-withdraw').classList.toggle('on', !isDeposit);
  document.getElementById('modal-title').textContent  = isDeposit ? 'เติมเงินเข้าระบบ' : 'ถอนเงินออกจากระบบ';
  document.getElementById('modal-sub').textContent    = isDeposit ? 'บันทึกเงินสดที่รับเข้ามา' : 'บันทึกเงินสดที่จ่ายออกไป';
  document.getElementById('confirm-label').textContent = isDeposit ? 'บันทึกเงินเข้า' : 'บันทึกเงินออก';
  const btn = document.getElementById('cash-confirm-btn');
  btn.className = `modal-confirm-btn ${type}`;
};

window.onCashAmtInput = function() {
  const val = parseFloat(document.getElementById('cash-amount').value) || 0;
  document.getElementById('cash-confirm-btn').disabled = val <= 0;
};

window.saveCash = async function() {
  const amt  = parseFloat(document.getElementById('cash-amount').value) || 0;
  const note = document.getElementById('cash-note').value.trim();
  if (amt <= 0) return;

  const btn = document.getElementById('cash-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i> กำลังบันทึก...';

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 500));
    ALL_TXNS.push({
      type: cashType, total_amount: amt,
      factory_name: note || (cashType === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน'),
      created_at: new Date().toISOString(), id: Date.now(),
    });
    toast(cashType === 'deposit' ? `✅ เติมเงิน ฿${fmt(amt)}` : `✅ ถอนเงิน ฿${fmt(amt)}`);
    document.getElementById('cash-modal').classList.remove('show');
    btn.disabled = false;
    btn.innerHTML = `<i class="ph ph-check-circle"></i> <span id="confirm-label">${cashType==='deposit'?'บันทึกเงินเข้า':'บันทึกเงินออก'}</span>`;
    render(RANGE_MULT[activeRange]);
    renderCashLog();
    return;
  }

  try {
    await sbFetch('transactions', {
      method: 'POST',
      prefer: 'return=minimal',
      body: {
        type:         cashType,
        total_amount: amt,
        factory_name: note || (cashType === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน'),
        lines:        null,
        total_kg:     null,
      },
    });

    ALL_TXNS = await sbFetch(
      'transactions?select=type,total_amount,total_kg,factory_name,created_at&order=created_at.asc'
    ) || [];

    await loadCats();
    toast(cashType === 'deposit' ? `✅ เติมเงิน ฿${fmt(amt)}` : `✅ ถอนเงิน ฿${fmt(amt)}`);
    document.getElementById('cash-modal').classList.remove('show');
    render(RANGE_MULT[activeRange]);
    renderCashLog();
  } catch (err) {
    toast('❌ ' + err.message);
    btn.disabled = false;
    btn.innerHTML = `<i class="ph ph-check-circle"></i> <span id="confirm-label">${cashType==='deposit'?'บันทึกเงินเข้า':'บันทึกเงินออก'}</span>`;
  }
};

function renderCashLog() {
  const wrap = document.getElementById('cash-log-wrap');
  const logs = [...ALL_TXNS]
    .filter(t => t.type === 'deposit' || t.type === 'withdraw')
    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20);

  if (!logs.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:24px;color:var(--ink3);font-size:13px;">ยังไม่มีรายการเติม/ถอนเงิน</div>`;
    return;
  }

  const typeLabel = { deposit:'เติมเงิน', withdraw:'ถอนเงิน' };
  const typeColor = { deposit:'var(--green)', withdraw:'var(--red)' };
  const typeBg    = { deposit:'rgba(0,200,83,0.1)', withdraw:'rgba(255,59,48,0.08)' };
  const typeIcon  = { deposit:'ph-plus-circle', withdraw:'ph-minus-circle' };
  const typeSign  = { deposit:'+', withdraw:'−' };

  wrap.innerHTML = logs.map(t => {
    const d   = new Date(t.created_at);
    const dStr = d.toLocaleDateString('th-TH',{day:'numeric',month:'short'}) + ' ' +
                 d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
    return `
    <div class="cash-log-row">
      <div class="cash-log-icon" style="background:${typeBg[t.type]};color:${typeColor[t.type]};">
        <i class="ph ${typeIcon[t.type]}"></i>
      </div>
      <div class="cash-log-info">
        <div class="cash-log-type" style="color:${typeColor[t.type]};">${typeLabel[t.type]}</div>
        <div class="cash-log-note">${t.factory_name || '–'}</div>
        <div class="cash-log-date">${dStr}</div>
      </div>
      <div class="cash-log-amt" style="color:${typeColor[t.type]};">${typeSign[t.type]}฿${fmt(Number(t.total_amount||0))}</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════
//  RENDER MAIN
// ══════════════════════════════════════════
function render(mult) {
  const D = compute(mult);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('h-time').textContent = timeStr;
  document.getElementById('h-time2').textContent = timeStr;

  animateNum(document.getElementById('h-net-profit'), fmt(D.netProfit));
  animateNum(document.getElementById('h-buy-total'),  '฿'+fmt(D.totalBuy));
  animateNum(document.getElementById('h-sell-total'), '฿'+fmt(D.totalSell));
  animateNum(document.getElementById('h-cash-val'),   '฿'+fmt(D.cash));

  animateNum(document.getElementById('s-buy'),    fmt(D.totalBuy));
  animateNum(document.getElementById('s-sell'),   fmt(D.totalSell));
  animateNum(document.getElementById('s-net'),    fmt(D.netProfit));
  animateNum(document.getElementById('s-margin'), D.margin.toFixed(1)+'%');
  animateNum(document.getElementById('s-cash'),   fmt(D.cash));
  animateNum(document.getElementById('s-stock-val'),    '฿'+fmt(D.stockSellVal));
  animateNum(document.getElementById('s-stock-cost'),   '฿'+fmt(D.stockCost));
  
  const profitEl = document.getElementById('s-stock-profit');
  if (profitEl) {
    profitEl.textContent = (D.stockProfit >= 0 ? '+' : '') + '฿' + fmt(D.stockProfit);
    profitEl.style.color = D.stockProfit >= 0 ? 'var(--green)' : 'var(--red)';
  }

  animateNum(document.getElementById('n-net'),     fmt(D.netProfit));
  animateNum(document.getElementById('n-income'),  '฿'+fmt(D.totalSell));
  animateNum(document.getElementById('n-expense'), '฿'+fmt(D.totalBuy));
  animateNum(document.getElementById('n-diff'),    '฿'+fmt(D.netProfit));

  renderMiniBars();
  renderChart();
  renderStock();
  renderCashLog();
}

function renderMiniBars() {
  const w = WEEKLY_DATA;
  const max = Math.max(...w.buy, ...w.sell) || 1;
  const bars = document.getElementById('mini-bars');
  bars.innerHTML = w.buy.map((b,i) => {
    const bh = Math.max(4, (b/max)*32);
    const sh = Math.max(4, (w.sell[i]/max)*32);
    return `<div style="flex:1;display:flex;align-items:flex-end;gap:1px;">
      <div class="mini-bar" style="flex:1;height:${bh}px;background:rgba(10,132,255,0.35);border-radius:2px 2px 0 0;"></div>
      <div class="mini-bar" style="flex:1;height:${sh}px;background:rgba(255,107,0,0.55);border-radius:2px 2px 0 0;"></div>
    </div>`;
  }).join('');
}

function buildChartData(range) {
  if (ALL_TXNS.length === 0) return DEMO_WEEKLY;

  if (range === 'today') {
    const labels = ['00','04','08','12','16','20'];
    const buy  = [0,0,0,0,0,0];
    const sell = [0,0,0,0,0,0];
    const start = new Date(); start.setHours(0,0,0,0);
    ALL_TXNS.forEach(t => {
      const d = new Date(t.created_at);
      if (d >= start) {
        const idx = Math.min(5, Math.floor(d.getHours()/4));
        const amt = Number(t.total_amount||0);
        if (t.type==='buy')  buy[idx]  += amt;
        if (t.type==='sell') sell[idx] += amt;
      }
    });
    return {labels, buy, sell};
  } else if (range === 'week') {
    const labels = ['จ','อ','พ','พฤ','ศ','ส','อา'];
    const buy  = [0,0,0,0,0,0,0];
    const sell = [0,0,0,0,0,0,0];
    const start = getRangeStart('week');
    ALL_TXNS.forEach(t => {
      const d = new Date(t.created_at);
      if (d >= start) {
        const dow = d.getDay();
        const idx = dow===0 ? 6 : dow-1;
        const amt = Number(t.total_amount||0);
        if (t.type==='buy')  buy[idx]  += amt;
        if (t.type==='sell') sell[idx] += amt;
      }
    });
    return {labels, buy, sell};
  } else if (range === 'month') {
    const labels = ['W1','W2','W3','W4'];
    const buy  = [0,0,0,0];
    const sell = [0,0,0,0];
    const start = getRangeStart('month');
    ALL_TXNS.forEach(t => {
      const d = new Date(t.created_at);
      if (d >= start) {
        const idx = Math.min(3, Math.floor((d.getDate()-1)/7));
        const amt = Number(t.total_amount||0);
        if (t.type==='buy')  buy[idx]  += amt;
        if (t.type==='sell') sell[idx] += amt;
      }
    });
    return {labels, buy, sell};
  } else if (range === 'quarter') {
    const labels = ['ม.1','ม.2','ม.3'];
    const buy  = [0,0,0];
    const sell = [0,0,0];
    const start = getRangeStart('quarter');
    ALL_TXNS.forEach(t => {
      const d = new Date(t.created_at);
      if (d >= start) {
        const monthDiff = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
        const idx = Math.min(2, Math.max(0, monthDiff));
        const amt = Number(t.total_amount||0);
        if (t.type==='buy')  buy[idx]  += amt;
        if (t.type==='sell') sell[idx] += amt;
      }
    });
    return {labels, buy, sell};
  } else { 
    const labels = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const buy  = new Array(12).fill(0);
    const sell = new Array(12).fill(0);
    const start = getRangeStart('year');
    ALL_TXNS.forEach(t => {
      const d = new Date(t.created_at);
      if (d >= start) {
        const idx = d.getMonth();
        const amt = Number(t.total_amount||0);
        if (t.type==='buy')  buy[idx]  += amt;
        if (t.type==='sell') sell[idx] += amt;
      }
    });
    return {labels, buy, sell};
  }
}

function renderChart() {
  const chartData = buildChartData(activeRange);
  const svg = document.getElementById('chart-svg');
  const W=320, H=120, padL=32, padR=8, padT=8, padB=22;
  const innerW=W-padL-padR, innerH=H-padT-padB;

  const buy  = chartData.buy;
  const sell = chartData.sell;
  const max  = Math.max(...buy, ...sell) || 1;
  const n    = buy.length;
  const px   = i => padL + (i/(n-1||1))*innerW;
  const py   = v => padT + innerH - (v/max)*innerH;

  const yTicks = [0, 0.5, 1].map(t => ({y: padT+innerH*(1-t), val: fmtShort(max*t)}));

  svg.innerHTML = `
    ${yTicks.map(t=>`
      <line x1="${padL}" y1="${t.y}" x2="${W-padR}" y2="${t.y}" stroke="rgba(10,10,30,0.05)" stroke-width="1"/>
      <text class="y-label" x="${padL-4}" y="${t.y+3}" text-anchor="end">${t.val}</text>
    `).join('')}
    ${chartData.labels.map((l,i)=>`
      <text class="x-label" x="${px(i)}" y="${H-4}" text-anchor="middle">${l}</text>
    `).join('')}
    <defs>
      <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0A84FF" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#0A84FF" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="${buy.map((v,i)=>`${px(i)},${py(v)}`).join(' ')} ${px(n-1)},${padT+innerH} ${px(0)},${padT+innerH}" fill="url(#gb)"/>
    <polygon points="${sell.map((v,i)=>`${px(i)},${py(v)}`).join(' ')} ${px(n-1)},${padT+innerH} ${px(0)},${padT+innerH}" fill="url(#gs)"/>
    <polyline points="${buy.map((v,i)=>`${px(i)},${py(v)}`).join(' ')}" fill="none" stroke="#0A84FF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${sell.map((v,i)=>`${px(i)},${py(v)}`).join(' ')}" fill="none" stroke="#FF6B00" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${buy.map((v,i)=>`<circle cx="${px(i)}" cy="${py(v)}" r="3.5" fill="#0A84FF"/>`).join('')}
    ${sell.map((v,i)=>`<circle cx="${px(i)}" cy="${py(v)}" r="3.5" fill="#FF6B00"/>`).join('')}
  `;
}

function renderStock() {
  const maxCost = Math.max(...STOCK_DATA.map(s=>Number(s.buy_price)*Number(s.stock_qty)), 1);
  const rows = STOCK_DATA.map(s=>{
    const cost    = Number(s.buy_price)  * Number(s.stock_qty);
    const sellVal = Number(s.sell_price) * Number(s.stock_qty);
    const profit  = sellVal - cost;
    const pct     = Math.round((cost/maxCost)*100);
    return `
    <div class="stock-row">
      <div class="stock-icon">${renderIcon(s.icon, s.cat, 22)}</div>
      <div class="stock-info">
        <div class="stock-name">${s.name}</div>
        <div class="stock-qty">${Number(s.stock_qty).toLocaleString('th-TH')} ${s.unit || (s.sell_mode === 'piece' ? 'ชิ้น' : 'กก.')}</div>
        <div class="stock-bar-wrap"><div class="stock-bar-fill" style="width:${pct}%;"></div></div>
      </div>
      <div class="stock-values">
        <div class="stock-val-cost">฿${fmt(cost)}</div>
        <div class="stock-val-sell" style="color:var(--green);">+฿${fmt(profit)}</div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('stock-table').innerHTML = `
    <div class="stock-head">
      <span class="stock-head-title">สต๊อกคงเหลือ</span>
      <a href="buy.html"><button class="stock-see-all">+ รับซื้อ</button></a>
    </div>
    ${rows || '<div style="padding:20px;text-align:center;color:var(--ink3);font-size:13px;">ไม่มีข้อมูลสต๊อก</div>'}`;
}

window.setRange = function(el, range) {
  document.querySelectorAll('.date-pill').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');
  activeRange = range;
  render(RANGE_MULT[range]);
};

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast-show';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = ''; }, 2200);
}

// ══════════════════════════════════════════
//  PROFILE SHEET
// ══════════════════════════════════════════
window.openProfile = function() {
  const user = window.AUTH?.user;
  if (!user) {
    toast('⚠️ กรุณารอโหลดข้อมูลผู้ใช้');
    return;
  }

  const email    = user.email || '—';
  const initial  = email.charAt(0).toUpperCase();
  const created  = user.created_at
    ? new Date(user.created_at).toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'})
    : '—';
  const lastSign = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString('th-TH',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
    : '—';

  document.getElementById('ps-avatar').textContent       = initial;
  document.getElementById('ps-name').textContent         = user.user_metadata?.full_name || email.split('@')[0];
  document.getElementById('ps-email').textContent        = email;
  document.getElementById('ps-info-email').textContent   = email;
  document.getElementById('ps-info-created').textContent = created;
  document.getElementById('ps-info-last').textContent    = lastSign;
  document.getElementById('ps-info-uid').textContent     = user.id || '—';

  document.getElementById('profile-backdrop').classList.add('show');
  document.getElementById('profile-sheet').classList.add('show');
  document.body.style.overflow = 'hidden';
};

window.closeProfile = function() {
  document.getElementById('profile-backdrop')?.classList.remove('show');
  document.getElementById('profile-sheet')?.classList.remove('show');
  document.body.style.overflow = '';
};

// ══════════════════════════════════════════
//  RESET MODAL
// ══════════════════════════════════════════
window.openResetConfirm = function() {
  document.body.style.overflow = '';
  try { closeProfile(); } catch(_) {}
  setTimeout(() => {
    document.getElementById('reset-backdrop').classList.add('show');
    document.getElementById('reset-box').classList.add('show');
    document.body.style.overflow = 'hidden';
  }, 300);
};

window.closeResetConfirm = function() {
  document.getElementById('reset-backdrop')?.classList.remove('show');
  document.getElementById('reset-box')?.classList.remove('show');
  document.body.style.overflow = '';
};

window.doReset = async function() {
  const btn = document.getElementById('reset-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i> กำลังรีเซ็ต...';

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 900));
    closeResetConfirm();
    toast('✅ รีเซ็ตสำเร็จ (Demo)');
    setTimeout(() => window.loadDashboard(), 400);
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-warning-octagon"></i> รีเซ็ตเลย';
    return;
  }

  try {
    const result = await sbFetch('rpc/reset_all_data', { method: 'POST', body: {} });
    closeResetConfirm();
    toast(`✅ รีเซ็ตสำเร็จ — items ${result.item_count} รายการยังคงอยู่`);
    setTimeout(() => window.loadDashboard(), 500);
  } catch (err) {
    toast(`❌ รีเซ็ตไม่สำเร็จ: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-warning-octagon"></i> รีเซ็ตเลย';
  }
};

// ══════════════════════════════════════════
//  SHOP PROFILE EDIT
// ══════════════════════════════════════════
window.toggleShopEdit = function() {
  document.body.style.overflow = '';
  try { closeProfile(); } catch(_) {}
  setTimeout(() => window.openShopEdit(), 280);
};

window.openShopEdit = function() {
  loadShopProfile();
  document.getElementById('shop-backdrop').classList.add('show');
  document.getElementById('shop-sheet').classList.add('show');
  document.body.style.overflow = 'hidden';
};

window.closeShopEdit = function() {
  document.getElementById('shop-backdrop')?.classList.remove('show');
  document.getElementById('shop-sheet')?.classList.remove('show');
  document.body.style.overflow = '';
  const status = document.getElementById('pse-status');
  if (status) { status.textContent = ''; status.className = 'ps-shop-status'; }
};

async function loadShopProfile() {
  try {
    const rows = await sbFetch('profiles?is_active=eq.true&order=id&limit=1');
    if (!rows.length) return;
    const p = rows[0];
    window._shopProfileId = p.id;
    document.getElementById('pse-name').value     = p.name        || '';
    document.getElementById('pse-phone').value    = p.phone       || '';
    document.getElementById('pse-line').value     = p.line_id     || '';
    document.getElementById('pse-facebook').value = p.facebook_page || '';
    document.getElementById('pse-address').value  = [p.address, p.district, p.province, p.postal_code].filter(Boolean).join(' ');
    document.getElementById('pse-open').value     = p.open_time   || '08:00';
    document.getElementById('pse-close').value    = p.close_time  || '18:00';
    document.getElementById('pse-days').value     = p.open_days   || '';
    document.getElementById('pse-maps-url').value = p.maps_url    || '';
    document.getElementById('pse-lat').value      = p.lat != null ? p.lat : '';
    document.getElementById('pse-lng').value      = p.lng != null ? p.lng : '';
  } catch(e) { console.warn('loadShopProfile:', e); }
}

window.saveShopProfile = async function() {
  const btn    = document.getElementById('pse-save-btn');
  const status = document.getElementById('pse-status');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i> กำลังบันทึก...';
  status.textContent = '';
  status.className = 'ps-shop-status';

  const addrRaw = document.getElementById('pse-address').value.trim();
  const body = {
    user_id:       window.AUTH.user.id,
    name:          document.getElementById('pse-name').value.trim()     || null,
    phone:         document.getElementById('pse-phone').value.trim()    || null,
    line_id:       document.getElementById('pse-line').value.trim()     || null,
    facebook_page: document.getElementById('pse-facebook').value.trim() || null,
    address:       addrRaw || null,
    open_time:     document.getElementById('pse-open').value            || null,
    close_time:    document.getElementById('pse-close').value           || null,
    open_days:     document.getElementById('pse-days').value.trim()     || null,
    maps_url:      document.getElementById('pse-maps-url').value.trim() || null,
    lat:           parseFloat(document.getElementById('pse-lat').value)  || null,
    lng:           parseFloat(document.getElementById('pse-lng').value)  || null,
  };

  try {
    const id = window._shopProfileId;
    if (id) {
      await sbFetch(`profiles?id=eq.${id}`, { method: 'PATCH', body });
      status.textContent = '✅ บันทึกข้อมูลร้านแล้ว';
      status.className = 'ps-shop-status ok';
    } else {
      const result = await sbFetch('profiles', { method: 'POST', body: { ...body, is_active: 1 } });
      if (result && result[0] && result[0].id) window._shopProfileId = result[0].id;
      status.textContent = '✅ บันทึกข้อมูลร้านแล้ว';
      status.className = 'ps-shop-status ok';
    }
  } catch(e) {
    status.textContent = '❌ บันทึกไม่สำเร็จ: ' + e.message;
    status.className = 'ps-shop-status err';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-floppy-disk"></i> บันทึกข้อมูลร้าน';
    setTimeout(() => { status.textContent = ''; status.className = 'ps-shop-status'; }, 3500);
  }
};

// ══════════════════════════════════════════
//  LAT/LNG HELPERS
// ══════════════════════════════════════════
window.extractLatLngFromUrl = function() {
  const url = document.getElementById('pse-maps-url').value.trim();
  if (!url) { toast('⚠️ กรุณาใส่ URL ก่อน'); return; }

  // 1) @lat,lng
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    document.getElementById('pse-lat').value = atMatch[1];
    document.getElementById('pse-lng').value = atMatch[2];
    toast('✅ ดึงพิกัดสำเร็จ');
    return;
  }
  // 2) ?q=lat,lng หรือ ll=lat,lng
  const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    document.getElementById('pse-lat').value = qMatch[1];
    document.getElementById('pse-lng').value = qMatch[2];
    toast('✅ ดึงพิกัดสำเร็จ');
    return;
  }
  // 3) !3dLAT!4dLNG
  const dataMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (dataMatch) {
    document.getElementById('pse-lat').value = dataMatch[1];
    document.getElementById('pse-lng').value = dataMatch[2];
    toast('✅ ดึงพิกัดสำเร็จ');
    return;
  }
  toast('⚠️ ไม่พบพิกัดใน URL นี้ — ลองคัดลอก URL จาก Google Maps ใหม่');
};

window.useCurrentLocation = function() {
  const btn = document.querySelector('.pse-locate-btn');
  if (!navigator.geolocation) { toast('⚠️ เบราว์เซอร์ไม่รองรับ GPS'); return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i> กำลังหาตำแหน่ง...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('pse-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('pse-lng').value = pos.coords.longitude.toFixed(6);
      toast('✅ ได้ตำแหน่งปัจจุบันแล้ว');
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-navigation-arrow"></i> ใช้ตำแหน่งปัจจุบัน';
    },
    err => {
      toast('❌ ไม่สามารถระบุตำแหน่ง: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-navigation-arrow"></i> ใช้ตำแหน่งปัจจุบัน';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

// ══════════════════════════════════════════
//  REVIEW APPROVAL
// ══════════════════════════════════════════
let _reviewsCache = [];
let _reviewTab    = 'pending';

window.openReviewApproval = async function() {
  document.getElementById('review-approval-backdrop').classList.add('show');
  document.getElementById('review-approval-sheet').classList.add('show');
  document.body.style.overflow = 'hidden';
  await loadReviews();
};

window.closeReviewApproval = function() {
  document.getElementById('review-approval-backdrop')?.classList.remove('show');
  document.getElementById('review-approval-sheet')?.classList.remove('show');
  document.body.style.overflow = '';
};

window.switchReviewTab = function(el, tab) {
  _reviewTab = tab;
  document.querySelectorAll('.ra-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderReviews();
};

async function loadReviews() {
  document.getElementById('ra-body').innerHTML =
    '<div class="ra-loading"><i class="ph ph-spinner-gap spin"></i> กำลังโหลด...</div>';
  try {
    const rows = await sbFetch(
      'reviews?order=created_at.desc&select=id,author_name,rating,content,is_active,created_at',
      { headers: { Authorization: `Bearer ${window.AUTH?.token || SUPABASE_ANON}` } }
    );
    _reviewsCache = rows || [];
    updateReviewBadges();
    renderReviews();
  } catch (e) {
    document.getElementById('ra-body').innerHTML =
      `<div class="ra-empty"><div class="ra-empty-icon">⚠️</div>โหลดไม่สำเร็จ: ${e.message}</div>`;
  }
}

function updateReviewBadges() {
  const pending  = _reviewsCache.filter(r => !r.is_active).length;
  const approved = _reviewsCache.filter(r =>  r.is_active).length;

  document.getElementById('ra-pending-badge').textContent  = pending;
  document.getElementById('ra-approved-badge').textContent = approved;

  const badge = document.getElementById('ps-review-badge');
  if (badge) {
    badge.textContent    = pending;
    badge.style.display  = pending > 0 ? 'inline-flex' : 'none';
  }

  // sync quick-action bar dot
  const dot = document.getElementById('qa-review-dot');
  if (dot) dot.style.display = pending > 0 ? 'block' : 'none';
}

function renderReviews() {
  const body    = document.getElementById('ra-body');
  const reviews = _reviewsCache.filter(r =>
    _reviewTab === 'pending' ? !r.is_active : r.is_active
  );

  if (!reviews.length) {
    body.innerHTML = `<div class="ra-empty">
      <div class="ra-empty-icon">${_reviewTab === 'pending' ? '🎉' : '📭'}</div>
      ${_reviewTab === 'pending' ? 'ไม่มีรีวิวรอการอนุมัติ' : 'ยังไม่มีรีวิวที่อนุมัติแล้ว'}
    </div>`;
    return;
  }

  body.innerHTML = reviews.map(r => {
    const stars  = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const av     = (r.author_name || '?').charAt(0).toUpperCase();
    const d      = new Date(r.created_at);
    const dStr   = d.toLocaleDateString('th-TH', { day:'numeric', month:'short' }) + ' ' +
                   d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
    const isPending = !r.is_active;
    return `
    <div class="ra-review-card ${isPending ? 'pending' : 'approved'}" id="ra-rv-${r.id}">
      <div class="ra-card-top">
        <div class="ra-author">
          <div class="ra-av">${av}</div>
          <div>
            <div class="ra-name">${escHtmlR(r.author_name)}</div>
            <div class="ra-date">${dStr}</div>
          </div>
        </div>
        <span class="ra-status-tag ${isPending ? 'pending' : 'approved'}">
          ${isPending ? 'รออนุมัติ' : 'อนุมัติแล้ว'}
        </span>
      </div>
      <div class="ra-stars">${stars}</div>
      <div class="ra-text">"${escHtmlR(r.content)}"</div>
      <div class="ra-actions">
        ${isPending
          ? `<button class="ra-btn-approve" onclick="raApprove(${r.id})">
               <i class="ph ph-check-circle"></i> อนุมัติ
             </button>`
          : `<button class="ra-btn-unapprove" onclick="raUnapprove(${r.id})">
               <i class="ph ph-arrow-counter-clockwise"></i> ยกเลิก
             </button>`
        }
        <button class="ra-btn-delete" onclick="raDelete(${r.id})">
          <i class="ph ph-trash"></i> ลบ
        </button>
      </div>
    </div>`;
  }).join('');
}

function escHtmlR(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.raApprove = async function(id) {
  const card = document.getElementById(`ra-rv-${id}`);
  const btn  = card?.querySelector('.ra-btn-approve');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i>'; }
  try {
    await sbFetch(`reviews?id=eq.${id}`, {
      method: 'PATCH', prefer: 'return=minimal',
      body:   { is_active: true },
      headers: { Authorization: `Bearer ${window.AUTH?.token || SUPABASE_ANON}` }
    });
    const r = _reviewsCache.find(x => x.id === id);
    if (r) r.is_active = true;
    toast('✅ อนุมัติรีวิวแล้ว');
    updateReviewBadges();
    renderReviews();
  } catch (e) {
    toast('❌ ' + e.message);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-check-circle"></i> อนุมัติ'; }
  }
};

window.raUnapprove = async function(id) {
  const card = document.getElementById(`ra-rv-${id}`);
  const btn  = card?.querySelector('.ra-btn-unapprove');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i>'; }
  try {
    await sbFetch(`reviews?id=eq.${id}`, {
      method: 'PATCH', prefer: 'return=minimal',
      body:   { is_active: false },
      headers: { Authorization: `Bearer ${window.AUTH?.token || SUPABASE_ANON}` }
    });
    const r = _reviewsCache.find(x => x.id === id);
    if (r) r.is_active = false;
    toast('↩ ยกเลิกการอนุมัติแล้ว');
    updateReviewBadges();
    renderReviews();
  } catch (e) {
    toast('❌ ' + e.message);
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-arrow-counter-clockwise"></i> ยกเลิก'; }
  }
};

window.raDelete = async function(id) {
  if (!confirm('ลบรีวิวนี้ถาวร?')) return;
  const card = document.getElementById(`ra-rv-${id}`);
  const btn  = card?.querySelector('.ra-btn-delete');
  if (card) card.style.opacity = '0.4';
  if (btn)  btn.disabled = true;
  try {
    await sbFetch(`reviews?id=eq.${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${window.AUTH?.token || SUPABASE_ANON}` }
    });
    _reviewsCache = _reviewsCache.filter(r => r.id !== id);
    toast('🗑 ลบรีวิวแล้ว');
    updateReviewBadges();
    renderReviews();
  } catch (e) {
    toast('❌ ' + e.message);
    if (card) card.style.opacity = '1';
    if (btn)  btn.disabled = false;
  }
};

async function loadPendingReviewCount() {
  if (!SUPABASE_READY) return;
  try {
    const rows = await sbFetch(
      'reviews?is_active=eq.false&select=id',
      { headers: { Authorization: `Bearer ${window.AUTH?.token || SUPABASE_ANON}` } }
    );
    const count = (rows || []).length;
    const badge = document.getElementById('ps-review-badge');
    if (badge) {
      badge.textContent   = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    const dot = document.getElementById('qa-review-dot');
    if (dot) dot.style.display = count > 0 ? 'block' : 'none';
  } catch (_) {}
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
window.goStorefront = function() {
  toast('ตัดฟีเจอร์หน้าร้านออกแล้ว (ใช้เฉพาะ POS ในเครื่อง)');
};

(async () => {
  window.AUTH = { user: { email: 'local@device' }, logout: () => {} };

  const avatarBtn = document.getElementById('avatar-btn');
  if (avatarBtn) avatarBtn.textContent = 'ผ';

  window.loadDashboard();
})();