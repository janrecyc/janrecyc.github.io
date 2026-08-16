// ══════════════════════════════════════════
//  pages/buy-tab.js — the "รับซื้อ" tab's content, rendered into
//  shop.html's #shop-mount by shop-page.js's tab router. Ported
//  from ScrapPOS's own buy.html/buy.js (same catalogue/cart/kg-
//  entry/receipt logic against ScrapDB), re-homed the same way as
//  js/pages/history-tab.js:
//    - initBuyTab(mountId) builds the search box + category bar +
//      item grid + cart panel into the mount (was buy.html's
//      <div class="catalogue"> + <div class="cart-panel">) and is
//      what shop-page.js calls when this tab becomes active —
//      buy.js used to just run everything at script-load time.
//    - The kg-entry modal, confirm dialog, receipt sheet, and
//      toast are NOT part of the mount — like history-tab.js's
//      detail sheet, they're fixed-position overlays living as
//      static markup at the end of shop.html's <body>, so they
//      survive #shop-mount being re-rendered on every tab switch.
//    - No more page-level header/logo/logout button — shop.html's
//      own page-header + bottom nav-mount (and dashboard's own
//      logout, in its profile sheet) already cover that. The
//      cash-pill + refresh button that lived in that header are
//      now their own small row at the top of the mount instead.
//
//  A few small helpers (fmtB, esc, sbFetch) are intentionally
//  redeclared identically in history-tab.js too — both files load
//  together on shop.html now (they used to be separate pages that
//  never coexisted), but since the implementations are byte-for-
//  byte the same trivial wrappers, the duplicate declaration is
//  harmless (last one loaded just wins).
// ══════════════════════════════════════════

// ── ตั้งค่าร้าน — ค่าเริ่มต้น (ถ้ายังไม่เคยกรอก "ข้อมูลร้าน" ในหน้า Dashboard) ──
let SHOP_NAME    = 'ScrapPOS';
let SHOP_TAGLINE = 'ร้านรับซื้อของเก่า / รีไซเคิล';
let SHOP_TEL     = '';   // เบอร์โทร เช่น '081-234-5678'
let SHOP_ADDRESS = '';
let SHOP_LOGO    = '';

// โหลดข้อมูลร้าน (ชื่อ/เบอร์โทร/ที่อยู่/โลโก้) จากตาราง profiles มาทับค่าเริ่มต้นด้านบน
// เพื่อให้ใบเสร็จใช้ชื่อร้านที่ตั้งไว้ในเมนู "ข้อมูลร้าน" (Dashboard) แทนคำว่า ScrapPOS เฉยๆ
async function loadShopProfileForReceipt() {
  try {
    const rows = await sbFetch('profiles?is_active=eq.true&order=id&limit=1');
    if (!rows.length) return;
    const p = rows[0];
    if (p.name)  SHOP_NAME    = p.name;
    if (p.phone) SHOP_TEL     = p.phone;
    if (p.logo)  SHOP_LOGO    = p.logo;
    const addr = [p.address, p.district, p.province, p.postal_code].filter(Boolean).join(' ');
    if (addr) SHOP_ADDRESS = addr;
  } catch (e) { console.warn('loadShopProfileForReceipt:', e); }
}

