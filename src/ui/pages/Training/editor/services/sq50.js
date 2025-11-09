// Oscuras cuando (r+c) % 2 === 1  → tablero 10x10 estándar en tu UI
export const DARK_IS_EVEN = false;

/** (r,c) -> índice 1..50 sobre casillas oscuras */
export function rcTo50(r, c, darkIsEven = DARK_IS_EVEN) {
  const dark = ((r + c) % 2 === 0);
  if ((darkIsEven && !dark) || (!darkIsEven && dark)) return null;
  const base = r * 5;
  const idxInRow = (c - (darkIsEven ? (r % 2 ? 1 : 0) : (r % 2 ? 0 : 1))) >> 1;
  return base + idxInRow + 1;
}

/** índice 1..50 -> (r,c) en casillas oscuras */
export function sq50ToRC(n, darkIsEven = DARK_IS_EVEN) {
  const r = Math.floor((n - 1) / 5);
  const k = (n - 1) % 5;
  const offset = darkIsEven ? (r % 2 ? 1 : 0) : (r % 2 ? 0 : 1);
  return { r, c: offset + 2 * k };
}

/** Crea tablero 10x10 con nulls (lo que espera el motor) */
export function mkEmptyBoard() {
  return Array.from({ length: 10 }, () => Array(10).fill(null));
}
