import { supabase } from './config.js';
import { checkSession } from './auth.js';

let chart;

document.addEventListener('DOMContentLoaded', async () => {
    const { session } = await checkSession();
    if (!session) return location.href = 'login.html';

    setDate();
    await loadSummary();
    await loadChart();
});


// =================
// DATE
// =================
function setDate() {
    const now = new Date();
    document.getElementById('date-display').innerText =
        now.toLocaleDateString('th-TH', { dateStyle: 'full' });
}


// =================
// SUMMARY
// =================
async function loadSummary() {

    const today = new Date();
    today.setHours(0,0,0,0);

    const { data } = await supabase
        .from('transactions')
        .select('type, total_amount, created_at');

    let buy = 0;
    let sell = 0;

    data.forEach(t => {
        const d = new Date(t.created_at);

        if (d >= today) {
            if (t.type === 'buy') buy += Number(t.total_amount);
            if (t.type === 'sell') sell += Number(t.total_amount);
        }
    });

    document.getElementById('today-buy').innerText =
        buy.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    document.getElementById('today-sell').innerText =
        sell.toLocaleString('th-TH', { minimumFractionDigits: 2 });

    // cash
    const { data: cash } = await supabase
        .from('cash_flow')
        .select('amount_in, amount_out');

    const balance = cash.reduce((s, r) =>
        s + Number(r.amount_in) - Number(r.amount_out), 0);

    document.getElementById('drawer-cash').innerText =
        balance.toLocaleString('th-TH', { minimumFractionDigits: 2 });
}


// =================
// CHART 7 DAYS
// =================
async function loadChart() {

    const { data } = await supabase
        .from('transactions')
        .select('type, total_amount, created_at');

    const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().slice(0,10);
    }).reverse();

    const values = days.map(day => {
        return data
            .filter(t => t.type === 'buy' && t.created_at.startsWith(day))
            .reduce((s, r) => s + Number(r.total_amount), 0);
    });

    const ctx = document.getElementById('buyChart');

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days.map(d => d.slice(5)),
            datasets: [{
                label: 'ยอดซื้อ',
                data: values,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}
