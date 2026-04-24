// js/modules/dashboard.js

import { fetchCashBalance } from '../core/api.js';
import { showToast } from '../core/ui.js';

let chartInstance = null;

export async function initDashboardPage(user) {
  renderUI();

  renderDate();

  try {
    const cash = await fetchCashBalance();
    document.getElementById('drawer-cash').textContent = format(cash);

    // TODO: replace with real API
    document.getElementById('today-buy').textContent = '1250.00';
    document.getElementById('today-sell').textContent = '0.00';

    renderChart();

  } catch (err) {
    console.error(err);
    showToast('โหลดข้อมูลไม่สำเร็จ', 'error');
  }
}

// ---------------- UI ----------------

function renderUI() {
  const root = document.getElementById('page-content');

  root.innerHTML = `
    <main class="flex flex-col h-full">

      <!-- HEADER -->
      <header class="bg-white px-4 py-3 flex justify-between items-center shadow-sm">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <i class="ph-fill ph-chart-line-up text-lg"></i>
          </div>
          <h1 class="font-bold">Dashboard</h1>
        </div>
        <span id="date-display" class="text-xs text-slate-500"></span>
      </header>

      <!-- CONTENT -->
      <div class="flex-1 overflow-y-auto p-3 space-y-3 pb-24">

        <div class="grid grid-cols-2 gap-3">

          <div class="bg-white p-4 rounded-2xl shadow-sm border">
            <p class="text-xs text-slate-500">ซื้อวันนี้</p>
            <div class="text-xl font-bold text-red-500">
              ฿ <span id="today-buy">0.00</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl shadow-sm border">
            <p class="text-xs text-slate-500">ขายวันนี้</p>
            <div class="text-xl font-bold text-green-600">
              ฿ <span id="today-sell">0.00</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-2xl shadow-sm border col-span-2">
            <p class="text-xs text-slate-500">เงินสดในลิ้นชัก</p>
            <div class="text-2xl font-bold text-blue-600">
              ฿ <span id="drawer-cash">0.00</span>
            </div>
          </div>

        </div>

        <div class="bg-white p-4 rounded-2xl shadow-sm border">
          <h3 class="font-bold mb-2 text-sm">ยอดรับซื้อย้อนหลัง 7 วัน</h3>
          <canvas id="buyChart" class="h-40"></canvas>
        </div>

      </div>

      <!-- NAV -->
      <nav class="sticky bottom-0 bg-white border-t z-50">
        <div class="flex overflow-x-auto hide-scrollbar">

          ${navItem('buy.html','ph-download-simple','รับซื้อ')}
          ${navItem('sell.html','ph-upload-simple','ขาย')}
          ${navItem('sort.html','ph-recycle','คัดแยก')}
          ${navItem('prices.html','ph-chart-line-up','ราคา')}
          ${navItem('cashflow.html','ph-money','เงินสด')}
          ${navItem('dashboard.html','ph-chart-line-up','ภาพรวม', true)}

        </div>
      </nav>

    </main>
  `;
}

// ---------------- COMPONENT ----------------

function navItem(path, icon, label, active=false) {
  return `
    <a href="/pages/${path}"
       class="min-w-[76px] py-2 text-center ${
         active ? 'text-blue-600 bg-blue-50' : 'text-slate-400'
       }">
      <i class="ph ${active ? 'ph-fill' : ''} ${icon} text-xl"></i>
      <div class="text-[10px] ${active ? 'font-bold' : ''}">${label}</div>
    </a>
  `;
}

// ---------------- CHART ----------------

function renderChart() {
  const ctx = document.getElementById('buyChart');

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'],
      datasets: [{
        label: 'ยอดซื้อ',
        data: [1200, 900, 1500, 800, 2000, 1700, 1300],
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#eee' } }
      }
    }
  });
}

// ---------------- UTIL ----------------

function renderDate() {
  const el = document.getElementById('date-display');
  const now = new Date();
  el.textContent = now.toLocaleDateString('th-TH');
}

function format(num) {
  return Number(num).toFixed(2);
}
