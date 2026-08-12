/* ============================================================
   data/profile.js — content for profile.html.

   CURRENT_USER: the logged-in employee shown at the top of the
   page (avatar + name + role). Placeholder values in [ ] — wire
   this up to real auth/session data once that exists.

   PROFILE_SECTIONS: same shape as data/settings.js (sections of
   rows, same row `type`s: select/toggle/value/link), rendered by
   the same components/section-list.js — see that file's own
   comment for what each `type` does.

   ⚠️ SCAFFOLD STATUS (same caveats as data/settings.js):
     - "value" rows below show static placeholder numbers/text —
       wire them to real per-employee stats once they exist.
     - "link" rows (เปลี่ยนรหัสผ่าน, สลับบัญชี/สลับกะ, ออกจากระบบ)
       don't do anything yet — components/section-list.js doesn't
       attach click handlers to `.is-link` rows. Add that once
       there's a real auth flow to call.

   To add a new profile section or row later, edit this array
   only — no HTML changes required on profile.html.
   ============================================================ */
const CURRENT_USER = {
  name: '[ชื่อพนักงาน]',
  role: '[ตำแหน่ง เช่น เจ้าของร้าน/พนักงานชั่ง]',
  // Shown inside the avatar circle until there's a real photo.
  avatarIcon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>'
};

const PROFILE_SECTIONS = [
  {
    title: 'สรุปผลงานวันนี้',
    items: [
      {
        type: 'value',
        id: 'today-buy-in',
        label: 'รับซื้อวันนี้',
        icon: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
        value: '0 บาท'
      },
      {
        type: 'value',
        id: 'today-sell-out',
        label: 'ขายออกวันนี้',
        icon: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
        value: '0 บาท'
      },
      {
        type: 'value',
        id: 'today-count',
        label: 'จำนวนรายการวันนี้',
        icon: '<path d="M6 2h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6"/>',
        value: '0 รายการ'
      }
    ]
  },

  {
    title: 'สิทธิ์การใช้งาน',
    items: [
      {
        type: 'value',
        id: 'perm-edit-price',
        label: 'แก้ไขราคาได้',
        icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
        value: '—' // placeholder until a real permissions system exists
      },
      {
        type: 'value',
        id: 'perm-view-reports',
        label: 'ดูรายงานได้',
        icon: '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>',
        value: '—'
      }
    ]
  },

  {
    title: 'บัญชี',
    items: [
      {
        type: 'link',
        id: 'change-password',
        label: 'เปลี่ยนรหัสผ่าน',
        icon: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
      },
      {
        type: 'link',
        id: 'switch-account',
        label: 'สลับบัญชี/สลับกะ',
        icon: '<path d="M17 2l4 4-4 4"/><path d="M3 12v-2a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 12v2a4 4 0 0 1-4 4H3"/>'
      },
      {
        type: 'link',
        id: 'logout',
        label: 'ออกจากระบบ',
        icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'
      }
    ]
  }
];
