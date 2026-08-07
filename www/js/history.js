function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' +
         d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

async function loadHistory() {
  const listEl = document.getElementById('tx-list');
  try {
    const txs = await DB.getAllTransactions();
    const buyTotal = txs.filter(t => t.type === 'buy').reduce((s, t) => s + t.total, 0);
    const sellTotal = txs.filter(t => t.type === 'sell').reduce((s, t) => s + t.total, 0);
    document.getElementById('sum-buy').textContent = formatMoney(buyTotal);
    document.getElementById('sum-sell').textContent = formatMoney(sellTotal);

    if (!txs.length) {
      listEl.innerHTML = '<div class="empty-state">ยังไม่มีรายการ</div>';
      return;
    }
    listEl.innerHTML = txs.map(t => `
      <div class="tx-row" data-id="${t.id}">
        <div class="left">
          <span class="type ${t.type}">${t.type === 'buy' ? 'รับซื้อ' : 'ขายออก'}</span>
          <div class="name">${escapeHtml(t.item_name)}</div>
          <div class="meta">${formatQty(t.qty)} × ${formatMoney(t.price_per_unit)}</div>
        </div>
        <div class="right">
          <div class="amt">${formatMoney(t.total)}</div>
          <div class="time">${fmtTime(t.created_at)}</div>
        </div>
        <button class="del" data-del="${t.id}">✕</button>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('ลบรายการนี้?')) return;
        await DB.deleteTransaction(Number(btn.dataset.del));
        toast('ลบแล้ว');
        loadHistory();
      };
    });
  } catch (e) {
    console.error(e);
    listEl.innerHTML = `<div class="empty-state">โหลดข้อมูลไม่สำเร็จ: ${escapeHtml(e.message)}</div>`;
  }
}

loadHistory();
