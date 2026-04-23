// js/modules/dashboard.js

import {
  fetchPrices,
  fetchCashBalance,
  fetchItems
} from '../core/api.js';

import { showToast } from '../core/ui.js';

export async function initDashboardPage(user) {
  try {
    renderLayout(user);

    const [prices, cash, items] = await Promise.all([
      fetchPrices(),
      fetchCashBalance(),
      fetchItems()
    ]);

    renderPrices(prices);
    renderInventory();
    renderTime();

  } catch (err) {
    console.error(err);
    showToast('โหลด Dashboard ไม่สำเร็จ', 'error');
  }
}

// ---------------- UI ----------------

function renderLayout(user) {
  const container = document.getElementById('page-content');

  container.innerHTML = `
    <div class="space-y-6">

      <!-- Navbar -->
      <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow">
        <div class="text-lg font-bold">JanRecyc System</div>
        <div class="text-sm text-gray-600">
          <span>${user.profile.full_name} (${user.profile.role})</span> |
          <span id="current-time"></span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${kpiCard('เงินสดในลิ้นชัก', '5,000 ฿', 'bg-green-500')}
        ${kpiCard('ยอดรับซื้อวันนี้', '1,250 ฿', 'bg-red-500')}
        ${kpiCard('ยอดขายวันนี้', '0 ฿', 'bg-blue-500')}
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        ${actionBtn('➕ รับซื้อสินค้า', 'buy.html', 'bg-green-600')}
        ${actionBtn('🚚 ขายส่งโรงงาน', 'sell.html', 'bg-blue-600')}
        ${actionBtn('💵 จัดการเงินลิ้นชัก', 'cashflow.html', 'bg-yellow-600')}
        ${actionBtn('📝 อัปเดตราคาวันนี้', 'prices.html', 'bg-purple-600')}
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- Price Board -->
        <div class="bg-white p-4 rounded-xl shadow">
          <h2 class="font-bold mb-3">📊 ราคาวันนี้</h2>
          <div id="price-list" class="space-y-2"></div>
        </div>

        <!-- Inventory -->
        <div class="bg-white p-4 rounded-xl shadow">
          <h2 class="font-bold mb-3">📦 สถานะคลังสินค้า</h2>
          <div id="inventory-list" class="space-y-3"></div>
        </div>

      </div>

      <!-- Recent Transactions -->
      <div class="bg-white p-4 rounded-xl shadow">
        <h2 class="font-bold mb-3">🧾 รายการล่าสุด</h2>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left border-b">
                <th class="py-2">เวลา</th>
                <th>ประเภท</th>
                <th>รายการ</th>
                <th>น้ำหนัก</th>
                <th>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody id="tx-list">
              ${mockTransactions()}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// ---------------- COMPONENTS ----------------

function kpiCard(title, value, color) {
  return `
    <div class="${color} text-white p-4 rounded-xl shadow">
      <div class="text-sm">${title}</div>
      <div class="text-2xl font-bold">${value}</div>
    </div>
  `;
}

function actionBtn(label, href, color) {
  return `
    <a href="/pages/${href}" class="${color} text-white p-4 rounded-xl text-center font-semibold shadow">
      ${label}
    </a>
  `;
}

// ---------------- DATA RENDER ----------------

function renderPrices(prices) {
  const container = document.getElementById('price-list');

  container.innerHTML = prices
    .slice(0, 5)
    .map(p => `
      <div class="flex justify-between border-b pb-1">
        <span>${p.items.name}</span>
        <span class="font-bold">${p.buy_price} ฿/kg</span>
      </div>
    `)
    .join('');
}

function renderInventory() {
  const container = document.getElementById('inventory-list');

  const data = [
    { name: 'โลหะ', value: 500, max: 1000 },
    { name: 'กระดาษ', value: 1200, max: 1500 },
    { name: 'พลาสติก', value: 300, max: 800 }
  ];

  container.innerHTML = data.map(d => {
    const percent = Math.min((d.value / d.max) * 100, 100);

    return `
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>${d.name}</span>
          <span>${d.value} kg</span>
        </div>
        <div class="w-full bg-gray-200 h-3 rounded">
          <div class="bg-green-500 h-3 rounded" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- MOCK DATA ----------------

function mockTransactions() {
  return `
    <tr class="border-b">
      <td class="py-2">10:30</td>
      <td>รับซื้อ</td>
      <td>ทองแดง</td>
      <td>5 kg</td>
      <td>1,100 ฿</td>
    </tr>
    <tr class="border-b">
      <td class="py-2">11:15</td>
      <td>รับซื้อ</td>
      <td>เหล็ก</td>
      <td>50 kg</td>
      <td>500 ฿</td>
    </tr>
    <tr class="border-b">
      <td class="py-2">13:00</td>
      <td>เติมเงิน</td>
      <td>-</td>
      <td>-</td>
      <td>2,000 ฿</td>
    </tr>
  `;
}

// ---------------- UTIL ----------------

function renderTime() {
  const el = document.getElementById('current-time');

  function update() {
    const now = new Date();
    el.textContent = now.toLocaleString('th-TH');
  }

  update();
  setInterval(update, 1000);
}
