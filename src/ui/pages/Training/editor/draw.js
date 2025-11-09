// Usamos SOLO background-color para no tapar las texturas de cells.css
export function drawBoard(boardEl, board, SIZE, dark){
  let html = `<div class="board">`;
  for (let r = 0; r < SIZE; r++){
    for (let c = 0; c < SIZE; c++){
      const isDark = dark(r, c);
      const v  = board[r][c];

      // Usa clases de pieza (se pintan por CSS con tus imágenes)
      const pieceClass =
        v === 'r' ? 'piece piece--w'  : // peón blanco (tu archivo)
        v === 'R' ? 'piece piece--wk' :
        v === 'n' ? 'piece piece--b'  :
        v === 'N' ? 'piece piece--bk' : '';

      const fallback = isDark ? '#5a3d2b' : '#f0d9b5'; // solo color de respaldo

      html += `<div id="sq-${r}-${c}"
                     data-r="${r}" data-c="${c}"
                     data-dark="${isDark ? '1' : '0'}"
                     class="square ${isDark ? 'dark' : 'light'}"
                     style="background-color:${fallback}">`;

      if (pieceClass) html += `<span class="${pieceClass}"></span>`;

      html += `</div>`;
    }
  }
  html += `</div>`;
  boardEl.innerHTML = html;
}


// Resalta/des-resalta una casilla usando la clase CSS .sq-highlight
export function paintSquareHighlight(cellEl, color) {
  if (!cellEl) return;
  if (color) {
    cellEl.classList.add("sq-highlight");
  } else {
    cellEl.classList.remove("sq-highlight");
  }
}
