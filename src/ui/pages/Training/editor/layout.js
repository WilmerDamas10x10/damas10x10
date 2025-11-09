// src/ui/pages/Training/editor/layout.js

/**
 * Centra tablero y sidebar en una sola fila flex:
 * [ Dock de turno ] [ #board ] [ #toolbar ]
 * y limita el ancho total, con margen auto para que quede centrado.
 */
export function centerBoardWithSidebar(container) {
  const board = container.querySelector("#board");
  if (!board) return;

  const toolbar = container.querySelector("#toolbar");

  // Crea/recupera la fila contenedora
  let row = container.querySelector("#board-row");
  if (!row) {
    row = document.createElement("div");
    row.id = "board-row";
    Object.assign(row.style, {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: "24px",
      width: "100%",
      maxWidth: "1400px",      // ancho máximo del bloque completo
      margin: "0 auto",        // ← centrado horizontal
      padding: "8px 8px 0 8px",
      boxSizing: "border-box",
    });

    // Inserta la fila al principio del contenedor del editor
    const host = board.parentElement || container;
    host.insertBefore(row, host.firstChild);
  }

  // Mueve tablero y toolbar a la fila (si ya están, no pasa nada)
  if (board.parentElement !== row) row.appendChild(board);
  if (toolbar && toolbar.parentElement !== row) row.appendChild(toolbar);

  // Asegura que no se estiren
  board.style.flex = "0 0 auto";
  if (toolbar) toolbar.style.flex = "0 0 auto";

  // Para overlays/dock relativos al tablero
  if (getComputedStyle(board).position === "static") {
    board.style.position = "relative";
  }
}

/**
 * Inserta un dock de turno como *columna izquierda* de la fila (#board-row),
 * NO absoluto: es un ítem flex, así el bloque total se centra perfecto.
 */
export function mountTurnDockFixed(
  boardEl,
  { getTurnLabel = () => "", onSwitch = () => {} } = {}
) {
  if (!boardEl) return { update() {}, destroy() {} };

  const row = boardEl.parentElement; // debe ser #board-row tras centerBoardWithSidebar
  if (!row) return { update() {}, destroy() {} };

  let dock = row.querySelector("#turn-dock");
  if (!dock) {
    dock = document.createElement("div");
    dock.id = "turn-dock";
    Object.assign(dock.style, {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      background: "rgba(255,255,255,0.92)",
      border: "1px solid rgba(0,0,0,0.15)",
      borderRadius: "10px",
      padding: "8px 10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      flex: "0 0 auto",
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      gap: "6px",
      alignItems: "baseline",
    });

    const label = document.createElement("span");
    label.textContent = "Turno:";
    label.style.fontWeight = "600";

    const text = document.createElement("span");
    text.id = "turn-dock-text";
    text.style.fontWeight = "800";

    header.appendChild(label);
    header.appendChild(text);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Cambiar turno";
    Object.assign(btn.style, {
      width: "100%",
      padding: "6px 10px",
      borderRadius: "8px",
      border: "1px solid #999",
      background: "#fff",
      cursor: "pointer",
    });
    btn.addEventListener("click", onSwitch);

    dock.appendChild(header);
    dock.appendChild(btn);

    // ← Dock a la IZQUIERDA del tablero (antes del board en la fila)
    row.insertBefore(dock, boardEl);
  }

  const update = () => {
    const t = dock.querySelector("#turn-dock-text");
    if (t) t.textContent = getTurnLabel();
  };
  update();

  const destroy = () => dock.remove();

  return { update, destroy };
}
