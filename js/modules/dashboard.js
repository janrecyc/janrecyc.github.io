// js/modules/dashboard.js

import {
  fetchItems,
  fetchPrices,
  fetchCashBalance,
  subscribePrices
} from '../core/api.js';

import { showToast } from '../core/ui.js';

let priceSubscription = null;

export async function initDashboardPage(user) {
  try {
    renderSkeleton();

    const [items, prices, cash] = await Promise.all([
      fetchItems(),
      fetchPrices(),
      fetchCashBalance()
    ]);

    renderData({
      user,
      itemsCount: items.length,
      pricesCount: prices.length,
      cashBalance: cash
    });

    initRealtime();

  } catch (err) {
    console.error(err);
    showToast('โหลด Dashboard ไม่สำเร็จ', 'error');
  }
}

// ---------- UI ----------

function renderSkeleton() {
  const container = document.getElementById('page-content');

  container.innerHTML = `
    <div class="space-y-4">
      <h1 class="text-xl font-bold">Dashboard</h1>

      <div id="dashboard-cards" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${cardLoading()}
        ${cardLoading()}
        ${cardLoading()}
        ${cardLoading()}
      </div>
    </div>
  `;
}

function renderData({ user, itemsCount, pricesCount, cashBalance }) {
  const container = document.getElementById('dashboard-cards');

  container.innerHTML = `
    ${card('ผู้ใช้งาน', user.profile.full_name)}
    ${card('Role', user.profile.role)}
    ${card('จำนวนสินค้า', itemsCount)}
    ${card('รายการราคา', pricesCount)}
    ${card('เงินสดในลิ้นชัก', formatCurrency(cashBalance))}
  `;
}

// ---------- REALTIME ----------

function initRealtime() {
  if (priceSubscription) {
    priceSubscription.unsubscribe();
  }

  priceSubscription = subscribePrices(async () => {
    try {
      const prices = await fetchPrices();

      const container = document.getElementById('dashboard-cards');
      const cards = container.children;

      // update only prices count card (index 3)
      if (cards[3]) {
        cards[3].innerHTML = `
          <div class="text-sm text-gray-500">รายการราคา</div>
          <div class="text-xl font-bold">${prices.length}</div>
        `;
      }

      showToast('ราคามีการอัปเดต', 'info');

    } catch (err) {
      console.error(err);
    }
  });
}

// ---------- COMPONENTS ----------

function card(title, value) {
  return `
    <div class="bg-white p-4 rounded-xl shadow">
      <div class="text-sm text-gray-500">${title}</div>
      <div class="text-xl font-bold">${value}</div>
    </div>
  `;
}

function cardLoading() {
  return `
    <div class="bg-white p-4 rounded-xl shadow animate-pulse">
      <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div class="h-6 bg-gray-300 rounded w-1/3"></div>
    </div>
  `;
}

// ---------- UTIL ----------

function formatCurrency(num) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(num);
}
