// src/ui/pages/Training/editor/overlays/ov2.js
import { mejoresCapturasGlobal } from "@rules";

/* ---------- capa OV2 ---------- */
function ensureOV2Layer(boardEl){
  let layer = boardEl.querySelector(".ov2-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "ov2-layer";
    Object.assign(layer.style, {
      position: "absolute",
      inset: "0",
      zIndex: "9999",
      pointerEvents: "none",
    });
    const s = getComputedStyle(boardEl);
    if (s.position === "static") boardEl.style.position = "relative";
    boardEl.appendChild(layer);
  }
  return layer;
}
function ov2Clear(layer){ if (layer) layer.innerHTML = ""; }

/* ---------- utilidades de posicionamiento ---------- */
/** Intenta localizar el elemento de celda. Si no existe, devuelve null. */
function findCellEl(boardEl, r, c){
  return (
    boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`) ||
    boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`) ||
    boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`) ||
    null
  );
}

/** Rect de una celda (vía DOM si existe; si no, lo calcula a partir del grid). */
function getCellRect(boardEl, r, c, SIZE){
  const hostRect = boardEl.getBoundingClientRect();
  const cellEl = findCellEl(boardEl, r, c);
  if (cellEl) return { rect: cellEl.getBoundingClientRect(), hostRect };

  // Fallback geométrico: divide el área en SIZE x SIZE
  const cellW = hostRect.width  / SIZE;
  const cellH = hostRect.height / SIZE;
  const left  = hostRect.left + (c * cellW);
  const top   = hostRect.top  + (r * cellH);
  return {
    rect: new DOMRect(left, top, cellW, cellH),
    hostRect
  };
}

/* ---------- dibujantes ---------- */
function ov2AddBadge(boardEl, layer, r, c, text, SIZE, cls="ov2-label"){
  const { rect, hostRect } = getCellRect(boardEl, r, c, SIZE);
  const el = document.createElement("div");
  el.className = cls;
  el.textContent = text;
  Object.assign(el.style, {
    position: "absolute",
    left:  (rect.left - hostRect.left + rect.width*0.5) + "px",
    top:   (rect.top  - hostRect.top  + rect.height*0.5) + "px",
    transform: "translate(-50%, -50%)",
    fontWeight: "800",
    fontSize: "16px",
    textShadow: "0 0 2px #fff, 0 0 6px #fff",
    userSelect: "none",
  });
  layer.appendChild(el);
}

function ov2AddStep(boardEl, layer, r, c, num, SIZE){
  const { rect, hostRect } = getCellRect(boardEl, r, c, SIZE);
  const el = document.createElement("div");
  el.className = "ov2-step";
  el.textContent = String(num);
  Object.assign(el.style, {
    position: "absolute",
    left:  (rect.left - hostRect.left + 2) + "px",
    top:   (rect.top  - hostRect.top  + 2) + "px",
    padding: "2px 6px",
    borderRadius: "6px",
    outline: "2px solid rgba(255,180,0,.9)",
    background: "rgba(255,255,255,.9)",
    fontWeight: "800",
    fontSize: "13px",
    userSelect: "none",
  });
  layer.appendChild(el);
}

/* ---------- API pública ---------- */
export function paintOV2(boardEl, board, turn, SIZE){
  // ⛔️ Si hay cadena activa, NO pintar OV2 y limpiar la capa
  if (boardEl?.dataset?.chain === "1") {
    const layer0 = boardEl.querySelector(".ov2-layer");
    if (layer0) layer0.innerHTML = "";
    return;
  }

  const layer = ensureOV2Layer(boardEl);
  ov2Clear(layer);

  const global = mejoresCapturasGlobal(board, turn);
  if (!global || !global.size) return;

  const BRANCH = ["A","B","C","D","E","F","G","H"];

  const extractCaptures = (rt) => {
    const arr = [];
    if (Array.isArray(rt?.captures)) {
      for (const c of rt.captures) if (Array.isArray(c?.at)) arr.push(c.at);
    }
    return arr;
  };
  const extractLandings = (rt, origin) => {
    if (Array.isArray(rt?.path) && rt.path.length > 1) return rt.path.slice(1);
    if (Array.isArray(rt?.steps)) return rt.steps.map(s => s?.to).filter(Boolean);
    if (Array.isArray(rt?.captures) && rt.captures.length && rt.captures[0]?.to) {
      return rt.captures.map(x => x.to).filter(Boolean);
    }
    if (Array.isArray(rt) && rt.length > 1 && Array.isArray(rt[0]) && Array.isArray(rt[1])) {
      return rt.slice(1);
    }
    if (Array.isArray(rt?.to)) return [rt.to];
    if (rt && Array.isArray(rt?.captures) && rt.captures.length && Array.isArray(rt.captures[0]?.at)) {
      const [or, oc] = origin;
      const [er, ec] = rt.captures[0].at;
      const dr = Math.sign(er - or), dc = Math.sign(ec - oc);
      return [[er + dr, ec + dc]];
    }
    return [];
  };

  for (const [key, routes] of global.entries()) {
    const [or, oc] = key.split(",").map(Number);
    const origin = [or, oc];
    const piece  = board[or]?.[oc] ?? null;

    // Pieza obligada
    ov2AddBadge(boardEl, layer, or, oc, "★", SIZE, "ov2-label ov2-star");

    routes.forEach((rt, idx) => {
      // Caídas 1..n
      const landings = extractLandings(rt, origin);
      let n = 1;
      for (const [rr, cc] of landings) ov2AddStep(boardEl, layer, rr, cc, n++, SIZE);

      // Fichas comidas ×
      const caps = extractCaptures(rt);
      for (const [rr, cc] of caps) ov2AddBadge(boardEl, layer, rr, cc, "×", SIZE, "ov2-label ov2-kill");

      // Ramas A/B/C…
      if (routes.length > 1 && landings.length) {
        const tag = BRANCH[idx] || String.fromCharCode(65 + (idx % 26));
        const [rr, cc] = landings[0];
        ov2AddBadge(boardEl, layer, rr, cc, tag, SIZE, "ov2-label ov2-branch");
      }

      // Destino final ◎ (+ coronación ♕)
      if (landings.length) {
        const last = landings[landings.length - 1];
        ov2AddBadge(boardEl, layer, last[0], last[1], "◎", SIZE, "ov2-label ov2-end");
        if (piece && piece === piece.toLowerCase()) {
          const row = last[0];
          if ((piece === "r" && row === 0) || (piece === "n" && row === SIZE - 1)) {
            ov2AddBadge(boardEl, layer, last[0], last[1], "♕", SIZE, "ov2-label ov2-crown");
          }
        }
      }
    });
  }
}

export function installOV2Guard(boardEl, repaint){
  if (boardEl.__ov2GuardInstalled) return;
  boardEl.__ov2GuardInstalled = true;

  const mo = new MutationObserver((mutList) => {
    let removedLayer = false;
    for (const m of mutList){
      m.removedNodes?.forEach(n => {
        if (n.nodeType === 1 && n.classList?.contains("ov2-layer")) removedLayer = true;
      });
    }
    if (removedLayer) {
      requestAnimationFrame(() => requestAnimationFrame(repaint));
    }
  });
  mo.observe(boardEl, { childList: true });
}
