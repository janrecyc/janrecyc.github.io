// js/modules/test-auth.js

import { showToast } from '../core/ui.js';
import { getCurrentUser, logout } from '../core/auth.js';

export async function initTestAuthPage(user) {
  try {
    renderUI(user);
    bindEvents();
  } catch (err) {
    console.error(err);
    showToast('โหลดข้อมูลผู้ใช้ไม่สำเร็จ', 'error');
  }
}

function renderUI(user) {
  const container = document.getElementById('page-content');

  container.innerHTML = `
    <div class="space-y-4">

      <h1 class="text-xl font-bold">🔐 Auth Debug</h1>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-2">Session Info</h2>
        <pre class="text-xs bg-gray-100 p-2 rounded overflow-auto">
${escapeHtml(JSON.stringify(user, null, 2))}
        </pre>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold mb-2">User Profile</h2>
        <p><strong>Full Name:</strong> ${user.profile.full_name}</p>
        <p><strong>Role:</strong> ${user.profile.role}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
      </div>

      <div class="flex gap-2">
        <button id="refresh-btn" class="bg-blue-600 text-white px-4 py-2 rounded">
          Refresh User
        </button>

        <button id="logout-btn" class="bg-red-600 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>

    </div>
  `;
}

function bindEvents() {
  const refreshBtn = document.getElementById('refresh-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      try {
        const user = await getCurrentUser();
        renderUI(user);
        showToast('รีเฟรชข้อมูลสำเร็จ', 'success');
      } catch (err) {
        console.error(err);
        showToast('โหลดข้อมูลใหม่ไม่สำเร็จ', 'error');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

// ป้องกัน XSS ตอน dump JSON
function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
