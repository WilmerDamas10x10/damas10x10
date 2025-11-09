// ================================
// src/ui/pages/SoploLibre/index.js
// Orquestador del modo Soplo Libre (modular)
// ================================
import "./ui.styles.css";
import { createLayout } from "./ui.layout.js";
import { createBoard } from "./ui.board.js";
import { createSoploState } from "./lib/state.js";
import { navigate } from "../../../router.js";

import {
  boardHelpersFactory,
  historyHelpersFactory,
  toolHelpersFactory,
  bind,
  applyZoomRotFactory,
} from "./lib/ui.helpers.js";

// (Se elimina la importación del colapsable duplicado de Edición)
// import { setupEditCollapsible } from "./lib/collapsibles/edit.collapsible.js";
import { setupRevisionCollapsible } from "./lib/collapsibles/revision.collapsible.js";
import { setupPartidaCollapsible } from "./lib/collapsibles/partida.collapsible.js";
import { setupMediaCollapsibleLazy } from "./lib/collapsibles/media.collapsible.js";
import { setupAppearanceCollapsible } from "./lib/collapsibles/appearance.collapsible.js";

import { attachResponsiveBoard } from "./lib/board.responsive.js";

// ======== Labels por tema (derivación en vivo) ========
const PIECE_LABELS = {
  clasico: { light: "Rojo",         dark: "Negro" },
  madera:  { light: "Madera clara", dark: "Madera oscura" },
  ebony:   { light: "Ivory",        dark: "Ebony" },
  oscuro:  { light: "Crema",        dark: "Marrón" },
};

function getCurrentLabels(soplo) {
  const ap = (soplo?.state?.appearance) || {};
  const id = (ap.pieces || "clasico").toLowerCase();
  return PIECE_LABELS[id] || PIECE_LABELS.clasico;
}

// ======== Utilidades de casillas ========
function makePlayableHelpers(cells) {
  const xyFromIndex = (i) => ({ x: i % 10, y: Math.floor(i / 10) });
  const xyFromCell = (cell) => {
    const list = cells();
    let idx = -1;
    for (let k = 0; k < list.length; k++) if (list[k] === cell) { idx = k; break; }
    if (idx < 0) return null;
    return xyFromIndex(idx);
  };
  const isPlayableXY = (x, y) => ((x + y) % 2) === 0; // solo casillas oscuras
  const isPlayableCell = (cell) => {
    const xy = xyFromCell(cell);
    return xy ? isPlayableXY(xy.x, xy.y) : false;
  };
  return { xyFromCell, isPlayableXY, isPlayableCell };
}

// ======== Utilidades de piezas / turno ========
const normalizeSide = (side) => String(side || "").toLowerCase(); // "ROJO"/"NEGRO" → "rojo"/"negro"

function getPieceSide(pieceEl) {
  if (!pieceEl) return null;
  const ds = pieceEl.dataset?.side || pieceEl.getAttribute?.("data-side");
  if (ds) return normalizeSide(ds);
  const cl = pieceEl.classList || [];
  if (cl.contains("rojo") || cl.contains("side-rojo")) return "rojo";
  if (cl.contains("negro") || cl.contains("side-negro")) return "negro";
  const raw = (pieceEl.className || "").toString();
  if (/\brojo\b/.test(raw)) return "rojo";
  if (/\bnegro\b/.test(raw)) return "negro";
  return null;
}

