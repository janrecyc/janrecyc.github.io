// components/sidebar.js
import { logout } from '../js/auth.js';

// ฟังก์ชันนี้รับ ID ของ HTML Element ที่ต้องการเอา Sidebar ไปวาง
export function renderSidebar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // เช็คว่าตอนนี้อยู่หน้าไหน เพื่อไฮไลท์สีเมนู (Active State)
    const currentPath = window.location.pathname;
    
    const checkActive = (filename) => {
        return currentPath.includes(filename) 
            ? 'bg-green-700 border-l-4 border-green-400' // สีตอนกด (Active)
            : 'hover:bg-slate-700 border-l-4 border-transparent'; // สีปกติ
    };

    const sidebarHTML = `
        <aside class="w-64 h-screen bg-slate-800 text-white flex flex-col fixed top-0 left-0 shadow-xl">
            <div class="p-6 border-b border-slate-700">
                <h2 class="text-2xl font-bold text-green-400 tracking-wider">♻️ Scrap POS</h2>
                <p class="text-xs text-slate-400 mt-1" id="user-display">พนักงาน: Loading...</p>
            </div>
            
            <nav class="flex-1 overflow-y-auto py-4">
                <ul class="space-y-1">
                    <li><a href="buy.html" class="block py-3 px-6 transition ${checkActive('buy.html')}">📥 รับซื้อของเข้า</a></li>
                    <li><a href="sell.html" class="block py-3 px-6 transition ${checkActive('sell.html')}">📤 ขายออกโรงงาน</a></li>
                    <li><a href="sort.html" class="block py-3 px-6 transition ${checkActive('sort.html')}">♻️ คัดแยก / แปรรูป</a></li>
                    <li><a href="prices.html" class="block py-3 px-6 transition ${checkActive('prices.html')}">📈 บอร์ดราคาตลาด</a></li>
                    <li><a href="inventory.html" class="block py-3 px-6 transition ${checkActive('inventory.html')}">📦 สต๊อกคงเหลือ</a></li>
                    <li><a href="cashflow.html" class="block py-3 px-6 transition ${checkActive('cashflow.html')}">💵 เงินสดย่อย / ปิดกะ</a></li>
                </ul>
            </nav>
            
            <div class="p-4 bg-slate-900">
                <button id="logout-btn" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition flex justify-center items-center gap-2">
                    <span>🚪</span> ออกจากระบบ
                </button>
            </div>
        </aside>
    `;

    container.innerHTML = sidebarHTML;

    // ผูก Event ให้ปุ่ม Logout ทำงาน
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const confirmLogout = confirm('คุณต้องการออกจากระบบใช่หรือไม่?');
        if (confirmLogout) {
            await logout();
            window.location.replace('login.html');
        }
    });
}
