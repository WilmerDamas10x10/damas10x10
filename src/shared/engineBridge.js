// src/shared/engineBridge.js
// Puente único entre UI y motor del Editor/@rules.
// - Reexporta TODO lo que consumen Soplo/Online/IA (compat 100%).
// - Agrega utilidades y wrappers opcionales: captura obligatoria + coronación.
// - No cambia el comportamiento por defecto hasta que los modos usen los wrappers.

///////////////////////////
// Editor (UI Controller)
///////////////////////////
import {
  SIZE, dark, startBoard, drawBoard,
  clearHints, hintMove, showFirstStepOptions, markRouteLabel, paintState,
  makeController, attachBoardInteractions,
} from "../ui/pages/Training/editor/index.js";

import { applySingleCapture as editorApplySingleCapture } from "../ui/pages/Training/editor/moves.js";

export {
  SIZE, dark, startBoard, drawBoard,
  clearHints, hintMove, showFirstStepOptions, markRouteLabel, paintState,
  makeController, attachBoardInteractions,
  editorApplySingleCapture,
};

///////////////////////////
// Motor de reglas (@rules)
///////////////////////////
import * as Rules from "@rules";

// Fallback seguro de colorOf por si el motor no lo exporta
const colorOfFallback = (ch) => {
  if (ch === "r" || ch === "R") return Rules?.COLOR?.ROJO ?? "ROJO";
  if (ch === "n" || ch === "N") return Rules?.COLOR?.NEGRO ?? "NEGRO";
  return null;
};

export const COLOR = Rules.COLOR;
export const colorOf = Rules.colorOf || colorOfFallback;
export const movimientos = Rules.movimientos;
export const aplicarMovimiento = Rules.aplicarMovimiento;

///////////////////////////
// Utilidades comunes
///////////////////////////
export function cloneBoard(b){ return b.map(r => r.slice()); }

// Coronación segura tras mover/capturar (usa tamaño del board)
export function crownIfNeeded(board, to){
  try{
    const [r,c] = Array.isArray(to) ? to : [to?.r, to?.c];
    const size = Array.isArray(board) ? board.length : (typeof SIZE === "number" ? SIZE : 10);
    const piece = board?.[r]?.[c];
    if (piece === "r" && r === 0) board[r][c] = "R";
    if (piece === "n" && r === size - 1) board[r][c] = "N";
  }catch{/* no-op */}
}

// ¿Existe alguna captura disponible para un color?
export function anyCaptureAvailable(board, color){
  try{
    const size = Array.isArray(board) ? board.length : (typeof SIZE === "number" ? SIZE : 10);
    for (let r = 0; r < size; r++){
      for (let c = 0; c < size; c++){
        const cell = board[r]?.[c];
        if (!cell) continue;
        if (colorOf(cell) !== color) continue;
        const mv = movimientos(board, [r, c]) || {};
        const caps = mv.captures || mv.capturas || mv.takes || [];
        if (Array.isArray(caps) && caps.length) return true;
      }
    }
  }catch{/* no-op */}
  return false;
}

// Normaliza para dejar solo rutas de captura (tolera distintas firmas)
export function filterOnlyCaptures(result){
  if (!result) return result;

  // Caso "objeto por pieza"
  if (typeof result === "object" && !Array.isArray(result)){
    const caps = result.captures || result.capturas || result.takes || [];
    return { ...result, captures: caps, capturas: caps, takes: caps, moves: [], movs: [] };
  }

  // Caso "lista de rutas"
  if (Array.isArray(result)){
    const isCap = (r) => {
      const caps = r?.captures || r?.capturas || r?.takes || [];
      return Array.isArray(caps) && caps.length > 0;
    };
    return result.filter(isCap);
  }

  return result;
}

///////////////////////////
// applySingleCapture (seguro)
///////////////////////////
function _fallbackSingleCapture(board, from, to){
  const nb = board.map(r => r.slice());
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = nb[fr][fc];
  if (!piece) return nb;

  const stepR = tr > fr ? 1 : -1;
  const stepC = tc > fc ? 1 : -1;

  let r = fr + stepR, c = fc + stepC;
  let capR = null, capC = null;
  while (r !== tr && c !== tc){
    if (nb[r][c]) { capR = r; capC = c; break; }
    r += stepR; c += stepC;
  }

  nb[tr][tc] = piece;
  nb[fr][fc] = null;
  if (capR != null && capC != null) nb[capR][capC] = null;
  return nb;
}

export function applySingleCapture(board, from, to){
  try{
    return (board && typeof editorApplySingleCapture === "function")
      ? editorApplySingleCapture(board, from, to)
      : _fallbackSingleCapture(board, from, to);
  }catch{
    return _fallbackSingleCapture(board, from, to);
  }
}

///////////////////////////
// Wrappers opcionales (no activados por defecto)
// - movimientosForced(board, piecePos, turnColor, { mustCapture=true })
// - aplicarMovimientoForced(board, payload, turnColor, { mustCapture=true, crown=true })
///////////////////////////
export function movimientosForced(board, pieceOrPos, turnColor, opts = {}){
  const { mustCapture = true } = opts;
  const res = movimientos(board, pieceOrPos) || {};
  if (!mustCapture) return res;

  if (anyCaptureAvailable(board, turnColor)) {
    return filterOnlyCaptures(res);
  }
  return res;
}

export function aplicarMovimientoForced(board, payload, turnColor, opts = {}){
  const { mustCapture = true, crown = true } = opts;

  // Detecta si el payload luce como captura (salto > 1 o ruta con captures)
  const isCapturePayload = (() => {
    const caps = payload?.captures || payload?.capturas || payload?.takes || [];
    if (Array.isArray(caps) && caps.length) return true;
    const from = payload?.from, to = payload?.to;
    if (Array.isArray(from) && Array.isArray(to)) {
      const dr = Math.abs(to[0] - from[0]);
      const dc = Math.abs(to[1] - from[1]);
      return dr > 1 && dc > 1; // salto típico de captura
    }
    return false;
  })();

  // Si hay captura obligatoria y el payload no es captura, bloquear
  if (mustCapture && anyCaptureAvailable(board, turnColor) && !isCapturePayload) {
    return board;
  }

  const nb = aplicarMovimiento(board, payload);
  try{ if (crown) crownIfNeeded(nb, payload?.to); }catch{}
  return nb;
}
