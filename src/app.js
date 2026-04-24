import { initRouter, registerRoute, renderRoute, navigate } from "./router.js";
import { getSession, onAuthStateChange } from "./auth.js";

// Views (จะสร้างทีหลัง)
import { loginView } from "./views/login.js";
import { dashboardView } from "./views/dashboard.js";
import { posView } from "./views/pos.js";
import { inventoryView } from "./views/inventory.js";
import { historyView } from "./views/history.js";

const appEl = document.getElementById("app");

/**
 * Protected Route Wrapper
 */
async function requireAuth(view) {
  const session = await getSession();

  if (!session) {
    navigate("/");
    return loginView();
  }

  return view();
}

/**
 * Register Routes
 */
function setupRoutes() {
  registerRoute("/", loginView);

  registerRoute("/dashboard", () => requireAuth(dashboardView));
  registerRoute("/pos", () => requireAuth(posView));
  registerRoute("/inventory", () => requireAuth(inventoryView));
  registerRoute("/history", () => requireAuth(historyView));
}

/**
 * App Init
 */
async function init() {
  if (!appEl) {
    console.error("#app not found");
    return;
  }

  setupRoutes();
  initRouter(appEl);

  // Listen auth changes (auto redirect UX)
  onAuthStateChange((session) => {
    if (!session) {
      navigate("/");
    }
  });

  // First load
  await renderRoute();
}

init();
