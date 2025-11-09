// ================================
// quick-layout.editor.js
// Coloca GOLDENS / Export Replay (dev) / Mark Undo (dev)
// en una zona configurable: "left-panel" | "right-panel"
// o un dock en esquina: "bottom-right" | "bottom-left" | "top-right" | "top-left"
// Cambia de sitio en caliente con:
//   window.__DEV_setPos("bottom-right")
// o persiste con localStorage.setItem("editor.devpos", "left-panel")
// ================================

const POSITIONS = new Set([
  "left-panel", "right-panel",
  "bottom-right", "bottom-left",
  "top-right", "top-left"
]);

function getPref() {
  try {
    // prioridad: global -> localStorage -> default
    if (typeof window.__DEV_POS === "string" && POSITIONS.has(window.__DEV_POS)) {
      return window.__DEV_POS;
    }
    const ls = localStorage.getItem("editor.devpos");
    if (ls && POSITIONS.has(ls)) return ls;
  } catch {}
  // por defecto intentamos dentro del panel izquierdo
  return "left-panel";
}

function setPref(pos) {
  if (!POSITIONS.has(pos)) return;
  try { localStorage.setItem("editor.devpos", pos); } catch {}
  try { window.__DEV_POS = pos; } catch {}
}

function ensureDock(container) {
  let dock = container.querySelector(".editor-dev-dock");
  if (!dock) {
    dock = document.createElement("div");
    dock.className = "editor-dev-dock";
    Object.assign(dock.style, {
      position: "fixed",
      zIndex: "999",
      display: "flex",
      gap: "10px",
      padding: "10px",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,.18)",
      background: "rgba(255,255,255,.88)",
      backdropFilter: "blur(4px)",
    });
    document.body.appendChild(dock);
  }
  return dock;
}

function positionDock(dock, pos) {
  // limpia anclas
  ["top","right","bottom","left"].forEach(k => dock.style[k] = "auto");
  if (pos === "bottom-right") { dock.style.right = "14px"; dock.style.bottom = "14px"; }
  if (pos === "bottom-left")  { dock.style.left  = "14px"; dock.style.bottom = "14px"; }
  if (pos === "top-right")    { dock.style.right = "14px"; dock.style.top    = "14px"; }
  if (pos === "top-left")     { dock.style.left  = "14px"; dock.style.top    = "14px"; }
}

function findDevButtons(root = document) {
  const out = new Set();

  // Botón GOLDENS (id inyectado por tu parche)
  const goldens = root.querySelector("#btn-goldens-ui");
  if (goldens) out.add(goldens);

  // Export / Mark (por texto, tolerante a estilos)
  root.querySelectorAll("button, [role='button'], .btn").forEach((b) => {
    const txt = (b.textContent || "").replace(/\s+/g," ").trim().toLowerCase();
    if (!txt) return;
    if (txt.includes("export") && txt.includes("replay")) out.add(b);
    if (txt.includes("mark") && txt.includes("undo")) out.add(b);
  });

  return Array.from(out).filter(Boolean);
}

function findLeftPanel(container) {
  return (
    container.querySelector("#tools") ||
    container.querySelector(".toolbar-vertical") ||
    container.querySelector("[data-area='left']") ||
    container.querySelector(".layout-editor .area-left") ||
    // como último recurso: la primera columna “Turno”
    container.querySelector(".toolbar, .col, .card")
  );
}

function findRightPanel(container) {
  return (
    container.querySelector(".area-right") ||
    // panel de herramientas a la derecha (donde están Vaciar/Agregar/etc.)
    container.querySelector("#editor-tools, .tools, .tools-right") ||
    // heurística: el panel que está a la derecha del tablero
    (function(){
      const board = container.querySelector("#board");
      if (!board) return null;
      // busca un panel-card a la derecha del tablero
      let best = null, bestDx = -1;
      document.querySelectorAll(".card, .col, .panel").forEach(el=>{
        const rB = board.getBoundingClientRect?.();
        const rE = el.getBoundingClientRect?.();
        if (!rB || !rE) return;
        const dx = rE.left - rB.right;
        if (dx > 0 && dx > bestDx) { bestDx = dx; best = el; }
      });
      return best;
    })()
  );
}

function ensureRowHost(panel, keyClass) {
  if (!panel) return null;
  let row = panel.querySelector(`:scope > .${keyClass}`);
  if (!row) {
    row = document.createElement("div");
    row.className = keyClass;
    Object.assign(row.style, {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      alignItems: "center",
      marginTop: "10px",
    });
    panel.appendChild(row);

    // etiqueta discreta
    const lbl = document.createElement("div");
    lbl.textContent = "Acciones de desarrollo";
    Object.assign(lbl.style, {
      width: "100%",
      fontSize: "12px",
      opacity: ".55",
      marginBottom: "4px",
    });
    row.appendChild(lbl);
  }
  return row;
}

function moveButtonsTo(target, buttons) {
  if (!target) return;
  buttons.forEach(btn => {
    if (btn && btn.parentElement !== target) {
      btn.style.margin = "0";
      btn.style.display = "inline-flex";
      target.appendChild(btn);
    }
  });
}

function place(container) {
  const pref = getPref();
  const buttons = findDevButtons(container);
  if (!buttons.length) return;

  // oculta dock si existiera
  const existingDock = document.querySelector(".editor-dev-dock");
  if (existingDock) existingDock.style.display = "none";

  if (pref === "left-panel") {
    const panel = findLeftPanel(container);
    const row = ensureRowHost(panel, "editor-dev-row-left");
    if (row) {
      moveButtonsTo(row, buttons);
      row.style.display = "flex";
      return;
    }
  }

  if (pref === "right-panel") {
    const panel = findRightPanel(container);
    const row = ensureRowHost(panel, "editor-dev-row-right");
    if (row) {
      moveButtonsTo(row, buttons);
      row.style.display = "flex";
      return;
    }
  }

  // Esquina (dock flotante)
  const dock = ensureDock(container);
  positionDock(dock, pref);
  dock.style.display = "flex";
  moveButtonsTo(dock, buttons);
}

function installObserver(container) {
  if (container.__editorDevObserver) {
    try { container.__editorDevObserver.disconnect(); } catch {}
  }
  const obs = new MutationObserver(() => {
    try { place(container); } catch {}
  });
  obs.observe(container, { childList: true, subtree: true });
  container.__editorDevObserver = obs;
}

// API global para mover “con una palabra”
try {
  window.__DEV_setPos = function(pos) {
    if (!POSITIONS.has(pos)) {
      console.warn("[devpos] valor inválido:", pos);
      return;
    }
    setPref(pos);
    place(document);
  };
} catch {}

export function applyEditorLayout(container) {
  try {
    place(container);
    installObserver(container);
  } catch (e) {
    console.warn("[quick-layout.editor] no se pudo aplicar layout:", e);
  }
}
