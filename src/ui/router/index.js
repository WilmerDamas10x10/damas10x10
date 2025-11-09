// src/ui/router/index.js
// Facade temporal. Reemplázalo luego por re-exports desde tu router real.
// Exportamos las firmas esperadas para que el build no rompa.

export const appElement = () =>
  document.getElementById('app') || document.body;

const routes = new Map();

export function registerRoute(path, component) {
  routes.set(path, component);
}

export function registerTrainingRoute(path, component) {
  // Si en tu app esto hace algo especial, por ahora reusa registerRoute.
  routes.set(path, component);
}

export function initRouter() {
  // En cuanto encuentres tu router real, borra este stub.
  const mount = () => {
    const hash = location.hash.replace(/^#/, '') || '/';
    const Cmp = routes.get(hash);
    if (Cmp) {
      const el = appElement();
      // Montaje naif para dev; ajusta a tu framework real
      if (typeof Cmp === 'function') {
        el.innerHTML = '';
        const node = Cmp(); // si tus componentes retornan string o nodo
        if (typeof node === 'string') el.innerHTML = node;
        else if (node instanceof Node) el.appendChild(node);
        else el.innerHTML = '<div>Training</div>';
      }
    }
  };
  window.addEventListener('hashchange', mount);
  mount();
}
