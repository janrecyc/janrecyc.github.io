/* ============================================================
   pages/manage-users-page.js — orchestrates manage-users.html.
   Single mount (#users-mount) swaps between four views:
     list -> add-form -> pin-setup (for the new user's first PIN)
     list -> edit-form -> pin-setup (resetting an existing PIN)
   Every AuthDB call here goes through getAllUsersManaged/
   createUser/updateUserProfile/setUserActive/setUserPin — see
   js/db/db.js's "User management" section for what each does.

   No "current PIN" check anywhere in this file — unlike
   change-pin.html (a user changing their OWN PIN), this page is
   reached only from Settings ▸ บัญชี ▸ จัดการผู้ใช้งาน, i.e. an
   already-authenticated admin acting on someone else's account.
   ============================================================ */
async function initManageUsersPage() {
  const mount = document.getElementById('users-mount');
  const errorEl = document.getElementById('manage-users-error');

  try {
    await AuthDB.initDatabase();
  } catch (err) {
    console.error('AuthDB.initDatabase() failed:', err);
    mount.innerHTML = `<div class="empty-state">เชื่อมต่อฐานข้อมูลไม่สำเร็จ: ${(err && err.message) || String(err)}</div>`;
    return;
  }

  async function showList() {
    errorEl.textContent = '';
    let users;
    try {
      users = await AuthDB.getAllUsersManaged();
    } catch (err) {
      console.error('AuthDB.getAllUsersManaged() failed:', err);
      mount.innerHTML = '<div class="empty-state">โหลดรายชื่อผู้ใช้งานไม่สำเร็จ</div>';
      return;
    }
    renderUserList('users-mount', users, {
      onSelectUser: showEditForm,
      onAddUser: showAddForm
    });
  }

  function showAddForm(prefill) {
    errorEl.textContent = '';
    renderUserForm('users-mount', {
      user: prefill, // renderUserForm only reads name/role/avatar_icon,
                      // so a plain profile object (no id yet) prefills fine
      title: 'เพิ่มผู้ใช้งาน',
      submitLabel: 'ถัดไป: ตั้ง PIN',
      onSubmit: async (profile) => {
        showPinSetup({
          intro: `${profile.avatar_icon} ${profile.name}`,
          onConfirmed: async (pin) => {
            await AuthDB.createUser({ ...profile, pin });
          },
          onDone: showList,
          // Failed save (or cancel) -> back to the form WITH what they
          // typed, not a blank one — they shouldn't have to retype the
          // name/role just because the PIN step didn't go through.
          onCancelBackTo: () => showAddForm(profile)
        });
      },
      onCancel: showList
    });
  }

  function showEditForm(user) {
    errorEl.textContent = '';
    renderUserForm('users-mount', {
      user,
      title: 'แก้ไขผู้ใช้งาน',
      submitLabel: 'บันทึก',
      onSubmit: async (profile) => {
        await AuthDB.updateUserProfile(user.id, profile);
        showList();
      },
      onCancel: showList,
      extraActions: [
        { id: 'set-pin', label: 'ตั้ง PIN ใหม่' },
        { id: user.active ? 'disable' : 'enable', label: user.active ? 'ปิดใช้งานผู้ใช้นี้' : 'เปิดใช้งานอีกครั้ง', danger: !!user.active }
      ],
      onExtraAction: async (actionId) => {
        if (actionId === 'set-pin') {
          showPinSetup({
            intro: `${user.avatar_icon || '👤'} ${user.name}`,
            onConfirmed: async (pin) => { await AuthDB.setUserPin(user.id, pin); },
            onDone: showList,
            onCancelBackTo: () => showEditForm(user)
          });
          return;
        }
        // disable / enable
        try {
          await AuthDB.setUserActive(user.id, actionId === 'enable');
        } catch (err) {
          console.error('AuthDB.setUserActive() failed:', err);
          errorEl.textContent = 'บันทึกไม่สำเร็จ: ' + ((err && err.message) || String(err));
          return;
        }
        showList();
      }
    });
  }

  // Shared by both "add" (new user, no prior PIN) and "reset" (existing
  // user) — renderPinSetupFlow only ever collects+confirms a NEW pin,
  // it never checks an old one (that's change-pin-page.js's job, for a
  // user changing their own PIN).
  function showPinSetup({ intro, onConfirmed, onDone, onCancelBackTo }) {
    mount.innerHTML = `<div class="pin-pad-wrap" id="pin-setup-mount"></div>`;
    // renderPinSetupFlow's own onConfirmed hook is the only completion
    // signal it exposes (see its header comment) — wrap it here so the
    // page can advance to the list once the save actually succeeds.
    renderPinSetupFlow('pin-setup-mount', {
      userLabel: intro,
      onConfirmed: async (pin) => {
        try {
          await onConfirmed(pin);
        } catch (err) {
          // Must not throw back into pin-pad's handleKey (it doesn't
          // catch) — surface the error on the page-level banner and
          // bail out to wherever the caller wants a retry from.
          console.error('AuthDB save failed during pin setup:', err);
          errorEl.textContent = 'บันทึกไม่สำเร็จ: ' + ((err && err.message) || String(err));
          onCancelBackTo();
          return;
        }
        if (onDone) onDone();
      },
      onCancel: onCancelBackTo
    });
  }

  showList();
}