const DEMO_ITEMS = [
  {id:1,  name:'เหล็กหนัก',          icon:'ph-nut',           buy_price:4.50,  unit:'กก.',  sell_mode:'kg',    cat:'metal'},
  {id:2,  name:'เหล็กบาง',           icon:'ph-pipe',          buy_price:2.80,  unit:'กก.',  sell_mode:'kg',    cat:'metal'},
  {id:3,  name:'ทองแดง',             icon:'ph-coins',         buy_price:195,   unit:'กก.',  sell_mode:'kg',    cat:'metal'},
  {id:4,  name:'อลูมิเนียม',         icon:'ph-steps',         buy_price:42,    unit:'กก.',  sell_mode:'kg',    cat:'metal'},
  {id:5,  name:'สแตนเลส',            icon:'ph-gear-six',      buy_price:18,    unit:'กก.',  sell_mode:'kg',    cat:'metal'},
  {id:6,  name:'กระดาษหนังสือพิมพ์', icon:'ph-newspaper',     buy_price:2.20,  unit:'กก.',  sell_mode:'kg',    cat:'paper'},
  {id:7,  name:'กระดาษลัง',          icon:'ph-package',       buy_price:2.50,  unit:'กก.',  sell_mode:'kg',    cat:'paper'},
  {id:8,  name:'กระดาษขาว',          icon:'ph-file-text',     buy_price:3.00,  unit:'กก.',  sell_mode:'kg',    cat:'paper'},
  {id:9,  name:'พลาสติกขาว',         icon:'ph-cube',          buy_price:8.50,  unit:'กก.',  sell_mode:'kg',    cat:'plastic'},
  {id:10, name:'ขวด PET',            icon:'ph-flask',         buy_price:6.00,  unit:'กก.',  sell_mode:'kg',    cat:'plastic'},
  {id:11, name:'แก้วใส',             icon:'ph-square',        buy_price:1.20,  unit:'กก.',  sell_mode:'kg',    cat:'glass'},
  {id:12, name:'สายไฟทองแดง',        icon:'ph-plug-charging', buy_price:85,    unit:'กก.',  sell_mode:'kg',    cat:'electric'},
  {id:13, name:'มอเตอร์เก่า',        icon:'ph-lightning',     buy_price:25,    unit:'ชิ้น', sell_mode:'piece', cat:'electric'},
];

// สีพื้นวงกลมไอคอนหมวดหมู่ — ใช้โทนสีแบรนด์เดียวกับที่แดชบอร์ด/หน้าอื่นๆ
// ของแอปใช้อยู่แล้ว (var(--blue)/(--green)/(--amber)/(--red)/(--magenta)/
// (--primary) ใน buy.css) แทนสีพาสเทลเดิมของ ScrapPOS เพื่อให้แท็บนี้
// กลมกลืนไปกับธีมของแอป ไม่ใช่จานสีแยกของตัวเอง
const CAT_COLOR = {
  metal:       {bg:'var(--blue-l)',    fg:'var(--blue)'},
  paper:       {bg:'var(--amber-l)',   fg:'var(--amber)'},
  plastic:     {bg:'var(--green-l)',   fg:'var(--green)'},
  glass:       {bg:'var(--primary-l)', fg:'var(--primary)'},
  electric:    {bg:'var(--red-l)',     fg:'var(--red)'},
  'beer-crate':{bg:'var(--magenta-l)', fg:'var(--magenta)'},
  default:     {bg:'var(--primary-l)', fg:'var(--primary)'},
};
function itemColor(cat) { return CAT_COLOR[cat] || CAT_COLOR.default; }

function renderIcon(icon, cat, size = 28) {
  if (icon && icon.startsWith('ph-')) {
    const c = itemColor(cat);
    return `<span class="ph-icon-wrap" style="background:${c.bg};color:${c.fg};width:${size+16}px;height:${size+16}px;font-size:${size}px;">
      <i class="ph-fill ${icon}"></i></span>`;
  }
  return `<span style="font-size:${size}px;line-height:1;">${icon}</span>`;
}

// ── State ──
let ITEMS       = [];
let cart        = {};
let CATS        = [];
let cashBalance = null;
let activeCat   = 'all';
let query       = '';

function catLabel(s) { return CATS.find(c => c.slug === s)?.label || s; }
function catIcon(s)  { return CATS.find(c => c.slug === s)?.icon || '📦'; }

// ══════════════════════════════════════════
//  KG MODAL STATE
// ══════════════════════════════════════════
let kgModalItemId  = null;
let kgBuffer       = '';
let kgEntries      = [];
let currentMode    = 'kg';
let kgMultiplyBase = null;

function kgTotal() { return kgEntries.reduce((s, e) => s + e.val, 0); }

