/* ============================================================
   data/shop-tabs.js — the filter chips above the shop item list
   (รับซื้อ / ขายออก / คัดแยก / ประวัติการซื้อขาย). Each tab's `tag`
   must match a value inside a shop item's `tags: []` array in
   data/shop-items.js — used only by the 2 tabs still going through
   shop-item-list.js (see NOTE below).

   NOTE: "รับซื้อ", "ขายออก" and "ประวัติการซื้อขาย" now each have
   their own real data shape + render path — pages/buy-tab.js,
   pages/sell-tab.js and pages/history-tab.js respectively, wired
   in by pages/shop-page.js's SPECIAL_TABS router — instead of
   going through shop-item-list.js like "คัดแยก" still does. Their
   `tag` values here (null / 'sell-out' / 'history') are unused
   for those three, kept only so this array stays a uniform shape.

   To add a 5th tab later: add one object here, then either start
   tagging items with its `tag` in data/shop-items.js (item-list
   style), or give it its own pages/<name>-tab.js like buy/history's,
   and add it to shop-page.js's SPECIAL_TABS map. No HTML changes
   needed either way.
   ============================================================ */
const SHOP_TABS = [
  { id: 'buy-in', label: 'รับซื้อ', tag: null },
  { id: 'sell-out', label: 'ขายออก', tag: 'sell-out' },
  { id: 'sorting', label: 'คัดแยก', tag: 'sorting' },
  { id: 'history', label: 'ประวัติการซื้อขาย', tag: 'history' }
];
