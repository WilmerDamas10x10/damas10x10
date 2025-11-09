// src/engine/chain.geom.js
// Helpers puros de geometría/lectura de trayectorias (sin tocar DOM ni estado)

export const k = (r, c) => `${r},${c}`;

export const isQueenPiece = (cell) =>
  !!cell && typeof cell === "string" && cell === cell.toUpperCase();

export const isPawnCell = (cell) =>
  !!cell && typeof cell === "string" && cell.toLowerCase() === cell;

export const isFirstHop = (from, visited) =>
  (visited instanceof Set && visited.size === 1 && visited.has(k(from[0], from[1])));

// Solo r/R/n/N cuentan como piezas reales
export function isRealPiece(v) {
  if (v == null || typeof v !== "string") return false;
  const s = v.trim();
  return /^(r|R|n|N)$/.test(s);
}

// Puntos del primer capturado (dama=1.5, peón=1.0)
export function firstCapturedPts(board, from, to) {
  const [r1, c1] = from, [r2, c2] = to;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  if (!dr || !dc) return 0;
  if (Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return 0;

  for (let r = r1 + dr, c = c1 + dc; r !== r2 || c !== c2; r += dr, c += dc) {
    const v = board[r]?.[c];
    if (isRealPiece(v)) return (v === v.toUpperCase()) ? 1.5 : 1.0;
  }
  return 0;
}

// PRIMERA pieza real entre from y to (excl extremos)
export function firstRealBetween(board, from, to) {
  const [r1, c1] = from, [r2, c2] = to;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  if (!dr || !dc || Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return null;
  for (let r = r1 + dr, c = c1 + dc; r !== r2 || c !== c2; r += dr, c += dc) {
    const v = board[r]?.[c];
    if (isRealPiece(v)) return [r, c];
  }
  return null;
}

// ¿Hay EXACTAMENTE 1 pieza real entre from y to?
export function hasSingleRealBetween(board, from, to) {
  const [r1, c1] = from, [r2, c2] = to;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);

  if (!dr || !dc) return false;
  const distR = Math.abs(r2 - r1), distC = Math.abs(c2 - c1);
  if (distR !== distC || distR < 2) return false;

  let blockers = 0;
  for (let r = r1 + dr, c = c1 + dc; r !== r2 || c !== c2; r += dr, c += dc) {
    if (isRealPiece(board[r]?.[c])) {
      blockers++;
      if (blockers > 1) return false;
    }
  }
  return blockers === 1;
}

// Aterrizajes posibles de una dama DESPUÉS de saltar la pieza en `at`
export function queenLandingSquaresAfterAt(board, from, at) {
  const [fr, fc] = from, [er, ec] = at;
  const dr = Math.sign(er - fr), dc = Math.sign(ec - fc);

  if (!dr || !dc) return [];
  if (Math.abs(er - fr) !== Math.abs(ec - fc)) return [];

  const R = board.length, C = board[0]?.length || 0;
  const out = [];
  let r = er + dr, c = ec + dc;
  while (r >= 0 && r < R && c >= 0 && c < C) {
    const cell = board[r]?.[c] ?? null;
    if (isRealPiece(cell)) break;
    if (!cell) out.push([r, c]);
    r += dr; c += dc;
  }
  return out;
}
