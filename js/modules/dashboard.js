export function initDashboard() {

  const el = document.getElementById("page-content");

  el.innerHTML = `
    
    <!-- KPI -->
    <div class="grid grid-cols-2 gap-3 mb-4">

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <div class="text-xs text-gray-400">ซื้อวันนี้</div>
        <div class="text-xl font-bold text-red-500">฿ 1,250</div>
      </div>

      <div class="bg-white rounded-2xl p-4 shadow-sm">
        <div class="text-xs text-gray-400">ขายวันนี้</div>
        <div class="text-xl font-bold text-green-500">฿ 0</div>
      </div>

      <div class="col-span-2 bg-white rounded-2xl p-4 shadow-sm">
        <div class="text-xs text-gray-400">เงินสดในลิ้นชัก</div>
        <div class="text-2xl font-bold text-blue-600">฿ 5,000</div>
      </div>

    </div>

    <!-- CARD -->
    <div class="bg-white rounded-2xl p-4 shadow-sm">

      <div class="font-semibold mb-2">
        ยอดรับซื้อย้อนหลัง
      </div>

      <div class="h-40 flex items-center justify-center text-gray-300">
        (chart coming soon)
      </div>

    </div>

  `;
}
