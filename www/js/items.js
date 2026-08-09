// ══════════════════════════════════════════════
//  items.js — Logic for items.html (จัดการสินค้า)
//  ScrapPOS
// ══════════════════════════════════════════════

// ══════════════════════════════════════════════
//  DEMO DATA
// ══════════════════════════════════════════════
const DEMO_ITEMS = [
  {id:1,  name:'เหล็กหนัก',          icon:'🔩', buy_price:4.50,  sell_price:5.80,  stock_qty:4200, unit:'กก.', cat:'metal'},
  {id:2,  name:'เหล็กบาง',           icon:'🔧', buy_price:2.80,  sell_price:3.50,  stock_qty:1800, unit:'กก.', cat:'metal'},
  {id:3,  name:'ทองแดง',             icon:'🪙', buy_price:195,   sell_price:215,   stock_qty:320,  unit:'กก.', cat:'metal'},
  {id:4,  name:'อลูมิเนียม',         icon:'🫗', buy_price:42,    sell_price:50,    stock_qty:960,  unit:'กก.', cat:'metal'},
  {id:5,  name:'สแตนเลส',            icon:'⚙️', buy_price:18,    sell_price:22,    stock_qty:550,  unit:'กก.', cat:'metal'},
  {id:6,  name:'กระดาษหนังสือพิมพ์', icon:'📰', buy_price:2.20,  sell_price:2.80,  stock_qty:3000, unit:'กก.', cat:'paper'},
  {id:7,  name:'กระดาษลัง',          icon:'📦', buy_price:2.50,  sell_price:3.20,  stock_qty:5200, unit:'กก.', cat:'paper'},
  {id:8,  name:'กระดาษขาว',          icon:'📄', buy_price:3.00,  sell_price:3.80,  stock_qty:1100, unit:'กก.', cat:'paper'},
  {id:9,  name:'พลาสติกขาว',         icon:'🥛', buy_price:8.50,  sell_price:11,    stock_qty:780,  unit:'กก.', cat:'plastic'},
  {id:10, name:'ขวด PET',            icon:'🍶', buy_price:6.00,  sell_price:8.00,  stock_qty:620,  unit:'กก.', cat:'plastic'},
  {id:11, name:'แก้วใส',             icon:'🪟', buy_price:1.20,  sell_price:1.60,  stock_qty:2100, unit:'กก.', cat:'glass'},
  {id:12, name:'สายไฟทองแดง',        icon:'🔌', buy_price:85,    sell_price:100,   stock_qty:180,  unit:'กก.', cat:'electric'},
  {id:13, name:'มอเตอร์เก่า',        icon:'⚡', buy_price:25,    sell_price:32,    stock_qty:95,   unit:'กก.', cat:'electric'},
];

// Fallback icons ถ้าโหลดจาก DB ไม่ได้
const ICONS_FALLBACK = [
  'ph-package','ph-wrench','ph-pipe','ph-coins','ph-gear-six',
  'ph-newspaper','ph-file-text','ph-cube','ph-flask','ph-coffee',
  'ph-plug-charging','ph-lightning','ph-recycle','ph-steps',
  'ph-hammer','ph-axe','ph-screwdriver','ph-battery-full',
  'ph-broadcast','ph-cpu','ph-magnet','ph-key',
  'ph-truck','ph-warehouse','ph-barcode','ph-tag',
];
let ALL_ICONS = [...ICONS_FALLBACK]; 

// หมวดหมู่ dynamic (โหลดจาก Supabase)
let CATS = [];