function openKgModal(id) {
  id = Number(id);
  const item = ITEMS.find(x => x.id === id);
  if (!item) return;
  kgModalItemId = id;

  document.getElementById('kg-item-icon').innerHTML  = renderIcon(item.icon, item.cat, 26);
  document.getElementById('kg-item-name').textContent  = item.name;
  document.getElementById('kg-item-price').textContent = `฿${Number(item.buy_price).toFixed(2)} / ${item.unit||'กก.'}`;

  const itemMode = item.sell_mode || 'kg';
  document.getElementById('kg-mode-toggle').style.display = item.sell_mode === 'piece' ? 'none' : 'flex';
  setMode(itemMode);

  if (cart[id]) kgEntries = [{ val: cart[id].qty }];
  updateKgDisplay();

  document.getElementById('kg-backdrop').classList.add('open');
  document.getElementById('kg-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeKgModal() {
  document.getElementById('kg-backdrop').classList.remove('open');
  document.getElementById('kg-modal').classList.remove('open');
  document.body.style.overflow = '';
  kgModalItemId = null; kgBuffer = ''; kgEntries = []; kgMultiplyBase = null;
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-btn-kg').classList.toggle('active', mode === 'kg');
  document.getElementById('mode-btn-piece').classList.toggle('active', mode === 'piece');
  if (mode === 'kg') {
    document.getElementById('kg-display-label').textContent = 'น้ำหนัก';
    document.getElementById('kg-unit-label').textContent    = 'กก.';
  } else {
    document.getElementById('kg-display-label').textContent = 'จำนวน';
    document.getElementById('kg-unit-label').textContent    = 'ชิ้น';
  }
  kgBuffer = ''; kgEntries = [];
  updateKgDisplay();
}

function updateKgDisplay() {
  const unitText = currentMode === 'kg' ? 'กก.' : 'ชิ้น';
  const cur      = parseFloat(kgBuffer) || 0;
  const total    = kgTotal() + cur;

  const lblEl2 = document.getElementById('kg-display-label');
  if (kgMultiplyBase !== null) {
    lblEl2.textContent = `${formatCalc(kgMultiplyBase)} ×`;
    lblEl2.style.color = 'var(--calc-op)';
  } else {
    lblEl2.textContent = currentMode === 'kg' ? 'น้ำหนัก' : 'จำนวน';
    lblEl2.style.color = '';
  }

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

  document.getElementById('kg-display-num').textContent = kgBuffer || '0';

  const item  = kgModalItemId ? ITEMS.find(x => x.id === kgModalItemId) : null;
  const price = item ? Number(item.buy_price) : 0;
  const sub   = total * price;
  document.getElementById('kg-subtotal').textContent = sub > 0 ? `฿${sub.toFixed(2)}` : '฿0';

  const btnEl = document.getElementById('kg-confirm-btn');
  const lblEl = document.getElementById('kg-confirm-label');
  const valid = total > 0;
  btnEl.disabled = !valid;
  lblEl.textContent = valid
    ? `เพิ่ม ${formatCalc(total)} ${unitText} = ฿${sub.toFixed(2)}`
    : 'เพิ่มในตะกร้า';
}

function tapeDelete(i) {
  kgEntries.splice(i, 1);
  updateKgDisplay();
}

// ── Numpad ──
function kpNum(n, e) {
  rippleKey(e);
  if (kgBuffer.replace(/[^0-9]/g,'').length >= 8) return;
  if (kgBuffer === '0') kgBuffer = n;
  else kgBuffer += n;
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

function kpMultiply(e) {
  rippleKey(e);
  const cur = parseFloat(kgBuffer);
  if (!cur || cur <= 0) return;
  kgMultiplyBase = kgMultiplyBase !== null ? kgMultiplyBase * cur : cur;
  kgBuffer = '';
  updateKgDisplay();
}

function kpClear(e) {
  rippleKey(e);
  kgBuffer = ''; kgEntries = []; kgMultiplyBase = null;
  updateKgDisplay();
}

function formatCalc(v) {
  if (Number.isInteger(v)) return String(v);
  return parseFloat(v.toFixed(4)).toString();
}

function rippleKey(e) {
  if (!e || !e.currentTarget) return;
  const btn  = e.currentTarget;
  const r    = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  r.style.cssText = `width:${size}px;height:${size}px;left:${size/2}px;top:${size/2}px;margin:-${size/2}px;`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 400);
}

async function confirmKg() {
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

  const id   = kgModalItemId;
  const item = ITEMS.find(x => x.id === id);
  if (!item) { closeKgModal(); return; }

  const mode      = currentMode;
  const unitLabel = mode === 'kg' ? 'กก.' : (item.unit || 'ชิ้น');
  cart[id] = { item, qty: total, mode, unitLabel };

  closeKgModal();
  renderGrid();
  renderCartPanel();
  toast(`✓ ${item.name} ${formatCalc(total)} ${unitLabel}`);
}

// ══════════════════════════════════════════
//  CART PANEL
// ══════════════════════════════════════════
function renderCartPanel() {
  const panel   = document.getElementById('cart-panel');
  const listEl  = document.getElementById('cart-items-list');
  const countEl = document.getElementById('cart-count');
  const btnEl   = document.getElementById('cart-confirm-btn');
  const lblEl   = document.getElementById('cart-confirm-label');
  const warnEl  = document.getElementById('cash-insufficient-warn');
  const warnTxt = document.getElementById('cash-insufficient-text');

  const entries = Object.values(cart);
  const count   = entries.length;
  panel.classList.toggle('has-items', count > 0);
  countEl.textContent = count;

  if (!count) { listEl.innerHTML = ''; warnEl.classList.remove('show'); return; }

  const totalAmt = entries.reduce((s, c) => {
    return s + Math.round(c.qty * Number(c.item.buy_price) * 100) / 100;
  }, 0);

  listEl.innerHTML = entries.map(c => `
    <div class="cart-item-chip" onclick="openKgModal(${c.item.id})">
      <div class="cart-item-chip-icon">${renderIcon(c.item.icon, c.item.cat, 14)}</div>
      <div class="cart-item-chip-info">
        <div class="cart-item-chip-name">${c.item.name}</div>
        <div class="cart-item-chip-qty">${c.qty} ${c.unitLabel}</div>
      </div>
      <button class="cart-item-chip-remove" onclick="event.stopPropagation();removeFromCart(${c.item.id})">
        <i class="ph ph-x"></i>
      </button>
    </div>
  `).join('');

  lblEl.textContent = `บันทึก ${count} รายการ — ฿${totalAmt.toFixed(2)}`;

  if (cashBalance !== null && cashBalance < totalAmt) {
    const short = totalAmt - cashBalance;
    warnTxt.textContent = `เงินสดไม่พอ — ขาดอีก ฿${short.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    warnEl.classList.add('show');
    btnEl.disabled = true;
    btnEl.classList.add('blocked');
  } else {
    warnEl.classList.remove('show');
    btnEl.disabled = false;
    btnEl.classList.remove('blocked');
  }
}

function removeFromCart(id) { delete cart[id]; renderGrid(); renderCartPanel(); }
function clearCart()        { cart = {}; renderGrid(); renderCartPanel(); }

async function confirmCart() {
  const entries = Object.values(cart);
  if (!entries.length) return;

  const btnEl = document.getElementById('cart-confirm-btn');
  const lblEl = document.getElementById('cart-confirm-label');

  const lines = entries.map(c => ({
    item_id:    c.item.id,
    item_name:  c.item.name,
    qty:        c.qty,
    kg:         c.mode === 'kg' ? c.qty : null,
    mode:       c.mode,
    unit_label: c.unitLabel,
    price:      Number(c.item.buy_price),
    subtotal:   Math.round(c.qty * Number(c.item.buy_price) * 100) / 100,
  }));
  const totalAmt = lines.reduce((s, l) => s + l.subtotal, 0);

  if (cashBalance !== null && cashBalance < totalAmt) {
    const short = (totalAmt - cashBalance).toLocaleString('th-TH', {minimumFractionDigits:2});
    toast(`❌ เงินสดไม่พอ — ขาดอีก ฿${short}`, 'error');
    return;
  }

  btnEl.disabled = true;
  lblEl.textContent = 'กำลังบันทึก...';

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 700));
    if (cashBalance !== null) cashBalance -= totalAmt;
    renderCashBar();
    _pendingReceipt = { lines, totalAmt };
    cart = {}; renderGrid(); renderCartPanel();
    showDialog(lines, totalAmt);
    return;
  }

  try {
    await sbFetch('rpc/record_buy_transaction', {
      method: 'POST', body: { p_lines: lines }, prefer: 'return=minimal',
    });
    _pendingReceipt = { lines, totalAmt };
    cart = {}; renderGrid(); renderCartPanel();
    loadItems(); // loadItems() เรียก loadCashBalance() ให้อยู่แล้ว ไม่ต้องเรียกซ้ำ
    showDialog(lines, totalAmt);
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
    btnEl.disabled = false;
    lblEl.textContent = `บันทึก ${entries.length} รายการ — ฿${totalAmt.toFixed(2)}`;
  }
}

// ══════════════════════════════════════════
//  RECEIPT SYSTEM
// ══════════════════════════════════════════
let _pendingReceipt = null;

function fmtB(n) {
  const v = Number(n || 0);
  return v === Math.floor(v)
    ? v.toLocaleString('th-TH')
    : v.toLocaleString('th-TH', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtQtyStr(qty, mode, unit) {
  return `${fmtB(qty)} ${unit || (mode==='kg' ? 'กก.' : 'ชิ้น')}`;
}
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showDialog(lines, totalAmt) {
  document.getElementById('dlg-amount').textContent = '฿' + fmtB(totalAmt);
  document.getElementById('dlg-items').textContent  = lines.length + ' รายการ';
  document.getElementById('dlg-backdrop').classList.add('show');
  document.getElementById('dlg-box').classList.add('show');
}
function hideDialog() {
  document.getElementById('dlg-backdrop').classList.remove('show');
  document.getElementById('dlg-box').classList.remove('show');
}
function skipReceipt() { hideDialog(); toast('✅ บันทึกแล้ว'); _pendingReceipt = null; }

function openReceipt() {
  hideDialog();
  if (!_pendingReceipt) return;
  const { lines, totalAmt } = _pendingReceipt;

  const now     = new Date();
  const dateStr = now.toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
  const billNo  = 'B' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') +
                  String(now.getDate()).padStart(2,'0') + '-' +
                  String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0') +
                  String(now.getSeconds()).padStart(2,'0');
  const totalKg = lines.filter(l => l.mode === 'kg').reduce((s, l) => s + l.qty, 0);

  const linesHtml = lines.map(l => `
    <div class="rp-line">
      <div class="rp-line-left">
        <div class="rp-line-name">${esc(l.item_name)}</div>
        <div class="rp-line-detail">${fmtQtyStr(l.qty, l.mode, l.unit_label)} × ฿${fmtB(l.price)}/${l.unit_label||'กก.'}</div>
      </div>
      <div class="rp-line-amt">฿${fmtB(l.subtotal)}</div>
    </div>`).join('');

  const telHtml = SHOP_TEL
    ? `<div class="rp-shop-tel"><i class="ph ph-phone"></i> ${esc(SHOP_TEL)}</div>` : '';
  const addrHtml = SHOP_ADDRESS
    ? `<div class="rp-shop-addr"><i class="ph ph-map-pin"></i> ${esc(SHOP_ADDRESS)}</div>` : '';

  document.getElementById('rcp-paper').innerHTML = `
    <div class="rp-shop">
      ${SHOP_LOGO ? `<img class="rp-shop-logo" src="${SHOP_LOGO}" alt="โลโก้ร้าน">` : ''}
      <div class="rp-shop-name">${SHOP_LOGO ? '' : '🔄 '}${esc(SHOP_NAME)}</div>
      <div class="rp-shop-sub">${esc(SHOP_TAGLINE)}</div>
      ${telHtml}
      ${addrHtml}
    </div>
    <hr class="rp-divider">
    <div class="rp-type-badge"><i class="ph-fill ph-download-simple"></i> ใบรับซื้อ</div>
    <div class="rp-meta-row"><span class="rp-meta-label">วันที่</span><span class="rp-meta-val">${dateStr}</span></div>
    <div class="rp-meta-row"><span class="rp-meta-label">เวลา</span><span class="rp-meta-val">${timeStr} น.</span></div>
    <div class="rp-meta-row"><span class="rp-meta-label">เลขบิล</span><span class="rp-meta-val">${billNo}</span></div>
    <hr class="rp-divider">
    ${linesHtml}
    <div class="rp-total-block">
      <div class="rp-total-row">
        <span class="rp-total-label">ยอดรวม</span>
        <span class="rp-total-amt">฿${fmtB(totalAmt)}</span>
      </div>
      ${totalKg > 0 ? `<div class="rp-total-kg">น้ำหนักรวม ${fmtB(totalKg)} กก.</div>` : ''}
    </div>
    <hr class="rp-divider">
    <div class="rp-footer">ขอบคุณที่ใช้บริการ 🙏<br>${esc(SHOP_NAME)}</div>
    <div class="rp-bill-no">${billNo}</div>
  `;

  document.getElementById('rcp-backdrop').classList.add('show');
  document.getElementById('rcp-sheet').classList.add('show');

  // เก็บข้อความใบเสร็จแบบ plain-text ไว้ใช้ตอนกด "พิมพ์ใบเสร็จ" (ดู printReceipt())
  const totalKgLine = totalKg > 0 ? `น้ำหนักรวม ${fmtB(totalKg)} กก.\n` : '';
  const telLine = SHOP_TEL ? `โทร ${SHOP_TEL}\n` : '';
  const addrLine = SHOP_ADDRESS ? `${SHOP_ADDRESS}\n` : '';
  _lastReceiptText =
`🔄 ${SHOP_NAME}
${SHOP_TAGLINE}
${telLine}${addrLine}
ใบรับซื้อ
วันที่ ${dateStr}
เวลา ${timeStr} น.
เลขบิล ${billNo}
────────────────────
${lines.map(l => `${l.item_name}\n  ${fmtQtyStr(l.qty, l.mode, l.unit_label)} × ฿${fmtB(l.price)}/${l.unit_label||'กก.'} = ฿${fmtB(l.subtotal)}`).join('\n')}
────────────────────
ยอดรวม ฿${fmtB(totalAmt)}
${totalKgLine}
ขอบคุณที่ใช้บริการ 🙏
${SHOP_NAME}`;

  _pendingReceipt = null;
}

// ══════════════════════════════════════════
//  พิมพ์ใบเสร็จ
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
        title: `ใบเสร็จ ${SHOP_NAME}`,
        text: _lastReceiptText || '',
        dialogTitle: 'พิมพ์ / แชร์ใบเสร็จ',
      });
    } catch (err) {
      // ผู้ใช้กดปิด share sheet เอง ไม่ถือเป็น error
      if (err && err.message && !/cancel/i.test(err.message)) {
        toast('❌ แชร์ไม่สำเร็จ: ' + err.message, 'error');
      }
    }
    return;
  }
  window.print();
}

// ══════════════════════════════════════════
//  ส่งใบเสร็จเป็นรูปภาพผ่าน LINE
// ══════════════════════════════════════════
// แปลง #rcp-paper เป็นรูปภาพด้วย html2canvas แล้วแชร์ผ่าน share sheet
// (เลือกแอป LINE ได้จากหน้าต่างที่เปิดขึ้นมา) ต่างจาก printReceipt() ที่ส่งเป็นข้อความ
async function sendLine() {
  const paper = document.getElementById('rcp-paper');
  if (!paper) return;
  if (!window.html2canvas) {
    toast('❌ โหลดตัวสร้างรูปภาพไม่สำเร็จ ลองใหม่อีกครั้ง', 'error');
    return;
  }

  let dataUrl;
  try {
    const canvas = await html2canvas(paper, {
      backgroundColor: '#FFFEF5',
      scale: 2,
      useCORS: true,
    });
    dataUrl = canvas.toDataURL('image/png');
  } catch (err) {
    toast('❌ สร้างรูปใบเสร็จไม่สำเร็จ: ' + (err?.message || err), 'error');
    return;
  }

  const capShare = window.Capacitor?.Plugins?.Share;
  const capFs    = window.Capacitor?.Plugins?.Filesystem;

  if (capShare && capFs) {
    try {
      const base64   = dataUrl.split(',')[1];
      const fileName = `receipt-${Date.now()}.png`;
      await capFs.writeFile({ path: fileName, data: base64, directory: 'CACHE' });
      const { uri } = await capFs.getUri({ path: fileName, directory: 'CACHE' });
      await capShare.share({
        title: `ใบเสร็จ ${SHOP_NAME}`,
        files: [uri],
        dialogTitle: 'ส่งใบเสร็จผ่าน LINE',
      });
    } catch (err) {
      if (err && err.message && !/cancel/i.test(err.message)) {
        toast('❌ ส่งไม่สำเร็จ: ' + err.message, 'error');
      }
    }
    return;
  }

  // Fallback (เช่นเปิดใน browser ปกติตอนพัฒนา ไม่มี Capacitor): ดาวน์โหลดรูปแทน
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `receipt-${Date.now()}.png`;
  a.click();
}

function closeReceipt() {
  document.getElementById('rcp-backdrop').classList.remove('show');
  document.getElementById('rcp-sheet').classList.remove('show');
}

// ══════════════════════════════════════════
//  SUPABASE REST
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
    if (icon.startsWith('ph-fill '))  return `<i class="${icon}"></i> `;
    if (icon.startsWith('ph ph-'))    return `<i class="ph-fill ${icon.slice(3)}"></i> `;
    if (icon.startsWith('ph-'))       return `<i class="ph-fill ${icon}"></i> `;
    return icon + ' ';
  };
  bar.innerHTML = '<button class="cat-btn on" data-cat="all">ทั้งหมด</button>'
    + CATS.map(c => `<button class="cat-btn" data-cat="${c.slug}">${catIconHtml(c.icon)}${c.label}</button>`).join('');
  bar.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('on', b === btn));
      activeCat = btn.dataset.cat;
      renderGrid();
    });
  });
}

async function loadCashBalance() {
  if (!SUPABASE_READY) { cashBalance = 0; renderCashBar(); return; }
  try {
    const rows = await sbFetch(
      'transactions?select=type,total_amount&type=in.(deposit,withdraw,buy,sell)'
    ) || [];
    let bal = 0;
    rows.forEach(r => {
      const amt = Number(r.total_amount || 0);
      if (r.type === 'deposit' || r.type === 'sell') bal += amt;
      if (r.type === 'withdraw' || r.type === 'buy') bal -= amt;
    });
    cashBalance = Math.round(bal * 100) / 100;
  } catch (_) { cashBalance = null; }
  renderCashBar();
  renderCartPanel();
}

function renderCashBar() {
  const bar   = document.getElementById('cash-bar');
  const amtEl = document.getElementById('cash-bar-amt');
  const msgEl = document.getElementById('cash-bar-msg');
  const iconEl= document.getElementById('cash-pill-icon');

  if (cashBalance === null) { amtEl.textContent = '—'; bar.className = 'cash-pill'; if (msgEl) msgEl.textContent = ''; return; }

  amtEl.textContent = Math.floor(cashBalance).toLocaleString('th-TH');

  if (cashBalance <= 0) {
    bar.className = 'cash-pill danger';
    if (iconEl) iconEl.className = 'ph ph-warning-circle cash-pill-icon';
  } else if (cashBalance < 500) {
    bar.className = 'cash-pill warn';
    if (iconEl) iconEl.className = 'ph ph-warning cash-pill-icon';
  } else {
    bar.className = 'cash-pill';
    if (iconEl) iconEl.className = 'ph ph-wallet cash-pill-icon';
  }
  if (msgEl) msgEl.textContent = '';
}

async function loadItems() {
  const grid = document.getElementById('item-grid');
  grid.innerHTML = `<div class="grid-loading"><i class="ph ph-spinner-gap spin" style="font-size:28px;"></i><span style="font-size:13px;">กำลังโหลดสินค้า...</span></div>`;
  loadCashBalance();

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 400));
    ITEMS = DEMO_ITEMS;
    const banner0 = document.getElementById('config-banner');
    if (banner0) banner0.style.display = 'flex';
    renderCatBar();
    renderGrid();
    return;
  }

  const banner = document.getElementById('config-banner');
  if (banner) banner.style.display = 'none';
  try {
    await loadCats();
    renderCatBar();
    ITEMS = await sbFetch('items?select=id,name,icon,buy_price,unit,cat,stock_qty,sell_mode&order=cat,name') || [];
    renderGrid();
  } catch (err) {
    grid.innerHTML = `<div class="grid-loading"><i class="ph ph-warning-circle" style="font-size:28px;color:var(--red);"></i><span style="font-size:13px;color:var(--red);">โหลดไม่สำเร็จ: ${err.message}</span></div>`;
    toast('❌ ' + err.message, 'error');
  }
}

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
    const inCart   = !!cart[item.id];
    const qty      = inCart ? cart[item.id].qty : 0;
    const mode     = inCart ? cart[item.id].mode : (item.sell_mode || 'kg');
    const unit     = mode === 'kg' ? 'กก.' : (item.unit || 'ชิ้น');
    const qtyLabel = qty % 1 === 0 ? qty : qty.toFixed(1);
    return `
    <div class="item-card ${inCart?'selected':''}" onclick="openKgModal(${item.id})">
      <div class="card-badge">${qtyLabel} ${unit}</div>
      <div class="card-icon">${renderIcon(item.icon, item.cat, 26)}</div>
      <div class="card-name">${item.name}</div>
      <div class="card-bottom">
        <div class="card-price">฿${Number(item.buy_price).toFixed(2)}<span class="card-price-unit">/${item.unit||'กก.'}</span></div>
        <button class="card-add-btn" onclick="event.stopPropagation();openKgModal(${item.id})">
          <i class="ph ${inCart?'ph-pencil':'ph-plus'}"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

// ── Toast ──
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast-show' + (type === 'error' ? ' toast-error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = ''; }, 2200);
}

