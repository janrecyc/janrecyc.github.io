/* ============================================================
   components/history-view.js — the "ประวัติการซื้อขาย" tab's real
   content, ported from ScrapPOS's own pages/history.html+history.js.
   Unlike the other 3 shop.html tabs (which just filter SHOP_ITEMS
   through shop-item-list.js — see the note in data/shop-tabs.js),
   this tab has its own data shape (a transaction log, not an
   inventory item) and its own render logic entirely, so shop-page.js
   calls renderHistoryView() directly instead of going through
   shop-item-list.js.

   Reads from ScrapDB's 'transactions' table via localRest()/sbFetch()
   (js/scrap-db/db.js + local-rest.js — same data layer buy/sell/sort
   will eventually write to). Re-fetches every time the tab is
   selected; cheap enough not to need caching across tab switches.

   renderHistoryView(mountId)
   ============================================================ */
async function sbFetch(path, opts = {}) {
  return localRest(path, opts);
}

const HISTORY_TYPE_META = {
  buy:      { icon: 'ph-download-simple', color: '#0A84FF', bg: 'rgba(10,132,255,0.12)', label: 'รับซื้อ' },
  sell:     { icon: 'ph-upload-simple',   color: 'var(--nav-active)', bg: 'rgba(139,123,247,0.12)', label: 'ขายออก' },
  sort:     { icon: 'ph-recycle',         color: '#00B86B', bg: 'rgba(0,184,107,0.12)',  label: 'คัดแยก' },
  deposit:  { icon: 'ph-plus-circle',     color: '#00C853', bg: 'rgba(0,200,83,0.12)',   label: 'เติมเงิน' },
  withdraw: { icon: 'ph-minus-circle',    color: '#FF3B30', bg: 'rgba(255,59,48,0.12)',  label: 'ถอนเงิน' },
};

const HISTORY_FILTERS = [
  { id: 'all',  label: 'ทั้งหมด' },
  { id: 'buy',  label: 'รับซื้อ' },
  { id: 'sell', label: 'ขายออก' },
  { id: 'sort', label: 'คัดแยก' },
  { id: 'cash', label: 'เงินสด' },
];