// ══════════════════════════════════════════════
//  ICON / COLOR HELPERS 
// ══════════════════════════════════════════════
const CAT_COLOR = {
  glass:        {bg:'#E3F2FD', fg:'#1565C0'},
  'beer-crate': {bg:'#FDE8C8', fg:'#C06000'},
  steel:        {bg:'#E8EDF8', fg:'#3A6CC8'},
  plastic:      {bg:'#E8F5E9', fg:'#2E7D32'},
  paper:        {bg:'#FFF3E0', fg:'#E07A20'},
  copper:       {bg:'#FFF3E0', fg:'#B45309'},
  electronics:  {bg:'#FFF9C4', fg:'#F57F17'},
  metal:        {bg:'#E8EDF8', fg:'#3A6CC8'},
  electric:     {bg:'#FFF9C4', fg:'#F57F17'},
  default:      {bg:'#F3F0FF', fg:'#5E35B1'},
};
function resolveIcon(icon){
  if(!icon) return null;
  if(icon.startsWith('ph-fill ')) return icon.replace('ph-fill ','');
  if(icon.startsWith('ph ph-'))   return icon.slice(3);
  if(icon.startsWith('ph-'))      return icon;
  return null;
}
function itemColor(cat){ return CAT_COLOR[cat]||CAT_COLOR.default; }
function renderIcon(icon, cat, size=26){
  const ph = resolveIcon(icon);
  const c  = itemColor(cat);
  if(ph) return `<span class="ph-icon-wrap" style="background:${c.bg};color:${c.fg};width:${size+16}px;height:${size+16}px;font-size:${size}px;"><i class="ph-fill ${ph}"></i></span>`;
  if(icon) return `<span class="ph-icon-wrap" style="background:${c.bg};width:${size+16}px;height:${size+16}px;font-size:${size}px;">${icon}</span>`;
  return '';
}

function catLabel(slug){ return CATS.find(c=>c.slug===slug)?.label || slug; }
function catIcon(slug){
  const icon = CATS.find(c=>c.slug===slug)?.icon || '📦';
  return icon.startsWith('ph-') ? `<i class="ph-fill ${icon}"></i>` : icon;
}

// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let ALL_ITEMS = [];
let activeCat = 'all';
let query = '';
let editingId = null;   // null = add new
let deleteId  = null;
let selectedIcon = ALL_ICONS[0];
let selectedCat  = '';
let selectedSellMode = 'kg'; // 'kg' | 'piece'

// ══════════════════════════════════════════════
//  SUPABASE HELPER
// ══════════════════════════════════════════════
// เดิมยิง REST ไปที่ Supabase ผ่าน fetch() — ตอนนี้เปลี่ยนไปเรียก
// localRest() ที่อ่าน/เขียน SQLite ในเครื่องแทน
async function sb(path, opts = {}) {
  return localRest(path, opts);
}

// ══════════════════════════════════════════════
//  LOAD
// ══════════════════════════════════════════════
async function loadItems() {
  if (!window.AUTH && SUPABASE_READY) return; 
  const icon = document.getElementById('refresh-icon');
  icon.classList.add('spin');

  if (!SUPABASE_READY) {
    document.getElementById('config-banner').style.display = 'flex';
    await new Promise(r => setTimeout(r, 500));
    ALL_ITEMS = structuredClone(DEMO_ITEMS);
    icon.classList.remove('spin');
    renderCatBar();
    renderList();
    return;
  }

  document.getElementById('config-banner').style.display = 'none';

  try {
    const [items, cats] = await Promise.all([
      sb('items?select=id,name,icon,buy_price,sell_price,stock_qty,unit,cat,sell_mode&order=cat,name'),
      sb('categories?select=slug,label,icon&order=id'),
    ]);
    ALL_ITEMS = items || [];
    if (cats && cats.length) CATS = cats;
    renderCatBar();
    renderList();
  } catch (err) {
    toast('❌ โหลดไม่สำเร็จ: ' + err.message, 'error');
    ALL_ITEMS = structuredClone(DEMO_ITEMS);
    renderCatBar();
    renderList();
  } finally {
    icon.classList.remove('spin');
  }
}

