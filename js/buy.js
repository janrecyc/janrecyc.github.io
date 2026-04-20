// js/buy.js
import { supabase } from './config.js';
import { checkSession } from './auth.js';
import { renderSidebar } from '../components/sidebar.js';

// --- State Management ---
let globalPrices = []; 
let cart = []; 
let currentUser = null; 

document.addEventListener('DOMContentLoaded', async () => {
    const { session } = await checkSession();
    if (!session) return window.location.replace('login.html');
    currentUser = session.user.id;

    renderSidebar('sidebar-container');
    await loadItemsAndPrices();
    setupEventListeners();
});

// 1. โหลดข้อมูลสินค้าและราคา
async function loadItemsAndPrices() {
    const { data, error } = await supabase
        .from('prices')
        .select(`item_id, buy_price, items (id, name, default_deduction_percent)`);

    if (error) {
        showToast('โหลดข้อมูลราคาล้มเหลว', 'error');
        return;
    }
    
    globalPrices = data;
    renderItemGrid();
}

// 2. สร้างปุ่มสินค้า (UI ใหม่ สวยๆ กดง่าย)
function renderItemGrid() {
    const grid = document.getElementById('item-grid');
    grid.innerHTML = globalPrices.map(p => `
        <button class="item-btn group bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-3 flex flex-col items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 active:scale-95 relative overflow-hidden" data-id="${p.item_id}">
            <!-- สีแต่งขอบด้านบน -->
            <div class="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
            
            <div class="w-12 h-12 bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500 rounded-full flex items-center justify-center mb-2 transition-colors">
                <i class="ph-fill ph-package text-2xl"></i>
            </div>
            
            <span class="text-[13px] font-bold text-slate-700 text-center leading-tight mb-2 h-8 flex items-center">${p.items.name}</span>
            <span class="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md text-center w-full truncate border border-green-100">฿ ${p.buy_price}</span>
        </button>
    `).join('');
}

function setupEventListeners() {
    document.getElementById('item-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('.item-btn');
        if (btn) addToCart(btn.dataset.id);
    });

    document.getElementById('cart-container').addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT') {
            const rowId = e.target.dataset.rowid;
            const field = e.target.dataset.field; 
            updateCartItem(rowId, field, e.target.value);
        }
    });

    document.getElementById('cart-container').addEventListener('click', (e) => {
        const delBtn = e.target.closest('.del-btn');
        if (delBtn) removeFromCart(delBtn.dataset.rowid);
    });

    document.getElementById('checkout-btn').addEventListener('click', processCheckout);
}

function addToCart(itemId) {
    const itemData = globalPrices.find(p => p.item_id === itemId);
    if (!itemData) return;

    const rowId = 'row_' + Date.now(); 
    
    cart.unshift({ // ใช้ unshift เพื่อให้ของใหม่ไปอยู่บนสุดของบิล
        rowId: rowId,
        itemId: itemId,
        name: itemData.items.name,
        price: itemData.buy_price,
        gross: '',
        deduct: '',
        net: 0,
        subtotal: 0
    });

    renderCart();
    
    setTimeout(() => {
        const inputs = document.querySelectorAll(`input[data-rowid="${rowId}"][data-field="gross"]`);
        if (inputs.length > 0) inputs[0].focus();
    }, 50);
}

// 5. วาดตะกร้าใหม่ (UI บิลใหม่ พิมพ์ง่าย กรอบชัดเจน)
function renderCart() {
    const container = document.getElementById('cart-container');
    const emptyMsg = document.getElementById('empty-cart-msg');
    
    document.getElementById('cart-count').innerText = `${cart.length} รายการ`;

    if (cart.length === 0) {
        emptyMsg.style.display = 'flex';
        container.querySelectorAll('.cart-item-card').forEach(el => el.remove());
    } else {
        emptyMsg.style.display = 'none';
        
        const html = cart.map((c, index) => `
            <div class="cart-item-card bg-white p-3 rounded-2xl shadow-sm border border-slate-200 relative animate-[fadeIn_0.3s_ease-out]">
                <!-- ปุ่มลบสวยๆ -->
                <button class="del-btn absolute -top-2 -right-2 bg-red-100 hover:bg-red-500 text-red-500 hover:text-white border border-white w-7 h-7 flex items-center justify-center rounded-full transition-colors shadow-sm" data-rowid="${c.rowId}">
                    <i class="ph-bold ph-x text-xs"></i>
                </button>
                
                <!-- หัวข้อสินค้าในบิล -->
                <div class="flex justify-between items-center mb-2 pr-4 border-b border-slate-100 pb-2">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <div class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                        <span class="font-bold text-sm lg:text-base text-slate-800 truncate">${c.name}</span>
                    </div>
                    <span class="text-[11px] lg:text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">@ ${c.price} ฿</span>
                </div>
                
                <!-- กล่องกรอกตัวเลข -->
                <div class="flex gap-2 mb-2">
                    <div class="flex-1 bg-slate-50 rounded-xl p-1.5 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <label class="text-[10px] text-slate-500 block text-center mb-0.5">รวม (กก.)</label>
                        <!-- ใช้ inputmode="decimal" เพื่อเรียกคีย์บอร์ดตัวเลขบนมือถือขึ้นมาทันที -->
                        <input type="number" step="0.1" inputmode="decimal" data-rowid="${c.rowId}" data-field="gross" value="${c.gross}" placeholder="0" class="w-full bg-transparent text-center px-1 py-1 text-lg font-bold text-slate-800 outline-none placeholder:text-slate-300">
                    </div>
                    <div class="flex-1 bg-red-50/50 rounded-xl p-1.5 border border-red-100 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                        <label class="text-[10px] text-red-400 block text-center mb-0.5">หักขยะ (กก.)</label>
                        <input type="number" step="0.1" inputmode="decimal" data-rowid="${c.rowId}" data-field="deduct" value="${c.deduct}" placeholder="0" class="w-full bg-transparent text-center px-1 py-1 text-lg font-bold text-red-600 outline-none placeholder:text-red-200">
                    </div>
                </div>
                
                <!-- สรุปบรรทัด -->
                <div class="flex justify-between items-center bg-green-50/50 px-3 py-2 rounded-xl border border-green-100">
                    <span class="text-xs font-semibold text-slate-600">สุทธิ <span id="net-${c.rowId}" class="text-slate-800">${c.net.toFixed(2)}</span> กก.</span>
                    <span class="text-sm lg:text-base font-bold text-green-600">฿ <span id="sub-${c.rowId}">${c.subtotal.toLocaleString('th-TH', {minimumFractionDigits:2})}</span></span>
                </div>
            </div>
        `).join('');
        
        if(container.querySelectorAll('.cart-item-card').length !== cart.length) {
            container.innerHTML = '<div id="empty-cart-msg" style="display:none;"></div>' + html;
        }
    }
    
    updateTotalSummary();
}

