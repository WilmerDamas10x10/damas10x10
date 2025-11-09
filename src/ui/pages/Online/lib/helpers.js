// ================================
// src/ui/pages/Online/lib/helpers.js
// Utilidades compartidas para modo Online
// - Sanitización de tablero (NO fuerza paridad)
// - Coronación (crownIfNeeded)
// - Hash de estado local (estable) para sincronización
// - Utilidades de clonación y paths
// ================================

import { SIZE, COLOR } from "../../../../shared/engineBridge.js";

// Piezas válidas en este proyecto
export const PIECES_OK = new Set(["r", "n", "R", "N", ""]);

/** Clona una matriz 10×10 (board) */
export function clone(board) {
  return board.map(row => row.slice());
}

/** Devuelve el último elemento de un array */
export function last(arr) {
  return arr[arr.length - 1];
}

/** Determina si una ruta de movimiento tiene al menos una captura */
export function routeHasCapture(route) {
  if (!Array.isArray(route) || route.length < 2) return false;
  for (let i = 1; i < route.length; i++) {
    const [r1, c1] = route[i - 1];
    const [r2, c2] = route[i];
    if (Math.abs(r1 - r2) >= 2 || Math.abs(c1 - c2) >= 2) return true;
  }
  return false;
}

/** Devuelve el caracter de celda (para panel DEBUG) */
export function cellChar(ch) {
  return PIECES_OK.has(ch) ? (ch || ".") : ".";
}

/**
 * Sanitiza un tablero SIN forzar paridad:
 * - Garantiza 10x10.
 * - Sustituye símbolos inválidos por "".
 * - No borra por (r+c)%2: respeta la convención del respaldo.
 */
export function sanitizeBoard(board) {
  const out = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => {
      const v = (board?.[r]?.[c]) ?? "";
      return PIECES_OK.has(v) ? v : "";
    })
  );
  return out;
}

/**
 * (Opcional) Limpia piezas en casillas no jugables (por si quieres forzarlo manualmente).
 * No se usa automáticamente para no romper el startBoard del respaldo.
 */
export function scrubNonPlayableSquares(board, isPlayableFn) {
  if (typeof isPlayableFn !== "function") return board;
  const out = clone(board);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isPlayableFn(r, c)) out[r][c] = "";
    }
  }
  return out;
}

/**
 * Coronación si corresponde:
 * - 'r' (rojo) corona a 'R' al llegar a la última fila (abajo, r == SIZE-1)
 * - 'n' (negro) corona a 'N' al llegar a la primera fila (arriba, r == 0)
 * @param {string[][]} board matriz 10x10 (mutable)
 * @param {[number, number] | null} to celda destino [r,c]
 */
export function crownIfNeeded(board, to) {
  if (!to || !Array.isArray(to) || to.length !== 2) return;
  const r = to[0] | 0;
  const c = to[1] | 0;
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;

  const v = board?.[r]?.[c];
  if (v === "r" && r === SIZE - 1) {
    board[r][c] = "R";
  } else if (v === "n" && r === 0) {
    board[r][c] = "N";
  }
}

/** String estable para el board (10x10) + turno */
function stableBoardString(board, turn) {
  const rows = [];
  for (let r = 0; r < SIZE; r++) {
    const row = [];
    for (let c = 0; c < SIZE; c++) {
      const v = (board?.[r]?.[c]) ?? "";
      row.push(PIECES_OK.has(v) ? v : "");
    }
    rows.push(row.join(""));
  }
  const t = (turn === COLOR.NEGRO) ? "N" : "R";
  return rows.join("|") + "#" + t;
}

/** djb2 hash (uint32) */
function djb2(str) {
  let h = 5381 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) + str.charCodeAt(i)) >>> 0; // h*32 + h + char
  }
  return h >>> 0;
}

/** Genera un hash estable del estado (tablero + turno) */
export function stateHash(board, turn) {
  return djb2(stableBoardString(board, turn));
}

/** Convierte el tablero a texto 10×10 para debug */
export function boardToAscii(board) {
  return Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => cellChar((board?.[r]?.[c]) ?? ""))
      .join("")
  ).join("\n");
}
