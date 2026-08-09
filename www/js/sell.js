// ══════════════════════════════════════════
//  sell.js — Logic for sell.html (ขายออก)
//  ScrapPOS
// ══════════════════════════════════════════

// ══ ตั้งค่าร้าน — ค่าเริ่มต้น (ถ้ายังไม่เคยกรอก "ข้อมูลร้าน" ในหน้า Dashboard) ══
let SHOP_NAME    = 'ScrapPOS';
let SHOP_TAGLINE = 'ร้านรับซื้อของเก่า / รีไซเคิล';
let SHOP_TEL     = '';   // เบอร์โทร เช่น '081-234-5678'
let SHOP_ADDRESS = '';

// โหลดข้อมูลร้าน (ชื่อ/เบอร์โทร/ที่อยู่) จากตาราง profiles มาทับค่าเริ่มต้นด้านบน
// เพื่อให้ใบส่งสินค้าใช้ชื่อร้านที่ตั้งไว้ในเมนู "ข้อมูลร้าน" (Dashboard) แทนคำว่า ScrapPOS เฉยๆ
async function loadShopProfileForReceipt() {
  try {
    const rows = await sbFetch('profiles?is_active=eq.true&order=id&limit=1');
    if (!rows.length) return;
    const p = rows[0];
    if (p.name)  SHOP_NAME    = p.name;
    if (p.phone) SHOP_TEL     = p.phone;
    const addr = [p.address, p.district, p.province, p.postal_code].filter(Boolean).join(' ');
    if (addr) SHOP_ADDRESS = addr;
  } catch (e) { console.warn('loadShopProfileForReceipt:', e); }
}

// ══════════════════════════════════════════
//  DEMO DATA
// ══════════════════════════════════════════
const DEMO_ITEMS = [
  {id:1,  name:'เหล็กหนัก',          icon:'ph-wrench',         sell_price:5.80,  unit:'กก.',  cat:'metal',    stock_qty:4200, sell_mode:'kg'},
  {id:2,  name:'เหล็กบาง',           icon:'ph-pipe',           sell_price:3.50,  unit:'กก.',  cat:'metal',    stock_qty:1800, sell_mode:'kg'},
  {id:3,  name:'ทองแดง',             icon:'ph-coins',          sell_price:215,   unit:'กก.',  cat:'metal',    stock_qty:320,  sell_mode:'kg'},
  {id:4,  name:'อลูมิเนียม',         icon:'ph-steps',          sell_price:50,    unit:'กก.',  cat:'metal',    stock_qty:960,  sell_mode:'kg'},
  {id:5,  name:'สแตนเลส',            icon:'ph-gear-six',       sell_price:22,    unit:'กก.',  cat:'metal',    stock_qty:550,  sell_mode:'kg'},
  {id:6,  name:'กระดาษหนังสือพิมพ์', icon:'ph-newspaper',      sell_price:2.80,  unit:'กก.',  cat:'paper',    stock_qty:3000, sell_mode:'kg'},
  {id:7,  name:'กระดาษลัง',          icon:'ph-package',        sell_price:3.20,  unit:'กก.',  cat:'paper',    stock_qty:5200, sell_mode:'kg'},
  {id:8,  name:'กระดาษขาว',          icon:'ph-file-text',      sell_price:3.80,  unit:'กก.',  cat:'paper',    stock_qty:1100, sell_mode:'kg'},
  {id:9,  name:'พลาสติกขาว',         icon:'ph-cube',           sell_price:11,    unit:'กก.',  cat:'plastic',  stock_qty:780,  sell_mode:'kg'},
  {id:10, name:'ขวด PET',            icon:'ph-flask',          sell_price:8.00,  unit:'กก.',  cat:'plastic',  stock_qty:620,  sell_mode:'kg'},
  {id:11, name:'แก้วใส',             icon:'ph-square',         sell_price:1.60,  unit:'กก.',  cat:'glass',    stock_qty:2100, sell_mode:'kg'},
  {id:12, name:'สายไฟทองแดง',        icon:'ph-plug-charging',  sell_price:100,   unit:'กก.',  cat:'electric', stock_qty:180,  sell_mode:'kg'},
  {id:13, name:'มอเตอร์เก่า',        icon:'ph-lightning',      sell_price:32,    unit:'กก.',  cat:'electric', stock_qty:95,   sell_mode:'kg'},
  {id:20, name:'ลังเบียร์ช้าง',      icon:'ph-cube',           sell_price:18,    unit:'ลัง',  cat:'beer-crate',stock_qty:20,  sell_mode:'piece'},
];

// Category colors (same as buy.html)
const CAT_COLOR = {
  metal:       {bg:'#E8EDF8', fg:'#3A6CC8'},
  paper:       {bg:'#FFF3E0', fg:'#E07A20'},
  plastic:     {bg:'#E8F5E9', fg:'#2E7D32'},
  glass:       {bg:'#E3F2FD', fg:'#1565C0'},
  electric:    {bg:'#FFF9C4', fg:'#F57F17'},
  'beer-crate':{bg:'#FDE8C8', fg:'#C06000'},
  default:     {bg:'#F3F0FF', fg:'#5E35B1'},
};
function itemColor(cat){ return CAT_COLOR[cat] || CAT_COLOR.default; }

