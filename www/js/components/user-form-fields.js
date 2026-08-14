/* ============================================================
   components/user-form-fields.js — renders the name input + role
   picker used by both "add user" and "edit user" in
   manage-users-page.js. NOT used on login.html — that screen is
   deliberately button-only; this is for the admin-only management
   screen where typing a name is unavoidable.
   ============================================================ */
function renderUserFormFields(mountId, { name, role, onSubmit, submitLabel }) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const roles = [
    { value: 'owner', label: 'เจ้าของร้าน' },
    { value: 'manager', label: 'ผู้จัดการ' },
    { value: 'staff', label: 'พนักงาน' }
  ];
  let selectedRole = role || 'staff';

  mount.innerHTML = `
    <div class="field-group">
      <label class="field-label">ชื่อ</label>
      <input type="text" class="text-input" id="user-form-name" value="${name || ''}" placeholder="ชื่อพนักงาน">
    </div>
    <div class="field-group">
      <label class="field-label">บทบาท</label>
      <div class="role-picker" id="user-form-role-picker">
        ${roles.map(r => `<button type="button" class="role-btn ${r.value === selectedRole ? 'active' : ''}" data-role="${r.value}">${r.label}</button>`).join('')}
      </div>
    </div>
    <button class="primary-btn" id="user-form-submit">${submitLabel}</button>
  `;

  mount.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRole = btn.dataset.role;
      mount.querySelectorAll('.role-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  mount.querySelector('#user-form-submit').addEventListener('click', () => {
    const nameVal = mount.querySelector('#user-form-name').value.trim();
    if (!nameVal) {
      mount.querySelector('#user-form-name').focus();
      return;
    }
    onSubmit({ name: nameVal, role: selectedRole });
  });
}
