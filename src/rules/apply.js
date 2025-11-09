// src/rules/apply.js
import { SIZE } from "./constants.js";

// Aplica un movimiento simple (sin capturas en cadena).
// Espera un objeto: { from:[r,c], to:[r,c], captures?:[] }
// Nota: Las capturas por pasos ya las maneja el Editor con applySingleCapture().
export function aplicarMovimiento(board, move) {
  if (!board || !move) return board;

  const nb = board.map(row => row.slice());
  const [fr, fc] = move.from || [];
  const [tr, tc] = move.to   || [];
  if (
    fr == null || fc == null || tr == null || tc == null ||
    !nb[fr] || !nb[tr]
  ) return board;

  const piece = nb[fr][fc];
  if (!piece) return board;

  // mover pieza
  nb[fr][fc] = null;
  nb[tr][tc] = piece;

  // coronación (promoción) de peón
  // rojas (r) coronan arriba (fila 0) → R
  // negras (n) coronan abajo (fila SIZE-1) → N
  if (piece === "r" && tr === 0) nb[tr][tc] = "R";
  if (piece === "n" && tr === SIZE - 1) nb[tr][tc] = "N";

  return nb;
}
