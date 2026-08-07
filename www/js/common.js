function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 2000);
}

function formatMoney(n) {
  return '฿' + Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty(n) {
  return Number(n).toLocaleString('th-TH', { maximumFractionDigits: 2 });
}
