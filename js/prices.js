// js/prices.js
import { supabase } from './config.js';
import { checkSession } from './auth.js';
import { renderSidebar } from '../components/sidebar.js';

let userRole = 'cashier';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. เช็ค Login
    const { session } = await checkSession();
    if (!session) return window.location.replace('login.html');
    
    // ดึงสิทธิ์ User
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
    
    if (userData) userRole = userData.role;

    // เรนเดอร์ Sidebar (มันจะไปฝังใน div ที่ซ่อนอยู่บนมือถืออัตโนมัติ)
    renderSidebar('sidebar-container');

    // 2. ดึงข้อมูลราคามาแสดง
    await loadPrices();

    // 3. เปิดระบบรับฟัง Realtime
    subscribeToRealtime();
});

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
        .order('items(name)', { ascending: true });

    if (error) {
        console.error('Error fetching prices:', error);
        return;
    }

    renderCards(data); // เปลี่ยนชื่อเรียกเป็น renderCards
}

// 📌 สร้าง Card แทนการสร้างตาราง
function renderCards(pricesData) {
    const container = document.getElementById('price-card-container');
    
    const isReadOnly = userRole !== 'admin' ? 'disabled' : '';
    const hideAction = userRole !== 'admin' ? 'hidden' : '';

    container.innerHTML = pricesData.map(row => `
        <div id="card-${row.item_id}" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 relative transition-all duration-300">
            
            <!-- ชื่อสินค้า & เวลา -->
            <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 class="font-bold text-lg text-slate-800">${row.items.name}</h3>
                <span class="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md" id="time-${row.item_id}">
                    <i class="ph ph-clock"></i> ${formatTime(row.updated_at)}
                </span>
            </div>

            <!-- กล่องกรอกราคา (ออกแบบให้กดง่ายบนมือถือ) -->
            <div class="flex gap-3 mb-1">
                <div class="flex-1 bg-slate-50 rounded-xl p-2 border border-slate-100 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <label class="text-[10px] text-slate-500 uppercase tracking-wide font-medium block text-center mb-1">รับซื้อ (฿/kg)</label>
                    <input type="number" id="buy-${row.item_id}" value="${row.buy_price}" ${isReadOnly}
                           class="w-full bg-transparent text-xl font-bold text-blue-600 text-center outline-none disabled:text-slate-400">
                </div>
                
                <div class="flex-1 bg-slate-50 rounded-xl p-2 border border-slate-100 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                    <label class="text-[10px] text-slate-500 uppercase tracking-wide font-medium block text-center mb-1">ขายออก (฿/kg)</label>
                    <input type="number" id="sell-${row.item_id}" value="${row.sell_price}" ${isReadOnly}
                           class="w-full bg-transparent text-xl font-bold text-green-600 text-center outline-none disabled:text-slate-400">
                </div>
            </div>

            <!-- ปุ่มเซฟ (ซ่อนถ้าไม่ใช่ Admin, ปุ่มใหญ่กดมือเดียวง่าย) -->
            <button data-id="${row.item_id}" class="save-btn w-full mt-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-medium transition-all flex justify-center items-center gap-2 ${hideAction}">
                <i class="ph ph-floppy-disk text-lg"></i> บันทึกราคา
            </button>
        </div>
    `).join('');
}

// 📌 ดักจับ Event คลิกปุ่มเซฟ
document.getElementById('price-card-container').addEventListener('click', async (e) => {
    if (e.target.closest('.save-btn')) {
        const btn = e.target.closest('.save-btn');
        const itemId = btn.dataset.id;
        
        const buyVal = document.getElementById(`buy-${itemId}`).value;
        const sellVal = document.getElementById(`sell-${itemId}`).value;

        // สถานะกำลังโหลด
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner-gap animate-spin text-lg"></i> กำลังบันทึก...';
        btn.disabled = true;
        btn.classList.add('opacity-70');

        const { error } = await supabase
            .from('prices')
            .update({ 
                buy_price: parseFloat(buyVal), 
                sell_price: parseFloat(sellVal),
                updated_at: new Date().toISOString()
            })
            .eq('item_id', itemId);

        btn.disabled = false;
        btn.classList.remove('opacity-70');
        btn.innerHTML = originalHtml;

        if (error) {
            showToast('เกิดข้อผิดพลาด: ' + error.message, true);
        } else {
            showToast('บันทึกราคาเรียบร้อย');
        }
    }
});

// 📌 Supabase Realtime
function subscribeToRealtime() {
    const desktopStatus = document.getElementById('desktop-connection-status');
    const mobileStatus = document.getElementById('mobile-connection-status');

    supabase.channel('prices-update-channel')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'prices' },
            (payload) => {
                const newData = payload.new;
                
                // ค้นหา Card และ Input
                const card = document.getElementById(`card-${newData.item_id}`);
                const buyInput = document.getElementById(`buy-${newData.item_id}`);
                const sellInput = document.getElementById(`sell-${newData.item_id}`);
                const timeCell = document.getElementById(`time-${newData.item_id}`);

                if (card && buyInput && sellInput) {
                    if (parseFloat(buyInput.value) !== newData.buy_price) buyInput.value = newData.buy_price;
                    if (parseFloat(sellInput.value) !== newData.sell_price) sellInput.value = newData.sell_price;
                    
                    timeCell.innerHTML = `<i class="ph ph-clock"></i> ${formatTime(newData.updated_at)}`;

                    // ยิง Effect แฟลชสีเขียวที่ Card
                    card.classList.remove('flash-update');
                    void card.offsetWidth;
                    card.classList.add('flash-update');
                }
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                // อัปเดต UI ให้สีเขียวทั้งจอคอมและมือถือ
                if(desktopStatus) {
                    desktopStatus.innerHTML = '<div class="w-2.5 h-2.5 rounded-full bg-green-500"></div> เชื่อมต่อ Realtime แล้ว';
                    desktopStatus.className = 'flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium';
                }
                if(mobileStatus) {
                    mobileStatus.innerHTML = '<div class="w-2 h-2 rounded-full bg-green-400"></div> Realtime';
                    mobileStatus.className = 'flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-[10px] font-medium border border-green-500/30';
                }
            }
        });
}

// --- Utils ---
function formatTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const msgElement = document.getElementById('toast-msg');
    
    // จัดการสี
    if(isError) {
        toast.classList.replace('bg-slate-800', 'bg-red-600');
        toast.innerHTML = `<i class="ph-fill ph-warning-circle text-white text-xl"></i> <span id="toast-msg">${message}</span>`;
    } else {
        toast.classList.replace('bg-red-600', 'bg-slate-800');
        toast.innerHTML = `<i class="ph-fill ph-check-circle text-green-400 text-xl"></i> <span id="toast-msg">${message}</span>`;
    }
    
    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}