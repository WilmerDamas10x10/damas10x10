// src/rules/utils.js
// Utilidades puras para el motor de reglas (sin DOM).

import { SIZE, COLOR } from "./constants.js";

/** ¿(r,c) está dentro del tablero? */
export function dentro(r, c) {
  return (
    Number.isInteger(r) && Number.isInteger(c) &&
    r >= 0 && r < SIZE && c >= 0 && c < SIZE
  );
}

/** ¿La celda representa una dama? (letra mayúscula: 'R'/'N') */
export function esDama(cell) {
  return typeof cell === "string" && cell === cell.toUpperCase();
}

/** ¿La celda representa un peón? (letra minúscula: 'r'/'n') */
export function esPeon(cell) {
  return typeof cell === "string" && cell === cell.toLowerCase();
}

/** Color de la pieza ('ROJO' / 'NEGRO'), o null si no aplica */
export function colorOf(cell) {
  if (typeof cell !== "string") return null;
  const ch = cell.toLowerCase();
  if (ch === "r") return COLOR.ROJO;
  if (ch === "n") return COLOR.NEGRO;
  return null;
}

/** Valor de pieza para puntajes/desempates */
export function valorPieza(cell) {
  if (!cell || typeof cell !== "string") return 0;
  return esDama(cell) ? 1.5 : 1; // Dama 1.5; Peón 1.0
}

/** Clonado ligero de un tablero 2D (matriz) */
export function clone(board) {
  return Array.isArray(board) ? board.map(row => row.slice()) : board;
}

/** Singleton para casilla fantasma usada en cadenas diferidas */
export const GHOST = Object.freeze({ type: "ghost", ghost: true });

/** ¿Es un marcador temporal (fantasma) usado durante cadenas? */
export function isGhost(cell) {
  // identidad con el singleton o distintas variantes marcadas como ghost
  return (
    cell === GHOST ||
    (!!cell && typeof cell === "object" && (
      cell.ghost === true || cell.type === "ghost" || cell.kind === "ghost"
    ))
  );
}
