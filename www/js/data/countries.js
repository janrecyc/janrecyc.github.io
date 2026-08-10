/* ============================================================
   data/countries.js — server/country list shown on country.html.
   Empty for now. When ready, add objects like:
     {
       flag: '🇺🇸',
       name: 'สหรัฐอเมริกา',
       ping: '28 ms',
       tags: ['p2p']            // matches a filter `tag` in
     }                          // data/country-filters.js — omit
                                 // or leave [] if it fits no filter
                                 // besides "ทั้งหมด".
   components/country-list.js renders whatever list it's given —
   no HTML changes needed on country.html.
   ============================================================ */
const COUNTRY_ITEMS = [];
