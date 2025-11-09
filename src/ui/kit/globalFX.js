// src/ui/kit/globalFX.js
// Instala una vez sonidos del Editor y estilos de zoom/FX para el tablero.
// Cualquier mejora en el Editor (sfx, highlights, etc.) se reflejará en los otros modos.

let _installed = false;

export async function ensureGlobalFX() {
  if (_installed) return;
  _installed = true;

  // 1) Sonidos del Editor (mismo bootstrap que usa el Editor)
  try {
    const mod = await import("../pages/Training/editor/sfx.bootstrap.js");
    if (typeof mod.initEditorSFX === "function") {
      mod.initEditorSFX();        // carga buffers, ataja spam, Alt+S toggle global
      // Opcional: forzar ON si quieres por defecto
      // mod.setSfxEnabled(true);
    }
  } catch (e) {
    console.warn("[globalFX] No se pudo inicializar SFX:", e);
  }

  // 2) CSS de zoom/FX (reutiliza clases del Editor)
  try {
    if (!document.getElementById("board-zoom-css")) {
      const css = `
        /* Suaviza transformaciones de fichas */
        .board .piece { transition: transform .12s ease; will-change: transform; }

        /* Zoom al seleccionar/origen (Editor usa .sq-highlight para marcar) */
        .board .square.sq-highlight .piece { transform: scale(1.08); }

        /* Pequeño feedback al aplicar captura/movimiento (si pintas .pulse en Editor) */
        .board .square.pulse .piece { transform: scale(1.12); }

        /* Invalid feedback (el Editor ya agrega .shake en casilla inválida) */
        .board .square.shake { animation: sq-shake .14s linear; }
        @keyframes sq-shake {
          0%{ transform: translateX(0) } 25%{ transform: translateX(-2px) }
          50%{ transform: translateX(2px) } 100%{ transform: translateX(0) }
        }
      `;
      const tag = document.createElement("style");
      tag.id = "board-zoom-css";
      tag.textContent = css;
      document.head.appendChild(tag);
    }
  } catch (e) {
    console.warn("[globalFX] No se pudo inyectar CSS de zoom:", e);
  }
}

export default { ensureGlobalFX };
