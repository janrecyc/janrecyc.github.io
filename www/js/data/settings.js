/* ============================================================
   data/settings.js — settings page content, grouped into
   SECTIONS (the purple "ฟีเจอร์" / "การเชื่อมต่อ" labels).

   Each section: { title, items: [...] }
   Every row can optionally include `icon` (an inline SVG path
   string, same format as data/nav.js) to show a leading icon.
   Row "type" values (extend components/settings-list.js's
   switch statement if you add a new type):
     - "select":  tap to expand a list of options, one selected
                  at a time (a "radio list" / "single-select list").
                  Needs `id`, `options: [{value, label}]`.
                  Reads/writes its value via `get`/`set` functions
                  you provide, so it can back ANY preference —
                  not just theme.
     - "toggle":  a switch. Needs a unique `id`.
     - "value":   a label + static text on the right (read-only).
     - "link":    a label + chevron, for a future sub-page.

   To add a new section or row later, edit this array only —
   no HTML changes required on settings.html.
   ============================================================ */
const SETTINGS_SECTIONS = [
  {
    title: 'ฟีเจอร์',
    items: [
      {
        type: 'toggle',
        id: 'theme-toggle',
        label: 'โหมดสว่าง/มืด',
        icon: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
        get: () => window.getAppliedTheme() === 'light',
        set: (isOn) => window.setThemePref(isOn ? 'light' : 'dark')
      }

      // Add more feature rows here, e.g.:
      // { type: 'toggle', id: 'low-stock-alert', label: 'แจ้งเตือนสต็อกต่ำ', icon: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>' },
    ]
  }

  // Add more sections here, e.g.:
  // {
  //   title: 'ร้านค้า',
  //   items: [
  //     { type: 'value', label: 'อัปเดตราคาล่าสุด', value: '11 ส.ค. 2569' },
  //   ]
  // },
];
