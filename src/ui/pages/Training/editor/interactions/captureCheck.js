// src/ui/pages/Training/editor/interactions/captureCheck.js
// ¿Quedan capturas REALES desde `from`? (puro; depende de funciones pasadas por parámetro)

export function hasAnyRealCapture(
  board, from, visited, origin0, SIZE,
  colorOf_, isQueenCell_, isFirstHop_, crossesOrLandsVisited_, isGhost_
) {
  const piece = board?.[from[0]]?.[from[1]];
  if (!piece) return false;
  const myColor = colorOf_(piece);
  const isQ = isQueenCell_(piece);
  const dirs = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  // Peón: salto corto
  if (!isQ) {
    for (const [dr, dc] of dirs) {
      const mr = from[0] + dr, mc = from[1] + dc;          // casilla del enemigo
      const lr = from[0] + 2 * dr, lc = from[1] + 2 * dc;  // aterrizaje
      if (lr < 0 || lr >= SIZE || lc < 0 || lc >= SIZE) continue;
      if (mr < 0 || mr >= SIZE || mc < 0 || mc >= SIZE) continue;

      const mid = board[mr][mc];
      if (mid && !isGhost_(mid) && colorOf_(mid) !== myColor && !board[lr][lc]) {
        // sin cruzar/aterrizar visitadas
        if (!crossesOrLandsVisited_(from, [lr, lc], visited, false, origin0)) return true;
      }
    }
    return false;
  }

  // Dama: deslizamiento, 1 enemigo en la línea
  for (const [dr, dc] of dirs) {
    let rr = from[0] + dr, cc = from[1] + dc;
    let enemies = 0, friendly = 0;

    while (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) {
      const cell = board[rr][cc];

      if (!cell) {
        // vacío: si ya vimos 1 enemigo, este es aterrizaje posible
        if (enemies === 1) {
          const crosses = crossesOrLandsVisited_(
            from, [rr, cc], visited,
            isQ && !isFirstHop_(from, visited),
            origin0
          );
          if (!crosses) return true;
        }
        rr += dr; cc += dc;
        continue;
      }

      if (isGhost_(cell)) { rr += dr; cc += dc; continue; } // fantasmas no cuentan

      if (colorOf_(cell) === myColor) { friendly++; break; } // aliado corta
      enemies++;
      if (enemies > 1) break; // más de 1 enemigo corta
      rr += dr; cc += dc;
    }
  }
  return false;
}
