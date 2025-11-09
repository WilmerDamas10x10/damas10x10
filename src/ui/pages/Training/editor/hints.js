// src/ui/pages/Training/editor/hints.js
export function clearHints(boardEl) {
  if (!boardEl) return;

  // 1) elimina overlays creados por hints (burbujas y etiquetas)
  boardEl.querySelectorAll(".hint-step,.hint-label").forEach(n => n.remove());

  // 2) limpia datasets/clases en casillas marcadas
  boardEl.querySelectorAll("[data-move],[data-step],.hint-move,.hint-step,.hint-origin,.hint-hop").forEach(tile => {
    delete tile.dataset.move;
    delete tile.dataset.step;
    tile.classList.remove("hint-move","hint-step","hint-origin","hint-hop");
    const badge = tile.querySelector(".hop-index");
    if (badge) badge.remove();
    tile.style.outline = "";
    tile.style.outlineOffset = "";
    tile.style.boxShadow = "";
  });

  // 3) limpia capa de dibujos (#hints) si existe
  const hintsLayer = boardEl.parentElement?.querySelector("#hints");
  if (hintsLayer) hintsLayer.innerHTML = "";
}

export function markOrigin(boardEl, r,c){
  const el = boardEl.querySelector(`#sq-${r}-${c}`);
  if (!el) return;
  el.classList.add('hint-origin');
  el.setAttribute('data-origin','1');
}

export function markHop(boardEl, r,c, idx){
  const el = boardEl.querySelector(`#sq-${r}-${c}`);
  if (!el) return;
  el.classList.add('hint-hop');
  if (idx != null){
    const badge = document.createElement('span');
    badge.className = 'hop-index';
    badge.textContent = String(idx);
    el.appendChild(badge);
  }
}


// Marca un destino de movimiento simple en la casilla del tablero
export function hintMove(boardEl, to, payload /* color no usado: estilos via CSS */) {
  const [r, c] = Array.isArray(to) ? to : [to[0], to[1]];
  const tile = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  if (!tile) return;

  // Guarda el movimiento para que el handler de clicks lo lea
  tile.dataset.move = JSON.stringify(payload);

  // Estilo visual por clase (definido en CSS)
  tile.classList.add("hint-move");
}


// Pinta todos los aterrizajes y deja clickable solo el primer salto de cada ruta


// Muestra las opciones del PRIMER paso de captura para un origen dado.
// Soporta: {steps:[{to}]}, {to:[r,c]}, array de casillas,
// y {captures:[...]} (cap[i].to o cap[i].at / [r,c] → aterrizaje detrás).
export function showFirstStepOptions(boardEl, routes, origin) {
  if (!boardEl || !routes || !routes.length) return;
  const [or, oc] = origin;
  const seen = new Set();

  const pickFirstTo = (rt) => {
    if (rt && Array.isArray(rt.steps) && rt.steps.length && Array.isArray(rt.steps[0]?.to)) {
      return rt.steps[0].to;
    }
    if (rt && Array.isArray(rt.to)) return rt.to;
    if (Array.isArray(rt) && rt.length > 1 && Array.isArray(rt[0]) && Array.isArray(rt[1])) {
      for (let i = 0; i < rt.length - 1; i++) {
        const a = rt[i], b = rt[i + 1];
        if (a[0] === or && a[1] === oc) return b;
      }
    }
    if (rt && Array.isArray(rt.captures) && rt.captures.length) {
      const cap0 = rt.captures[0];
      if (Array.isArray(cap0?.to)) return cap0.to;
      const capCell = Array.isArray(cap0?.at) ? cap0.at : (Array.isArray(cap0) ? cap0 : null);
      if (capCell) {
        const dr = Math.sign(capCell[0] - or);
        const dc = Math.sign(capCell[1] - oc);
        return [capCell[0] + dr, capCell[1] + dc]; // aterrizaje detrás
      }
    }
    return null;
  };

  for (const rt of routes) {
    const to = pickFirstTo(rt);
    if (!to) continue;
    const [r, c] = to;
    const key = `${r},${c}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const tile = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!tile) continue;

    // Guardamos el primer salto
    tile.dataset.step = JSON.stringify({ from: [or, oc], to: [r, c] });

    // Estilo visual por clase (definido en CSS)
    tile.classList.add("hint-step");
  }
}


export function showRouteFull(boardEl, route, origin){
  const last = route.path.at(-1);
  hintMove(boardEl, last, { from: origin, to: last, captures: route.captures }, '#c33');
  for (let i = 1; i < route.path.length - 1; i++){
    const [pr, pc] = route.path[i];
    const el = boardEl.querySelector(`#sq-${pr}-${pc}`);
    if (el) el.style.outline = '2px dashed #c88';
  }
}

// === Hints básicos para verificación visual ===

// Etiqueta en el ORIGEN (A, B, C...) con texto opcional
export function markRouteLabel(boardEl, pos, label, opts = {}) {
  if (!boardEl || !pos) return;
  const [r, c] = pos;
  const tile = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  if (!tile) return;

  tile.style.position = tile.style.position || "relative";

  let el = tile.querySelector(".hint-label");
  if (!el) {
    el = document.createElement("div");
    el.className = "hint-label";
    el.style.position = "absolute";
    el.style.top = "4px";
    el.style.left = "4px";
    el.style.fontSize = "12px";
    el.style.fontWeight = "700";
    el.style.padding = "2px 4px";
    el.style.background = "rgba(255,255,255,0.85)";
    el.style.border = "1px solid rgba(0,0,0,0.3)";
    el.style.borderRadius = "4px";
    el.style.userSelect = "none";
    el.style.pointerEvents = "none";
    tile.appendChild(el);
  }
  el.textContent = String(label ?? "");
  if (opts && opts.text) el.title = String(opts.text);
}

// Número ①②③… sobre cada casilla de una ruta
export function markStep(boardEl, to, n) {
  if (!boardEl || !to) return;
  const [r, c] = to;
  const tile = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  if (!tile) return;

  tile.style.position = tile.style.position || "relative";

  let el = tile.querySelector(".hint-step");
  if (!el) {
    el = document.createElement("div");
    el.className = "hint-step";
    el.style.position = "absolute";
    el.style.bottom = "4px";
    el.style.right  = "4px";
    el.style.width = "20px";
    el.style.height = "20px";
    el.style.borderRadius = "50%";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.fontSize = "12px";
    el.style.fontWeight = "700";
    el.style.background = "rgba(255,255,255,0.85)";
    el.style.border = "1px solid rgba(0,0,0,0.3)";
    el.style.userSelect = "none";
    el.style.pointerEvents = "none";
    tile.appendChild(el);
  }
  el.textContent = String(n ?? "");
}

// Pintado mínimo (si el Editor lo llama, al menos limpiamos/actualizamos)
export function paintState({ boardEl /*, board, turn, ...*/ }) {
  // Por ahora, solo limpiamos overlays antiguos.
  clearHints(boardEl);
}
