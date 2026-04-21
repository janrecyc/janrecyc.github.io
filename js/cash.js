import { supabase } from './config.js';
import { checkSession } from './auth.js';

let currentUser = null;
let currentBalance = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const { session } = await checkSession();
    if (!session) return location.href = 'login.html';

    currentUser = session.user.id;

    await loadCashData();

    document.getElementById('submit-cash-btn')
        .addEventListener('click', processCashTransaction);
});


// =================
// LOAD DATA
// =================
async function loadCashData() {

    const { data } = await supabase
        .from('cash_flow')
        .select(`amount_in, amount_out, created_at, transactions(type)`)
        .order('created_at', { ascending: false })
        .limit(30);

    const { data: all } = await supabase
        .from('cash_flow')
        .select('amount_in, amount_out');

    currentBalance = all.reduce((s, r) =>
        s + Number(r.amount_in) - Number(r.amount_out), 0);

    document.getElementById('current-balance').innerText =
        currentBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    renderHistory(data);
}


// =================
// RENDER HISTORY
// =================
function renderHistory(rows) {
    const el = document.getElementById('cash-history');

    if (!rows.length) {
        el.innerHTML = `<div class="text-center text-slate-400">ไม่มีข้อมูล</div>`;
        return;
    }

    el.innerHTML = rows.map(r => {

        let color = 'text-red-500';
        let text = 'ซื้อเข้า';

        if (r.transactions.type === 'sell') {
            color = 'text-green-600'; text = 'ขายออก';
        }
        if (r.transactions.type === 'cash_in') {
            color = 'text-blue-600'; text = 'เติมเงิน';
        }
        if (r.transactions.type === 'cash_out') {
            color = 'text-orange-500'; text = 'เบิกเงิน';
        }

        const date = new Date(r.created_at)
            .toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        return `
        <div class="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
            <div>
                <div class="text-xs text-slate-500">${date}</div>
                <div class="${color} font-medium">${text}</div>
            </div>
            <div class="text-right">
                <div class="text-green-600">${r.amount_in ? '+'+r.amount_in : ''}</div>
                <div class="text-red-500">${r.amount_out ? '-'+r.amount_out : ''}</div>
            </div>
        </div>
        `;
    }).join('');
}


// =================
// SAVE
// =================
async function processCashTransaction() {

    const type = document.getElementById('cash-type').value;
    const amount = parseFloat(document.getElementById('cash-amount').value);

    if (!amount || amount <= 0) {
        return showToast('กรอกจำนวนเงิน', true);
    }

    if (type === 'cash_out' && amount > currentBalance) {
        return showToast('เงินไม่พอ', true);
    }

    const btn = document.getElementById('submit-cash-btn');
    btn.disabled = true;
    btn.innerText = 'กำลังบันทึก...';

    try {

        const { data: tx } = await supabase
            .from('transactions')
            .insert({
                type,
                total_amount: amount,
                created_by: currentUser
            })
            .select().single();

        const amtIn = type === 'cash_in' ? amount : 0;
        const amtOut = type === 'cash_out' ? amount : 0;

        await supabase.from('cash_flow').insert({
            transaction_id: tx.id,
            amount_in: amtIn,
            amount_out: amtOut,
            balance: currentBalance + amtIn - amtOut
        });

        showToast('บันทึกสำเร็จ');

        document.getElementById('cash-amount').value = '';

        await loadCashData();

    } catch (err) {
        showToast('error: ' + err.message, true);
    }

    btn.disabled = false;
    btn.innerText = 'บันทึก';
}


// =================
// TOAST
// =================
function showToast(msg, err = false) {
    const t = document.getElementById('toast');
    const m = document.getElementById('toast-msg');

    m.innerText = msg;

    t.classList.remove('opacity-0');

    if (err) t.classList.add('bg-red-600');
    else t.classList.remove('bg-red-600');

    setTimeout(() => t.classList.add('opacity-0'), 2000);
}
