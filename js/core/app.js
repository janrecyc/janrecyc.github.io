import { renderHeader } from "../components/header.js";

export function initApp(pageInit) {

  const fakeUser = {
    profile: {
      full_name: "เถ้าแก่ (Admin)"
    }
  };

  renderLayout(fakeUser);

  if (pageInit) {
    pageInit(fakeUser);
  }
}

function renderLayout(user) {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="min-h-screen flex flex-col">

      ${renderHeader(user)}

      <main id="page-content" class="flex-1 p-4 pb-24"></main>

      ${bottomNav()}

    </div>
  `;
}

function bottomNav() {
  const path = window.location.pathname;

  return `
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">

    ${nav("dashboard.html","🏠","หน้าหลัก", path)}

  </nav>
  `;
}

function nav(page, icon, label, path) {
  const active = path.includes(page);

  return `
    <a href="./${page}" class="flex flex-col items-center text-xs ${
      active ? "text-blue-600 font-bold" : "text-gray-400"
    }">
      <div class="text-lg">${icon}</div>
      <div>${label}</div>
    </a>
  `;
}

