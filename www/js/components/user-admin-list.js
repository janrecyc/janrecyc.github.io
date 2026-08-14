/* ============================================================
   components/user-admin-list.js — the list view for จัดการผู้ใช้งาน:
   every user (active + inactive) as a tappable row, plus an
   "เพิ่มผู้ใช้ใหม่" button.
   ============================================================ */
function renderUserAdminList(mountId, users, { onSelectUser, onAddNew }) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const roleLabels = { owner: 'เจ้าของร้าน', manager: 'ผู้จัดการ', staff: 'พนักงาน' };

  mount.innerHTML = `
    <button class="primary-btn" id="admin-add-user-btn" style="margin-bottom:16px;">+ เพิ่มผู้ใช้ใหม่</button>
    <div class="section-rows">
      ${users.map(u => `
        <div class="admin-user-row ${u.active ? '' : 'inactive'}" data-user-id="${u.id}">
          <span class="admin-user-avatar">${u.avatar_icon || '👤'}</span>
          <span class="admin-user-info">
            <div class="admin-user-name">${u.name}</div>
            <div class="admin-user-role">${roleLabels[u.role] || u.role}</div>
          </span>
          ${u.active ? '' : '<span class="admin-user-badge">ปิดใช้งาน</span>'}
        </div>
      `).join('')}
    </div>
  `;

  mount.querySelector('#admin-add-user-btn').addEventListener('click', onAddNew);
  mount.querySelectorAll('.admin-user-row').forEach(row => {
    row.addEventListener('click', () => {
      const user = users.find(u => u.id === Number(row.dataset.userId));
      if (user) onSelectUser(user);
    });
  });
}