// ══════════════════════════════════════════════
//  RENDER LIST
// ══════════════════════════════════════════════
function renderList() {
  const wrap = document.getElementById('list-wrap');
  wrap.scrollTop = 0;
  let list = ALL_ITEMS;
  if (activeCat !== 'all') list = list.filter(x => x.cat === activeCat);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(x => (x.name || '').toLowerCase().includes(q));
  }

  if (!list.length) {
    wrap.innerHTML = `
      <div class="list-empty">
        <i class="ph ph-package"></i>
        <p>${query ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า กดเพิ่มสินค้าเพื่อเริ่มต้น'}</p>
      </div>`;
    return;
  }

  const countLabel = `${list.length} รายการ`;

  wrap.innerHTML = `<div class="items-count">${countLabel}</div>` + list.map(item => {
    const stock = Number(item.stock_qty);
    const stockCls = stock <= 0 ? 'empty' : stock < 100 ? 'low' : '';
    const stockLabel = stock <= 0 ? 'หมดสต๊อก' : `${stock.toLocaleString('th-TH')} ${item.unit||'กก.'}`;
    const buy = Number(item.buy_price);
    const sell = Number(item.sell_price);
    const spread = sell - buy;
    return `
    <div class="item-row" onclick="openEdit(${item.id})">
      <div class="item-icon">${renderIcon(item.icon, item.cat, 24)}</div>
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-meta">
          <span class="meta-chip buy"><i class="ph ph-download-simple"></i>฿${buy.toFixed(2)}</span>
          <span class="meta-chip sell"><i class="ph ph-upload-simple"></i>฿${sell.toFixed(2)}</span>
          <span class="meta-chip stock ${stockCls}"><i class="ph ph-package"></i>${stockLabel}</span>
          <span class="meta-chip" style="background:rgba(0,200,83,0.1);color:var(--green);"><i class="ph ph-trend-up"></i>+฿${spread.toFixed(2)}</span>
          <span class="meta-chip cat">${catIcon(item.cat)} ${catLabel(item.cat)}</span>
        </div>
      </div>
      <div class="item-actions" onclick="event.stopPropagation()">
        <button class="action-btn edit" onclick="openEdit(${item.id})" title="แก้ไข">
          <i class="ph ph-pencil-simple"></i>
        </button>
        <button class="action-btn del" onclick="openDelete(${item.id})" title="ลบ">
          <i class="ph ph-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════
//  ICON GRID (สินค้า) 
// ══════════════════════════════════════════════
function buildIconGrid() {
  document.getElementById('icon-grid').innerHTML = ALL_ICONS.map(ic => `
    <div class="icon-opt ${ic===selectedIcon?'selected':''}" data-ic="${ic}" onclick="pickIcon('${ic}')"><i class="ph-fill ${ic}"></i></div>
  `).join('');
}

function pickIcon(ic) {
  selectedIcon = ic;
  document.querySelectorAll('.icon-opt').forEach(el => {
    el.classList.toggle('selected', el.dataset.ic === ic);
  });
}

// ══════════════════════════════════════════════
//  CAT ICON PICKER (inline) 
// ══════════════════════════════════════════════
function filterCatIcons(q) {
  const term = q.toLowerCase().replace(/^ph-/,'');
  const list = term ? ALL_ICONS.filter(ic => ic.replace('ph-','').includes(term)) : ALL_ICONS;
  renderCatIconGrid(list);
}

function renderCatIconGrid(list) {
  const cur = document.getElementById('cat-f-icon').value || 'ph-cube';
  const grid = document.getElementById('cat-icon-grid');
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--ink3);font-size:12px;">ไม่พบไอคอน</div>`;
  } else {
    grid.innerHTML = list.map(ic => {
      const sel = ic === cur;
      return `<button type="button" onclick="pickCatIcon('${ic}')" title="${ic.replace('ph-','')}"
        style="width:36px;height:36px;border-radius:10px;font-size:20px;cursor:pointer;
               border:${sel ? '2px solid var(--primary)' : '1.5px solid transparent'};
               background:${sel ? 'var(--primary-l)' : 'var(--white)'};
               display:flex;align-items:center;justify-content:center;
               color:${sel ? 'var(--primary)' : 'var(--ink2)'};
               transition:background .1s,border-color .1s;">
        <i class="ph-fill ${ic}"></i>
      </button>`;
    }).join('');
  }
  const countEl = document.getElementById('cat-icon-count');
  if (countEl) countEl.textContent = `${list.length} ไอคอน`;
}

function pickCatIcon(ic) {
  document.getElementById('cat-f-icon').value = ic;
  const q = document.getElementById('cat-icon-search')?.value || '';
  filterCatIcons(q);
}

//  RENDER CAT BAR (dynamic)
// ══════════════════════════════════════════════
function renderCatBar() {
  const bar = document.getElementById('cat-bar');
  const catChipIcon = (icon) => {
    if(!icon) return '';
    if(icon.startsWith('ph-fill ')) return `<i class="${icon}"></i>`;
    if(icon.startsWith('ph ph-'))   return `<i class="ph-fill ${icon.slice(3)}"></i>`;
    if(icon.startsWith('ph-'))      return `<i class="ph-fill ${icon}"></i>`;
    return icon;
  };
  bar.innerHTML = `<button class="cat-btn ${activeCat==='all'?'on':''}" data-cat="all">ทั้งหมด</button>`
    + CATS.map(c => `<button class="cat-btn ${activeCat===c.slug?'on':''}" data-cat="${c.slug}">${catChipIcon(c.icon)} ${c.label}</button>`).join('')
    + `<button class="cat-btn" onclick="openCatManager()" style="background:var(--primary-l);color:var(--primary);border:1px solid var(--primary);"><i class="ph ph-gear"></i></button>`;

  bar.querySelectorAll('.cat-btn[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      bar.querySelectorAll('.cat-btn[data-cat]').forEach(b => b.classList.toggle('on', b.dataset.cat === activeCat));
      renderList();
    });
  });
}