function renderIcon(icon, cat, size=28) {
  if (icon && icon.startsWith('ph-')) {
    const c = itemColor(cat);
    return `<span class="ph-icon-wrap" style="background:${c.bg};color:${c.fg};width:${size+16}px;height:${size+16}px;font-size:${size}px;">
      <i class="ph-fill ${icon}"></i></span>`;
  }
  return `<span style="font-size:${size}px;line-height:1;">${icon}</span>`;
}

function stockClass(qty) {
  if (qty <= 0)   return 'empty';
  if (qty < 100)  return 'low';
  return '';
}

let ITEMS = [];
let cart  = {};   // {id: {item, qty, mode, unitLabel}}
let CATS  = [];
let FACTORIES = [];
let activeCat = 'all';
let query     = '';

// ══════════════════════════════════════════
//  KG MODAL STATE — tape-add model
// ══════════════════════════════════════════
let kgModalItemId  = null;
let kgBuffer       = '';
let kgEntries      = [];   // [{val: number}]
let currentMode    = 'kg';
let kgMultiplyBase = null; // ตัวเลขแรกก่อน ×

function kgTotal() {
  return kgEntries.reduce((s, e) => s + e.val, 0);
}

function formatCalc(v) {
  if (Number.isInteger(v)) return String(v);
  return parseFloat(v.toFixed(4)).toString();
}

function setMode(mode) {
  currentMode = mode;
  const isKg  = mode === 'kg';
  const item  = kgModalItemId ? ITEMS.find(x => x.id === kgModalItemId) : null;
  const unit  = isKg ? 'กก.' : (item?.unit || 'ชิ้น');

  document.getElementById('mode-btn-kg').classList.toggle('active', isKg);
  document.getElementById('mode-btn-piece').classList.toggle('active', !isKg);
  document.getElementById('kg-display-label').textContent = isKg ? 'น้ำหนัก' : 'จำนวน';
  document.getElementById('kg-display-unit').textContent  = unit;

  kgBuffer = ''; kgEntries = [];
  updateKgDisplay();
}

