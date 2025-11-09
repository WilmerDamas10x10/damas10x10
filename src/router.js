// src/router.js
// Router mínimo (history API)

const routes = new Map();
let _appEl = null;

const norm = (p) => (p && p.startsWith("/")) ? p : `/${p || ""}`;

export function appElement() {
  return _appEl || document.getElementById("app");
}

export function registerRoute(path, handler) {
  routes.set(norm(path), handler);
}

export function navigate(path) {
  history.pushState({}, "", norm(path));
  resolve();
}

export function currentPath() {
  return location.pathname || "/";
}

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

async function resolve() {
  const path = currentPath().split("?")[0];
  const handler = routes.get(norm(path)) || routes.get("/");
  const el = appElement();
  if (!el) return;
  clear(el);
  if (handler) {
    // Handlers pueden ser async
    await handler(el);
  }
}

export function initRouter(rootEl) {
  _appEl = rootEl || document.getElementById("app");
  window.addEventListener("popstate", resolve);
  resolve();
}

// 👉 /training — Editor (lazy)
export function registerTrainingRoute() {
  registerRoute("/training", async (el) => {
    try {
      const { default: TrainingEditor } = await import("./ui/pages/Training/editor/Editor.js");
      TrainingEditor(el);
    } catch (err) {
      console.error("[router:/training] Error importando Editor:", err);
      el.innerHTML = "<p style='color:#b00'>Error cargando el Editor.</p>";
    }
  });
}

/**
 * 👉 /ai — "Jugar contra la IA"
 */
export function registerAIRoute() {
  registerRoute("/ai", async (el) => {
    try {
      const mod = await import("./ui/pages/AI/index.js");
      const mount = mod?.default || mod?.mountAI || mod?.mount || mod?.start;
      if (typeof mount === "function") {
        await mount(el);
      } else {
        console.error("[router:/ai] No encontré función de montaje en ui/pages/AI/index.js");
        el.innerHTML = "<p style='color:#b00'>No se pudo montar la página de IA.</p>";
      }
    } catch (err) {
      console.error("[router:/ai] Error importando IA:", err);
      el.innerHTML = "<p style='color:#b00'>Error cargando la página de IA.</p>";
    }
  });
}

/**
 * 👉 /soplo — ruta canónica; monta SoploLibre
 *    (evita la importación rota de ./ui/pages/Soplo/index.js)
 */
export function registerSoploRoute() {
  registerRoute("/soplo", async (el) => {
    try {
      const { default: mountSoploLibre } = await import("./ui/pages/SoploLibre/index.js");
      await mountSoploLibre(el);
    } catch (err) {
      console.error("[router:/soplo] Error importando SoploLibre:", err);
      el.innerHTML = "<p style='color:#b00'>Error cargando Soplo Modo Libre.</p>";
    }
  });
}

/**
 * 👉 /soplo-libre — alias que REDIRIGE a la ruta canónica /soplo
 *    (mantiene compatibilidad con enlaces antiguos)
 */
export function registerSoploLibreRoute() {
  registerRoute("/soplo-libre", async () => {
    try {
      // Redirección explícita a la ruta canónica
      window.history.replaceState({}, "", "/soplo");
      const el = appElement();
      const { default: mountSoploLibre } = await import("./ui/pages/SoploLibre/index.js");
      await mountSoploLibre(el);
    } catch (err) {
      const el = appElement();
      console.error("[router:/soplo-libre] Error importando SoploLibre:", err);
      if (el) el.innerHTML = "<p style='color:#b00'>Error cargando Soplo Modo Libre.</p>";
    }
  });
}

/**
 * 👉 /online — Juego online con el unimotor (BC/WebSocket-ready)
 */
export function registerOnlineRoute() {
  registerRoute("/online", async (el) => {
    try {
      const { default: mountOnline } = await import("./ui/pages/Online/index.js");
      await mountOnline(el);
    } catch (err) {
      console.error("[router:/online] Error importando Online:", err);
      el.innerHTML = "<p style='color:#b00'>Error cargando la página Online.</p>";
    }
  });
}

// Export opcional (por si usas import default)
export default {
  registerRoute,
  navigate,
  currentPath,
  initRouter,
  appElement,
  registerTrainingRoute,
  registerAIRoute,
  registerSoploRoute,
  registerSoploLibreRoute,
  registerOnlineRoute,
};