// ══════════════════════════════════════════════
//  CATEGORY SELECT (in add/edit modal)
// ══════════════════════════════════════════════
function renderCatSelectGrid(selected = '') {
  const catChipIcon = (icon) => {
    if(!icon) return '';
    if(icon.startsWith('ph-fill ')) return `<i class="${icon}"></i>`;
    if(icon.startsWith('ph ph-'))   return `<i class="ph-fill ${icon.slice(3)}"></i>`;
    if(icon.startsWith('ph-'))      return `<i class="ph-fill ${icon}"></i>`;
    return icon;
  };
  document.getElementById('cat-select-grid').innerHTML = CATS.map(c => `
    <button class="cat-opt ${selected===c.slug?'selected':''}" data-val="${c.slug}" onclick="selectCat(this)">${catChipIcon(c.icon)} ${c.label}</button>
  `).join('');
}

function selectCat(el) {
  selectedCat = el.dataset.val;
  document.querySelectorAll('.cat-opt').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
}

// ══════════════════════════════════════════════
//  SELL MODE TOGGLE
// ══════════════════════════════════════════════
function setSellMode(mode) {
  selectedSellMode = mode;
  const isKg = mode === 'kg';

  const btnKg    = document.getElementById('mode-btn-kg');
  const btnPiece = document.getElementById('mode-btn-piece');
  const activeStyle   = 'border:2px solid var(--primary);background:var(--primary);color:white;';
  const inactiveStyle = 'border:2px solid rgba(10,10,30,0.12);background:var(--surface);color:var(--ink3);';

  if (btnKg)    btnKg.style.cssText    = `flex:1;padding:11px;border-radius:13px;font-family:'Prompt',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;${isKg ? activeStyle : inactiveStyle}`;
  if (btnPiece) btnPiece.style.cssText = `flex:1;padding:11px;border-radius:13px;font-family:'Prompt',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .15s;${!isKg ? activeStyle : inactiveStyle}`;

  const unit = isKg ? 'กก.' : 'ชิ้น';
  const labelPrice  = document.getElementById('label-price');
  const labelStock  = document.getElementById('label-stock');
  const labelSpread = document.getElementById('label-spread');
  if (labelPrice)  labelPrice.textContent  = `ราคา (บาท/${unit})`;
  if (labelStock)  labelStock.textContent  = `สต๊อกเริ่มต้น (${unit})`;
  if (labelSpread) labelSpread.textContent = `กำไร/${unit}`;

  const unitField = document.getElementById('f-unit');
  if (unitField) {
    if (!isKg && unitField.value === 'กก.') unitField.value = 'ชิ้น';
    if (isKg  && unitField.value === 'ชิ้น') unitField.value = 'กก.';
  }

  updatePreview();
}

// ══════════════════════════════════════════════
//  PRICE PREVIEW
// ══════════════════════════════════════════════
function updatePreview() {
  const buy  = parseFloat(document.getElementById('f-buy').value)  || 0;
  const sell = parseFloat(document.getElementById('f-sell').value) || 0;
  const spread = sell - buy;
  const margin = sell > 0 ? (spread / sell * 100) : 0;

  document.getElementById('prev-buy').textContent  = buy  > 0 ? '฿'+buy.toFixed(2)  : '–';
  document.getElementById('prev-sell').textContent = sell > 0 ? '฿'+sell.toFixed(2) : '–';
  document.getElementById('prev-spread').textContent = spread > 0 ? '+฿'+spread.toFixed(2) : spread < 0 ? '฿'+spread.toFixed(2) : '–';
  document.getElementById('prev-margin').textContent = spread > 0 ? margin.toFixed(1)+'%' : '';
}

