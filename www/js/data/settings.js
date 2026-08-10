/* ============================================================
   data/settings.js — rows shown on the settings page.
   Supported row "type" values (extend components/settings-list.js
   if you add a new type):
     - "toggle": a switch. Needs a unique `id` so JS can bind to it.
     - "value":  a label + static text on the right (read-only).
     - "link":   a label + chevron, for future sub-pages.

   To add a new setting later, just add an object to this array —
   no HTML changes required on settings.html.
   ============================================================ */
const SETTINGS_ITEMS = [
  { type: 'toggle', id: 'theme-switch', label: 'โหมดสว่าง/มืด' }

  // Examples for future items — uncomment / edit when ready:
  // { type: 'value', label: 'โปรโตคอล', value: 'อัตโนมัติ' },
  // { type: 'link',  id: 'about-link', label: 'เกี่ยวกับ' },
];
