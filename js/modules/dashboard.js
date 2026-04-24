// js/modules/dashboard.js

export async function initDashboardPage() {
  const el = document.getElementById('page-content');

  el.innerHTML = `
    <div class="p-3 space-y-3">

      <div class="grid grid-cols-2 gap-3">

        <div class="bg-white p-4 rounded-xl shadow">
          <div class="text-xs text-gray-500">ซื้อวันนี้</div>
          <div class="text-xl text-red-500 font-bold">฿0.00</div>
        </div>

        <div class="bg-white p-4 rounded-xl shadow">
          <div class="text-xs text-gray-500">ขายวันนี้</div>
          <div class="text-xl text-green-600 font-bold">฿0.00</div>
        </div>

        <div class="bg-white p-4 rounded-xl shadow col-span-2">
          <div class="text-xs text-gray-500">เงินสดในลิ้นชัก</div>
          <div class="text-2xl text-blue-600 font-bold">฿0.00</div>
        </div>

      </div>

    </div>
  `;
}
