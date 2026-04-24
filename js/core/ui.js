// js/core/ui.js

let toastContainer = null;

// ---------------- TOAST ----------------

export function showToast(message, type = 'info') {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 space-y-2';
    document.body.appendChild(toastContainer);
  }

  const el = document.createElement('div');

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-gray-800'
  };

  el.className = `
    ${colors[type] || colors.info}
    text-white px-4 py-2 rounded-lg shadow-lg
    animate-fadeIn
  `;

  el.textContent = message;

  toastContainer.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 2500);
}

// ---------------- LOADING ----------------

let loadingEl = null;

export function showLoading() {
  if (loadingEl) return;

  loadingEl = document.createElement('div');
  loadingEl.className = `
    fixed inset-0 bg-black/40 flex items-center justify-center z-50
  `;

  loadingEl.innerHTML = `
    <div class="bg-white px-4 py-3 rounded-xl shadow">
      กำลังโหลด...
    </div>
  `;

  document.body.appendChild(loadingEl);
}

export function hideLoading() {
  if (loadingEl) {
    loadingEl.remove();
    loadingEl = null;
  }
}
