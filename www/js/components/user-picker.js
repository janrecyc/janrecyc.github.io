/* ============================================================
   components/user-picker.js — renders one button per active user
   (avatar + name) into a mount element. Tapping a button calls
   onSelectUser(user) — no text input anywhere on this screen.
   ============================================================ */
async function renderUserPicker(mountId, onSelectUser) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  mount.innerHTML = '<div class="empty-state">กำลังโหลดรายชื่อผู้ใช้งาน...</div>';

  let users;
  try {
    users = await AuthDB.getAllUsers();
  } catch (err) {
    console.error('AuthDB.getAllUsers() failed:', err);
    mount.innerHTML = '<div class="empty-state">โหลดรายชื่อผู้ใช้งานไม่สำเร็จ</div>';
    return;
  }

  if (users.length === 0) {
    mount.innerHTML = '<div class="empty-state">ยังไม่มีผู้ใช้งานในระบบ — ต้องเพิ่มผู้ใช้ก่อนเปิดใช้การเข้าสู่ระบบ</div>';
    return;
  }

  mount.innerHTML = users.map(u => `
    <button class="user-picker-btn" data-user-id="${u.id}">
      <span class="user-avatar">${u.avatar_icon || '👤'}</span>
      <span class="user-name">${u.name}</span>
    </button>
  `).join('');

  mount.querySelectorAll('.user-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const user = users.find(u => u.id === Number(btn.dataset.userId));
      if (user) onSelectUser(user);
    });
  });
}
