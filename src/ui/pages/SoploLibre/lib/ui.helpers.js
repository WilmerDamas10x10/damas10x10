// ================================
// ui.helpers.js — utilidades UI y tablero
// ================================
export const bind = (el, fn) => el && el.addEventListener("click", fn);

// Tablero y piezas
export function boardHelpersFactory(boardWrap) {
  const cells = () => boardWrap.querySelectorAll(".cell");
  const idx = (x, y) => y * 10 + x;
  const getCellByXY = (x, y) => cells()[idx(x, y)];
  const makePieceEl = (kind, color) => {
    const p = document.createElement("div");
    p.className = `piece piece--${color} piece--${kind}`;
    if (kind === "king") {
      const crown = document.createElement("div");
      crown.className = "piece__crown";
      p.appendChild(crown);
    }
    return p;
  };
  const putPiece = (x, y, color, kind) => {
    const cell = getCellByXY(x, y);
    if (!cell) return;
    cell.querySelector(".piece")?.remove();
    cell.appendChild(makePieceEl(kind, color));
  };
  const clearPiecesOnly = () => boardWrap.querySelectorAll(".piece").forEach(n => n.remove());

  const readPieces = () => {
    const out = [];
    const all = cells();
    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      const piece = c.querySelector(".piece");
      if (!piece) continue;
      const x = i % 10, y = Math.floor(i / 10);
      const color = piece.classList.contains("piece--rojo") ? "rojo" : "negro";
      const kind  = piece.classList.contains("piece--king") ? "king" : "pawn";
      out.push({ x, y, color, kind });
    }
    return out;
  };
  const writePieces = (pieces) => {
    clearPiecesOnly();
    (pieces || []).forEach(p => putPiece(p.x, p.y, p.color, p.kind));
  };

  return { cells, idx, getCellByXY, makePieceEl, putPiece, clearPiecesOnly, readPieces, writePieces };
}

// Historial
export function historyHelpersFactory(readPieces, writePieces, soplo) {
  const history = [];
  const pushHistory = () => {
    history.push(readPieces());
    if (history.length > 200) history.shift();
  };
  const popHistory = () => {
    const last = history.pop();
    if (!last) return false;
    writePieces(last);
    soplo.save();
    return true;
  };
  return { pushHistory, popHistory, history };
}

// Tools
export function toolHelpersFactory(refs, setStatus) {
  let current = null;
  const all = [];
  const markActive = () => all.forEach(b => b.classList.toggle("is-active", b.dataset.tool === current));
  const registerToolBtn = (btn, name) => {
    if (!btn) return;
    btn.dataset.tool = name;
    all.push(btn);
    btn.addEventListener("click", () => {
      current = name;
      markActive();
      setStatus(current ? `Herramienta: ${current.replace("-", " ")}` : "Sin herramienta seleccionada");
    });
  };
  return { registerToolBtn, markActive, tool: { get: () => current } };
}

// Zoom / Rot
export function applyZoomRotFactory(refs, soplo) {
  let zoom = 1, rot = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const apply = () => {
    refs.root.style.setProperty("--board-zoom", String(zoom));
    refs.root.style.setProperty("--board-rot", rot + "deg");
    refs.zoomVal && (refs.zoomVal.textContent = Math.round(zoom * 100) + "%");
    soplo.setZoomRot({ zoom, rot });
  };
  const setZoom = (z) => { zoom = z; apply(); };
  const setRot  = (r) => { rot = r; apply(); };
  // controlador simple
  const applyZoomRot = (opts={}) => {
    if (opts.type === "zoom") {
      if (opts.reset) zoom = 1;
      else zoom = clamp(Math.round((zoom + (opts.delta||0)) * 10) / 10, 0.6, 2.0);
      apply();
    } else if (opts.type === "rot") {
      rot = opts.toggle ? (rot === 0 ? 180 : 0) : (opts.value ?? rot);
      apply();
    } else apply();
  };
  // base del tablero (CSS)
  refs.root.style.setProperty("--board-base", "640px");
  return { applyZoomRot, setZoom, setRot };
}
