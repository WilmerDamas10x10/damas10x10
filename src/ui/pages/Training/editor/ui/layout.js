// src/ui/pages/Training/editor/ui/layout.js
// Estructura y montaje del layout del Editor (modo Entrenamiento)

import { installEditorWANPanel } from "./panels/wan.panel.js";

/* ---------------- Utils ---------------- */
function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

/* ------------------------------------------------------------------
 * setupResponsive: deja de inyectar el viejo "flex nowrap" inline
 * y garantiza que el contenedor use la clase .board-row (grid CSS).
 * Mantiene compatibilidad con Editor.js que lo sigue importando.
 * ------------------------------------------------------------------ */
export function setupResponsive(root) {
  try {
    // 1) Elimina el antiguo style inline (si existiera)
    const old = document.getElementById("css-board-responsive");
    if (old && old.parentNode) old.parentNode.removeChild(old);

    // 2) Asegura que el contenedor tenga la clase para el grid CSS
    const row = (root && root.querySelector("#board-row")) || document.getElementById("board-row");
    if (row) {
      row.classList.add("board-row"); // las media queries viven en editor.responsive.css
      // Limpia display inline si alguien lo hubiera metido antes
      row.style.display = "";
      row.style.flexWrap = "";
    }
  } catch (e) {
    console.warn("[layout.setupResponsive] aviso:", e);
  }
}

/* ---------------- Layout principal ---------------- */
export function createEditorLayout(root, editorApi) {
  if (!root) throw new Error("Root no definido para createEditorLayout");

  // Contenedor principal (sin estilos inline de layout)
  const row = el(`<div id="board-row" class="board-row"></div>`);

  // Panel izquierdo: turno + guardar/cargar/importar/compartir
  const leftDock = el(`
    <div id="left-dock" class="left-dock">
      <div id="turn-dock">
        <h4 style="margin:0;">Turno</h4>
        <div id="turn-status" class="turn-status">BLANCO</div>
        <button id="btn-switch-turn">Cambiar turno</button>
      </div>

      <div id="group-save-load-local" style="margin-top:1rem;">
        <button id="btn-save">Guardar posición</button>
        <button id="btn-load">Cargar posición</button>

        <div class="dropdown">
          <button class="dropbtn">Importar ▼</button>
          <div class="dropdown-content">
            <button id="import-fen">Pegar FEN</button>
            <button id="import-base64">Pegar Base64</button>
            <button id="import-jaxon">Cargar JAXON</button>
          </div>
        </div>

        <div class="dropdown">
          <button class="dropbtn">Compartir ▼</button>
          <div class="dropdown-content">
            <button id="share-fen">Copiar FEN</button>
            <button id="share-link">Copiar enlace</button>
          </div>
        </div>
      </div>
    </div>
  `);

  // Tablero
  const board = el(`
    <div id="board" class="board-fluid">
      <canvas class="board-canvas-fluid"></canvas>
    </div>
  `);

  // Panel derecho (sin el botón obsoleto “Compartir posición (WAN)”)
  const rightPanel = el(`
    <div id="right-panel" class="right-panel">
      <button id="btn-reset">Posición Inicial</button>
      <button id="btn-clear">Vaciar Tablero</button>

      <button id="add-white">Agregar</button>
      <button id="add-black">Agregar</button>
      <button id="add-white-queen">Agregar</button>
      <button id="add-black-queen">Agregar</button>

      <button id="btn-eraser">Borrador</button>
      <button id="btn-undo">Deshacer</button>
      <button id="btn-redo">Rehacer</button>
      <button id="btn-menu">Volver al menú</button>
      <button id="btn-sound">Sonido ON</button>
      <button id="btn-rotate">Girar tablero</button>

      <button id="btn-download-fen">Descargar .FEN</button>
      <button id="btn-copy-fen">Copiar FEN</button>

      <small style="opacity:.6;">La WAN solo conecta al compartir.</small>
    </div>
  `);

  // Ensamble
  row.appendChild(leftDock);
  row.appendChild(board);
  row.appendChild(rightPanel);
  root.appendChild(row);

  // Monta el panel WAN alineado debajo de Guardar/Cargar/Importar/Compartir
  installEditorWANPanel(leftDock, { getBridge: editorApi?.getBridge });

  // Llama al shim responsive para limpiar cualquier residuo anterior
  setupResponsive(root);

  return { row, board, leftDock, rightPanel };
}
