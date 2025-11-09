import { isGhost } from "@rules";

export const isEmptyOrGhost = (cell) => !cell || isGhost(cell);

// Cuenta bloqueadores REALES (ignora GHOST) entre a y b (excluye extremos)
export function countRealBlockers(board, a, b) {
  let blockers = 0;
  const dr = Math.sign(b[0]-a[0]), dc = Math.sign(b[1]-a[1]);
  let r = a[0] + dr, c = a[1] + dc;
  while (r !== b[0] || c !== b[1]) {
    const v = board[r][c];
    if (v && !isGhost(v)) blockers++;
    r += dr; c += dc;
  }
  return blockers;
}
