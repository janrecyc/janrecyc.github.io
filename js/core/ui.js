// js/core/ui.js

export function showToast(message, type = 'info') {
  const toast = document.createElement('div');

  const base = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow text-white z-50';
  const color = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-gray-800'
  }[type];

  toast.className = `${base} ${color}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

export function showLoading() {
  let loader = document.getElementById('global-loader');
  if (loader) return;

  loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loader.innerHTML = `<div class="bg-white p-4 rounded shadow">Loading...</div>`;

  document.body.appendChild(loader);
}

export function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.remove();
}

export function confirmDialog(message) {
  return window.confirm(message);
}