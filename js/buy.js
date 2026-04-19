// js/buy.js
import { supabase } from './config.js';
import { checkSession } from './auth.js';
import { renderSidebar } from '../components/sidebar.js';

// --- State Management ---
let globalPrices = []; // เก็บราคาล่าสุด
let cart = []; // เก็บของในตะกร้า
let currentUser = null; // เก็บ ID คนใช้งาน

document.addEventListener('DOMContentLoaded', async () => {
    const { session } = await checkSession();
    if (!session) return window.location.replace('login.html');
    currentUser = session.user.id;

    renderSidebar('sidebar-container');
    await loadItemsAndPrices();
    setupEventListeners();
});

// 1. โหลดข้อมูลสินค้าและราคาจากฐานข้อมูล
async function loadItemsAndPrices() {
    const { data, error } = await supabase
        .from('prices')
        .select(`
            item_id, 
            buy_price, 
            items (id, name, default_deduction_percent)
        `);

    if (error) return alert('โหลดข้อมูลราคาล้มเหลว');
    
    globalPrices = data;
    renderItemGrid();
}

// 2. สร้างปุ่มให้กดเลือกฝั่งซ้าย
function renderItemGrid() {
    const grid = document.getElementById('item-grid');
    grid.innerHTML = globalPrices.map(p => `
        <button class="item-btn bg-white border-2 border-slate-200 hover:border-green-500 hover:shadow-md rounded-xl p-4 flex flex-col items-center justify-center transition" data-id="${p.item_id}">
            <span class="text-xl font-bold text-slate-800 mb-1">${p.items.name}</span>
            <span class="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full text-sm">฿ ${p.buy_price} / กก.</span>
        </button>
    `).join('');
}

// 3. จัดการ Event ต่างๆ
function setupEventListeners() {
    // ดักคลิกเลือกสินค้า (Event Delegation)
    document.getElementById('item-grid').addEventListener('click', (e) => {
        const btn = e.target.closest('.item-btn');
        if (btn) addToCart(btn.dataset.id);
    });

    // ดักการพิมพ์ตัวเลขในบิล เพื่อคำนวณสดๆ
    document.getElementById('cart-container').addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT') {
            const rowId = e.target.dataset.rowid;
            const field = e.target.dataset.field; // 'gross' หรือ 'deduct'
            updateCartItem(rowId, field, e.target.value);
        }
    });

    // ดักลบรายการ
    document.getElementById('cart-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('del-btn')) {
            removeFromCart(e.target.dataset.rowid);
        }
    });

    // ปุ่มชำระเงิน
    document.getElementById('checkout-btn').addEventListener('click', processCheckout);
}

