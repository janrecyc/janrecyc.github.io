/* ============================================================
   data/shop-items.js — the list of scrap/recyclable materials
   shown on shop.html. Empty for now. When ready, add objects like:
     {
       icon: '🔩',
       name: 'เหล็ก',
       price: '12',
       unit: 'บาท/กก.',
       tags: ['sell-out']        // matches a tab `tag` in
     }                           // data/shop-tabs.js — omit or
                                  // leave [] if it only belongs
                                  // in "รับซื้อ" (the default tab).
   components/shop-item-list.js renders whatever list it's given —
   no HTML changes needed on shop.html.
   ============================================================ */
const SHOP_ITEMS = [];
