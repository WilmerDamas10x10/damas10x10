// src/ui/pages/Training/editor/index.js
import { installGoldenHook } from "./dev/goldenHook.js";
import { onMove, onCaptureHop, onCrown, onInvalid } from "../../../sfx.hooks.js"; // (no-op imports OK)
import { setupVariantToggle } from "./ui/variantToggle.js"; // selector Variante
import "./editor.fx.css";
// Hints y pintado (UI básica)
export { clearHints, markOrigin, hintMove, showFirstStepOptions, showRouteFull, paintState } from "./hints.js";

// ✅ Stubs V1 centralizados: evitan overlays legacy
export { markRouteLabel, markStep } from "./config/legacy-noops.js";

// Plantilla e iconos
export { getEditorTemplate } from "./template.js";
export { applyButtonIcons } from "./icons.js";

// Estado base del editor
export { SIZE, dark, startBoard } from "./state.js";

// Dibujo del tablero
export { drawBoard } from "./draw.js";

// Lógica de movimientos del Editor (no confundir con @rules)
export { applySingleCapture, bestRoutesFromPos } from "./moves.js";

// Undo/Redo
export { makeUndoAPI } from "./undo.js";

// Toolbar (API nueva, sin dependencias circulares)
export { setupToolbar, syncToolButtons } from "./ui/toolbar.js";

// Controlador e interacciones (si conservas la API antigua)
export { makeController } from "./controller.js";
export { attachBoardInteractions } from "./interactions.js";

// Layout / dock de turno
export { centerBoardWithSidebar, mountTurnDockFixed } from "./layout.js";

/* ─────────────────────────────────────────────────────────────────────
   Helper: inicializa la toolbar, monta el toggle de variante
   y corrige el “hueco” forzando el PRIMER BOTÓN a ocupar la fila completa.
   ───────────────────────────────────────────────────────────────────── */
export async function initToolbarWithVariant(container, ctx) {
  // 1) Monta/obtén la toolbar
  let toolbarEl;
  try {
    toolbarEl = await awaitMaybe(setupToolbar, container, ctx);
  } catch {}
  if (!toolbarEl) {
    toolbarEl =
      container?.querySelector?.("#toolbar, .toolbar") ||
      document.querySelector("#toolbar, .toolbar") ||
      null;
  }
  if (!toolbarEl) return null;

  // 2) Selector de variante (clásica / internacional)
  setupVariantToggle(toolbarEl, ctx);

  // 3) Reacción defensiva al aplicar variante
  toolbarEl.addEventListener("variant:apply", () => {
    try { ctx?.rebuildHints?.(); } catch {}
    try { ctx?.repaint?.(); } catch {}
  });

  // 4) FIX anti-hueco:
  //    - Si el primer hijo NO es botón: lo trato como “intro” (span-2).
  //    - Si sí es botón: el PRIMER contenedor que tenga botón pasa a span-2.
  try {
    const isButtonish = (el) =>
      !!el?.querySelector?.("button, a[role='button'], a.button, .btn");

    const first = toolbarEl.firstElementChild;
    if (first && !isButtonish(first)) {
      first.classList.add("span-2", "toolbar-intro");
    }

    // Primer contenedor con botón real → span-2 (evita que arranque en columna 2)
    const firstBtnContainer = Array.from(toolbarEl.children).find(isButtonish);
    if (firstBtnContainer) {
      firstBtnContainer.classList.add("span-2");
      // normaliza por si traía grid-column inline
      firstBtnContainer.style.gridColumn = "1 / -1";
    }

    // Normalización básica del resto (evita spans accidentales)
    Array.from(toolbarEl.children).forEach((el) => {
      if (el !== firstBtnContainer && !el.classList.contains("toolbar-intro")) {
        el.style.gridColumn = "auto / span 1";
        el.style.float = "none";
        el.style.position = "static";
        el.style.margin = "0";
        el.style.width = "100%";
      }
    });
  } catch {}

  return toolbarEl;
}

// Pequeño helper para tolerar setupToolbar async/sync indistintamente
async function awaitMaybe(fn, ...args) {
  if (typeof fn !== "function") return undefined;
  const out = fn(...args);
  return out instanceof Promise ? await out : out;
}

/* ─────────────────────────────────────────────────────────────────────
   Auto-enhance: si la página no llama explícitamente initToolbarWithVariant,
   lo intentamos al cargar el DOM (no rompe si ya se montó).
   ───────────────────────────────────────────────────────────────────── */
(function autoEnhanceToolbar() {
  const run = async () => {
    const container =
      document.querySelector(".editor, #editor, [data-editor-root], [data-editor]") ||
      document.body;

    const ctx = { repaint: () => {}, rebuildHints: () => {} };
    try { await initToolbarWithVariant(container, ctx); } catch {}
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(run, 0);
  } else {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  }
})();

/* ─────────────────────────────────────────────────────────────────────
   GOLDEN solo si lo pides: en DEV y con ?golden=1
   ───────────────────────────────────────────────────────────────────── */
const ENABLE_GOLDEN =
  import.meta.env.DEV &&
  new URLSearchParams(location.search).get("golden") === "1";

if (ENABLE_GOLDEN) {
  try { installGoldenHook(document.body); } catch {}
} else {
  // Limpieza defensiva: si algún script lo inyectó, elimínalo
  const killGolden = () =>
    document.querySelectorAll("#golden-hook, .golden-hook, .golden-fab")
      .forEach(n => n.remove());
  killGolden();
  document.addEventListener("DOMContentLoaded", killGolden, { once: true });
}