function updateCartItem(rowId, field, value) {
    const itemIndex = cart.findIndex(c => c.rowId === rowId);
    if (itemIndex === -1) return;

    cart[itemIndex][field] = value; 

    const gross = parseFloat(cart[itemIndex].gross) || 0;
    const deduct = parseFloat(cart[itemIndex].deduct) || 0;
    
    cart[itemIndex].net = Math.max(0, gross - deduct); 
    cart[itemIndex].subtotal = cart[itemIndex].net * cart[itemIndex].price;

    document.getElementById(`net-${rowId}`).innerText = cart[itemIndex].net.toFixed(2);
    document.getElementById(`sub-${rowId}`).innerText = cart[itemIndex].subtotal.toLocaleString('th-TH', {minimumFractionDigits:2, maximumFractionDigits:2});

    updateTotalSummary();
}

function removeFromCart(rowId) {
    cart = cart.filter(c => c.rowId !== rowId);
    renderCart();
}

function updateTotalSummary() {
    let totalWeight = 0;
    let totalAmount = 0;

    cart.forEach(c => {
        totalWeight += c.net;
        totalAmount += c.subtotal;
    });

    document.getElementById('total-weight').innerText = totalWeight.toFixed(2);
    document.getElementById('total-amount').innerText = totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const btn = document.getElementById('checkout-btn');
    const isValid = cart.length > 0 && cart.every(c => c.net > 0);
    btn.disabled = !isValid;
}

// 8. Checkout
async function processCheckout() {
    const btn = document.getElementById('checkout-btn');
    btn.innerHTML = '<i class="ph ph-spinner-gap animate-spin text-2xl"></i> กำลังบันทึก...';
    btn.disabled = true;

    const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    try {
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .insert({
                type: 'buy',
                total_amount: grandTotal,
                created_by: currentUser,
                status: 'completed'
            })
            .select()
            .single();

        if (txError) throw new Error('บันทึกหัวบิลล้มเหลว: ' + txError.message);
        const txId = txData.id;

        const linesData = cart.map(c => ({
            transaction_id: txId,
            item_id: c.itemId,
            gross_weight: parseFloat(c.gross),
            deduction_weight: parseFloat(c.deduct) || 0,
            unit_price: c.price
        }));

        const { error: linesError } = await supabase.from('transaction_lines').insert(linesData);
        if (linesError) throw new Error('บันทึกรายละเอียดล้มเหลว: ' + linesError.message);

        const inventoryData = cart.map(c => ({
            item_id: c.itemId,
            transaction_id: txId,
            change_weight: c.net,
            balance_weight: c.net
        }));
        await supabase.from('inventory_ledger').insert(inventoryData);

        await supabase.from('cash_flow').insert({
            transaction_id: txId,
            amount_in: 0,
            amount_out: grandTotal,
            balance: 0 
        });

        // สำเร็จ! เคลียร์บิล โชว์ Toast
        cart = [];
        renderCart();
        btn.innerHTML = '<i class="ph-fill ph-money text-2xl group-disabled:opacity-50"></i> บันทึกและจ่ายเงิน';
        
        showToast('บันทึกบิลสำเร็จ!', 'success');

    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
        btn.innerHTML = '<i class="ph-fill ph-money text-2xl group-disabled:opacity-50"></i> บันทึกและจ่ายเงิน';
        updateTotalSummary(); 
    }
}

// --- ฟังก์ชันช่วยเหลือ (Utils) ---

// แจ้งเตือนสวยๆ จากขอบบนจอ (ลงมาตรงกลาง)
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgElement = document.getElementById('toast-msg');
    const iconElement = document.getElementById('toast-icon');
    
    if (type === 'error') {
        toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 transform transition-all duration-300 px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 whitespace-nowrap text-sm font-medium pointer-events-none bg-red-600 text-white';
        iconElement.innerHTML = '<i class="ph-fill ph-warning-circle text-white text-xl"></i>';
    } else {
        toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 transform transition-all duration-300 px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 whitespace-nowrap text-sm font-medium pointer-events-none bg-slate-800 text-white border border-slate-700';
        iconElement.innerHTML = '<i class="ph-fill ph-check-circle text-green-400 text-xl"></i>';
    }
    
    msgElement.innerText = message;
    
    // เด้งลงมา
    toast.classList.remove('-translate-y-20', 'opacity-0');
    
    // หายไปหลัง 3 วิ
    setTimeout(() => {
        toast.classList.add('-translate-y-20', 'opacity-0');
    }, 3000);
}
