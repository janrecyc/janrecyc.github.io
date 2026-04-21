// js/sell.js
import { supabase } from './config.js';
import { checkSession } from './auth.js';
import { renderSidebar } from '../components/sidebar.js';

let itemsList = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { session } = await checkSession();
    if (!session) return window.location.replace('login.html');
    currentUser = session.user.id;

    renderSidebar('sidebar-container');

    await loadItemsAndPrices();
    setupEventListeners();
});


// =======================
// โหลดสินค้า + ราคา
// =======================
async function loadItemsAndPrices() {
    const { data, error } = await supabase
        .from('prices')
        .select(`
            item_id,
            sell_price,
            items (id, name)
        `)
        .order('items(name)', { ascending: true });

    if (error) {
        showToast('โหลดข้อมูลล้มเหลว', true);
        return;
    }

    itemsList = data;

    const select = document.getElementById('item-select');
    select.innerHTML =
        '<option value="">-- เลือกสินค้า --</option>' +
        itemsList.map(p => `
            <option value="${p.item_id}">
                ${p.items.name}
            </option>
        `).join('');
}


// =======================
// Event ต่างๆ
// =======================
function setupEventListeners() {

    // น้ำหนัก
    document.getElementById('gross-weight').addEventListener('input', calculate);
    document.getElementById('tare-weight').addEventListener('input', calculate);

    // เลือกสินค้า
    document.getElementById('item-select').addEventListener('change', (e) => {
        const itemId = e.target.value;
        const item = itemsList.find(i => i.item_id === itemId);

        if (item && !isPending()) {
            document.getElementById('unit-price').value = item.sell_price;
        }

        calculate();
    });

    // แก้ราคา
    document.getElementById('unit-price').addEventListener('input', calculate);

    // รอราคา
    document.getElementById('pending-price-cb').addEventListener('change', togglePendingPrice);

    // save
    document.getElementById('save-btn').addEventListener('click', processSellTransaction);
}


// =======================
// Toggle รอราคา
// =======================
function togglePendingPrice(e) {
    const checked = e.target.checked;
    const priceInput = document.getElementById('unit-price');
    const total = document.getElementById('total-amount');

    if (checked) {
        priceInput.value = 0;
        priceInput.disabled = true;
        priceInput.classList.add('opacity-50', 'bg-slate-200');

        total.innerText = 'รอราคา';
        total.classList.replace('text-slate-800', 'text-amber-500');
    } else {
        priceInput.disabled = false;
        priceInput.classList.remove('opacity-50', 'bg-slate-200');

        total.classList.replace('text-amber-500', 'text-slate-800');

        // โหลดราคากลับ
        const itemId = document.getElementById('item-select').value;
        const item = itemsList.find(i => i.item_id === itemId);
        if (item) priceInput.value = item.sell_price;
    }

    calculate();
}

function isPending() {
    return document.getElementById('pending-price-cb').checked;
}


// =======================
// คำนวณ
// =======================
function calculate() {
    const gross = parseFloat(document.getElementById('gross-weight').value) || 0;
    const tare = parseFloat(document.getElementById('tare-weight').value) || 0;
    const price = parseFloat(document.getElementById('unit-price').value) || 0;

    const net = Math.max(0, gross - tare);

    document.getElementById('net-weight').innerText =
        net.toLocaleString('th-TH');

    let total = 0;

    if (!isPending()) {
        total = net * price;

        document.getElementById('total-amount').innerText =
            total.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    }

    // enable ปุ่ม
    const itemId = document.getElementById('item-select').value;
    const btn = document.getElementById('save-btn');

    btn.disabled = !(itemId && net > 0);
}


// =======================
// บันทึกข้อมูล
// =======================
async function processSellTransaction() {
    const btn = document.getElementById('save-btn');

    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-spinner-gap animate-spin"></i> กำลังบันทึก...`;

    try {
        const itemId = document.getElementById('item-select').value;
        const gross = parseFloat(document.getElementById('gross-weight').value);
        const tare = parseFloat(document.getElementById('tare-weight').value);
        const net = gross - tare;

        const pending = isPending();
        const price = pending ? 0 : parseFloat(document.getElementById('unit-price').value);
        const total = pending ? 0 : net * price;

        // 1. transaction
        const { data: tx, error: txError } = await supabase
            .from('transactions')
            .insert({
                type: 'sell',
                total_amount: total,
                created_by: currentUser,
                status: 'completed'
            })
            .select()
            .single();

        if (txError) throw txError;

        // 2. line
        const { error: lineError } = await supabase
            .from('transaction_lines')
            .insert({
                transaction_id: tx.id,
                item_id: itemId,
                gross_weight: gross,
                deduction_weight: tare,
                unit_price: price
            });

        if (lineError) throw lineError;

        // 3. stock
        const { error: ledgerError } = await supabase
            .from('inventory_ledger')
            .insert({
                item_id: itemId,
                transaction_id: tx.id,
                change_weight: -net,
                balance_weight: -net
            });

        if (ledgerError) throw ledgerError;

        // 4. cash
        if (!pending && total > 0) {
            await supabase.from('cash_flow').insert({
                transaction_id: tx.id,
                amount_in: total,
                amount_out: 0,
                balance: 0
            });
        }

        showToast('บันทึกสำเร็จ');

        setTimeout(() => {
            if (confirm('พิมพ์ตั๋วเลยไหม?')) window.print();
            window.location.reload();
        }, 800);

    } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาด: ' + err.message, true);

        btn.disabled = false;
        btn.innerHTML = '💾 บันทึกการขาย (ตัดสต๊อก)';
    }
}


// =======================
// Toast
// =======================
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toast-msg');

    text.innerText = msg;

    toast.classList.remove('opacity-0', 'translate-y-10');

    if (isError) {
        toast.classList.add('bg-red-600');
        toast.classList.remove('bg-slate-800');
    } else {
        toast.classList.add('bg-slate-800');
        toast.classList.remove('bg-red-600');
    }

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-10');
    }, 2500);
}
