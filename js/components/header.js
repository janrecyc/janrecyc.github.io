// js/components/header.js

import { logout } from '../core/auth.js';

export function renderHeader(user) {
  return `
    <header class="bg-[#1c1c1c] border-b border-[#2f2f2f] px-4 py-3 flex justify-between items-center">

      <div class="font-bold text-white">
        JanRecyc System
      </div>

      <div class="flex items-center gap-3 text-sm text-gray-300">
        <span>${user.profile.full_name}</span>

        <button 
          id="logout-btn"
          class="bg-red-500 text-white px-3 py-1 rounded-lg active:scale-95">
          Logout
        </button>
      </div>

    </header>
  `;
}

export function bindHeaderEvents() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', logout);
  }
}
