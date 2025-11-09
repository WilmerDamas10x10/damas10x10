// src/ui/pages/Training/editor/state.js
import { SIZE } from "@rules";
export { SIZE };

export const dark = (r, c) => ((r + c) % 2) === 0;

// Coloca NEGRAS ("n") ARRIBA y ROJAS ("r") ABAJO, en casillas oscuras
export function startBoard() {
  const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  const placeRows = (rows, piece) => {
    for (const r of rows) {
      for (let c = 0; c < SIZE; c++) {
        if (dark(r, c)) b[r][c] = piece;
      }
    }
  };

  // 10x10 estándar: 4 filas por lado
  placeRows([0, 1, 2, 3], "n");                             // NEGRAS arriba
  placeRows([SIZE - 4, SIZE - 3, SIZE - 2, SIZE - 1], "r"); // ROJAS abajo

  return b;
}