// ── Events (kg-modal swipe-to-close — safe to wire at file-load time
//    since #kg-modal is static markup in shop.html, not part of the
//    dynamically injected mount below) ──
let touchStartY = 0;
let swipeFromHandle = false;
const kgHandleEl = document.querySelector('#kg-modal .kg-handle');
const kgHeaderEl = document.querySelector('#kg-modal .kg-header');
[kgHandleEl, kgHeaderEl].forEach(el => {
  if (!el) return;
  el.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; swipeFromHandle = true; }, {passive:true});
});
document.getElementById('kg-modal').addEventListener('touchstart', e => {
  if (!e.target.closest('.kg-handle') && !e.target.closest('.kg-header')) swipeFromHandle = false;
}, {passive:true});
document.getElementById('kg-modal').addEventListener('touchmove', e => {
  if (!swipeFromHandle) return;
  if (e.touches[0].clientY - touchStartY > 60) { swipeFromHandle = false; closeKgModal(); }
}, {passive:true});

// ══════════════════════════════════════════
//  เข้าทาง shop-page.js เมื่อเลือกแท็บ "รับซื้อ"
// ══════════════════════════════════════════
function initBuyTab(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  mount.innerHTML = `
    <div class="buy-tab-topbar">
      <div class="cash-pill" id="cash-bar">
        <i class="ph ph-wallet cash-pill-icon" id="cash-pill-icon"></i>
        <span class="cash-pill-amt" id="cash-bar-amt">...</span>
        <span class="cash-pill-msg" id="cash-bar-msg"></span>
      </div>
      <button class="icon-btn" id="buy-refresh-btn" title="รีเฟรช">
        <i class="ph ph-arrows-clockwise"></i>
      </button>
    </div>

    <div class="catalogue">
      <div class="search-area">
        <div class="search-field">
          <i class="ph ph-magnifying-glass"></i>
          <input type="text" id="search-input" placeholder="ค้นหาสินค้า...">
        </div>
      </div>

      <div class="cat-bar" id="cat-bar">
        <button class="cat-btn on" data-cat="all">ทั้งหมด</button>
      </div>

      <div class="item-grid-wrap">
        <div class="item-grid" id="item-grid">
          <div class="grid-loading">
            <i class="ph ph-spinner-gap spin" style="font-size:28px;"></i>
            <span style="font-size:13px;">กำลังโหลดสินค้า...</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cart-panel" id="cart-panel">
      <div class="cart-header">
        <div class="cart-title">
          <i class="ph ph-shopping-cart-simple"></i>
          ตะกร้ารับซื้อ
          <span class="cart-count-badge" id="cart-count">0</span>
        </div>
        <button class="cart-clear-btn" id="cart-clear-btn">ล้างทั้งหมด</button>
      </div>
      <div class="cart-items" id="cart-items-list"></div>
      <div class="cart-confirm-row">
        <div class="cash-insufficient-warn" id="cash-insufficient-warn">
          <i class="ph ph-warning-circle"></i>
          <span id="cash-insufficient-text">เงินสดไม่พอ — ขาดอีก ฿0</span>
        </div>
        <button class="cart-confirm-btn" id="cart-confirm-btn">
          <i class="ph ph-check-circle"></i>
          <span id="cart-confirm-label">บันทึกทั้งหมด</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('search-input').addEventListener('input', e => {
    query = e.target.value.trim();
    renderGrid();
  });
  document.getElementById('buy-refresh-btn').addEventListener('click', loadItems);
  document.getElementById('cart-clear-btn').addEventListener('click', clearCart);
  document.getElementById('cart-confirm-btn').addEventListener('click', confirmCart);

  loadItems();
  loadShopProfileForReceipt();
}
