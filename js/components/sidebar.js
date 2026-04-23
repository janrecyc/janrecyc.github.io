// js/components/sidebar.js

export function renderSidebar() {
  const path = window.location.pathname;

  return `
    <aside class="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h1 class="text-xl font-bold mb-6">janrecyc</h1>
      <nav class="space-y-2">
        ${link('/pages/dashboard.html', 'Dashboard', path)}
        ${link('/pages/buy.html', 'Buy', path)}
        ${link('/pages/sell.html', 'Sell', path)}
        ${link('/pages/sort.html', 'Sort', path)}
        ${link('/pages/prices.html', 'Prices', path)}
        ${link('/pages/cashflow.html', 'Cash Flow', path)}
      </nav>
    </aside>
  `;
}

function link(href, label, current) {
  const active = current.includes(href) ? 'bg-gray-700' : '';
  return `
    <a href="${href}" class="block px-3 py-2 rounded ${active}">
      ${label}
    </a>
  `;
}