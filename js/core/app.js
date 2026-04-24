// js/core/app.js

import { getSession } from './auth.js';
import { renderHeader, bindHeaderEvents } from '../components/header.js';

export async function initApp(pageInit) {
  const session = await getSession();

  if (!session) {
    window.location.href = '/pages/login.html';
    return;
  }

  renderLayout(session.user);

  if (typeof pageInit === 'function') {
    await pageInit(session.user);
  }

  bindHeaderEvents();
}

// ❌ ลบ sidebar ออก
function renderLayout(user) {
  const root = document.getElementById('app');

  root.innerHTML = `
    <div class="min-h-screen bg-black">

      ${renderHeader(user)}

      <main id="page-content" class="pb-20"></main>

    </div>
  `;
}