function renderHistoryView(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  let allTxns = [];
  let activeFilter = 'all';

  function fmtB(n) {
    const v = Number(n || 0);
    return v === Math.floor(v)
      ? v.toLocaleString('th-TH')
      : v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function safeParse(s) {
    try { return s ? JSON.parse(s) : null; } catch (_) { return null; }
  }

  mount.innerHTML = `
    <div class="filter-tabs" id="history-filter-mount"></div>
    <div id="history-timeline"></div>

    <!-- Detail sheet — fixed-position overlay, position in the DOM tree
         doesn't affect how it renders, so it just lives at the end of
         this tab's own markup. -->
    <div class="hd-backdrop" id="hd-backdrop"></div>
    <div class="hd-sheet" id="hd-sheet">
      <div class="hd-handle-row"><div class="hd-handle"></div></div>
      <div class="hd-hero">
        <div class="hd-icon" id="hd-icon"></div>
        <div class="hd-title" id="hd-title">—</div>
        <div class="hd-date" id="hd-date">—</div>
        <div class="hd-amt" id="hd-amt">—</div>
      </div>
      <div class="hd-body" id="hd-body"></div>
      <button class="hd-close-btn" id="hd-close-btn">ปิด</button>
    </div>
  `;

  const backdrop = mount.querySelector('#hd-backdrop');
  const sheet = mount.querySelector('#hd-sheet');
  backdrop.addEventListener('click', closeDetail);
  mount.querySelector('#hd-close-btn').addEventListener('click', closeDetail);

  function closeDetail() {
    backdrop.classList.remove('show');
    sheet.classList.remove('show');
    document.body.style.overflow = '';
  }

  function openDetail(id) {
    const t = allTxns.find(x => Number(x.id) === Number(id));
    if (!t) return;
    const meta = HISTORY_TYPE_META[t.type] || HISTORY_TYPE_META.buy;
    const lines = safeParse(t.lines);

    const dateStr = new Date(t.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    let bodyHtml = '';
    if (t.type === 'buy' || t.type === 'sell') {
      const arr = Array.isArray(lines) ? lines : [];
      const factoryHtml = (t.type === 'sell' && t.factory_name)
        ? `<div class="hd-factory"><i class="ph ph-factory"></i> ${esc(t.factory_name)}</div>` : '';
      bodyHtml = factoryHtml + arr.map(l => `
        <div class="hd-line">
          <div class="hd-line-left">
            <div class="hd-line-name">${esc(l.item_name)}</div>
            <div class="hd-line-detail">${fmtB(l.qty)} ${esc(l.unit_label || (l.mode === 'kg' ? 'กก.' : 'ชิ้น'))} × ฿${fmtB(l.price)}</div>
          </div>
          <div class="hd-line-amt">฿${fmtB(l.subtotal)}</div>
        </div>`).join('');
    } else if (t.type === 'sort') {
      const from = (lines && lines.from) || {};
      const results = (lines && lines.results) || [];
      bodyHtml = `
        <div class="hd-sort-from"><i class="ph ph-arrow-fat-line-down"></i> จาก: <b>${esc(from.name || '—')}</b> ${fmtB(from.kg || 0)} กก.</div>
        ${results.map(r => `
          <div class="hd-line">
            <div class="hd-line-left">
              <div class="hd-line-name"><i class="ph ph-arrow-elbow-down-right"></i> ${esc(r.item_name || '—')}</div>
            </div>
            <div class="hd-line-amt">${fmtB(r.kg)} กก.</div>
          </div>`).join('')}`;
    } else {
      bodyHtml = `<div class="hd-note">${esc(t.factory_name || (t.type === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน'))}</div>`;
    }

    const iconEl = mount.querySelector('#hd-icon');
    iconEl.style.background = meta.bg;
    iconEl.style.color = meta.color;
    iconEl.innerHTML = `<i class="ph ${meta.icon}"></i>`;
    mount.querySelector('#hd-title').textContent = meta.label;
    mount.querySelector('#hd-date').textContent = `${dateStr} • ${timeStr} น.`;
    mount.querySelector('#hd-amt').textContent =
      t.type === 'sort' ? `${fmtB(t.total_kg || 0)} กก.` : `฿${fmtB(t.total_amount)}`;
    mount.querySelector('#hd-amt').className = 'hd-amt ' + (t.type === 'sell' || t.type === 'deposit' ? 'plus' : t.type === 'sort' ? 'neutral' : 'minus');
    mount.querySelector('#hd-body').innerHTML = bodyHtml;

    backdrop.classList.add('show');
    sheet.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function summarize(t) {
    const time = new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const lines = safeParse(t.lines);

    if (t.type === 'buy' || t.type === 'sell') {
      const arr = Array.isArray(lines) ? lines : [];
      const names = arr.map(l => l.item_name).filter(Boolean);
      const nameStr = names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
      const kgStr = t.total_kg ? ` • ${fmtB(t.total_kg)} กก.` : '';
      const title = t.type === 'buy'
        ? `รับซื้อ ${arr.length} รายการ`
        : `ส่งขาย${t.factory_name ? ' — ' + t.factory_name : ''}`;
      return { title, sub: `${nameStr}${kgStr} • ${time} น.` };
    }
    if (t.type === 'sort') {
      const from = (lines && lines.from) || {};
      const results = (lines && lines.results) || [];
      const title = `คัดแยก${from.name ? ' — ' + from.name : ''}`;
      return { title, sub: `แยกเป็น ${results.length} รายการ • ${fmtB(t.total_kg || 0)} กก. • ${time} น.` };
    }
    const title = t.factory_name || (t.type === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน');
    return { title, sub: `${time} น.` };
  }

  function renderRow(t) {
    const meta = HISTORY_TYPE_META[t.type] || HISTORY_TYPE_META.buy;
    const { title, sub } = summarize(t);

    let amtHtml;
    if (t.type === 'sort') {
      amtHtml = `<div class="txn-amt neutral">${fmtB(t.total_kg || 0)} กก.</div>`;
    } else {
      const isPlus = t.type === 'sell' || t.type === 'deposit';
      amtHtml = `<div class="txn-amt ${isPlus ? 'plus' : 'minus'}">${isPlus ? '+' : '−'}฿${fmtB(t.total_amount)}</div>`;
    }

    return `
      <div class="txn-row" data-txn-id="${t.id}">
        <div class="txn-icon" style="background:${meta.bg};color:${meta.color};"><i class="ph ${meta.icon}"></i></div>
        <div class="txn-info">
          <div class="txn-title">${esc(title)}</div>
          <div class="txn-sub">${esc(sub)}</div>
        </div>
        ${amtHtml}
      </div>`;
  }

  function renderTimeline() {
    const wrap = mount.querySelector('#history-timeline');
    const rows = activeFilter === 'all'  ? allTxns
               : activeFilter === 'cash' ? allTxns.filter(t => t.type === 'deposit' || t.type === 'withdraw')
               : allTxns.filter(t => t.type === activeFilter);

    if (!rows.length) {
      wrap.innerHTML = `<div class="empty-state">ไม่พบรายการที่ตรงกับเงื่อนไข</div>`;
      return;
    }

    const groups = [];
    let lastKey = null;
    for (const t of rows) {
      const key = new Date(t.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
      if (key !== lastKey) { groups.push({ key, items: [] }); lastKey = key; }
      groups[groups.length - 1].items.push(t);
    }

    wrap.innerHTML = groups.map(g => `
      <div class="txn-date-header">${g.key}</div>
      <div class="section-rows" style="display:flex; flex-direction:column; gap:8px;">
        ${g.items.map(renderRow).join('')}
      </div>
    `).join('');

    wrap.querySelectorAll('.txn-row').forEach(row => {
      row.addEventListener('click', () => openDetail(row.dataset.txnId));
    });
  }

  function selectFilter(filterId) {
    activeFilter = filterId;
    renderTabFilter(HISTORY_FILTERS, activeFilter, 'history-filter-mount', selectFilter);
    renderTimeline();
  }

  renderTabFilter(HISTORY_FILTERS, activeFilter, 'history-filter-mount', selectFilter);

  mount.querySelector('#history-timeline').innerHTML = `<div class="tl-loading"><i class="ph ph-spinner-gap spin"></i> กำลังโหลด...</div>`;
  sbFetch('transactions?select=id,type,total_amount,total_kg,factory_name,lines,created_at&order=created_at.desc')
    .then(rows => {
      allTxns = rows || [];
      renderTimeline();
    })
    .catch(err => {
      console.error('history-view: failed to load transactions', err);
      mount.querySelector('#history-timeline').innerHTML = `<div class="empty-state">โหลดข้อมูลไม่สำเร็จ</div>`;
    });
}
