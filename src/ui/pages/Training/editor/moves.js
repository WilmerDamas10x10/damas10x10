// src/ui/pages/Training/editor/moves.js
import { movimientos } from "@rules";
import { SIZE } from "./state.js";

/**
 * Encuentra la casilla capturada entre `from` y `to` avanzando por la diagonal.
 * Devuelve la primera casilla NO vacía encontrada; si no la hay, usa el punto medio.
 * @param {Array<Array<("r"|"R"|"n"|"N"|null)>>} b - Tablero
 * @param {[number, number]} from - Origen [r,c]
 * @param {[number, number]} to - Destino [r,c]
 * @returns {[number, number]} coordenadas [r,c] de la pieza capturada
 */
export function findCapturedBetween(b, from, to) {
  const dr = Math.sign(to[0] - from[0]);
  const dc = Math.sign(to[1] - from[1]);
  let r = from[0] + dr, c = from[1] + dc;

  // Importante: condición correcta es OR (||), no AND (&&)
  while (r !== to[0] || c !== to[1]) {
    if (b[r][c]) return [r, c];
    r += dr; c += dc;
  }
  // Fallback (por si la UI manda un salto de 2)
  return [ (from[0] + to[0]) >> 1, (from[1] + to[1]) >> 1 ];
}

/**
 * Aplica un solo salto de captura (peón o dama).
 * - Mueve la pieza de `from` a `to`
 * - Elimina la primera pieza encontrada en la diagonal entre ambos
 * - Promociona el peón si aterriza en la fila de coronación
 * @param {Array<Array<("r"|"R"|"n"|"N"|null)>>} board - Tablero
 * @param {[number, number]} from - Origen [r,c]
 * @param {[number, number]} to - Destino [r,c]
 * @returns {Array<Array<("r"|"R"|"n"|"N"|null)>>} nuevo tablero
 */
export function applySingleCapture(board, from, to) {
  // Copia superficial por filas
  const b = board.map(r => r.slice());

  const piece = b[from[0]][from[1]];
  b[from[0]][from[1]] = null;

  // Quitar la pieza capturada (la 1ª que encontremos entre from y to)
  const dr = Math.sign(to[0] - from[0]);
  const dc = Math.sign(to[1] - from[1]);
  let r = from[0] + dr, c = from[1] + dc;

  // Importante: condición correcta es OR (||), no AND (&&)
  while (r !== to[0] || c !== to[1]) {
    if (b[r][c]) { b[r][c] = null; break; }
    r += dr; c += dc;
  }

  // Colocar pieza en destino con PROMOCIÓN si corresponde
  let out = piece;
  // Con la orientación actual: ROJAS (r) suben → coronan en fila 0
  // NEGRAS (n) bajan       → coronan en fila SIZE - 1
  if (piece === "r" || piece === "n") {
    const promoRow = (piece === "r") ? 0 : (SIZE - 1);
    if (to[0] === promoRow) out = piece.toUpperCase();
  }

  b[to[0]][to[1]] = out;
  return b;
}

/**
 * Devuelve las rutas de captura de máxima longitud para una posición dada.
 * @param {Array<Array<unknown>>} b - Tablero
 * @param {[number, number]} pos - Posición [r,c]
 * @returns {Array<{captures: Array<any>}>} rutas con longitud máxima
 */
export function bestRoutesFromPos(b, pos) {
  const info = movimientos(b, pos) || {};
  const captures = Array.isArray(info.captures) ? info.captures : [];
  if (!captures.length) return [];

  const maxLen = Math.max(...captures.map(rt => (rt?.captures?.length ?? 0)));
  return captures.filter(rt => (rt?.captures?.length ?? 0) === maxLen);
}
