import { logout } from '../core/auth.js';

export function renderHeader(user) {
  return `
    <header class="bg-[#1a1a1a] px-4 py-3 flex justify-between items-center border-b border-[#2a2a2a]">

      <div class="text-white font-bold text-lg">
        JanRecyc System
      </div>

      <div class="flex items-center gap-3 text-sm text-gray-300">
        <span>${user.profile.full_name}</span>

        <button id="logout-btn"
          class="bg-red-500 px-3 py-1 rounded-lg text-white">
          Logout
        </button>
      </div>

    </header>
  `;
}

export function bindHeaderEvents() {
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}
