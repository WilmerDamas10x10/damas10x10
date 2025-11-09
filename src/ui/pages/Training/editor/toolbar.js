// src/ui/pages/Training/editor/toolbar.js
// Utilidades de toolbar originales (vanilla ESM)

// Enciende/apaga el estado visual de los botones con data-mode
export function syncToolButtons(root, activeMode) {
  const scope =
    root.querySelector("#tools") ||
    root.querySelector(".toolbar") ||
    root;

  if (!scope) return;

  scope.querySelectorAll("[data-mode]").forEach((btn) => {
    const mode = btn.getAttribute("data-mode");
    const on = !!activeMode && mode === activeMode;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

// Cablea los botones de colocación (data-mode) para llamar a setPlacing
export function wirePlacementTools(root, { setPlacing }) {
  const scope =
    root.querySelector("#tools") ||
    root.querySelector(".toolbar") ||
    root;

  if (!scope) return;

  // Delegación de eventos para todos los botones con data-mode
  scope.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-mode]");
    if (!btn || !scope.contains(btn)) return;
    ev.preventDefault();

    const mode = btn.getAttribute("data-mode");
    setPlacing?.(mode);
    syncToolButtons(root, mode);
  });
}

// Cablea los botones principales del editor si existen
export function wireEditorToolbar(root, api) {
  const q = (sel) => root.querySelector(sel);
  const bind = (sel, fn) => {
    const el = q(sel);
    if (!el || typeof fn !== "function") return;
    el.addEventListener("click", (e) => {
      e.preventDefault();
      fn(e);
    });
  };

  // Undo / Redo
  bind("#btn-undo", () => api.undo?.undo?.());
  bind("#btn-redo", () => api.undo?.redo?.());

  // Vaciar tablero (rápido)
  bind("#btn-vaciar", () => {
    const b = api.getBoard?.();
    if (!b) return;
    const nb = b.map((row) => row.map(() => null));
    api.undo?.save?.();
    api.setBoard?.(nb);
    api.setStepState?.(null);
    api.render?.();
    api.paintState?.();
    syncToolButtons(root, null);
  });

  // Borrador (modo 'x')
  bind("#btn-borrar", () => {
    api.setPlacing?.("x");
    syncToolButtons(root, "x");
  });

  // Compartir
  bind("#btn-share", () => api.share?.());
}
