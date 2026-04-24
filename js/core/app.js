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

  if (pageInit) {
    await pageInit(session.user);
  }

  bindHeaderEvents();
}

function renderLayout(user) {
  const root = document.getElementById('app');

  root.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] flex flex-col">

      ${renderHeader(user)}

      <main id="page-content" class="flex-1 overflow-y-auto pb-20"></main>

      ${renderBottomNav()}

    </div>
  `;
}

function renderBottomNav() {
  const path = window.location.pathname;

  return `
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 text-xs">

      ${navItem('dashboard.html','📊','ภาพรวม', path)}
      ${navItem('buy.html','➕','รับซื้อ', path)}
      ${navItem('sell.html','🚚','ขาย', path)}
      ${navItem('prices.html','💰','ราคา', path)}
      ${navItem('cashflow.html','💵','เงินสด', path)}

    </nav>
  `;
}

function navItem(page, icon, label, path) {
  const active = path.includes(page);

  return `
    <a href="/pages/${page}" class="flex flex-col items-center ${
      active ? 'text-blue-600 font-bold' : 'text-gray-400'
    }">
      <div>${icon}</div>
      <div>${label}</div>
    </a>
  `;
}
