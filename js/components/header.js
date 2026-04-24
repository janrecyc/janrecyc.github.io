// js/components/header.js

import { logout } from '../core/auth.js';

export function renderHeader(user) {
  return `
    <header class="bg-white px-4 py-3 flex justify-between items-center shadow-sm">

      <div class="font-bold">
        JanRecyc System
      </div>

      <div class="flex items-center gap-3 text-sm">
        <span>${user.profile.full_name}</span>

        <button id="logout-btn"
          class="bg-red-500 text-white px-3 py-1 rounded">
          Logout
        </button>
      </div>

    </header>
  `;
}

export function bindHeaderEvents() {
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}
