/* ============================================================
   pages/manage-users-page.js — orchestrates manage-users.html:
   list view (tap a user to edit, or "+ เพิ่มผู้ใช้ใหม่" to add) →
   form view (name + role, then PIN setup for new users) → back
   to list. Also lets an existing user's PIN be reset and their
   active/inactive status toggled.

   Restricted to 'owner'/'manager' roles — a 'staff' session sees
   an access-denied message instead of the management UI.
   ============================================================ */
async function initManageUsersPage() {
  const session = window.AuthSession.getSession();
  const gate = document.getElementById('access-gate');
  const content = document.getElementById('manage-users-content');
  const listMount = document.getElementById('list-view');
  const formMount = document.getElementById('form-view');

  const allowedRoles = ['owner', 'manager'];
  if (!session || !allowedRoles.includes(session.role)) {
    gate.innerHTML = '<div class="empty-state">หน้านี้สำหรับเจ้าของร้าน/ผู้จัดการเท่านั้น</div>';
    return;
  }
  gate.setAttribute('hidden', '');
  content.removeAttribute('hidden');

  try {
    await AuthDB.initDatabase();
  } catch (err) {
    const detail = (err && err.message) ? err.message : String(err);
    content.innerHTML = `<div class="empty-state">เชื่อมต่อฐานข้อมูลไม่สำเร็จ<br><br><span style="font-family: monospace; font-size: 12px; opacity: 0.8;">${detail}</span></div>`;
    return;
  }

  async function showList() {
    formMount.setAttribute('hidden', '');
    listMount.removeAttribute('hidden');
    const users = await AuthDB.getAllUsersForManagement();
    renderUserAdminList('list-view', users, {
      onSelectUser: showEditForm,
      onAddNew: showAddForm
    });
  }

  function showAddForm() {
    listMount.setAttribute('hidden', '');
    formMount.removeAttribute('hidden');
    formMount.innerHTML = '<button class="text-btn" id="form-back-btn">‹ กลับ</button><div id="user-fields-mount"></div>';
    formMount.querySelector('#form-back-btn').addEventListener('click', showList);

    renderUserFormFields('user-fields-mount', {
      name: '',
      role: 'staff',
      submitLabel: 'ถัดไป: ตั้ง PIN',
      onSubmit: ({ name, role }) => {
        startPinSetup({ mode: 'create', name, role });
      }
    });
  }

  function showEditForm(user) {
    listMount.setAttribute('hidden', '');
    formMount.removeAttribute('hidden');
    formMount.innerHTML = `
      <button class="text-btn" id="form-back-btn">‹ กลับ</button>
      <div id="user-fields-mount"></div>
      <button class="secondary-btn" id="reset-pin-btn" style="margin-top:12px;">ตั้ง PIN ใหม่</button>
      <button class="secondary-btn" id="toggle-active-btn" style="margin-top:12px;">
        ${user.active ? 'ปิดใช้งานผู้ใช้นี้' : 'เปิดใช้งานผู้ใช้นี้อีกครั้ง'}
      </button>
    `;
    formMount.querySelector('#form-back-btn').addEventListener('click', showList);

    renderUserFormFields('user-fields-mount', {
      name: user.name,
      role: user.role,
      submitLabel: 'บันทึกการแก้ไข',
      onSubmit: async ({ name, role }) => {
        await AuthDB.updateUserInfo(user.id, { name, role });
        showList();
      }
    });

    formMount.querySelector('#reset-pin-btn').addEventListener('click', () => {
      startPinSetup({ mode: 'reset', userId: user.id, name: user.name });
    });

    formMount.querySelector('#toggle-active-btn').addEventListener('click', async () => {
      await AuthDB.setUserActive(user.id, !user.active);
      showList();
    });
  }

  function startPinSetup({ mode, userId, name, role }) {
    formMount.innerHTML = '<div id="pin-setup-mount" class="pin-pad-wrap"></div>';
    let firstPin = null;

    function askFirst() {
      renderPinPad('pin-setup-mount', {
        userLabel: `ตั้ง PIN ${mode === 'create' ? 'สำหรับ' : 'ใหม่ให้'} ${name} (6 หลัก)`,
        onComplete: async (pin) => {
          firstPin = pin;
          askConfirm();
          return true;
        },
        onCancel: mode === 'create' ? showAddForm : showList
      });
    }

    function askConfirm() {
      renderPinPad('pin-setup-mount', {
        userLabel: 'ยืนยัน PIN อีกครั้ง',
        onComplete: async (pin) => {
          if (pin !== firstPin) return false; // pin-pad shakes + resets on false
          if (mode === 'create') {
            await AuthDB.createUser({ name, role, pin });
          } else {
            await AuthDB.updateUserPin(userId, pin);
          }
          showList();
          return true;
        },
        onCancel: askFirst
      });
    }

    askFirst();
  }

  showList();
}