function openKgModal(id) {
  id = Number(id);
  const item = ITEMS.find(x => x.id === id);
  if (!item) return;
  kgModalItemId = id;
  currentMode   = item.sell_mode || 'kg';
  kgBuffer      = '';
  kgEntries     = cart[id] ? [{ val: cart[id].qty }] : [];

  document.getElementById('kg-item-icon').innerHTML   = renderIcon(item.icon, item.cat, 26);
  document.getElementById('kg-item-name').textContent  = item.name;
  document.getElementById('kg-item-price').textContent = `฿${Number(item.sell_price).toFixed(2)} / ${item.unit||'กก.'}`;

  const stock   = item.stock_qty || 0;
  const cls     = stockClass(stock);
  const pill    = document.getElementById('kg-stock-pill');
  const unitLbl = item.unit || (currentMode === 'piece' ? 'ชิ้น' : 'กก.');
  pill.className = `kg-stock-zone-pill ${cls}`;
  document.getElementById('kg-stock-pill-text').textContent = `สต๊อก ${stock.toLocaleString('th-TH')} ${unitLbl}`;

  // แสดง toggle เฉพาะ item ที่ไม่ได้ fix sell_mode
  const wrap = document.getElementById('kg-mode-toggle-wrap');
  wrap.style.display = item.sell_mode ? 'none' : 'block';

  // sync mode buttons
  const isKg = currentMode === 'kg';
  document.getElementById('mode-btn-kg').classList.toggle('active', isKg);
  document.getElementById('mode-btn-piece').classList.toggle('active', !isKg);
  document.getElementById('kg-display-label').textContent = isKg ? 'น้ำหนัก' : 'จำนวน';
  document.getElementById('kg-display-unit').textContent  = isKg ? 'กก.' : (item.unit||'ชิ้น');

  updateKgDisplay();
  document.getElementById('kg-backdrop').classList.add('open');
  document.getElementById('kg-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeKgModal() {
  document.getElementById('kg-backdrop').classList.remove('open');
  document.getElementById('kg-modal').classList.remove('open');
  document.body.style.overflow = '';
  kgModalItemId  = null;
  kgBuffer       = '';
  kgEntries      = [];
  kgMultiplyBase = null;
}

function updateKgDisplay() {
  const unitText = currentMode === 'kg' ? 'กก.' : (
    (kgModalItemId ? ITEMS.find(x=>x.id===kgModalItemId)?.unit : null) || 'ชิ้น'
  );
  const cur   = parseFloat(kgBuffer) || 0;
  const total = kgTotal() + cur;
  const item  = kgModalItemId ? ITEMS.find(x => x.id === kgModalItemId) : null;
  const price = item ? Number(item.sell_price) : 0;
  const stock = item ? (item.stock_qty || 0) : Infinity;

  // ── multiply indicator in label ──
  const lblEl2 = document.getElementById('kg-display-label');
  if (kgMultiplyBase !== null) {
    lblEl2.textContent = `${formatCalc(kgMultiplyBase)} ×`;
    lblEl2.style.color = 'var(--calc-op)';
  } else {
    lblEl2.textContent = currentMode === 'kg' ? 'น้ำหนัก' : 'จำนวน';
    lblEl2.style.color = '';
  }

  // ── tape ──
  const tapeEl = document.getElementById('kg-tape');
  tapeEl.innerHTML = kgEntries.map((e, i) => `
    <div class="kg-tape-entry">
      <span>
        ${i > 0 ? '<span class="kg-tape-plus">+</span>' : ''}
        <span class="kg-tape-num">${formatCalc(e.val)}</span>
        <span class="kg-tape-unit">${unitText}</span>
      </span>
      <button class="kg-tape-del" onclick="tapeDelete(${i})"><i class="ph ph-x"></i></button>
    </div>
  `).join('');
  tapeEl.scrollTop = tapeEl.scrollHeight;

  // ── buffer display ──
  document.getElementById('kg-display-num').textContent = kgBuffer || '0';

  // ── subtotal ──
  const sub = Math.round(total * price * 100) / 100;
  document.getElementById('kg-subtotal').textContent = sub > 0 ? `฿${sub.toFixed(2)}` : '฿0';

  // ── warnings ──
  const warnEl = document.getElementById('kg-stock-warning');
  const warnTx = document.getElementById('kg-stock-warning-text');
  const isInt  = Number.isInteger(total) || total === 0;
  const over   = total > stock;
  if (over && total > 0) {
    warnTx.textContent = `เกินสต๊อก (มี ${stock.toLocaleString('th-TH')} ${unitText})`;
    warnEl.classList.add('show');
  } else if (currentMode === 'piece' && !isInt && total > 0) {
    warnTx.textContent = 'จำนวนชิ้นต้องเป็นจำนวนเต็ม';
    warnEl.classList.add('show');
  } else {
    warnEl.classList.remove('show');
  }

  // ── confirm button ──
  const btnEl = document.getElementById('kg-confirm-btn');
  const lblEl = document.getElementById('kg-confirm-label');
  const valid = total > 0 && !over && (currentMode === 'kg' || isInt);
  btnEl.disabled = !valid;
  lblEl.textContent = valid
    ? `${cart[kgModalItemId] ? 'อัปเดต' : 'เพิ่ม'} ${formatCalc(total)} ${unitText} = ฿${sub.toFixed(2)}`
    : 'เพิ่มในรายการ';
}

function tapeDelete(i) {
  kgEntries.splice(i, 1);
  updateKgDisplay();
}

function kpNum(n, e) {
  rippleKey(e);
  if (kgBuffer.replace(/[^0-9]/g,'').length >= 8) return;
  kgBuffer = kgBuffer === '0' ? n : kgBuffer + n;
  updateKgDisplay();
}
function kpDot(e) {
  rippleKey(e);
  if (currentMode === 'piece') return;
  if (!kgBuffer.includes('.')) {
    if (!kgBuffer) kgBuffer = '0';
    kgBuffer += '.';
  }
  updateKgDisplay();
}
function kpBack(e) {
  rippleKey(e);
  if (kgBuffer.length > 0) {
    kgBuffer = kgBuffer.slice(0, -1);
  } else if (kgEntries.length > 0) {
    const last = kgEntries.pop();
    kgBuffer = formatCalc(last.val);
  }
  updateKgDisplay();
}
function kpPlus(e) {
  rippleKey(e);
  const cur = parseFloat(kgBuffer);
  if (!cur || cur <= 0) return;
  if (kgMultiplyBase !== null) {
    kgEntries.push({ val: kgMultiplyBase * cur });
    kgMultiplyBase = null;
  } else {
    kgEntries.push({ val: cur });
  }
  kgBuffer = '';
  updateKgDisplay();
}
function kpClear(e) {
  rippleKey(e);
  kgBuffer = '';
  kgEntries = [];
  kgMultiplyBase = null;
  updateKgDisplay();
}
function kpMultiply(e) {
  rippleKey(e);
  const cur = parseFloat(kgBuffer);
  if (!cur || cur <= 0) return;
  // ถ้ากำลังคูณอยู่แล้ว → สะสมต่อ, ถ้าเริ่มใหม่ → เก็บตัวแรก
  kgMultiplyBase = kgMultiplyBase !== null ? kgMultiplyBase * cur : cur;
  kgBuffer = '';
  updateKgDisplay();
}
function rippleKey(e) {
  if (!e || !e.currentTarget) return;
  const btn = e.currentTarget;
  const r   = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  r.style.cssText = `width:${size}px;height:${size}px;left:${size/2}px;top:${size/2}px;margin:-${size/2}px;`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 400);
}

function confirmKg() {
  const cur = parseFloat(kgBuffer);
  if (cur > 0) {
    if (kgMultiplyBase !== null) {
      kgEntries.push({ val: kgMultiplyBase * cur });
      kgMultiplyBase = null;
    } else {
      kgEntries.push({ val: cur });
    }
  }
  kgBuffer = '';
  const total = kgTotal();
  if (!total || total <= 0 || !kgModalItemId) { closeKgModal(); return; }
  const id   = Number(kgModalItemId);
  const item = ITEMS.find(x => x.id === id);
  if (!item) { closeKgModal(); return; }

  // ── validation guard ──
  const stock  = item.stock_qty || 0;
  const isInt  = Number.isInteger(total);
  if (total > stock) {
    toast(`❌ เกินสต็อก (มีแค่ ${stock.toLocaleString('th-TH')} ${item.unit||'กก.'})`, 'error');
    updateKgDisplay();
    return;
  }
  if (currentMode === 'piece' && !isInt) {
    toast('❌ จำนวนชิ้นต้องเป็นจำนวนเต็ม', 'error');
    updateKgDisplay();
    return;
  }

  const mode      = currentMode;
  const unitLabel = mode === 'kg' ? 'กก.' : (item.unit || 'ชิ้น');
  const isNew     = !cart[id];
  cart[id] = { item, qty: total, mode, unitLabel };
  closeKgModal();
  toast(isNew ? `+ ${item.name} ${formatCalc(total)} ${unitLabel}` : `✎ ${item.name} → ${formatCalc(total)} ${unitLabel}`);
  renderGrid();
  renderCartBadge();
}

