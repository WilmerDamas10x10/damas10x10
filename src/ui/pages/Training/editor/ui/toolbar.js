// src/ui/pages/Training/editor/ui/toolbar.js

// Mapa de IDs → modo (soporta tu toolbar actual)
const MAP = {
  "#btn-add-w": "r",
  "#btn-add-b": "n",
  "#btn-add-W": "R",
  "#btn-add-B": "N",
  "#btn-borrar": "x",
};

export function syncToolButtons(root, placing) {
  // Soporta botones por ID (tu caso actual)
  for (const [sel, val] of Object.entries(MAP)) {
    const el = root.querySelector(sel);
    if (!el) continue;
    const on = placing === val;
    el.classList.toggle("is-active", on);
    el.setAttribute("aria-pressed", on ? "true" : "false");
  }

  // Y también soporta botones genéricos con data-mode (por si los usas)
  root.querySelectorAll("[data-mode]").forEach((btn) => {
    const mode = btn.getAttribute("data-mode");
    const on = placing === mode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

export function setupToolbar(root, api) {
  const bind = (sel, fn) => {
    const el = root.querySelector(sel);
    if (!el || typeof fn !== "function") return;
    el.addEventListener("click", (e) => { e.preventDefault(); fn(e); });
  };

  // —— Botones básicos ——
  bind("#btn-undo", () => api.undo?.undo?.());
  bind("#btn-redo", () => api.undo?.redo?.());
  bind("#btn-vaciar", () => {
    const b = api.getBoard?.();
    if (!b) return;
    const nb = b.map(row => row.map(() => null));
    api.undo?.save?.();
    api.setBoard?.(nb);
    api.setStepState?.(null);
    api.render?.();
    api.paintState?.();
    syncToolButtons(root, null);
  });
  bind("#btn-share", () => api.share?.());

  // —— Colocación (IDs clásicos) ——
  const onPlaceClick = (mode) => {
    // Toggle real: si clicas el mismo, se apaga
    const current = api.getPlacing?.() ?? null;
    const next = current === mode ? null : mode;
    api.setPlacing?.(mode); // tu Editor hace el toggle internamente
    // Leemos el estado final (por si internamente decide algo distinto)
    const finalPlacing = api.getPlacing?.() ?? next;
    syncToolButtons(root, finalPlacing);
  };

  for (const [sel, mode] of Object.entries(MAP)) {
    const el = root.querySelector(sel);
    if (el) el.addEventListener("click", (e) => { e.preventDefault(); onPlaceClick(mode); });
  }

  // —— Colocación (data-mode) ——
  root.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      onPlaceClick(btn.getAttribute("data-mode"));
    });
  });

  // Estado inicial
  syncToolButtons(root, api.getPlacing?.() ?? null);
}
