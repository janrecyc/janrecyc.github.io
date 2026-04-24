let container;

/**
 * Init Toast Container
 */
function init() {
  container = document.createElement("div");
  container.className =
    "fixed top-4 right-4 z-50 flex flex-col gap-3";
  document.body.appendChild(container);
}

/**
 * Show Toast
 */
export function showToast(message, type = "success") {
  if (!container) init();

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500"
  };

  const toast = document.createElement("div");
  toast.className = `
    ${colors[type] || colors.success}
    text-white px-5 py-3 rounded-xl shadow-lg
    transition-all duration-300
    opacity-0 translate-y-2
  `;

  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