// ══════════════════════════════════════════════
//  OPEN ADD
// ══════════════════════════════════════════════
function openAdd() {
  editingId = null;
  selectedIcon = ALL_ICONS[0];
  selectedCat  = '';
  selectedSellMode = 'kg';
  document.getElementById('sheet-title').textContent = 'เพิ่มสินค้าใหม่';
  document.getElementById('save-label').textContent  = 'บันทึกสินค้า';
  document.getElementById('f-name').value  = '';
  document.getElementById('f-buy').value   = '';
  document.getElementById('f-sell').value  = '';
  document.getElementById('f-stock').value = '';
  document.getElementById('f-unit').value  = 'กก.';
  setSellMode('kg');
  updatePreview();
  buildIconGrid();
  renderCatSelectGrid('');
  openModal('edit-modal');
  document.getElementById('edit-sheet').querySelector('.sheet-body').scrollTop = 0;
  setTimeout(() => document.getElementById('f-name').focus(), 350);
}

// ══════════════════════════════════════════════
//  OPEN EDIT
// ══════════════════════════════════════════════
function openEdit(id) {
  id = Number(id);
  const item = ALL_ITEMS.find(x => Number(x.id) === id);
  if (!item) return;
  editingId    = id;
  selectedIcon = resolveIcon(item.icon) || ALL_ICONS[0];
  selectedCat  = item.cat  || '';
  selectedSellMode = item.sell_mode || 'kg';

  document.getElementById('sheet-title').textContent = 'แก้ไขสินค้า';
  document.getElementById('save-label').textContent  = 'บันทึกการเปลี่ยนแปลง';
  document.getElementById('f-name').value  = item.name || '';
  document.getElementById('f-buy').value   = item.buy_price  || '';
  document.getElementById('f-sell').value  = item.sell_price || '';
  document.getElementById('f-stock').value = item.stock_qty  || 0;
  document.getElementById('f-unit').value  = item.unit || 'กก.';
  setSellMode(selectedSellMode);
  updatePreview();
  buildIconGrid();
  renderCatSelectGrid(selectedCat);
  openModal('edit-modal');
  document.getElementById('edit-sheet').querySelector('.sheet-body').scrollTop = 0;
}

