/* ============================================================
   data/country-filters.js — the filter chips above the country
   list (ทั้งหมด / Secure Core / P2P / Tor). Each filter's `tag`
   must match a value inside a country item's `tags: []` array
   in data/countries.js — 'all' is special-cased to skip filtering.

   To add a 5th filter chip later: add one object here, then start
   tagging countries with its `tag` in data/countries.js. No HTML
   or component changes needed.
   ============================================================ */
const COUNTRY_FILTERS = [
  { id: 'all', label: 'ทั้งหมด', tag: null },
  { id: 'secure-core', label: 'Secure Core', tag: 'secure-core' },
  { id: 'p2p', label: 'P2P', tag: 'p2p' },
  { id: 'tor', label: 'Tor', tag: 'tor' }
];
