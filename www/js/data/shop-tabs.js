/* ============================================================
   data/shop-tabs.js — the filter chips above the shop item list
   (รับซื้อ / ขายออก / คัดแยก / ประวัติการซื้อขาย). Each tab's `tag`
   must match a value inside a shop item's `tags: []` array in
   data/shop-items.js — 'buy-in' is special-cased (tag: null) to
   skip filtering, i.e. it shows every item ("รับซื้อ" is the
   default/all view, replacing the old "ทั้งหมด").

   NOTE on "ประวัติการซื้อขาย" (history): this one now has its own
   real data shape + render path — pages/history-tab.js, wired in
   by pages/shop-page.js's tab router — instead of going through
   shop-item-list.js like the other 3. Its `tag: 'history'` here is
   unused (shop-page.js checks `id === 'history'` before ever
   consulting `tag`), kept only so this array stays a uniform shape.

   To add a 5th tab later: add one object here, then either start
   tagging items with its `tag` in data/shop-items.js (item-list
   style), or give it its own pages/<name>-tab.js like history's,
   and check for its `id` in shop-page.js's applyView(). No HTML
   changes needed either way.
   ============================================================ */
const SHOP_TABS = [
  { id: 'buy-in', label: 'รับซื้อ', tag: null },
  { id: 'sell-out', label: 'ขายออก', tag: 'sell-out' },
  { id: 'sorting', label: 'คัดแยก', tag: 'sorting' },
  { id: 'history', label: 'ประวัติการซื้อขาย', tag: 'history' }
];
