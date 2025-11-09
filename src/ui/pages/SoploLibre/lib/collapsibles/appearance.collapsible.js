// ================================================
// src/ui/pages/SoploLibre/lib/collapsibles/appearance.collapsible.js
// Apariencia: Modelos de TABLERO + FICHAS (4 modelos de fichas)
// ================================================
export function setupAppearanceCollapsible(refs, soplo) {
  // Root del modo
  const modeRoot =
    (refs.root && refs.root.closest?.(".soploLibre")) ||
    document.querySelector(".soploLibre") ||
    refs.root ||
    document.body;

  // Host donde va el colapsable
  const host = refs.appearanceHost || refs.side || modeRoot;

  // Evitar duplicados si ya existe nuestro panel
  if (host.querySelector('[data-collapsible="appearance-v2"]')) return;

  // === CONTENEDOR DEL GRUPO ===
  const wrap = document.createElement("div");
  wrap.className = "soploLibre__group";
  host.appendChild(wrap);

  const title = document.createElement("div");
  title.className = "soploLibre__groupTitle";
  title.textContent = "Apariencia";
  wrap.appendChild(title);

  // Toggle del colapsable
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "btn btn--subtle btn--block";
  toggleBtn.setAttribute("data-collapsible", "appearance-v2");
  toggleBtn.setAttribute("aria-expanded", "false");
  toggleBtn.textContent = "Colores de tablero y modelo de fichas";
  wrap.appendChild(toggleBtn);

  const panel = document.createElement("div");
  panel.className = "mediaPanel"; // reutiliza estilos (grid/padding)
  panel.style.display = "none";
  wrap.appendChild(panel);

  // ===========================
  // 1) MODELOS DE TABLERO
  // ===========================
  const boardTitle = document.createElement("div");
  boardTitle.className = "soploLibre__groupTitle";
  boardTitle.textContent = "Modelo de tablero";
  panel.appendChild(boardTitle);

  const boardRow = document.createElement("div");
  boardRow.className = "mediaPanel__grid"; // responsive
  panel.appendChild(boardRow);

  const BOARD_THEMES = ["nogal", "azul", "verde", "gris", "arena"];
  const boardButtons = [];

  function setBoardTheme(theme) {
    // Aplica atributo data-board-theme (tu CSS ya lo usa)
    modeRoot.setAttribute("data-board-theme", theme);

    // Persistencia
    try {
      soplo = soplo || {};
      soplo.state = soplo.state || {};
      soplo.state.appearance = soplo.state.appearance || {};
      soplo.state.appearance.boardTheme = theme;
      if (typeof soplo.save === "function") soplo.save();
    } catch {}

    // Marca activo
    boardButtons.forEach((b) =>
      b.classList.toggle("is-active", b.dataset.theme === theme)
    );
  }

  BOARD_THEMES.forEach((theme) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn gamePanel__btn";
    b.dataset.theme = theme;

    // Etiquetas bonitas
    const labelMap = {
      nogal: "Nogal (madera)",
      azul: "Azul",
      verde: "Verde",
      gris: "Gris",
      arena: "Arena",
    };
    b.textContent = labelMap[theme] || theme;

    b.addEventListener("click", () => setBoardTheme(theme));
    boardRow.appendChild(b);
    boardButtons.push(b);
  });

  // ===========================
  // 2) MODELOS DE FICHAS (4)
  // ===========================
  const piecesTitle = document.createElement("div");
  piecesTitle.className = "soploLibre__groupTitle";
  piecesTitle.style.marginTop = "8px";
  piecesTitle.textContent = "Modelo de fichas";
  panel.appendChild(piecesTitle);

  const piecesRow = document.createElement("div");
  piecesRow.className = "mediaPanel__grid"; // 2x2
  panel.appendChild(piecesRow);

  const PIECES_CLASSES = [
    "pieces--blanco-negro",
    "pieces--azul-rojo",
    "pieces--verde-amarillo",
    "pieces--naranja-celeste",
  ];

  // Por si quedaron clases viejas en el root (limpieza no destructiva)
  const OLD_PIECES = [
    "pieces--clasico","pieces--madera","pieces--ebony","pieces--oscuro",
    "pieces--madera-clara","pieces--madera-oscura","pieces--marron","pieces--crema","pieces--ebony-ivory"
  ];

  function setPiecesClass(cls) {
    // Quita anteriores (nuevas y viejas)
    [...PIECES_CLASSES, ...OLD_PIECES].forEach((c) => modeRoot.classList.remove(c));
    // Aplica nueva
    modeRoot.classList.add(cls);

    // Persistencia
    try {
      soplo = soplo || {};
      soplo.state = soplo.state || {};
      soplo.state.appearance = soplo.state.appearance || {};
      soplo.state.appearance.piecesModel = cls;
      if (typeof soplo.save === "function") soplo.save();
    } catch {}

    // Marca activo
    piecesButtons.forEach((b) =>
      b.classList.toggle("is-active", b.dataset.key === cls)
    );
  }

  const piecesModels = [
    { key: "pieces--blanco-negro",   label: "Blanco / Negro" },
    { key: "pieces--azul-rojo",      label: "Azul / Rojo" },
    { key: "pieces--verde-amarillo", label: "Verde / Amarillo" },
    { key: "pieces--naranja-celeste",label: "Naranja / Celeste" },
  ];

  const piecesButtons = [];
  piecesModels.forEach((m) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn editPanel__btn";
    b.dataset.key = m.key;
    b.textContent = m.label;
    b.addEventListener("click", () => setPiecesClass(m.key));
    piecesRow.appendChild(b);
    piecesButtons.push(b);
  });

  // ===========================
  // ESTADO INICIAL
  // ===========================
  // Board
  let initialBoard = null;
  try { initialBoard = soplo?.state?.appearance?.boardTheme || null; } catch {}
  if (!initialBoard || !BOARD_THEMES.includes(initialBoard)) {
    initialBoard = "nogal"; // default
  }
  setBoardTheme(initialBoard);

  // Pieces
  let initialPieces = null;
  try { initialPieces = soplo?.state?.appearance?.piecesModel || null; } catch {}
  if (!initialPieces || !PIECES_CLASSES.includes(initialPieces)) {
    initialPieces = "pieces--blanco-negro"; // default
  }
  setPiecesClass(initialPieces);

  // ===========================
  // TOGGLE DEL COLAPSABLE
  // ===========================
  toggleBtn.addEventListener("click", () => {
    const open = panel.style.display !== "none";
    panel.style.display = open ? "none" : "";
    toggleBtn.setAttribute("aria-expanded", String(!open));
    toggleBtn.classList.toggle("is-open", !open);
  });

  // Cerrar al hacer click fuera
  document.addEventListener("click", (ev) => {
    if (panel.style.display !== "none" && !wrap.contains(ev.target)) {
      panel.style.display = "none";
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.classList.remove("is-open");
    }
  });
}
