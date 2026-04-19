// js/prices.js
import { supabase } from './config.js';
import { checkSession } from './auth.js';
import { renderSidebar } from '../components/sidebar.js';

// ตัวแปรเก็บสิทธิ์การใช้งาน (เพื่อเช็คว่าจะให้แก้ไขราคาได้ไหม)
let userRole = 'cashier';

// เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', async () => {
    // 1. เช็ค Login และดึง Sidebar
    const { session } = await checkSession();
    if (!session) return window.location.replace('login.html');
    
    // ดึงสิทธิ์ User จากตาราง public.users
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
    
    if (userData) userRole = userData.role;

    // เรนเดอร์ Sidebar (สมมติว่าคุณมีฟังก์ชันนี้แล้วตามคำตอบก่อนหน้า)
    renderSidebar('sidebar-container');

    // 2. ดึงข้อมูลราคามาแสดง
    await loadPrices();

    // 3. เปิดระบบรับฟัง Realtime!
    subscribeToRealtime();
});

// ฟังก์ชันดึงข้อมูลแบบ Join ตาราง items เพื่อเอาชื่อสินค้า
async function loadPrices() {
    const { data, error } = await supabase
        .from('prices')
        .select(`
            item_id, 
            buy_price, 
            sell_price, 
            updated_at,
            items (name)
        `)
        .order('items(name)', { ascending: true }); // เรียงตามชื่อ

    if (error) {
        console.error('Error fetching prices:', error);
        return;
    }

    renderTable(data);
}

// ฟังก์ชันสร้างแถวในตาราง
function renderTable(pricesData) {
    const tbody = document.getElementById('price-table-body');
    
    // ตรวจสอบสิทธิ์: ถ้าเป็น Cashier ให้ Disable ช่อง Input และซ่อนปุ่ม
    const isReadOnly = userRole !== 'admin' ? 'disabled' : '';
    const hideAction = userRole !== 'admin' ? 'hidden' : '';

    tbody.innerHTML = pricesData.map(row => `
        <tr id="row-${row.item_id}" class="hover:bg-slate-50 transition-colors duration-300 group">
            <td class="p-4 font-bold text-slate-700 text-lg">${row.items.name}</td>
            <td class="p-4">
                <input type="number" id="buy-${row.item_id}" value="${row.buy_price}" ${isReadOnly}
                       class="w-full bg-slate-100 focus:bg-white border-2 border-transparent focus:border-green-400 rounded-lg px-3 py-2 text-lg font-semibold text-blue-600 outline-none transition disabled:bg-transparent disabled:text-slate-600">
            </td>
            <td class="p-4">
                <input type="number" id="sell-${row.item_id}" value="${row.sell_price}" ${isReadOnly}
                       class="w-full bg-slate-100 focus:bg-white border-2 border-transparent focus:border-green-400 rounded-lg px-3 py-2 text-lg font-semibold text-red-600 outline-none transition disabled:bg-transparent disabled:text-slate-600">
            </td>
            <td class="p-4 text-sm text-slate-500" id="time-${row.item_id}">
                ${formatTime(row.updated_at)}
            </td>
            <td class="p-4 text-center">
                <button data-id="${row.item_id}" class="save-btn bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition ${hideAction} opacity-0 group-hover:opacity-100">
                    💾 บันทึก
                </button>
            </td>
        </tr>
    `).join('');
}

// เทคนิค Event Delegation: ดักจับคลิกที่ปุ่มเซฟทั้งหมดผ่าน Tbody
document.getElementById('price-table-body').addEventListener('click', async (e) => {
    // หาว่าคลิกโดนปุ่มที่มีคลาส save-btn ไหม
    if (e.target.closest('.save-btn')) {
        const btn = e.target.closest('.save-btn');
        const itemId = btn.dataset.id;
        
        // ดึงค่าที่เถ้าแก่พิมพ์
        const buyVal = document.getElementById(`buy-${itemId}`).value;
        const sellVal = document.getElementById(`sell-${itemId}`).value;

        // เปลี่ยนปุ่มเป็นสถานะโหลด
        btn.innerHTML = '⏳...';
        btn.disabled = true;

        // อัปเดตลง Database (ตัวเวลาอัปเดตให้ฐานข้อมูลจัดการ หรือส่งไปจาก Client ก็ได้)
        const { error } = await supabase
            .from('prices')
            .update({ 
                buy_price: parseFloat(buyVal), 
                sell_price: parseFloat(sellVal),
                updated_at: new Date().toISOString()
            })
            .eq('item_id', itemId);

        btn.disabled = false;
        btn.innerHTML = '💾 บันทึก';

        if (error) {
            showToast('เกิดข้อผิดพลาด: ' + error.message, true);
        } else {
            showToast('บันทึกราคาเรียบร้อย');
            // ไม่ต้องทำอะไรเพิ่มกับ UI ตรงนี้ เพราะเดี๋ยว Realtime Subscription จะรับไม้ต่อเอง!
        }
    }
});

// 🚀 พลังของ Supabase Realtime
function subscribeToRealtime() {
    const statusBadge = document.getElementById('connection-status');

    supabase.channel('prices-update-channel')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'prices' },
            (payload) => {
                const newData = payload.new;
                
                // หา Element บนหน้าจอให้เจอ
                const row = document.getElementById(`row-${newData.item_id}`);
                const buyInput = document.getElementById(`buy-${newData.item_id}`);
                const sellInput = document.getElementById(`sell-${newData.item_id}`);
                const timeCell = document.getElementById(`time-${newData.item_id}`);

                if (row && buyInput && sellInput) {
                    // ปรับค่าใน Input ให้ตรงกับที่ Database ส่งมาใหม่
                    // (เช็คก่อนว่าค่าต่างกันจริงๆ ค่อยเปลี่ยน ป้องกัน Cursor เด้งเวลาเถ้าแก่กำลังพิมพ์)
                    if (parseFloat(buyInput.value) !== newData.buy_price) buyInput.value = newData.buy_price;
                    if (parseFloat(sellInput.value) !== newData.sell_price) sellInput.value = newData.sell_price;
                    
                    timeCell.innerText = formatTime(newData.updated_at);

                    // ยิง Effect สีเขียวให้รู้ว่าราคาอัปเดตแล้ว!
                    row.classList.remove('flash-update'); // รีเซ็ตคลาส
                    void row.offsetWidth; // บังคับให้เบราว์เซอร์ Reflow เพื่อให้ Animation ทำงานซ้ำได้
                    row.classList.add('flash-update');
                }
            }
        )
        .subscribe((status) => {
            // อัปเดต UI สถานะการเชื่อมต่อ
            if (status === 'SUBSCRIBED') {
                statusBadge.innerHTML = '🟢 เชื่อมต่อ Realtime แล้ว';
                statusBadge.className = 'flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium';
            }
        });
}

// --- ฟังก์ชันช่วยเหลือ (Utils) ---

// รูปแบบเวลาให้อ่านง่าย เช่น "14:30 น. (12 ก.พ.)"
function formatTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
}

// ฟังก์ชันโชว์ Toast แถบแจ้งเตือนมุมขวาล่าง
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const msgElement = document.getElementById('toast-msg');
    
    toast.className = `fixed bottom-5 right-5 transform transition-all duration-300 px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 ${isError ? 'bg-red-600' : 'bg-slate-800 text-white'}`;
    msgElement.innerText = message;
    
    // เด้งขึ้น
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    // หายไปหลังผ่านไป 3 วิ
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}
