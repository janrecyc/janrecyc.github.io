/* ============================================================
   data/shop-tabs.js — the filter chips above the shop item list
   (รับซื้อ / ขายออก / คัดแยก / ประวัติการซื้อขาย). Each tab's `tag`
   must match a value inside a shop item's `tags: []` array in
   data/shop-items.js — 'buy-in' is special-cased (tag: null) to
   skip filtering, i.e. it shows every item ("รับซื้อ" is the
   default/all view, replacing the old "ทั้งหมด").

   NOTE on "ประวัติการซื้อขาย" (history): right now it's wired the
   same way as the other 3 — just another tag filtering the same
   item list. In the real app this will likely need its own data
   shape (a transaction log: date, customer, amount — not an
   inventory item), so when you build it for real, give it its
   own data file (e.g. data/transactions.js) and its own render
   function instead of forcing it through shop-item-list.js.

   To add a 5th tab later: add one object here, then start tagging
   items with its `tag` in data/shop-items.js. No HTML or other
   component changes needed.
   ============================================================ */
const SHOP_TABS = [
  { id: 'buy-in', label: 'รับซื้อ', tag: null },
  { id: 'sell-out', label: 'ขายออก', tag: 'sell-out' },
  { id: 'sorting', label: 'คัดแยก', tag: 'sorting' },
  { id: 'history', label: 'ประวัติการซื้อขาย', tag: 'history' }
];
