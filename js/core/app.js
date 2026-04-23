// js/core/app.js

import { requireAuth } from './auth.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderHeader, bindHeaderEvents } from '../components/header.js';
import { showLoading, hideLoading } from './ui.js';

export async function initApp(moduleInit) {
  try {
    showLoading();

    const user = await requireAuth();

    renderLayout(user);

    if (typeof moduleInit === 'function') {
      await moduleInit(user);
    }

    bindHeaderEvents();

  } catch (err) {
    console.error(err);
  } finally {
    hideLoading();
  }
}

function renderLayout(user) {
  const root = document.getElementById('app');

  root.innerHTML = `
    <div class="flex">
      ${renderSidebar()}
      <div class="flex-1">
        ${renderHeader(user)}
        <main class="p-4" id="page-content"></main>
      </div>
    </div>
  `;
}