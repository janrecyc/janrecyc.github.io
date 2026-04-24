// js/modules/dashboard.js

import { fetchPrices, fetchCashBalance } from '../core/api.js';

export async function initDashboardPage(user) {
  renderUI(user);

  const [prices, cash] = await Promise.all([
    fetchPrices(),
    fetchCashBalance()
  ]);

  renderPrices(prices);
  updateCash(cash);
}

// ---------------- UI ----------------

function renderUI(user) {
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="space-y-4">

      <!-- Header -->
      <div class="bg-[#1c1c1c] p-4 rounded-2xl flex justify-between items-center border border-[#2f2f2f]">
        <div class="font-bold text-lg">JanRecyc System</div>
        <div class="text-sm text-gray-400">
          ${user.profile.full_name}
        </div>
      </div>

      <!-- KPI -->
      <div class="grid grid-cols-2 gap-3">
        ${kpi('เงินสด', '฿0', 'text-green-400')}
        ${kpi('รับซื้อวันนี้', '฿1,250', 'text-red-400')}
        ${kpi('ขายวันนี้', '฿0', 'text-blue-400')}
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-3">
        ${btn('➕ รับซื้อ', 'buy.html')}
        ${btn('🚚 ขายออก', 'sell.html')}
        ${btn('💵 เงินสด', 'cashflow.html')}
        ${btn('📝 ราคา', 'prices.html')}
      </div>

      <!-- Price Grid -->
      <div>
        <div class="mb-2 text-gray-400">ราคาวันนี้</div>
        <div id="price-grid" class="grid grid-cols-2 gap-3"></div>
      </div>

      <!-- Last Transaction -->
      <div class="bg-[#1c1c1c] p-4 rounded-2xl border border-[#2f2f2f]">
        <div class="text-gray-400 text-sm mb-1">รายการล่าสุด</div>
        <div class="flex justify-between items-center">
          <div>
            <div class="font-semibold">เหล็กหนา</div>
            <div class="text-gray-400 text-sm">25.5 กก.</div>
          </div>
          <div class="text-3xl font-bold text-green-400">฿267.75</div>
        </div>
      </div>

    </div>
  `;
}

// ---------------- COMPONENT ----------------

function kpi(label, value, color) {
  return `
    <div class="bg-[#1c1c1c] p-4 rounded-2xl border border-[#2f2f2f]">
      <div class="text-sm text-gray-400">${label}</div>
      <div class="text-xl font-bold ${color}">${value}</div>
    </div>
  `;
}

function btn(label, href) {
  return `
    <a href="/pages/${href}" class="bg-[#2a2a2a] p-4 rounded-2xl text-center font-semibold active:scale-95">
      ${label}
    </a>
  `;
}

// ---------------- DATA ----------------

function renderPrices(prices) {
  const grid = document.getElementById('price-grid');

  grid.innerHTML = prices.map(p => `
    <div class="bg-[#2a2a2a] rounded-2xl p-4 text-center">
      <div class="font-semibold">${p.items.name}</div>
      <div class="text-yellow-400 text-xl font-bold mt-1">
        ฿${p.buy_price}
      </div>
    </div>
  `).join('');
}

function updateCash(cash) {
  const el = document.querySelector('[data-cash]');
  if (el) {
    el.textContent = `฿${cash}`;
  }
}
