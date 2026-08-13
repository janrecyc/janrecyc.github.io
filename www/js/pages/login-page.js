/* ============================================================
   pages/login-page.js — orchestrates login.html: user picker
   screen, then the PIN pad for whichever user was tapped.
   ============================================================ */
async function initLoginPage() {
  const pickerMount = document.getElementById('user-picker-mount');
  const pinMount = document.getElementById('pin-pad-mount');
  const errorEl = document.getElementById('login-error');

  try {
    await AuthDB.initDatabase();
  } catch (err) {
    console.error('AuthDB.initDatabase() failed:', err);
    const detail = (err && err.message) ? err.message : String(err);
    pickerMount.innerHTML = `
      <div class="empty-state">
        เชื่อมต่อฐานข้อมูลไม่สำเร็จ — เช็ค js/db/db.js ว่าเรียก
        @capacitor-community/sqlite ถูกต้องตามเวอร์ชันที่ติดตั้งไหม
        (ดูคอมเมนต์ด้านบนของไฟล์)<br><br>
        <span style="font-family: monospace; font-size: 12px; opacity: 0.8;">${detail}</span>
      </div>`;
    return;
  }

  function showPicker() {
    if (errorEl) errorEl.textContent = '';
    pinMount.setAttribute('hidden', '');
    pickerMount.removeAttribute('hidden');
    renderUserPicker('user-picker-mount', onUserSelected);
  }

  function onUserSelected(user) {
    if (errorEl) errorEl.textContent = '';
    pickerMount.setAttribute('hidden', '');
    pinMount.removeAttribute('hidden');
    renderPinPad('pin-pad-mount', {
      userLabel: `${user.avatar_icon || '👤'} ${user.name}`,
      onComplete: async (pin) => {
        let ok;
        try {
          ok = await AuthDB.verifyPin(user.id, pin);
        } catch (err) {
          console.error('AuthDB.verifyPin() failed:', err);
          const detail = (err && err.message) ? err.message : String(err);
          if (errorEl) errorEl.textContent = `ตรวจสอบ PIN ไม่สำเร็จ: ${detail}`;
          return false;
        }
        if (ok) {
          window.AuthSession.setSession(user);
          location.href = 'index.html';
          return true;
        }
        if (errorEl) errorEl.textContent = 'PIN ไม่ถูกต้อง ลองอีกครั้ง';
        return false;
      },
      onCancel: showPicker
    });
  }

  showPicker();
}
