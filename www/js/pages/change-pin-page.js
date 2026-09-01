/* ============================================================
   pages/change-pin-page.js — orchestrates change-pin.html.
   Flow: verify the CURRENT PIN of whoever is logged in (session
   user), then hand off to renderPinSetupFlow() for the new PIN.
   Requires an active session — this page changes one specific
   user's PIN, not "the device's" PIN, so there has to be a
   logged-in user to know which row to update.
   ============================================================ */
async function initChangePinPage() {
  const mount = document.getElementById('change-pin-mount');
  const errorEl = document.getElementById('change-pin-error');

  const session = window.AuthSession.getSession();
  if (!session) {
    mount.innerHTML = '';
    errorEl.innerHTML = `
      ต้องเข้าสู่ระบบก่อนถึงจะเปลี่ยน PIN ได้
      (ตอนนี้ยังไม่ได้เปิดใช้งานการเข้าสู่ระบบ หรือยังไม่ได้ล็อกอิน)<br>
      <a href="login.html" style="color: var(--nav-active);">ไปหน้าเข้าสู่ระบบ</a>`;
    return;
  }

  try {
    await AuthDB.initDatabase();
  } catch (err) {
    console.error('AuthDB.initDatabase() failed:', err);
    errorEl.textContent = 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ: ' + ((err && err.message) || String(err));
    return;
  }

  function askCurrentPin() {
    errorEl.textContent = '';
    renderPinPad(mount.id, {
      userLabel: `${session.name} — กรอก PIN ปัจจุบัน`,
      onComplete: async (pin) => {
        let ok;
        try {
          ok = await AuthDB.verifyPin(session.userId, pin);
        } catch (err) {
          console.error('AuthDB.verifyPin() failed:', err);
          errorEl.textContent = 'ตรวจสอบ PIN ไม่สำเร็จ: ' + ((err && err.message) || String(err));
          return true; // stop shaking on an infra error, message already explains it
        }
        if (!ok) {
          errorEl.textContent = 'PIN ปัจจุบันไม่ถูกต้อง';
          return false;
        }
        errorEl.textContent = '';
        askNewPin();
        return true;
      },
      onCancel: () => { location.href = 'settings.html'; }
    });
  }

  function askNewPin() {
    renderPinSetupFlow(mount.id, {
      userLabel: session.name,
      onConfirmed: async (newPin) => {
        try {
          await AuthDB.setUserPin(session.userId, newPin);
        } catch (err) {
          console.error('AuthDB.setUserPin() failed:', err);
          errorEl.textContent = 'บันทึก PIN ใหม่ไม่สำเร็จ: ' + ((err && err.message) || String(err));
          askCurrentPin();
          return;
        }
        mount.innerHTML = '<div class="empty-state">เปลี่ยน PIN สำเร็จ ✓</div>';
        setTimeout(() => { location.href = 'settings.html'; }, 900);
      },
      onCancel: () => { location.href = 'settings.html'; }
    });
  }

  askCurrentPin();
}
