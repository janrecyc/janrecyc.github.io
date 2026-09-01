/* ============================================================
   components/user-list.js — renders the full roster (from
   AuthDB.getAllUsersManaged(), which includes disabled users —
   unlike components/user-picker.js's login-screen list, which
   only shows active ones) as tappable rows, plus an "add user"
   button. Tapping a row means "edit this user" — there's no
   separate view-only state.

   renderUserList(mountId, users, { onSelectUser, onAddUser })
   ============================================================ */
const ROLE_LABELS = { owner: 'เจ้าของร้าน', manager: 'ผู้จัดการ', staff: 'พนักงาน' };

function renderUserList(mountId, users, { onSelectUser, onAddUser }) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const rows = users.map(u => `
    <button type="button" class="user-row ${u.active ? '' : 'is-inactive'}" data-user-id="${u.id}">
      <span class="user-row-avatar">${u.avatar_icon || '👤'}</span>
      <span class="user-row-info">
        <span class="user-row-name">${u.name}</span>
        <span class="user-row-meta">
          <span class="role-badge ${u.active ? '' : 'inactive'}">${ROLE_LABELS[u.role] || u.role}</span>
          ${u.active ? '' : ' · ปิดใช้งานอยู่'}
        </span>
      </span>
      <span class="user-row-chevron">›</span>
    </button>
  `).join('');

  mount.innerHTML = `
    <div class="section-rows">
      ${rows || '<div class="empty-state">ยังไม่มีผู้ใช้งานในระบบ</div>'}
    </div>
    <button type="button" class="add-user-btn" id="add-user-btn">+ เพิ่มผู้ใช้งาน</button>
  `;

  mount.querySelectorAll('.user-row').forEach(rowEl => {
    rowEl.addEventListener('click', () => {
      const user = users.find(u => u.id === Number(rowEl.dataset.userId));
      if (user) onSelectUser(user);
    });
  });

  const addBtn = document.getElementById('add-user-btn');
  if (addBtn) addBtn.addEventListener('click', onAddUser);
}
