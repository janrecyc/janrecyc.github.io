// js/modules/login.js

import { login, getCurrentUser } from '../core/auth.js';
import { showToast, showLoading, hideLoading } from '../core/ui.js';

const form = document.getElementById('login-form');

init();

async function init() {
  try {
    showLoading();

    // 🔐 ถ้ามี session อยู่แล้ว → เข้า dashboard
    const user = await getCurrentUser();
    if (user) {
      window.location.href = '/pages/dashboard.html';
      return;
    }

  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }

  try {
    showLoading();

    await login(email, password);

    showToast('เข้าสู่ระบบสำเร็จ', 'success');

    // redirect หลัง login
    setTimeout(() => {
      window.location.href = '/pages/test-auth.html';
    }, 500);

  } catch (err) {
    console.error(err);

    if (err.message.includes('Invalid login credentials')) {
      showToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
    } else {
      showToast('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
    }

  } finally {
    hideLoading();
  }
});
