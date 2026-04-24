import { navigate } from "../router.js";
import { logout } from "../auth.js";

/**
 * Sidebar Item
 */
function sidebarItem(label, path, icon) {
  return `
    <a href="${path}" data-link
      class="flex items-center gap-3 px-4 py-3 rounded-xl
      text-gray-600 hover:bg-gray-100 hover:text-black
      transition-all duration-200 active:scale-95">

      <span class="text-lg">${icon}</span>
      <span class="font-medium">${label}</span>
    </a>
  `;
}

/**
 * Layout Wrapper
 */
export function renderLayout(content) {
  return `
  <div class="flex h-screen bg-gray-100">

    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r shadow-sm flex flex-col">

      <div class="p-6 text-2xl font-bold tracking-tight">
        janrecyc
      </div>

      <nav class="flex flex-col gap-2 px-3">

        ${sidebarItem("POS", "/pos", "💰")}
        ${sidebarItem("สต็อก / ราคา", "/inventory", "📦")}
        ${sidebarItem("ประวัติบิล", "/history", "📜")}

      </nav>

      <div class="mt-auto p-4">
        <button id="logoutBtn"
          class="w-full py-3 rounded-xl bg-red-500 text-white font-semibold
          hover:bg-red-600 transition-all duration-200 active:scale-95">
          ออกจากระบบ
        </button>
      </div>

    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col">

      <!-- Header -->
      <header class="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">

        <h1 class="text-xl font-semibold">
          ระบบ POS ร้านรับซื้อของเก่า
        </h1>

        <div class="text-sm text-gray-500">
          Ready to work
        </div>

      </header>

      <!-- Content -->
      <main class="flex-1 p-6 overflow-y-auto">
        ${content}
      </main>

    </div>

  </div>
  `;
}

/**
 * Bind Events (ต้องเรียกหลัง render)
 */
export function bindLayoutEvents() {
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await logout();
      navigate("/");
    });
  }
}
