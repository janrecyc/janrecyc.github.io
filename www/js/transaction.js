const params = new URLSearchParams(location.search);
const TX_TYPE = params.get('type') === 'sell' ? 'sell' : 'buy';

let items = [];
let selectedItem = null;

const pageTitle = document.getElementById('page-title');
const itemListEl = document.getElementById('item-list');
const qtyInput = document.getElementById('qty-input');
const priceInput = document.getElementById('price-input');
const totalAmt = document.getElementById('total-amt');
const saveBtn = document.getElementById('save-btn');

pageTitle.textContent = TX_TYPE === 'buy' ? 'รับซื้อ' : 'ขายออก';
saveBtn.className = 'save-btn ' + TX_TYPE;
document.getElementById('qty-label').textContent = TX_TYPE === 'buy' ? 'น้ำหนัก / จำนวนที่รับซื้อ' : 'น้ำหนัก / จำนวนที่ขายออก';
document.getElementById('price-label').textContent = TX_TYPE === 'buy' ? 'ราคารับซื้อ / หน่วย (แก้ไขได้)' : 'ราคาขายออก / หน่วย (แก้ไขได้)';

function renderItems() {
  if (!items.length) {
    itemListEl.innerHTML = '<div class="empty-state">ยังไม่มีสินค้า — กดเพิ่มสินค้าใหม่ด้านล่าง</div>';
    return;
  }
  itemListEl.innerHTML = items.map(it => {
    const price = TX_TYPE === 'buy' ? it.buy_price : it.sell_price;
    const selected = selectedItem && selectedItem.id === it.id;
    return `<div class="item-row ${selected ? 'selected' : ''}" data-id="${it.id}">
      <span class="name">${escapeHtml(it.name)}</span>
      <span class="price">${formatMoney(price)} / ${escapeHtml(it.unit)}</span>
    </div>`;
  }).join('');

  itemListEl.querySelectorAll('.item-row').forEach(row => {
    row.onclick = () => {
      const id = Number(row.dataset.id);
      selectedItem = items.find(i => i.id === id);
      priceInput.value = (TX_TYPE === 'buy' ? selectedItem.buy_price : selectedItem.sell_price) || '';
      renderItems();
      updateTotal();
      checkValid();
    };
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function updateTotal() {
  const qty = parseFloat(qtyInput.value) || 0;
  const price = parseFloat(priceInput.value) || 0;
  totalAmt.textContent = formatMoney(qty * price);
}

function checkValid() {
  const qty = parseFloat(qtyInput.value) || 0;
  const price = parseFloat(priceInput.value) || 0;
  saveBtn.disabled = !(selectedItem && qty > 0 && price >= 0);
}

qtyInput.addEventListener('input', () => { updateTotal(); checkValid(); });
priceInput.addEventListener('input', () => { updateTotal(); checkValid(); });

saveBtn.onclick = async () => {
  const qty = parseFloat(qtyInput.value);
  const price = parseFloat(priceInput.value);
  if (!selectedItem || !(qty > 0)) return;
  saveBtn.disabled = true;
  try {
    const total = await DB.addTransaction(TX_TYPE, selectedItem.name, qty, price);
    toast(`✅ บันทึกแล้ว — ${formatMoney(total)}`);
    if (typeof CapBridge !== 'undefined' && document.hidden) {
      CapBridge.notify('บันทึกรายการแล้ว', `${selectedItem.name} ${formatMoney(total)}`);
    }
    setTimeout(() => { location.href = 'index.html'; }, 700);
  } catch (e) {
    console.error(e);
    toast('❌ บันทึกไม่สำเร็จ: ' + e.message);
    saveBtn.disabled = false;
  }
};

// ── เพิ่มสินค้าใหม่ ──
const itemModal = document.getElementById('item-modal');
document.getElementById('add-item-btn').onclick = () => { itemModal.style.display = 'flex'; };
document.getElementById('modal-cancel').onclick = () => { itemModal.style.display = 'none'; };
document.getElementById('modal-confirm').onclick = async () => {
  const name = document.getElementById('new-item-name').value.trim();
  const unit = document.getElementById('new-item-unit').value.trim() || 'กก.';
  const buy = parseFloat(document.getElementById('new-item-buy').value) || 0;
  const sell = parseFloat(document.getElementById('new-item-sell').value) || 0;
  if (!name) { toast('⚠️ กรอกชื่อสินค้าก่อน'); return; }
  try {
    await DB.addItem(name, unit, buy, sell);
    itemModal.style.display = 'none';
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-unit').value = 'กก.';
    document.getElementById('new-item-buy').value = '';
    document.getElementById('new-item-sell').value = '';
    await loadItems();
    toast('✅ เพิ่มสินค้าแล้ว');
  } catch (e) {
    console.error(e);
    toast('❌ เพิ่มไม่สำเร็จ: ' + e.message);
  }
};

async function loadItems() {
  try {
    items = await DB.getItems();
    renderItems();
  } catch (e) {
    console.error(e);
    itemListEl.innerHTML = `<div class="empty-state">โหลดข้อมูลไม่สำเร็จ: ${escapeHtml(e.message)}</div>`;
  }
}

loadItems();
