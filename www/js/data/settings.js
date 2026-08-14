/* ============================================================
   data/settings.js — settings page content, grouped into
   SECTIONS (the purple section-title labels like "ฟีเจอร์").

   Each section: { title, items: [...] }
   Every row can optionally include `icon` (an inline SVG path
   string, same format as data/nav.js) to show a leading icon —
   every row below has one.

   Row "type" values (extend components/section-list.js's
   switch statement if you add a new type):
     - "select":  tap to expand a list of options, one selected
                  at a time (a "radio list" / "single-select list").
                  Needs `id`, `options: [{value, label}]`.
                  Reads/writes its value via `get`/`set` functions
                  you provide, so it can back ANY preference —
                  not just theme.
     - "toggle":  a switch. Needs a unique `id`, `get`/`set`.
     - "value":   a label + static text on the right (read-only).
     - "link":    a label + chevron, for a future sub-page.

   ⚠️ SCAFFOLD STATUS: everything below "ธีม" is a placeholder —
   rows render and look right, but most aren't backed by real
   data or navigation yet:
     - "select" rows below have no `get`/`set`, so they fall back
       to a plain `value` on the item and LOOK like they save (the
       checkmark updates live), but nothing persists after reload.
       Wire real `get`/`set` (like theme-toggle does) once there's
       somewhere real to store the setting.
     - "link" rows don't navigate anywhere yet — components/
       section-list.js doesn't attach a click handler to
       `.is-link` rows at all yet. When real sub-pages exist,
       add a click listener there keyed off `item.id`
       (e.g. `location.href = item.href`), and give each link
       item below an `href` (or an `onSelect` callback).
     - "value" rows show static placeholder text.

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
        label: 'ธีม',
        icon: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>',
        get: () => window.getAppliedTheme() === 'light',
        set: (isOn) => window.setThemePref(isOn ? 'light' : 'dark')
      }

      // Add more feature rows here, e.g.:
      // { type: 'toggle', id: 'low-stock-alert', label: 'แจ้งเตือนสต็อกต่ำ', icon: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>' },
    ]
  },

  {
    title: 'ร้านค้า/ธุรกิจ',
    items: [
      {
        type: 'link',
        id: 'shop-name',
        label: 'ชื่อร้าน',
        icon: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>'
      },
      {
        type: 'link',
        id: 'shop-address',
        label: 'ที่อยู่ร้าน',
        icon: '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'
      },
      {
        type: 'link',
        id: 'shop-phone',
        label: 'เบอร์โทรร้าน',
        icon: '<path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L7.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2.1z"/>'
      },
      {
        type: 'link',
        id: 'shop-logo',
        label: 'โลโก้ร้าน',
        icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/>'
      },
      {
        type: 'select',
        id: 'weight-unit',
        label: 'หน่วยชั่งน้ำหนักเริ่มต้น',
        icon: '<path d="M12 3v18"/><path d="m7 7-4 8a4 4 0 0 0 8 0z"/><path d="m17 7 4 8a4 4 0 0 1-8 0z"/><path d="M5 7h14"/><path d="M9 3h6"/>',
        value: 'kg', // fallback storage until real get/set is wired
        options: [
          { value: 'kg', label: 'กิโลกรัม (กก.)' },
          { value: 'khit', label: 'ขีด' }
        ]
      },
      {
        type: 'select',
        id: 'price-rounding',
        label: 'การปัดเศษราคา',
        icon: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
        value: 'none',
        options: [
          { value: 'none', label: 'ไม่ปัดเศษ' },
          { value: 'up', label: 'ปัดขึ้น' },
          { value: 'down', label: 'ปัดลง' }
        ]
      }
    ]
  },

  {
    title: 'ราคาและสินค้า',
    items: [
      {
        type: 'link',
        id: 'manage-prices',
        label: 'จัดการราคารับซื้อ/ขายออก',
        icon: '<path d="M12 2H2v10l10.5 10.5a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8L12 2z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>'
      },
      {
        type: 'link',
        id: 'price-history',
        label: 'ประวัติการเปลี่ยนราคา',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'
      },
      {
        type: 'link',
        id: 'item-categories',
        label: 'หมวดหมู่สินค้า',
        icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
      }
    ]
  },

  {
    title: 'ข้อมูล/สำรองข้อมูล',
    items: [
      {
        type: 'link',
        id: 'backup-data',
        label: 'สำรองข้อมูล',
        icon: '<path d="M7 18a5 5 0 0 1-1-9.9 6 6 0 0 1 11.5-2A5.5 5.5 0 0 1 18 18"/><path d="M12 12v7"/><path d="m9 15 3-3 3 3"/>'
      },
      {
        type: 'link',
        id: 'restore-data',
        label: 'กู้คืนข้อมูล',
        icon: '<path d="M7 18a5 5 0 0 1-1-9.9 6 6 0 0 1 11.5-2A5.5 5.5 0 0 1 18 18"/><path d="M12 12v7"/><path d="m9 16 3 3 3-3"/>'
      },
      {
        type: 'link',
        id: 'export-data',
        label: 'ส่งออกเป็น Excel/CSV',
        icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9.5 15.5 2.5 2.5 2.5-2.5"/>'
      },
      {
        type: 'link',
        id: 'clear-test-data',
        label: 'ล้างข้อมูลทดสอบ',
        icon: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>'
      }
    ]
  },

  {
    title: 'เกี่ยวกับแอพ',
    items: [
      {
        type: 'value',
        id: 'app-version',
        label: 'เวอร์ชันแอพ',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
        // APP_VERSION is generated fresh by the CI workflow (see
        // .github/workflows/build.yml → "Write app version into web
        // assets") and matches the real Android versionName exactly —
        // never edit this value by hand, it'll just get overwritten
        // (and go stale) on the next build.
        get: () => (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.0.0-dev')
      },
      {
        type: 'link',
        id: 'privacy-policy',
        label: 'นโยบายความเป็นส่วนตัว',
        icon: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/>'
      },
      {
        type: 'link',
        id: 'terms-of-service',
        label: 'ข้อกำหนดการใช้งาน',
        icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>'
      },
      {
        type: 'link',
        id: 'contact-support',
        label: 'ติดต่อ/สนับสนุน',
        icon: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'
      }
    ]
  },

  {
    title: 'บัญชี',
    items: [
      {
        type: 'link',
        id: 'change-pin',
        label: 'เปลี่ยน PIN',
        icon: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        onSelect: () => { location.href = 'change-pin.html'; }
      },
      {
        type: 'link',
        id: 'manage-users',
        label: 'จัดการผู้ใช้งาน',
        icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 8a3 3 0 1 1 4 2.83"/><path d="M16 20c0-2.5 1.5-4.5 4-5"/>',
        onSelect: () => { location.href = 'manage-users.html'; }
      },
      {
        type: 'toggle',
        id: 'require-login',
        label: 'เปิดใช้งานการเข้าสู่ระบบ',
        icon: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/>',
        // ผูกกับระบบ auth จริงแล้ว (js/auth/session.js) — ค่านี้เก็บถาวร
        // ใน localStorage ของเครื่อง ไม่ใช่แค่ fallback ในหน่วยความจำอีกต่อไป
        get: () => window.AuthSession.isLoginRequired(),
        set: (isOn) => window.AuthSession.setLoginRequired(isOn)
      },
      {
        type: 'link',
        id: 'logout',
        label: 'ออกจากระบบ',
        icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
        onSelect: () => {
          window.AuthSession.clearSession();
          location.href = 'login.html';
        }
      }
    ]
  }
];