export default async function mountSoploLibre(root) {
  const refs = createLayout(root);

  // ---- Tablero ----
  const boardWrap = document.createElement("div");
  boardWrap.className = "boardWrap";
  refs.boardHost.innerHTML = "";
  refs.boardHost.appendChild(boardWrap);
  createBoard(boardWrap);

  // Responsive
  attachResponsiveBoard(refs, { min: 280, max: 1024 });

  // Helpers tablero / piezas
  const {
    cells, putPiece, clearPiecesOnly,
    readPieces, writePieces,
  } = boardHelpersFactory(boardWrap);
  const { xyFromCell, isPlayableXY, isPlayableCell } = makePlayableHelpers(cells);

  // Piezas iniciales
  const populateInitialPieces = () => {
    clearPiecesOnly();
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 10; x++)
        if ((x + y) % 2 === 0) putPiece(x, y, "negro", "pawn");
    for (let y = 6; y < 10; y++)
      for (let x = 0; x < 10; x++)
        if ((x + y) % 2 === 0) putPiece(x, y, "rojo", "pawn");
    setStatus("Fichas iniciales colocadas");
  };

  // Estado/UI hooks
  const setStatus = (msg) => { if (refs.statusText) refs.statusText.textContent = msg; };

  // Turno visible según tema activo

   // Turno visible: texto + mini-ficha con el mismo modelo que el tablero
  const setTurnText = (turnRaw) => {
    if (!refs.turnText) return;
    const side = String(turnRaw || "").toLowerCase(); // "rojo" | "negro"
    const labels = getCurrentLabels(soplo);
    const label = side === "rojo" ? labels.light : side === "negro" ? labels.dark : side;

    // Texto (en <span id="turn-label"> si existe; si no, fallback al pill)
    const text = `Turno: ${String(label).replace(/^./, c => c.toUpperCase())}`;
    if (refs.turnLabel) refs.turnLabel.textContent = text;
    else refs.turnText.textContent = text;

    // Mini ficha (usa .piece--rojo / .piece--negro; los temas ya pintan “rojo” como azul si aplica)
    if (refs.turnPiece) {
      refs.turnPiece.classList.remove("piece--rojo", "piece--negro");
      refs.turnPiece.classList.add(side === "negro" ? "piece--negro" : "piece--rojo");
      refs.turnText.setAttribute("aria-label", text);
    }
  };



  function uiUpdate() {
    const st = soplo.state;
    setTurnText(st.turn);
  }

  const soplo = createSoploState({
    readPieces, writePieces,
    onStatus: setStatus,
    onTurnText: setTurnText,
    onUIUpdate: uiUpdate,
  });

  // Zoom / Rot
  const { applyZoomRot, setZoom, setRot } = applyZoomRotFactory(refs, soplo);
  setStatus("Modo Soplo Libre listo");

  // === SIEMPRE ARRANCAR EN POSICIÓN INICIAL (no restaurar piezas previas) ===
  // Conservamos appearance/zoom/rot si ya estaban; solo reiniciamos las piezas y el historial.
  soplo.restoreOrInit(() => {});   // restaura UI (apariencia/zoom/rot) si existía
  try { soplo.state.history = []; } catch {}
  populateInitialPieces();
  // normaliza turno inicial si no existe
  if (!soplo.state.turn) soplo.state.turn = "rojo";
  soplo.save();

  // Aplicar zoom/rot visibles
  setZoom(soplo.state.zoom ?? 1);
  setRot(soplo.state.rot ?? 0);
  applyZoomRot();
  setTurnText(soplo.state.turn);
  uiUpdate();

  // Herramientas / Historial
  const { tool, registerToolBtn } = toolHelpersFactory(refs, setStatus);
  const { pushHistory, popHistory } = historyHelpersFactory(readPieces, writePieces, soplo);
  pushHistory();

  // === Eliminar botón "Mover pieza (libre)" si quedara en el DOM por HTML viejo ===
  if (refs.btnMoveTool && refs.btnMoveTool.remove) { try { refs.btnMoveTool.remove(); } catch {} }
  // defensivo adicional por texto/data-role:
  const strayMoveBtn = root.querySelector('[data-role="tool-move"], button, a');
  if (strayMoveBtn && /mover pieza/i.test(strayMoveBtn.textContent || "")) {
    try { strayMoveBtn.remove(); } catch {}
  }

  // === Modo mover por defecto ===
  if (tool && typeof tool.set === "function") {
    tool.set("move");
  }

  // Selección / movimiento con bloqueo por turno
  let selectedCell = null;
  const selectCell = (el) => {
    if (selectedCell) selectedCell.classList.remove("is-selected");
    selectedCell = el;
    selectedCell?.classList.add("is-selected");
  };
  const clearSelection = () => {
    if (selectedCell) selectedCell.classList.remove("is-selected");
    selectedCell = null;
  };

  const canSelectCellByTurn = (cell) => {
    const piece = cell?.querySelector?.(".piece");
    if (!piece) return false;
    const pieceSide = getPieceSide(piece);
    const turnSide = normalizeSide(soplo.state.turn);
    return pieceSide && pieceSide === turnSide;
  };

  const movePiece = (fromCell, toCell) => {
    if (!fromCell || !toCell) return;

    // turno correcto
    const originPiece = fromCell.querySelector(".piece");
    const originSide = getPieceSide(originPiece);
    const turnSide = normalizeSide(soplo.state.turn);
    if (!originPiece || originSide !== turnSide) {
      setStatus("No es tu turno para mover esa ficha.");
      return;
    }

    // destino jugable
    if (!isPlayableCell(toCell)) {
      setStatus("Movimiento no permitido: casilla clara (no jugable).");
      return;
    }

    if (toCell.querySelector(".piece")) toCell.querySelector(".piece").remove();
    pushHistory();
    toCell.appendChild(originPiece);
    soplo.save();

    soplo.changeTurn?.();
    setTurnText(soplo.state.turn);
  };

  boardWrap.addEventListener("click", (ev) => {
    const cell = ev.target.closest(".cell");
    if (!cell) return;

    // Averigua herramienta (si el usuario eligió colocar fichas)
    const currentTool = (tool && typeof tool.get === "function") ? tool.get() : "move";

    // Colocar por herramienta (solo casillas oscuras)
    if (currentTool && currentTool !== "move") {
      const xy = xyFromCell(cell);
      if (!xy) return;
      if (!isPlayableXY(xy.x, xy.y)) {
        setStatus("Colocación no permitida: casilla clara (no jugable).");
        return;
      }
      pushHistory();
      switch (currentTool) {
        case "pawn-red":   putPiece(xy.x, xy.y, "rojo",  "pawn"); break;
        case "pawn-black": putPiece(xy.x, xy.y, "negro", "pawn"); break;
        case "king-red":   putPiece(xy.x, xy.y, "rojo",  "king"); break;
        case "king-black": putPiece(xy.x, xy.y, "negro", "king"); break;
      }
      setStatus(`Colocado ${currentTool.replace("-", " ")} en (${xy.x},${xy.y})`);
      soplo.save();
      return;
    }

    // Mover (por defecto)
    const hasPiece = !!cell.querySelector(".piece");
    if (hasPiece) {
      if (!canSelectCellByTurn(cell)) {
        setStatus("No es tu turno para esa ficha.");
        return;
      }
      selectCell(cell);
      setStatus("Celda seleccionada. Haz clic en el destino (solo casillas oscuras).");
    } else if (selectedCell) {
      if (!isPlayableCell(cell)) {
        setStatus("Movimiento no permitido: casilla clara (no jugable).");
        return;
      }
      movePiece(selectedCell, cell);
      clearSelection();
      setStatus("Pieza movida.");
    }
  });

  // Bind base (sin registro del botón mover)
  registerToolBtn(refs.btnPlacePawnRed, "pawn-red");
  registerToolBtn(refs.btnPlacePawnBlack, "pawn-black");
  registerToolBtn(refs.btnPlaceKingRed, "king-red");
  registerToolBtn(refs.btnPlaceKingBlack, "king-black");

  // Revisión
  bind(refs.btnRevisionStart, () => soplo.revisionStart?.());
  bind(refs.btnRevConfirmRed,   () => soplo.revisionConfirm?.("rojo"));
  bind(refs.btnRevConfirmBlack, () => soplo.revisionConfirm?.("negro"));
  bind(refs.btnRevApply,  () => soplo.revisionApply?.());
  bind(refs.btnRevCancel, () => soplo.revisionCancel?.());
  bind(refs.btnRevStepBack, () => soplo.revisionStepBack?.());

  // Pausa / Empate
  bind(refs.btnPauseStart,        () => soplo.pauseStart?.());
  bind(refs.btnPauseConfirmRed,   () => soplo.pauseConfirm?.("rojo"));
  bind(refs.btnPauseConfirmBlack, () => soplo.pauseConfirm?.("negro"));
  bind(refs.btnPauseResume,       () => soplo.pauseResume?.());
  bind(refs.btnPauseCancel,       () => soplo.pauseCancel?.());
  bind(refs.btnDrawStart,         () => soplo.drawStart?.());
  bind(refs.btnDrawConfirmRed,    () => soplo.drawConfirm?.("rojo"));
  bind(refs.btnDrawConfirmBlack,  () => soplo.drawConfirm?.("negro"));

  // Otros
  bind(refs.btnResign, () => soplo.resign?.());
  bind(refs.btnZoomIn,    () => { applyZoomRot({ type:"zoom", delta:+0.1 }); });
  bind(refs.btnZoomOut,   () => { applyZoomRot({ type:"zoom", delta:-0.1 }); });
  bind(refs.btnZoomReset, () => { applyZoomRot({ type:"zoom", reset:true }); });
  bind(refs.btnRotateBoard, () => { applyZoomRot({ type:"rot", toggle:true }); });

  if (refs.btnVolver) {
    refs.btnVolver.textContent = "Volver al menú principal";
    bind(refs.btnVolver, () => {
      try { navigate("/"); }
      catch { try { history.pushState({}, "", "/"); } catch {} try { location.assign("/"); } catch {} }
    });
  }

  // Varios
  bind(refs.btnReiniciar, () => {
    try { soplo.state.history = []; } catch {}
    populateInitialPieces();
    soplo.state.turn = "rojo";
    soplo.save();
    setTurnText(soplo.state.turn);
  });
  bind(refs.btnClearBoard, () => {
    clearPiecesOnly();
    setStatus("Tablero limpio (sin fichas)");
    soplo.save();
  });
  bind(refs.btnPopulateInitial, () => {
    try { soplo.state.history = []; } catch {}
    populateInitialPieces();
    soplo.save();
  });
  bind(refs.btnCambiarTurno, () => {
    soplo.changeTurn?.();
    setTurnText(soplo.state.turn);
  });
  bind(refs.btnDeshacer, () => {
    const ok = popHistory();
    setStatus(ok ? "Deshecho." : "Nada para deshacer.");
    setTurnText(soplo.state.turn);
  });

  // Re-render etiqueta cuando cambie el tema
  document.addEventListener("appearance:colors-changed", () => {
    setTurnText(soplo.state.turn);
  });

  // Montar colapsables (sin el duplicado de Edición)
  // setupEditCollapsible(refs); // ← Eliminado para evitar panel duplicado
  setupRevisionCollapsible(refs);
  setupPartidaCollapsible(refs);
  setupAppearanceCollapsible(refs, soplo);
  setupMediaCollapsibleLazy(refs, setStatus);
}
