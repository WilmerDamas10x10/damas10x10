// ================================
// src/ui/pages/SoploLibre/ui.board.js
// Tablero 10x10: primera casilla (0,0) = OSCURA
// ================================

export function createBoard(container) {
  container.innerHTML = "";

  const board = document.createElement("div");
  board.className = "board10x10";

  // (0,0) oscuro; alterna izquierda→derecha y por filas
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const cell = document.createElement("div");
      const isDark = (x + y) % 2 === 0; // (0,0) negro/oscuro
      cell.className = `cell ${isDark ? "dark" : "light"}`;
      board.appendChild(cell);
    }
  }

  container.appendChild(board);
  return board;
}
