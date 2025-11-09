// src/ui/lib/uiFX.js
// Efectos visuales simples para el Editor

// ——— Utiles internos ———
function measureInViewport(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function ensureLayer() {
  // Reutilizamos la capa global si ya existe (la misma que usa ghostAnim)
  let layer = document.querySelector(".ghost-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "ghost-layer";
    Object.assign(layer.style, {
      position: "fixed",
      left: "0",
      top: "0",
      right: "0",
      bottom: "0",
      pointerEvents: "none",
      zIndex: "9999",
    });
    document.body.appendChild(layer);
  }
  return layer;
}

function makeGhostFromPiece(pieceEl) {
  const g = document.createElement("div");
  // Copiamos todas las clases de la pieza real para que se vea igual
  g.className = pieceEl.className;
  // Y añadimos una marca para poder animarla sin tocar el original
  if (!g.classList.contains("piece")) g.classList.add("piece");
  Object.assign(g.style, {
    position: "fixed",
    willChange: "transform, opacity, filter",
    pointerEvents: "none",
  });
  return g;
}

// ——— Zoom corto al seleccionar la pieza ———
export function triggerPieceZoom(boardEl, [r, c], opts = {}) {
  try {
    const tile = boardEl?.querySelector?.(`[data-r="${r}"][data-c="${c}"]`);
    if (!tile) return false;
    const piece = tile.querySelector(".piece");
    if (!piece) return false;

    const cls = opts.className || "pulse-zoom";
    const dur = Math.max(120, opts.duration || 220);

    // Reiniciar si estaba en curso
    piece.classList.remove(cls);
    // eslint-disable-next-line no-unused-expressions
    piece.offsetWidth;

    piece.style.animationDuration = `${dur}ms`;
    piece.classList.add(cls);

    setTimeout(() => {
      piece.classList.remove(cls);
      piece.style.animationDuration = "";
    }, dur + 80);

    return true;
  } catch {
    return false;
  }
}

// ——— Desvanecer pieza capturada mediante CLON fantasma ———
export function triggerCapturedVanish(boardEl, [r, c], opts = {}) {
  try {
    const tile = boardEl?.querySelector?.(`[data-r="${r}"][data-c="${c}"]`);
    if (!tile) return false;

    // Si la pieza ya no existe (a veces se quita antes), abortamos silencioso
    const piece = tile.querySelector(".piece");
    if (!piece) return false;

    const { x, y, w, h } = measureInViewport(piece);
    const layer = ensureLayer();

    const ghost = makeGhostFromPiece(piece);
    Object.assign(ghost.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${w}px`,
      height: `${h}px`,
    });

    // Animación por CSS: piece-captured-vanish (ya definida en editor.fx.css)
    const dur = Math.max(380, opts.duration || 660);
    ghost.style.animation = `piece-captured-vanish ${dur}ms ease-in-out forwards`;

    layer.appendChild(ghost);

    // Limpieza cuando termina (por tiempo y por evento)
    const cleanup = () => {
      ghost.removeEventListener("animationend", cleanup);
      ghost.remove();
      if (!layer.childElementCount) {
        // Si la capa quedó vacía, no la borramos por compatibilidad con otros efectos
        // pero podrías removerla si quieres:
        // layer.remove();
      }
    };
    ghost.addEventListener("animationend", cleanup, { once: true });
    setTimeout(cleanup, dur + 100);

    return true;
  } catch {
    return false;
  }
}
