/**
 * Simple SPA Router (Vanilla JS)
 */

const routes = {};
let rootEl = null;

/**
 * Register route
 */
export function registerRoute(path, view) {
  routes[path] = view;
}

/**
 * Navigate
 */
export function navigate(path) {
  window.history.pushState({}, "", path);
  renderRoute();
}

/**
 * Match route
 */
function matchRoute(path) {
  return routes[path] || routes["/"];
}

/**
 * Render
 */
export async function renderRoute() {
  if (!rootEl) return;

  const path = window.location.pathname;
  const view = matchRoute(path);

  if (!view) {
    rootEl.innerHTML = "<h1>404 Not Found</h1>";
    return;
  }

  try {
    const html = await view();
    rootEl.innerHTML = html;
  } catch (err) {
    console.error("Render error:", err);
    rootEl.innerHTML = "<h1>เกิดข้อผิดพลาด</h1>";
  }
}

/**
 * Init Router
 */
export function initRouter(rootElement) {
  rootEl = rootElement;

  window.addEventListener("popstate", renderRoute);

  // Handle link clicks (SPA)
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");

    if (link) {
      e.preventDefault();
      navigate(link.getAttribute("href"));
    }
  });
}