// ══════════════════════════════════════════
//  CART MODAL
// ══════════════════════════════════════════
function openCartModal() {
  renderCartList();
  document.getElementById('cart-backdrop').classList.add('open');
  document.getElementById('cart-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCartModal() {
  document.getElementById('cart-backdrop').classList.remove('open');
  document.getElementById('cart-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function clearCart() {
  if (!Object.keys(cart).length) return;
  cart = {};
  renderCartList();
  renderGrid();
  renderCartBadge();
  toast('ล้างรายการแล้ว');
}
function removeFromCart(id) {
  delete cart[Number(id)];
  renderCartList();
  renderGrid();
  renderCartBadge();
}
function editFromCart(id) {
  closeCartModal();
  setTimeout(() => openKgModal(Number(id)), 350);
}
function renderCartBadge() {
  const n   = Object.keys(cart).length;
  const el  = document.getElementById('cart-fab-badge');
  el.textContent = n;
  el.classList.toggle('show', n > 0);
}
function renderCartList() {
  const listEl  = document.getElementById('cart-list');
  const countEl = document.getElementById('cart-count');
  const tItems  = document.getElementById('t-items');
  const tWt     = document.getElementById('t-weight');
  const tAmt    = document.getElementById('t-amount');
  const sendTag = document.getElementById('send-tag');
  const sendBtn = document.getElementById('send-btn');

  const keys = Object.keys(cart);

  if (!keys.length) {
    listEl.innerHTML = `<div class="cart-empty"><i class="ph ph-truck"></i><p>แตะสินค้าเพื่อเพิ่มรายการส่ง</p></div>`;
    countEl.textContent = '0';
    tItems.textContent  = '0 รายการ';
    tWt.textContent     = '0.00 กก.';
    tAmt.innerHTML      = '<span class="cur">฿</span>0.00';
    sendTag.textContent = '฿0';
    sendBtn.disabled    = true;
    return;
  }

  let totalKg = 0, totalAmt = 0, hasNonKg = false;
  listEl.innerHTML = keys.map(id => {
    const c      = cart[id];
    const price  = Number(c.item.sell_price);
    const sub    = Math.round(c.qty * price * 100) / 100;
    const isKg   = c.mode === 'kg';
    if (isKg) totalKg += c.qty; else hasNonKg = true;
    totalAmt += sub;
    const qtyDisp = c.qty % 1 === 0 ? c.qty : c.qty.toFixed(2);
    return `
    <div class="cart-row">
      <div class="cart-row-icon">${renderIcon(c.item.icon, c.item.cat, 20)}</div>
      <div class="cart-row-info">
        <div class="cart-row-name">${c.item.name}</div>
        <div class="cart-row-sub">${qtyDisp} ${c.unitLabel} × ฿${price} = <b>฿${sub.toFixed(2)}</b></div>
      </div>
      <button class="cart-row-weight-btn" onclick="editFromCart(${id})">
        <span class="cart-row-weight-val">${qtyDisp}</span>
        <span class="cart-row-weight-unit">${c.unitLabel}</span>
        <i class="ph ph-pencil-simple cart-row-weight-icon"></i>
      </button>
      <button class="cart-row-del" onclick="removeFromCart(${id})">
        <i class="ph ph-trash-simple"></i>
      </button>
    </div>`;
  }).join('');

  const fmt = n => n.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2});
  countEl.textContent = keys.length;
  tItems.textContent  = `${keys.length} รายการ`;
  // แสดงน้ำหนักรวมเฉพาะที่เป็น kg / หรือรวมบอก "หลายหน่วย"
  tWt.textContent     = hasNonKg
    ? (totalKg > 0 ? `${totalKg.toFixed(2)} กก. + ชิ้น` : 'หลายหน่วย')
    : `${totalKg.toFixed(2)} กก.`;
  tAmt.innerHTML      = `<span class="cur">฿</span>${fmt(totalAmt)}`;
  sendTag.textContent = `฿${Math.round(totalAmt).toLocaleString('th-TH')}`;
  sendBtn.disabled    = false;
}

// ══════════════════════════════════════════
//  SUPABASE
// ══════════════════════════════════════════
// เดิมยิง REST ไปที่ Supabase ผ่าน fetch() — ตอนนี้เปลี่ยนไปเรียก
// localRest() ที่อ่าน/เขียน SQLite ในเครื่องแทน โดย path/opts รูปแบบเดิมทุกอย่าง
async function sbFetch(path, opts = {}) {
  return localRest(path, opts);
}

// ══════════════════════════════════════════
//  LOAD DATA
// ══════════════════════════════════════════
async function loadCats() {
  try {
    const r = await sbFetch('categories?select=slug,label,icon&order=id');
    if (r && r.length) CATS = r;
  } catch(_) {}
}