// ══════════════════════════════════════════════
//  SAVE (CREATE / UPDATE)
// ══════════════════════════════════════════════
async function saveItem() {
  const name  = document.getElementById('f-name').value.trim();
  const buy   = parseFloat(document.getElementById('f-buy').value);
  const sell  = parseFloat(document.getElementById('f-sell').value);
  const stock = parseFloat(document.getElementById('f-stock').value) || 0;
  const unit  = document.getElementById('f-unit').value.trim() || 'กก.';

  if (!name) return shakeField('f-name', 'กรุณาระบุชื่อสินค้า');
  if (!selectedCat) return toast('⚠️ กรุณาเลือกหมวดหมู่', 'error');
  if (isNaN(buy) || buy <= 0) return shakeField('f-buy', 'กรุณาระบุราคารับซื้อ');
  if (isNaN(sell) || sell <= 0) return shakeField('f-sell', 'กรุณาระบุราคาขายออก');
  if (sell < buy) return shakeField('f-sell', 'ราคาขายออกต้องไม่ต่ำกว่าราคารับซื้อ');

  const payload = {
    name,
    icon: selectedIcon,
    cat: selectedCat,
    buy_price: buy,
    sell_price: sell,
    stock_qty: stock,
    unit,
    sell_mode: selectedSellMode,
    updated_at: new Date().toISOString(),
  };

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i><span>กำลังบันทึก...</span>';

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 600));
    if (editingId !== null) {
      const idx = ALL_ITEMS.findIndex(x => Number(x.id) === editingId);
      if (idx >= 0) ALL_ITEMS[idx] = { ...ALL_ITEMS[idx], ...payload };
      toast('✅ อัปเดตสินค้าแล้ว (Demo)', 'success');
    } else {
      const newId = Math.max(0, ...ALL_ITEMS.map(x=>x.id)) + 1;
      ALL_ITEMS.push({ id: newId, ...payload });
      toast('✅ เพิ่มสินค้าแล้ว (Demo)', 'success');
    }
    closeModal('edit-modal');
    renderList();
    resetSaveBtn(editingId !== null ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกสินค้า');
    return;
  }

  try {
    if (editingId !== null) {
      await sb(`items?id=eq.${editingId}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: payload,
      });
      const idx = ALL_ITEMS.findIndex(x => Number(x.id) === editingId);
      if (idx >= 0) ALL_ITEMS[idx] = { ...ALL_ITEMS[idx], ...payload };
      toast('✅ อัปเดตสินค้าแล้ว', 'success');
    } else {
      const result = await sb('items', {
        method: 'POST',
        prefer: 'return=representation',
        body: { ...payload, created_at: new Date().toISOString() },
      });
      const created = Array.isArray(result) ? result[0] : result;
      if (created) {
        ALL_ITEMS.push(created);
        ALL_ITEMS.sort((a, b) => (a.cat||'').localeCompare(b.cat||'') || (a.name||'').localeCompare(b.name||'', 'th'));
      }
      toast('✅ เพิ่มสินค้าใหม่แล้ว', 'success');
    }
    closeModal('edit-modal');
    renderList();
  } catch (err) {
    toast('❌ ' + err.message, 'error');
  } finally {
    resetSaveBtn(editingId !== null ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกสินค้า');
  }
}

function resetSaveBtn(label = 'บันทึกสินค้า') {
  const btn = document.getElementById('btn-save');
  btn.disabled = false;
  btn.innerHTML = `<i class="ph ph-floppy-disk"></i><span id="save-label">${label}</span>`;
}

// ══════════════════════════════════════════════
//  DELETE
// ══════════════════════════════════════════════
function openDelete(id) {
  id = Number(id);
  const item = ALL_ITEMS.find(x => Number(x.id) === id);
  if (!item) return;
  deleteId = id;
  document.getElementById('del-item-name').textContent = `"${item.name}"`;
  openModal('del-modal');
}

async function confirmDelete() {
  const btn = document.getElementById('btn-del-confirm');
  btn.disabled = true;
  btn.innerHTML = '<i class="ph ph-spinner-gap spin"></i><span>กำลังลบ...</span>';

  if (!SUPABASE_READY) {
    await new Promise(r => setTimeout(r, 500));
    ALL_ITEMS = ALL_ITEMS.filter(x => Number(x.id) !== deleteId);
    toast('🗑️ ลบสินค้าแล้ว (Demo)');
    closeModal('del-modal');
    renderList();
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-trash"></i><span>ลบสินค้า</span>';
    return;
  }

  try {
    await sb(`items?id=eq.${deleteId}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    ALL_ITEMS = ALL_ITEMS.filter(x => Number(x.id) !== deleteId);
    toast('🗑️ ลบสินค้าแล้ว');
    closeModal('del-modal');
    renderList();
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-trash"></i><span>ลบสินค้า</span>';
  }
}

// ══════════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  const anyOpen = document.querySelector('.modal-backdrop.open');
  if (!anyOpen) document.body.style.overflow = '';
}

document.querySelectorAll('.modal-backdrop').forEach(bd => {
  bd.addEventListener('click', e => {
    if (e.target === bd) closeModal(bd.id);
  });
});

// ══════════════════════════════════════════════
//  FIELD SHAKE VALIDATION
// ══════════════════════════════════════════════
function shakeField(id, msg) {
  const el = document.getElementById(id);
  el.style.borderColor = 'var(--red)';
  el.style.animation = 'shake .35s ease';
  el.addEventListener('animationend', () => {
    el.style.animation = '';
    el.style.borderColor = '';
  }, {once:true});
  el.focus();
  toast('⚠️ ' + msg, 'error');
}

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = ''; }, 2400);
}

// ══════════════════════════════════════════════
//  FILTERS
// ══════════════════════════════════════════════
document.getElementById('search-input').addEventListener('input', e => {
  query = e.target.value.trim();
  renderList();
});

// ══════════════════════════════════════════════
//  CAT MANAGER
// ══════════════════════════════════════════════
let editingCatSlug = null;

function openCatManager() {
  editingCatSlug = null;
  resetCatForm();
  renderCatList();
  openModal('cat-modal');
  renderCatIconGrid(ALL_ICONS); 
}

