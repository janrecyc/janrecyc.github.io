// js/components/header.js

import { logout } from '../core/auth.js';

export function renderHeader(user) {
  return `
    <header class="bg-white shadow px-4 py-3 flex justify-between items-center">
      <div class="font-semibold">Welcome, ${user.profile.full_name}</div>
      <button id="logout-btn" class="text-red-500">Logout</button>
    </header>
  `;
}

export function bindHeaderEvents() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', logout);
  }
}