function renderCatBar() {
  const bar = document.getElementById('cat-bar');
  if (!bar) return;
  const catIconHtml = (icon) => {
    if (!icon) return '';
    if (icon.startsWith('ph-fill ')) return `<i class="${icon}"></i> `;
    if (icon.startsWith('ph ph-'))   return `<i class="ph-fill ${icon.slice(3)}"></i> `;
    if (icon.startsWith('ph-'))      return `<i class="ph-fill ${icon}"></i> `;
    return icon + ' ';
  };
  bar.innerHTML = '<button class="cat-btn on" data-cat="all">ทั้งหมด</button>'
    + CATS.map(c=>`<button class="cat-btn" data-cat="${c.slug}">${catIconHtml(c.icon)}${c.label}</button>`).join('');
  bar.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('on', b === btn));
      activeCat = btn.dataset.cat;
      renderGrid();
    });
  });
}

async function loadFactories() {
  try {
    const r = await sbFetch('factories?select=id,name,location&order=id&is_active=eq.true');
    if (r && r.length) FACTORIES = r;
  } catch(_) {}
}

function renderFactorySelect() {
  const sel = document.getElementById('factory-select');
  if (!sel) return;
  // FACTORIES โหลดมาจากตาราง factories ใน SQLite (loadFactories()) — เป็น source of truth เดียว
  const source = FACTORIES.length ? FACTORIES : [
    {id:'factory_a', name:'โรงงาน A', location:'อยุธยา'},
    {id:'factory_b', name:'โรงงาน B', location:'สมุทรปราการ'},
    {id:'factory_c', name:'โรงงาน C', location:'ชลบุรี'},
    {id:'factory_d', name:'โรงงาน D', location:'ระยอง'},
  ];
  sel.innerHTML = source.map(f =>
    `<option value="${f.id}">🏭 ${f.name}${f.location ? ' — '+f.location : ''}</option>`
  ).join('');
}

