// Limpieza visual del editor SIN romper el layout ni ocultar el tablero.
// Se ocultan únicamente botones de desarrollo puntuales.

(function cleanupEditorUI() {
  function hideAll(sel) {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.display = "none";
        el.setAttribute("data-hidden-by", "cleanupEditorUI");
      });
    } catch {}
  }

  // Asegura que contenedores críticos NUNCA se oculten
  function unhideCritical() {
    const CRITICAL = [
      "#board",                   // tablero
      ".toolbar-vertical",        // panel derecho
      "#tools",                   // barra de herramientas
      "#turn-panel",              // panel de turno (si existe)
      ".editor-root",             // wrapper general (si existe)
    ];
    CRITICAL.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.style.removeProperty("display");
      });
    });
  }

  // --- Ocultar solo DEV ---

  // Botón Goldens (si existe en tu UI)
  hideAll("#btn-goldens-ui, [data-test-id='btn-goldens-ui']");

  // “Export Replay (dev)” y “Mark Undo (dev)” — dales data-dev-id en el markup si no lo tenían
  // pero además intentamos por texto para ser tolerantes.
  hideAll("button[data-dev-id='export-replay']");
  hideAll("button[data-dev-id='mark-undo']");

  // Fallback por texto (por si no hay data-dev-id)
  try {
    document.querySelectorAll("button").forEach((btn) => {
      const t = (btn.textContent || "").toLowerCase();
      if (t.includes("export replay") || t.includes("mark undo")) {
        btn.style.display = "none";
        btn.setAttribute("data-hidden-by", "cleanupEditorUI:text");
      }
    });
  } catch {}

  // Nunca ocultar los contenedores principales del editor
  unhideCritical();

  // Exponer un hook opcional para re-aplicar si el DOM cambia
  try { window.applyEditorCleanup = () => { cleanupEditorUI(); }; } catch {}
})();
