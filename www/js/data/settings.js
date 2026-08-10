/* ============================================================
   data/settings.js — settings page content, grouped into
   SECTIONS (the purple "ฟีเจอร์" / "การเชื่อมต่อ" labels).

   Each section: { title, items: [...] }
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
        get: () => window.getThemePref() === 'light',
        set: (isOn) => window.setThemePref(isOn ? 'light' : 'dark')
      }

      // Add more feature rows here, e.g.:
      // { type: 'toggle', id: 'netshield', label: 'NetShield' },
    ]
  }

  // Add more sections here, e.g.:
  // {
  //   title: 'การเชื่อมต่อ',
  //   items: [
  //     { type: 'value', label: 'โปรโตคอล', value: 'Smart (auto)' },
  //   ]
  // },
];
