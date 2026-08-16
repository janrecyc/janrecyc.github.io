/* ============================================================
   components/user-form.js — the name/role/avatar-icon form used
   by manage-users.html for both "add user" and "edit user". PIN
   entry is NOT part of this form — that's a separate step via
   components/pin-setup-flow.js, chained in afterward by
   pages/manage-users-page.js (a new user still needs a PIN before
   AuthDB.createUser() can run; an existing user's PIN is changed
   only if the "ตั้ง PIN ใหม่" extra action below is used).

   renderUserForm(mountId, {
     user,             // existing user object to prefill, or
                        // omit/null for a blank "add" form
     title,            // heading shown above the fields
     submitLabel,       // text on the primary button
     onSubmit,          // async ({name, role, avatar_icon}) => void
     onCancel,
     extraActions       // optional array of {id, label, danger}
                        // rendered as extra buttons below the form
                        // (edit-mode only: "ตั้ง PIN ใหม่",
                        // "ปิด/เปิดใช้งาน") — id comes back via
                        // onExtraAction(id)
     onExtraAction       // (id) => void
   })
   ============================================================ */
function renderUserForm(mountId, { user, title, submitLabel, onSubmit, onCancel, extraActions, onExtraAction }) {
  const mount = document.getElementById(mountId);
  if (!mount) return;

  const name = user ? user.name : '';
  const role = user ? user.role : 'staff';
  const avatar = user ? (user.avatar_icon || '👤') : '👤';

  const extraActionsHtml = (extraActions || []).map(a => `
    <button type="button" class="btn ${a.danger ? 'btn-danger' : 'btn-secondary'}" data-extra-action="${a.id}">${a.label}</button>
  `).join('');

  mount.innerHTML = `
    <div class="section-title">${title}</div>
    <div class="section-rows" style="display:flex; flex-direction:column; gap:14px;">
      <div class="form-field">
        <label class="form-label" for="uf-name">ชื่อ</label>
        <input class="text-input" id="uf-name" type="text" value="${escapeAttr(name)}" placeholder="ชื่อพนักงาน">
      </div>
      <div class="form-field">
        <label class="form-label" for="uf-role">บทบาท</label>
        <select class="select-input" id="uf-role">
          <option value="staff" ${role === 'staff' ? 'selected' : ''}>พนักงาน</option>
          <option value="manager" ${role === 'manager' ? 'selected' : ''}>ผู้จัดการ</option>
          <option value="owner" ${role === 'owner' ? 'selected' : ''}>เจ้าของร้าน</option>
        </select>
      </div>
      <div class="form-field">
        <label class="form-label" for="uf-avatar">ไอคอน (อิโมจิ)</label>
        <input class="text-input" id="uf-avatar" type="text" maxlength="4" value="${escapeAttr(avatar)}" placeholder="👤">
      </div>
    </div>
    <div class="form-error" id="uf-error"></div>
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" id="uf-cancel">ยกเลิก</button>
      <button type="button" class="btn btn-primary" id="uf-submit">${submitLabel}</button>
    </div>
    ${extraActionsHtml ? `<div class="form-actions" style="margin-top: 10px;">${extraActionsHtml}</div>` : ''}
  `;

  document.getElementById('uf-cancel').addEventListener('click', onCancel);
  document.getElementById('uf-submit').addEventListener('click', async () => {
    const errEl = document.getElementById('uf-error');
    const nameVal = document.getElementById('uf-name').value.trim();
    const roleVal = document.getElementById('uf-role').value;
    const avatarVal = document.getElementById('uf-avatar').value.trim() || '👤';

    if (!nameVal) {
      errEl.textContent = 'กรุณากรอกชื่อ';
      return;
    }
    errEl.textContent = '';
    try {
      await onSubmit({ name: nameVal, role: roleVal, avatar_icon: avatarVal });
    } catch (err) {
      console.error('user-form onSubmit failed:', err);
      errEl.textContent = 'บันทึกไม่สำเร็จ: ' + ((err && err.message) || String(err));
    }
  });

  mount.querySelectorAll('[data-extra-action]').forEach(btn => {
    btn.addEventListener('click', () => onExtraAction && onExtraAction(btn.dataset.extraAction));
  });
}

function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