// 4. เพิ่มของลงตะกร้า (สร้าง Unique ID ให้แต่ละบรรทัด เพราะอาจซื้อของชนิดเดียวกัน 2 รอบได้)
function addToCart(itemId) {
    const itemData = globalPrices.find(p => p.item_id === itemId);
    if (!itemData) return;

    const rowId = 'row_' + Date.now(); // สร้าง ID จำลองให้แต่ละบรรทัด
    
    cart.push({
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
    
    // Auto-focus ไปที่ช่องกรอกน้ำหนักล่าสุด
    setTimeout(() => {
        const inputs = document.querySelectorAll(`input[data-rowid="${rowId}"][data-field="gross"]`);
        if (inputs.length > 0) inputs[0].focus();
    }, 50);
}

// 5. วาดตะกร้าใหม่
function renderCart() {
    const container = document.getElementById('cart-container');
    const emptyMsg = document.getElementById('empty-cart-msg');
    
    if (cart.length === 0) {
        emptyMsg.style.display = 'flex';
        // เคลียร์ UI ให้หมด
        const cardElements = container.querySelectorAll('.cart-item-card');
        cardElements.forEach(el => el.remove());
    } else {
        emptyMsg.style.display = 'none';
        
        // วาดเฉพาะสิ่งที่ต้องวาด (วิธีแบบง่าย: วาดใหม่หมด)
        const html = cart.map((c, index) => `
            <div class="cart-item-card bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative">
                <button class="del-btn absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full font-bold shadow-md" data-rowid="${c.rowId}">✕</button>
                
                <div class="flex justify-between items-center mb-3">
                    <span class="font-bold text-lg text-slate-700">${index + 1}. ${c.name}</span>
                    <span class="text-sm text-slate-500">@ ${c.price} ฿/กก.</span>
                </div>
                
                <div class="flex gap-3 mb-2">
                    <div class="flex-1">
                        <label class="text-xs text-slate-500 font-medium">รวม (กก.)</label>
                        <input type="number" step="0.1" data-rowid="${c.rowId}" data-field="gross" value="${c.gross}" class="w-full bg-slate-100 border focus:border-green-400 rounded-lg px-2 py-2 text-lg font-bold text-slate-800 outline-none">
                    </div>
                    <div class="flex-1">
                        <label class="text-xs text-red-400 font-medium">หักขยะ (กก.)</label>
                        <input type="number" step="0.1" data-rowid="${c.rowId}" data-field="deduct" value="${c.deduct}" class="w-full bg-red-50 border focus:border-red-400 rounded-lg px-2 py-2 text-lg font-bold text-red-600 outline-none">
                    </div>
                </div>
                
                <div class="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                    <span class="text-sm font-semibold text-slate-600">สุทธิ: <span id="net-${c.rowId}">${c.net.toFixed(2)}</span> กก.</span>
                    <span class="text-lg font-bold text-green-600">฿ <span id="sub-${c.rowId}">${c.subtotal.toFixed(2)}</span></span>
                </div>
            </div>
        `).join('');
        
        // อัปเดต HTML (ระวัง: การทำ innerHTML แบบนี้จะทำให้สูญเสีย Focus ถ้ายัดลงไปตรงๆ)
        // เพื่อแก้ปัญหาพิมพ์แล้วหลุด Focus เราจะอัปเดต DOM แบบเจาะจงในฟังก์ชัน updateCartItem แทน
        if(container.querySelectorAll('.cart-item-card').length !== cart.length) {
            // ถ้าจำนวนของเปลี่ยน ค่อยวาดใหม่หมด
            container.innerHTML = '<div id="empty-cart-msg" style="display:none;"></div>' + html;
        }
    }
    
    updateTotalSummary();
}

// 6. คำนวณเมื่อมีการพิมพ์ตัวเลข (ไม่กระตุก Focus)
function updateCartItem(rowId, field, value) {
    const itemIndex = cart.findIndex(c => c.rowId === rowId);
    if (itemIndex === -1) return;

    const numVal = parseFloat(value) || 0;
    cart[itemIndex][field] = value; // เก็บเป็น String ก่อนเพื่อกันเวลาพิมพ์ "0."

    // คำนวณ
    const gross = parseFloat(cart[itemIndex].gross) || 0;
    const deduct = parseFloat(cart[itemIndex].deduct) || 0;
    
    cart[itemIndex].net = Math.max(0, gross - deduct); // ห้ามติดลบ
    cart[itemIndex].subtotal = cart[itemIndex].net * cart[itemIndex].price;

    // อัปเดต UI เฉพาะจุดที่เปลี่ยน (DOM Targeted Update) ทำให้พิมพ์ลื่นมาก
    document.getElementById(`net-${rowId}`).innerText = cart[itemIndex].net.toFixed(2);
    document.getElementById(`sub-${rowId}`).innerText = cart[itemIndex].subtotal.toFixed(2);

    updateTotalSummary();
}

function removeFromCart(rowId) {
    cart = cart.filter(c => c.rowId !== rowId);
    renderCart();
}

// 7. สรุปยอดรวมด้านล่างสุด
function updateTotalSummary() {
    let totalWeight = 0;
    let totalAmount = 0;

    cart.forEach(c => {
        totalWeight += c.net;
        totalAmount += c.subtotal;
    });

    document.getElementById('total-weight').innerText = totalWeight.toFixed(2);
    document.getElementById('total-amount').innerText = totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    const btn = document.getElementById('checkout-btn');
    // เปิดปุ่มถ้ามียอดเงิน และของในตะกร้าต้องไม่มีบรรทัดที่น้ำหนักเป็น 0
    const isValid = cart.length > 0 && cart.every(c => c.net > 0);
    btn.disabled = !isValid;
}

// ==========================================
// 🚀 8. CORE LOGIC: การบันทึกข้อมูลลงฐานข้อมูล
// ==========================================
async function processCheckout() {
    const btn = document.getElementById('checkout-btn');
    btn.innerHTML = '⏳ กำลังบันทึก...';
    btn.disabled = true;

    // หาผลรวมยอดบิล
    const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    try {
        // --- STEP 1: สร้างหัวบิล (transactions) ---
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

        // --- STEP 2: บันทึกรายการย่อย (transaction_lines) ---
        // เราใช้ .map แปลงข้อมูล cart เป็นรูปแบบที่ DB ต้องการ
        const linesData = cart.map(c => ({
            transaction_id: txId,
            item_id: c.itemId,
            gross_weight: parseFloat(c.gross),
            deduction_weight: parseFloat(c.deduct) || 0,
            unit_price: c.price
            // net_weight และ subtotal ไม่ต้องส่งไป! เพราะ DB Generate ให้เอง (ตามที่คุณออกแบบ)
        }));

        const { error: linesError } = await supabase.from('transaction_lines').insert(linesData);
        if (linesError) throw new Error('บันทึกรายละเอียดบิลล้มเหลว: ' + linesError.message);

        // --- STEP 3: อัปเดตสต๊อก (inventory_ledger) ---
        // *หมายเหตุสำหรับระดับ Senior: ในระบบจริง ควรดึงยอดยกมา (balance) ล่าสุดก่อน
        // แต่เพื่อความเรียบง่ายในโปรเจกต์นี้ เราจะถือว่า Database จัดการ Sum ให้ตอนดูรายงาน
        // เราจึง Insert เข้าไปแบบตรงๆ
        const inventoryData = cart.map(c => ({
            item_id: c.itemId,
            transaction_id: txId,
            change_weight: c.net, // รับซื้อ ของเข้า = ค่าบวก
            balance_weight: c.net // (จำลอง) ในของจริงต้องไป Query balance เก่ามาบวก
        }));
        await supabase.from('inventory_ledger').insert(inventoryData);

        // --- STEP 4: อัปเดตกระแสเงินสด (cash_flow) ---
        await supabase.from('cash_flow').insert({
            transaction_id: txId,
            amount_in: 0,
            amount_out: grandTotal, // จ่ายเงินออก
            balance: 0 // (จำลอง) ของจริงต้องดึงเงินกะปัจจุบันมาลบ
        });

        // 🟢 บันทึกสำเร็จทั้งหมด!
        alert('✅ บันทึกบิลสำเร็จ!');
        
        // ล้างตะกร้า เตรียมรับบิลใหม่
        cart = [];
        renderCart();
        btn.innerHTML = '💵 บันทึกและจ่ายเงิน';

    } catch (err) {
        console.error(err);
        alert('❌ เกิดข้อผิดพลาด:\n' + err.message);
        btn.innerHTML = '💵 บันทึกและจ่ายเงิน';
        updateTotalSummary(); // เปิดปุ่มคืน
    }
}