function renderCatList() {
  const wrap = document.getElementById('cat-list');
  if (!CATS.length) {
    wrap.innerHTML = `<div style="text-align:center;padding:20px;color:var(--ink3);font-size:13px;">ยังไม่มีหมวดหมู่</div>`;
    return;
  }
  wrap.innerHTML = CATS.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--white);border-radius:14px;margin-bottom:8px;box-shadow:var(--card-sh);">
      ${renderIcon(c.icon, c.slug, 20)}
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;">${c.label}</div>
        <div style="font-size:11px;color:var(--ink3);">${c.slug}</div>
      </div>
      <button onclick="editCat('${c.slug}')" style="width:32px;height:32px;border-radius:50%;background:var(--primary-l);border:none;color:var(--primary);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <i class="ph ph-pencil-simple"></i>
      </button>
      <button onclick="deleteCat('${c.slug}')" style="width:32px;height:32px;border-radius:50%;background:var(--red-l);border:none;color:var(--red);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <i class="ph ph-trash"></i>
      </button>
    </div>
  `).join('');
}

function editCat(slug) {
  const c = CATS.find(x => x.slug === slug);
  if (!c) return;
  editingCatSlug = slug;
  const ph = resolveIcon(c.icon) || 'ph-cube';
  document.getElementById('cat-f-icon').value  = ph;
  document.getElementById('cat-f-label').value = c.label;
  document.getElementById('cat-f-slug').value  = c.slug;
  document.getElementById('cat-f-slug').disabled = true;
  document.getElementById('cat-form-title').textContent = 'แก้ไขหมวดหมู่';
  document.getElementById('cat-save-btn').textContent   = 'บันทึก';
  if (document.getElementById('cat-icon-search')) {
    document.getElementById('cat-icon-search').value = '';
    filterCatIcons('');
  } else {
    filterCatIcons('');
  }
}

function resetCatForm() {
  editingCatSlug = null;
  document.getElementById('cat-f-icon').value  = 'ph-cube';
  document.getElementById('cat-f-label').value = '';
  document.getElementById('cat-f-slug').value  = '';
  document.getElementById('cat-f-slug').disabled = false;
  document.getElementById('cat-form-title').textContent = 'เพิ่มหมวดหมู่ใหม่';
  document.getElementById('cat-save-btn').textContent   = 'เพิ่ม';
  if (document.getElementById('cat-icon-search')) {
    document.getElementById('cat-icon-search').value = '';
    filterCatIcons('');
  }
}

async function saveCat() {
  const icon  = document.getElementById('cat-f-icon').value.trim();
  const label = document.getElementById('cat-f-label').value.trim();
  const slug  = document.getElementById('cat-f-slug').value.trim().toLowerCase().replace(/\s+/g,'-');

  if (!icon || !label || !slug) { toast('กรุณากรอกข้อมูลให้ครบ', 'error'); return; }
  if (!/^[a-z0-9-]+$/.test(slug)) { toast('slug ใช้ได้เฉพาะ a-z, 0-9 และ - เท่านั้น', 'error'); return; }

  const btn = document.getElementById('cat-save-btn');
  btn.disabled = true;

  try {
    if (editingCatSlug) {
      await sb(`categories?slug=eq.${editingCatSlug}`, {
        method:'PATCH', prefer:'return=minimal',
        body: { icon, label },
      });
      const idx = CATS.findIndex(c => c.slug === editingCatSlug);
      if (idx >= 0) CATS[idx] = { slug: editingCatSlug, label, icon };
      toast(`✅ แก้ไข "${label}" แล้ว`);
    } else {
      await sb('categories', {
        method:'POST', prefer:'return=minimal',
        body: { slug, label, icon },
      });
      CATS.push({ slug, label, icon });
      toast(`✅ เพิ่มหมวด "${label}" แล้ว`);
    }
    resetCatForm();
    renderCatList();
    renderCatBar();
    renderList();
  } catch(err) {
    toast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteCat(slug) {
  const c = CATS.find(x => x.slug === slug);
  if (!c) return;
  const hasItems = ALL_ITEMS.some(x => x.cat === slug);
  if (hasItems) {
    toast(`❌ มีสินค้าในหมวด "${c.label}" อยู่ ย้ายสินค้าออกก่อน`, 'error');
    return;
  }
  if (!confirm(`ลบหมวด "${c.label}" ใช่มั้ย?`)) return;

  try {
    await sb(`categories?slug=eq.${slug}`, { method:'DELETE', prefer:'return=minimal' });
    CATS = CATS.filter(x => x.slug !== slug);
    toast(`✅ ลบ "${c.label}" แล้ว`);
    if (activeCat === slug) { activeCat = 'all'; }
    renderCatList();
    renderCatBar();
    renderList();
  } catch(err) {
    toast('❌ ' + err.message, 'error');
  }
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
(async () => {
  window.AUTH = { user: { email: 'local@device' }, logout: () => {} };
  loadItems();
})();