// js/components/sidebar.js

export function renderSidebar() {
  const path = window.location.pathname;

  return `
    <aside class="w-20 bg-black text-white min-h-screen flex flex-col items-center py-4 space-y-4">

      ${navItem('/pages/dashboard.html', '🏠', 'Dashboard', path)}
      ${navItem('/pages/buy.html', '➕', 'Buy', path)}
      ${navItem('/pages/sell.html', '🚚', 'Sell', path)}
      ${navItem('/pages/sort.html', '🔀', 'Sort', path)}
      ${navItem('/pages/prices.html', '💰', 'Prices', path)}
      ${navItem('/pages/cashflow.html', '💵', 'Cash', path)}

    </aside>
  `;
}

function navItem(href, icon, label, current) {
  const active = current.includes(href);

  return `
    <a href="${href}"
       class="
         w-14 h-14 flex flex-col items-center justify-center
         rounded-xl
         ${active ? 'bg-yellow-400 text-black' : 'bg-[#1c1c1c] text-gray-300'}
         active:scale-95
       ">
       
      <div class="text-lg">${icon}</div>
      <div class="text-[10px]">${label}</div>
    </a>
  `;
}
