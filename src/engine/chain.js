// src/engine/chain.js
import { GHOST } from "@rules";

// Encuentra la casilla "mid" (del enemigo capturado) entre from → to
// Encuentra la casilla "mid" (del enemigo capturado) entre from → to
export function findCapturedMid(board, from, to) {
  const R = Array.isArray(board) ? board.length : 0;
  const C = R && Array.isArray(board[0]) ? board[0].length : 0;
  if (!R || !C || !Array.isArray(from) || !Array.isArray(to)) return null;

  const dr0 = to[0] - from[0], dc0 = to[1] - from[1];
  const absR = Math.abs(dr0), absC = Math.abs(dc0);

  // Debe ser un salto en diagonal con longitud >= 2
  if (absR === 0 || absC === 0 || absR !== absC) {
    // Fallback (peón 2 pasos); solo si cae dentro del tablero
    const mr = (from[0] + to[0]) >> 1;
    const mc = (from[1] + to[1]) >> 1;
    return (mr >= 0 && mr < R && mc >= 0 && mc < C) ? [mr, mc] : null;
  }

  const dr = Math.sign(dr0), dc = Math.sign(dc0);
  let r = from[0] + dr, c = from[1] + dc;

  // Avanza por la diagonal, con chequeos de límites
  while (r !== to[0] || c !== to[1]) {
    if (r < 0 || r >= R || c < 0 || c >= C) break;
    if (board[r][c]) return [r, c];
    r += dr; c += dc;
  }

  // Fallback (peón 2 pasos) si el mid directo no se encontró
  const mr = (from[0] + to[0]) >> 1;
  const mc = (from[1] + to[1]) >> 1;
  return (mr >= 0 && mr < R && mc >= 0 && mc < C) ? [mr, mc] : null;
}


// Aplica UN salto: mueve la pieza y deja un GHOST en la mid (no elimina aún)
// Incluye promoción si el peón aterriza en la última fila capturando.
export function applySingleCaptureDeferred(board, from, to, stepState) {
  const nb = board.map(row => row.slice());
  const piece = nb[from[0]][from[1]];

  // mover origen → destino
  nb[from[0]][from[1]] = null;
  nb[to[0]][to[1]] = piece;

  // Promoción inmediata del peón si aterriza en última fila
  const lastRow = nb.length - 1;
  if (piece && piece === piece.toLowerCase() && (to[0] === 0 || to[0] === lastRow)) {
    nb[to[0]][to[1]] = (piece === "r") ? "R" : "N";
  }

  // Marcar la casilla capturada como ghost (bloqueador temporal)
  const mid = findCapturedMid(board, from, to);
  if (mid) {
    const [mr, mc] = mid;
    if (board[mr]?.[mc]) {
      nb[mr][mc] = GHOST;
      (stepState.deferred ??= []).push([mr, mc]); // registrar para limpiar al final
    }
  }
  return nb;
}

// Elimina todos los GHOST creados durante la cadena
export function finalizeDeferred(board, deferred = []) {
  if (!deferred.length) return board;
  const nb = board.map(row => row.slice());
  for (const [r, c] of deferred) nb[r][c] = null;
  return nb;
}