async function loadItems() {
  const grid = document.getElementById('item-grid');
  grid.innerHTML = `<div class="grid-loading"><i class="ph ph-spinner-gap spin" style="font-size:28px;"></i><span style="font-size:13px;">กำลังโหลดสินค้า...</span></div>`;

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 400));
    ITEMS = DEMO_ITEMS.map(item => ({ ...item }));
    document.getElementById('config-banner').style.display = 'flex';
    renderCatBar();
    renderFactorySelect();
    renderGrid();
    return;
  }

  document.getElementById('config-banner').style.display = 'none';
  try {
    await loadCats();
    await loadFactories();
    renderCatBar();
    renderFactorySelect();
    ITEMS = await sbFetch('items?select=id,name,icon,sell_price,unit,cat,stock_qty,sell_mode&order=cat,name') || [];
    renderGrid();
  } catch (err) {
    grid.innerHTML = `<div class="grid-loading"><i class="ph ph-warning-circle" style="font-size:28px;color:var(--red);"></i><span style="font-size:13px;color:var(--red);">โหลดไม่สำเร็จ: ${err.message}</span></div>`;
    toast('❌ ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════
//  RENDER GRID
// ══════════════════════════════════════════
function renderGrid() {
  const grid = document.getElementById('item-grid');
  let list = ITEMS;
  if (activeCat !== 'all') list = list.filter(x => x.cat === activeCat);
  if (query) list = list.filter(x => x.name.includes(query));

  if (!list.length) {
    grid.innerHTML = `<div class="grid-loading"><i class="ph ph-magnifying-glass" style="font-size:28px;"></i><span style="font-size:13px;">ไม่พบสินค้า</span></div>`;
    return;
  }

  grid.innerHTML = list.map(item => {
    const nid       = Number(item.id);
    const inCart    = !!cart[nid];
    const cartEntry = cart[nid];
    const qty       = inCart ? cartEntry.qty : 0;
    const unitLabel = inCart ? cartEntry.unitLabel : (item.sell_mode === 'piece' ? (item.unit||'ชิ้น') : 'กก.');
    const stock     = item.stock_qty || 0;
    const cls       = stockClass(stock);
    const oos       = stock <= 0;
    const qtyDisp   = qty % 1 === 0 ? qty : qty.toFixed(1);
    const stockUnit = item.unit || (item.sell_mode === 'piece' ? 'ชิ้น' : 'กก.');
    return `
    <div class="item-card ${inCart?'selected':''} ${oos?'out-of-stock':''}" onclick="openKgModal(${nid})">
      <div class="card-badge">${qtyDisp}</div>
      <div class="card-icon">${renderIcon(item.icon, item.cat, 26)}</div>
      <div class="card-name">${item.name}</div>
      <div class="card-stock ${cls}">
        <i class="ph ph-stack-simple" style="font-size:9px;"></i>
        ${stock.toLocaleString('th-TH')} ${stockUnit}${oos?' — หมด':''}
      </div>
      <div class="card-bottom">
        <div class="card-price">฿${Number(item.sell_price).toFixed(2)}<span class="card-price-unit">/${item.unit||'กก.'}</span></div>
        <button class="card-add-btn" onclick="event.stopPropagation();openKgModal(${nid})">
          <i class="ph ${inCart?'ph-pencil':'ph-plus'}"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════
//  SAVE SELL TRANSACTION
// ══════════════════════════════════════════
async function saveSellTransaction() {
  const sendBtn = document.getElementById('send-btn');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i class="ph ph-spinner-gap spin"></i><span>กำลังบันทึก...</span>';

  const sel         = document.getElementById('factory-select');
  const factoryId   = FACTORIES.length ? parseInt(sel.value) : null;
  const factoryName = sel.options[sel.selectedIndex].text.replace('🏭 ', '');

  const lines = Object.values(cart).map(c => ({
    item_id:    c.item.id,
    item_name:  c.item.name,
    qty:        c.qty,
    kg:         c.mode === 'kg' ? c.qty : null,
    mode:       c.mode,
    unit_label: c.unitLabel,
    price:      Number(c.item.sell_price),
    subtotal:   Math.round(c.qty * Number(c.item.sell_price) * 100) / 100,
  }));
  const totalAmt = lines.reduce((s, l) => s + l.subtotal, 0);

  function deductLocalStock(soldLines) {
    soldLines.forEach(line => {
      const item = ITEMS.find(i => Number(i.id) === Number(line.item_id));
      if (item) {
        item.stock_qty = Math.max(0, (item.stock_qty || 0) - line.qty);
      }
    });
  }

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 700));
    deductLocalStock(lines);
    _pendingSellReceipt = { lines, totalAmt, factoryName };
    cart = {};
    closeCartModal();
    renderGrid();
    renderCartBadge();
    showSellDialog(lines, totalAmt, factoryName);
    return;
  }

  try {
    const result = await sbFetch('rpc/record_sell_transaction', {
      method: 'POST',
      body: { p_factory_id: factoryId, p_factory_name: factoryName, p_lines: lines },
      prefer: 'return=representation',
    });
    if (!result || !result.success) throw new Error('RPC ไม่สำเร็จ');
    deductLocalStock(lines);
    _pendingSellReceipt = { lines, totalAmt, factoryName };
    cart = {};
    closeCartModal();
    renderGrid();      
    renderCartBadge();
    showSellDialog(lines, totalAmt, factoryName);
    setTimeout(() => loadItems(), 1200);
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
    sendBtn.disabled = false;
    sendBtn.innerHTML = `<i class="ph ph-truck"></i><span>ยืนยันส่งโรงงาน</span><span class="send-amount-tag" id="send-tag">฿${Math.round(totalAmt).toLocaleString('th-TH')}</span>`;
  }
}

// ══════════════════════════════════════════
//  SELL RECEIPT SYSTEM
// ══════════════════════════════════════════
let _pendingSellReceipt = null;

function fmtB(n) {
  const v = Number(n || 0);
  return v === Math.floor(v)
    ? v.toLocaleString('th-TH')
    : v.toLocaleString('th-TH', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtQtyStr(qty, mode, unit) {
  return `${fmtB(qty)} ${unit || (mode==='kg' ? 'กก.' : 'ชิ้น')}`;
}
function escHtmlSell(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showSellDialog(lines, totalAmt, factoryName) {
  document.getElementById('sdlg-factory').textContent = factoryName.split(' — ')[0];
  document.getElementById('sdlg-amount').textContent  = '฿' + fmtB(totalAmt);
  document.getElementById('sdlg-items').textContent   = lines.length + ' รายการ';
  document.getElementById('sdlg-backdrop').classList.add('show');
  document.getElementById('sdlg-box').classList.add('show');
}
function hideSellDialog() {
  document.getElementById('sdlg-backdrop').classList.remove('show');
  document.getElementById('sdlg-box').classList.remove('show');
}
function skipSellReceipt() {
  hideSellDialog();
  toast('✅ บันทึกส่งสำเร็จ');
  _pendingSellReceipt = null;
}
function openSellReceipt() {
  hideSellDialog();
  if (!_pendingSellReceipt) return;
  const { lines, totalAmt, factoryName } = _pendingSellReceipt;
  const now     = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
  const billNo  = 'S' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') +
                  String(now.getDate()).padStart(2,'0') + '-' +
                  String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') +
                  String(now.getSeconds()).padStart(2,'0');
  const totalKg = lines.filter(l => l.mode==='kg').reduce((s, l) => s + l.qty, 0);
  const [factShort, factLoc] = factoryName.split(' — ');
  const linesHtml = lines.map(l => `
    <div class="srcp-line">
      <div class="srcp-line-left">
        <div class="srcp-line-name">${escHtmlSell(l.item_name)}</div>
        <div class="srcp-line-detail">
          ${fmtQtyStr(l.qty, l.mode, l.unit_label)} × ฿${fmtB(l.price)}/${l.unit_label||'กก.'}
        </div>
      </div>
      <div class="srcp-line-amt">฿${fmtB(l.subtotal)}</div>
    </div>`).join('');
  const telHtml = SHOP_TEL ? `<div class="srcp-shop-tel"><i class="ph ph-phone"></i> ${escHtmlSell(SHOP_TEL)}</div>` : '';
  const addrHtml = SHOP_ADDRESS ? `<div class="srcp-shop-addr"><i class="ph ph-map-pin"></i> ${escHtmlSell(SHOP_ADDRESS)}</div>` : '';

  document.getElementById('srcp-paper').innerHTML = `
    <div class="srcp-shop">
      <div class="srcp-shop-name">🔄 ${escHtmlSell(SHOP_NAME)}</div>
      <div class="srcp-shop-sub">${escHtmlSell(SHOP_TAGLINE)}</div>
      ${telHtml}
      ${addrHtml}
    </div>
    <hr class="srcp-divider">
    <div class="srcp-type-badge"><i class="ph-fill ph-upload-simple"></i> ใบส่งสินค้า</div>
    <div class="srcp-factory-badge">
      <i class="ph ph-factory" style="font-size:16px;color:var(--ink3);"></i>
      <div>
        <div class="srcp-factory-label">โรงงานปลายทาง</div>
        <div class="srcp-factory-name">${escHtmlSell(factShort)}${factLoc ? ' — '+escHtmlSell(factLoc) : ''}</div>
      </div>
    </div>
    <div class="srcp-meta-row"><span class="srcp-meta-label">วันที่</span><span class="srcp-meta-val">${dateStr}</span></div>
    <div class="srcp-meta-row"><span class="srcp-meta-label">เวลา</span><span class="srcp-meta-val">${timeStr} น.</span></div>
    <div class="srcp-meta-row"><span class="srcp-meta-label">เลขบิล</span><span class="srcp-meta-val">${billNo}</span></div>
    <hr class="srcp-divider">
    ${linesHtml}
    <div class="srcp-total-block">
      <div class="srcp-total-row"><span class="srcp-total-label">มูลค่าส่ง</span><span class="srcp-total-amt">฿${fmtB(totalAmt)}</span></div>
      ${totalKg > 0 ? `<div class="srcp-total-kg">น้ำหนักรวม ${fmtB(totalKg)} กก.</div>` : ''}
    </div>
    <hr class="srcp-divider">
    <div class="srcp-footer">ขอบคุณที่ใช้บริการ 🙏<br>${escHtmlSell(SHOP_NAME)}</div>
    <div class="srcp-bill-no">${billNo}</div>
  `;
  document.getElementById('srcp-backdrop').classList.add('show');
  document.getElementById('srcp-sheet').classList.add('show');

  // เก็บข้อความใบเสร็จแบบ plain-text ไว้ใช้ตอนกด "พิมพ์ใบส่ง" (ดู printReceipt())
  const totalKgLine = totalKg > 0 ? `น้ำหนักรวม ${fmtB(totalKg)} กก.\n` : '';
  const telLine = SHOP_TEL ? `โทร ${SHOP_TEL}\n` : '';
  const addrLine = SHOP_ADDRESS ? `${SHOP_ADDRESS}\n` : '';
  _lastReceiptText =
`🔄 ${SHOP_NAME}
${SHOP_TAGLINE}
${telLine}${addrLine}
ใบส่งสินค้า
โรงงานปลายทาง ${factShort}${factLoc ? ' — '+factLoc : ''}
วันที่ ${dateStr}
เวลา ${timeStr} น.
เลขบิล ${billNo}
────────────────────
${lines.map(l => `${l.item_name}\n  ${fmtQtyStr(l.qty, l.mode, l.unit_label)} × ฿${fmtB(l.price)}/${l.unit_label||'กก.'} = ฿${fmtB(l.subtotal)}`).join('\n')}
────────────────────
มูลค่าส่ง ฿${fmtB(totalAmt)}
${totalKgLine}
ขอบคุณที่ใช้บริการ 🙏
${SHOP_NAME}`;

  _pendingSellReceipt = null;
}

// ══════════════════════════════════════════
//  พิมพ์ใบส่ง
// ══════════════════════════════════════════
// window.print() ใช้ไม่ได้ใน Android WebView ของ Capacitor (ไม่มี print dialog ให้)
// ถ้าเปิดในแอพจริง (native) ใช้ @capacitor/share เปิด share sheet แทน
// ให้เลือกแอปพิมพ์ใบเสร็จ/เครื่องพิมพ์ Bluetooth (เช่น RawBT) หรือแชร์ผ่านไลน์/อีเมลได้
// ถ้าเปิดใน browser ปกติ (เช่น preview บนคอมตอนพัฒนา) ยัง fallback ไป window.print() ได้ตามเดิม
let _lastReceiptText = '';
async function printReceipt() {
  const capShare = window.Capacitor?.Plugins?.Share;
  if (capShare) {
    try {
      await capShare.share({
        title: `ใบส่ง ${SHOP_NAME}`,
        text: _lastReceiptText || '',
        dialogTitle: 'พิมพ์ / แชร์ใบส่ง',
      });
    } catch (err) {
      if (err && err.message && !/cancel/i.test(err.message)) {
        toast('❌ แชร์ไม่สำเร็จ: ' + err.message, 'error');
      }
    }
    return;
  }
  window.print();
}
function closeSellReceipt() {
  document.getElementById('srcp-backdrop').classList.remove('show');
  document.getElementById('srcp-sheet').classList.remove('show');
}

// ══════════════════════════════════════════
//  FACTORY EDIT MODAL
//  แก้ไข/เพิ่ม/ลบ "โรงงาน" — บันทึกลงตาราง factories ใน SQLite โดยตรง
//  (เดิมเคยเก็บใน localStorage เท่านั้น ทำให้ข้อมูลหายถ้าเคลียร์ cache
//   และไม่ sync กับตาราง factories ที่มีอยู่แล้ว — แก้ให้ใช้ SQLite เป็นแหล่งเดียว)
// ══════════════════════════════════════════
function openFactoryEdit() {
  // ใช้ FACTORIES ที่โหลดจาก DB จริง (มี id ตัวเลขจริง) ไม่ใช่ parse จาก <option> อีกต่อไป
  const factories = FACTORIES.length ? FACTORIES : [];
  renderFactoryEditList(factories);
  document.getElementById('fedit-backdrop').classList.add('open');
  document.getElementById('fedit-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFactoryEdit() {
  document.getElementById('fedit-backdrop').classList.remove('open');
  document.getElementById('fedit-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function renderFactoryEditList(factories) {
  const list = document.getElementById('fedit-list');
  list.innerHTML = factories.map((f, i) => `
    <div class="fedit-item" id="fedit-row-${i}" data-id="${f.id}">
      <div class="fedit-item-icon"><i class="ph ph-factory"></i></div>
      <div class="fedit-item-fields">
        <input class="fedit-item-name-input" id="fedit-name-${i}"
          value="${escHtml(f.name)}" placeholder="ชื่อโรงงาน" maxlength="60">
        <input class="fedit-item-loc-input" id="fedit-loc-${i}"
          value="${escHtml(f.location)}" placeholder="ที่ตั้ง (เช่น อยุธยา)" maxlength="60">
      </div>
      <button class="fedit-item-del" onclick="deleteFactoryRow(${i})" title="ลบ">
        <i class="ph ph-trash"></i>
      </button>
    </div>
  `).join('') + `
    <button class="fedit-add-btn" onclick="addFactoryRow()">
      <i class="ph ph-plus-circle"></i> เพิ่มโรงงานใหม่
    </button>
  `;
  list._count = factories.length;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function deleteFactoryRow(i) {
  const row = document.getElementById(`fedit-row-${i}`);
  if (row) { row.style.opacity='0.3'; row.style.pointerEvents='none'; row.dataset.deleted='1'; }
}

let _feditNewCount = 0;
function addFactoryRow() {
  const list = document.getElementById('fedit-list');
  const addBtn = list.querySelector('.fedit-add-btn');
  const i = 'new_' + (++_feditNewCount);
  const div = document.createElement('div');
  div.className = 'fedit-item';
  div.id = `fedit-row-${i}`;
  div.innerHTML = `
    <div class="fedit-item-icon"><i class="ph ph-factory"></i></div>
    <div class="fedit-item-fields">
      <input class="fedit-item-name-input" id="fedit-name-${i}"
        value="" placeholder="ชื่อโรงงาน" maxlength="60" autofocus>
      <input class="fedit-item-loc-input" id="fedit-loc-${i}"
        value="" placeholder="ที่ตั้ง (เช่น อยุธยา)" maxlength="60">
    </div>
    <button class="fedit-item-del" onclick="deleteFactoryRow('${i}')" title="ลบ">
      <i class="ph ph-trash"></i>
    </button>
  `;
  div.dataset.isnew = '1';
  list.insertBefore(div, addBtn);
  setTimeout(() => div.querySelector('input').focus(), 50);
}

async function saveFactoryEdit() {
  const list = document.getElementById('fedit-list');
  const rows = [...list.querySelectorAll('.fedit-item')];

  // แถวที่เหลืออยู่หลังแก้ไข (ไม่ถูกลบ, มีชื่อ)
  const kept = rows.filter(row => row.dataset.deleted !== '1');
  const keptNames = kept.map(row => (document.getElementById(`fedit-name-${row.id.replace('fedit-row-','')}`)?.value || '').trim()).filter(Boolean);
  if (!keptNames.length) { toast('⚠️ ต้องมีโรงงานอย่างน้อย 1 แห่ง', 'error'); return; }

  const btn = document.querySelector('.fedit-save-btn');
  if (btn) { btn.disabled = true; }

  try {
    for (const row of rows) {
      const idx = row.id.replace('fedit-row-', '');
      const name = (document.getElementById(`fedit-name-${idx}`)?.value || '').trim();
      const loc  = (document.getElementById(`fedit-loc-${idx}`)?.value || '').trim();
      const isNew = row.dataset.isnew === '1';
      const isDeleted = row.dataset.deleted === '1';
      const dbId = row.dataset.id;

      if (isDeleted) {
        if (!isNew && dbId) {
          await sbFetch(`factories?id=eq.${dbId}`, { method: 'DELETE', prefer: 'return=minimal' });
        }
        continue; // แถวใหม่ที่ถูกลบก่อนบันทึก ไม่ต้องทำอะไร
      }
      if (!name) continue; // ข้ามแถวที่ไม่กรอกชื่อ

      if (isNew) {
        await sbFetch('factories', {
          method: 'POST', prefer: 'return=minimal',
          body: { name, location: loc, is_active: 1 },
        });
      } else if (dbId) {
        await sbFetch(`factories?id=eq.${dbId}`, {
          method: 'PATCH', prefer: 'return=minimal',
          body: { name, location: loc },
        });
      }
    }

    await loadFactories();
    renderFactorySelect();
    closeFactoryEdit();
    toast('✓ บันทึกชื่อโรงงานแล้ว');
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ══════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════
document.getElementById('search-input').addEventListener('input', e => {
  query = e.target.value.trim();
  renderGrid();
});

function swipeClose(modalId, closeFn) {
  let ty = 0;
  document.getElementById(modalId).addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, {passive:true});
  document.getElementById(modalId).addEventListener('touchmove',  e => { if (e.touches[0].clientY - ty > 70) closeFn(); }, {passive:true});
}
swipeClose('kg-modal',   closeKgModal);
swipeClose('cart-modal', closeCartModal);

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast-show' + (type === 'error' ? ' toast-error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = ''; }, 2400);
}

// INIT
(async () => {
  window.AUTH = { user: { email: 'local@device' }, logout: () => {} };
  loadItems();
  loadShopProfileForReceipt();
})();