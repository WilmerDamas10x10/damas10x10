// src/ui/pages/Training/editor/paint.js
import { COLOR, mejoresCapturasGlobal } from "@rules";
import {
  clearHints, markOrigin,
  showFirstStepOptions, showRouteFull
} from "./hints.js";
import { bestRoutesFromPos } from "./moves.js";
import { paintSquareHighlight } from "./draw.js";

/**
 * Pinta el estado de ayudas/hints según el tablero y el turno.
 * No guarda estado propio: recibe todo por parámetros.
 *
 * @param {Object} ctx
 * @param {HTMLElement} ctx.boardEl
 * @param {Array<Array<string|null>>} ctx.board
 * @param {"ROJO"|"NEGRO"} ctx.turn
 * @param {(t:string)=>void} ctx.setTurn
 * @param {{pos:[number,number]}|null} ctx.stepState
 * @param {(ss:null|{pos:[number,number]})=>void} ctx.setStepState
 * @param {HTMLElement} [ctx.container]
 * @param {HTMLElement} [ctx.dbgEl]
 * @param {boolean} [ctx.showDebug=false]
 */
export function paintState(ctx) {
  const {
    boardEl, board,
    turn, setTurn,
    stepState, setStepState,
    container, dbgEl, showDebug = false
  } = ctx;

  const log = (msg) => {
    if (!showDebug || !dbgEl) return;
    dbgEl.textContent += msg + "\n";
    dbgEl.scrollTop = dbgEl.scrollHeight;
  };

  clearHints(boardEl);

  // ——— En cadena: mostrar siguientes pasos o cerrar cadena y pasar turno
  let effectiveTurn = turn;
  if (stepState) {
    const routes = bestRoutesFromPos(board, stepState.pos);
    if (routes.length) {
      showFirstStepOptions(boardEl, routes, stepState.pos);
      return;
    }
    // Fin de cadena → limpiar y cambiar turno
    setStepState(null);
    const nextTurn = (turn === COLOR.ROJO) ? COLOR.NEGRO : COLOR.ROJO;
    setTurn(nextTurn);
    if (container) {
      const te = container.querySelector("#turn");
      if (te) te.textContent = nextTurn;
    }
    effectiveTurn = nextTurn;
  }

  // ——— Obligación global (marcar orígenes y una ruta ejemplo)
  const global = mejoresCapturasGlobal(board, effectiveTurn);
  log(`Global.size = ${global.size}`);
  if (global.size) {
    for (const key of global.keys()) {
      const [or, oc] = key.split(",").map(Number);
      markOrigin(boardEl, or, oc);
    }
    const firstKey = [...global.keys()][0];
    const exampleRoutes = global.get(firstKey);
    const [r, c] = firstKey.split(",").map(Number);
    exampleRoutes.forEach(rt => showRouteFull(boardEl, rt, [r, c]));
  } else {
    log("No hay capturas globales.");
  }
}

// ——— Helpers que ya tenías, preservados ———
export function highlightMany(cells, color) {
  cells.forEach(el => paintSquareHighlight(el, color));
}
export function clearHighlights(cells) {
  highlightMany(cells, "");
}
