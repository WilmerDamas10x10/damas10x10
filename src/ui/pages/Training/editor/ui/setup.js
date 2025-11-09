// src/ui/pages/Training/editor/ui/setup.js

/** Oculta el encabezado duplicado del turno en el editor. */
export function initEditorChrome(container) {
  const tn = container.querySelector("#turn");
  if (tn?.parentElement) tn.parentElement.style.display = "none";
}

/** Marca el estado de edición en el host del tablero. */
export function setEditingFlag(boardEl, placing) {
  if (boardEl) boardEl.setAttribute("data-editing", placing ? "1" : "0");
}
