/* ============================================================
   pages/change-pin-page.js — orchestrates change-pin.html:
   verify current PIN → enter new PIN → confirm new PIN → save.
   Applies to whoever is logged in right now (from AuthSession),
   not a specific user picked from a list — that's what
   manage-users-page.js is for (resetting someone else's PIN).
   ============================================================ */
async function initChangePinPage() {
  const session = window.AuthSession.getSession();
  const mount = document.getElementById('change-pin-mount');
  const statusEl = document.getElementById('change-pin-status');

  if (!session) {
    mount.innerHTML = '<div class="empty-state">ไม่พบผู้ใช้ที่ล็อกอินอยู่</div>';
    return;
  }

  try {
    await AuthDB.initDatabase();
  } catch (err) {
    const detail = (err && err.message) ? err.message : String(err);
    mount.innerHTML = `<div class="empty-state">เชื่อมต่อฐานข้อมูลไม่สำเร็จ<br><br><span style="font-family: monospace; font-size: 12px; opacity: 0.8;">${detail}</span></div>`;
    return;
  }

  function askCurrent() {
    statusEl.textContent = '';
    renderPinPad('change-pin-mount', {
      userLabel: `ยืนยันตัวตน: ${session.name}`,
      onComplete: async (pin) => {
        const ok = await AuthDB.verifyPin(session.userId, pin);
        if (!ok) {
          statusEl.textContent = 'PIN เดิมไม่ถูกต้อง';
          return false;
        }
        askNew();
        return true;
      },
      onCancel: () => { location.href = 'settings.html'; }
    });
  }

  function askNew() {
    statusEl.textContent = '';
    renderPinPad('change-pin-mount', {
      userLabel: 'ตั้ง PIN ใหม่ (6 หลัก)',
      onComplete: async (pin) => {
        askConfirm(pin);
        return true;
      },
      onCancel: askCurrent
    });
  }

  function askConfirm(firstPin) {
    renderPinPad('change-pin-mount', {
      userLabel: 'ยืนยัน PIN อีกครั้ง',
      onComplete: async (pin) => {
        if (pin !== firstPin) {
          statusEl.textContent = 'PIN ไม่ตรงกัน ลองใหม่';
          return false;
        }
        try {
          await AuthDB.updateUserPin(session.userId, pin);
        } catch (err) {
          const detail = (err && err.message) ? err.message : String(err);
          statusEl.textContent = `บันทึกไม่สำเร็จ: ${detail}`;
          return false;
        }
        statusEl.textContent = 'เปลี่ยน PIN สำเร็จ';
        setTimeout(() => { location.href = 'settings.html'; }, 1200);
        return true;
      },
      onCancel: askNew
    });
  }

  askCurrent();
}
