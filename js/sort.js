// js/sort.js
import { supabase } from './config.js';
import { checkSession } from './auth.js';

let itemsList = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { session } = await checkSession();
    if (!session) return window.location.replace('login.html');

    currentUser = session.user.id;

    await loadItems();
    setupEventListeners();
});

// ==========================
// LOAD ITEMS
// ==========================
async function loadItems() {
    const { data, error } = await supabase
        .from('items')
        .select('id, name')
        .order('name');

    if (error) return showToast('โหลดสินค้าไม่สำเร็จ', true);

    itemsList = data;

    const inputSelect = document.getElementById('input-item');
    inputSelect.innerHTML =
        '<option value="">-- เลือกสินค้า --</option>' +
        itemsList.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
}

// ==========================
// EVENTS
// ==========================
function setupEventListeners() {

    document.getElementById('input-weight')
        .addEventListener('input', calculateWeights);

    document.getElementById('input-item')
        .addEventListener('change', calculateWeights);

    document.getElementById('add-output-btn')
        .addEventListener('click', addOutputRow);

    const container = document.getElementById('output-container');

    container.addEventListener('input', e => {
        if (e.target.classList.contains('out-weight')) calculateWeights();
    });

    container.addEventListener('change', e => {
        if (e.target.classList.contains('out-item')) calculateWeights();
    });

    container.addEventListener('click', e => {
        if (e.target.closest('.del-out-btn')) {
            e.target.closest('.output-row').remove();
            calculateWeights();
        }
    });

    document.getElementById('submit-sort-btn')
        .addEventListener('click', processSortTransaction);
}

// ==========================
// ADD ROW
// ==========================
function addOutputRow() {
    const container = document.getElementById('output-container');

    const options =
        '<option value="">-- เลือกสินค้า --</option>' +
        itemsList.map(i => `<option value="${i.id}">${i.name}</option>`).join('');

    const html = `
        <div class="output-row bg-slate-50 border p-3 rounded-xl flex gap-2 items-center">
            
            <select class="out-item flex-1 bg-white border rounded-lg px-2 py-2">
                ${options}
            </select>

            <input type="number" step="0.1" placeholder="0.00"
                class="out-weight w-24 text-center font-bold text-green-600 bg-white border rounded-lg px-2 py-2">

            <button class="del-out-btn text-red-500 text-lg px-2">✕</button>

        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
}

// ==========================
// CALCULATE
// ==========================
function calculateWeights() {
    const inputWeight = parseFloat(document.getElementById('input-weight').value) || 0;
    const inputItem = document.getElementById('input-item').value;

    let totalOutput = 0;
    let hasEmpty = false;

    document.querySelectorAll('.output-row').forEach(row => {
        const item = row.querySelector('.out-item').value;
        const weight = parseFloat(row.querySelector('.out-weight').value) || 0;

        totalOutput += weight;
        if (!item || weight <= 0) hasEmpty = true;
    });

    const loss = inputWeight - totalOutput;

    // UI
    document.getElementById('total-output-weight').textContent = totalOutput.toFixed(2);

    const lossEl = document.getElementById('loss-weight');
    const lossBox = document.getElementById('loss-container');

    lossEl.textContent = loss.toFixed(2);

    // VALIDATE
    let valid = true;

    if (inputWeight <= 0 || !inputItem) valid = false;
    if (hasEmpty || totalOutput <= 0) valid = false;

    if (totalOutput > inputWeight) {
        valid = false;
        lossBox.classList.remove('bg-slate-100');
        lossBox.classList.add('bg-red-100', 'text-red-600');
        lossEl.textContent = 'เกิน ' + Math.abs(loss).toFixed(2);
    } else {
        lossBox.classList.remove('bg-red-100', 'text-red-600');
        lossBox.classList.add('bg-slate-100');
    }

    document.getElementById('submit-sort-btn').disabled = !valid;
}

// ==========================
// SAVE
// ==========================
async function processSortTransaction() {
    const btn = document.getElementById('submit-sort-btn');

    btn.textContent = 'กำลังบันทึก...';
    btn.disabled = true;

    try {
        const inputItemId = document.getElementById('input-item').value;
        const inputWeight = parseFloat(document.getElementById('input-weight').value);

        const outputs = [];

        document.querySelectorAll('.output-row').forEach(row => {
            outputs.push({
                item_id: row.querySelector('.out-item').value,
                weight: parseFloat(row.querySelector('.out-weight').value)
            });
        });

        // 1. create transaction
        const { data: tx, error: txErr } = await supabase
            .from('transactions')
            .insert({
                type: 'sort',
                total_amount: 0,
                created_by: currentUser,
                status: 'completed'
            })
            .select().single();

        if (txErr) throw txErr;

        // 2. ledger
        const ledger = [];

        ledger.push({
            item_id: inputItemId,
            transaction_id: tx.id,
            change_weight: -Math.abs(inputWeight),
            balance_weight: -Math.abs(inputWeight)
        });

        outputs.forEach(o => {
            ledger.push({
                item_id: o.item_id,
                transaction_id: tx.id,
                change_weight: Math.abs(o.weight),
                balance_weight: Math.abs(o.weight)
            });
        });

        const { error: ledgerErr } = await supabase
            .from('inventory_ledger')
            .insert(ledger);

        if (ledgerErr) throw ledgerErr;

        showToast('บันทึกสำเร็จ');

        // reset
        document.getElementById('input-weight').value = '';
        document.getElementById('input-item').value = '';
        document.getElementById('output-container').innerHTML = '';
        calculateWeights();

    } catch (err) {
        console.error(err);
        showToast('ผิดพลาด', true);
    }

    btn.textContent = '💾 บันทึก';
}

// ==========================
// TOAST
// ==========================
function showToast(msg, err = false) {
    let toast = document.getElementById('toast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded text-white';
        document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.classList.remove('bg-red-600', 'bg-black');
    toast.classList.add(err ? 'bg-red-600' : 'bg-black');

    toast.classList.remove('opacity-0');
    setTimeout(() => toast.classList.add('opacity-0'), 2000);
}
