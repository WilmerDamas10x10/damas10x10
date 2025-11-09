// src/ui/lib/ghostAnim.js
// Animación "fantasma" que sobrevive a los re-renders del Editor.
// La capa se monta en document.body (fixed), así el render del #board no la borra.

const ease = "cubic-bezier(0.22, 0.61, 0.36, 1)";

export function clearGhostArtifacts() {
  try {
    const layer = document.querySelector(".ghost-layer");
    if (layer) layer.remove();
  } catch {}
}

function tileAt(boardEl, [r, c]) {
  return boardEl?.querySelector?.(`[data-r="${r}"][data-c="${c}"]`) || null;
}

// Capa global fija en viewport. No depende de #board.
function ensureLayer() {
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

// Medimos en coordenadas de *viewport* (porque la capa es fixed)
function measureInViewport(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function makeGhostFromTile(tile, pieceChar) {
  const ghost = document.createElement("div");
  ghost.className = "ghost-piece";
  const piece = tile?.querySelector?.(".piece");
  if (piece) {
    ghost.className += " " + piece.className; // conserva piece/piece--w/b/wk/bk
  } else if (pieceChar) {
    const map = { r: "piece piece--w", R: "piece piece--wk", n: "piece piece--b", N: "piece piece--bk" };
    ghost.className += " " + (map[pieceChar] || "piece");
  } else {
    ghost.className += " piece";
  }
  Object.assign(ghost.style, {
    position: "absolute",
    width: "var(--square-size, 56px)",
    height: "var(--square-size, 56px)",
    willChange: "transform, opacity",
    transitionProperty: "transform, opacity, box-shadow",
    pointerEvents: "none",
  });
  return ghost;
}

/**
 * Anima del tile "from" al "to".
 * opts: { duration=480, lift=8, scale=1.04, fade=false, pieceChar? }
 */
export async function animateCellMove(boardEl, from, to, opts = {}) {
  // Valores por defecto más “lentos” para que se note el efecto
  const duration = Math.max(120, opts.duration ?? 480);
  const lift     = opts.lift ?? 8;
  const scale    = opts.scale ?? 1.04;
  const fade     = !!opts.fade;

  if (!boardEl) return;

  // No elimines la capa si hay otras animaciones en curso; la limpiamos al iniciar
  clearGhostArtifacts();
  const layer = ensureLayer();

  const fromTile = tileAt(boardEl, from);
  const toTile   = tileAt(boardEl, to);
  if (!fromTile || !toTile) return;

  const pieceEl = fromTile.querySelector(".piece");
  const ghost   = makeGhostFromTile(fromTile, opts.pieceChar);
// ⬇️ Pinta el anillo directamente en el ghost desde el primer frame
if (opts.ringColor) {
  ghost.classList.add("glow-selected");
  try { ghost.style.setProperty("--ring-color", opts.ringColor); } catch {}
}


  const start   = measureInViewport(fromTile);
  const end     = measureInViewport(toTile);

  Object.assign(ghost.style, {
    left: `${start.x}px`,
    top:  `${start.y - lift}px`,
    width: `${start.w}px`,
    height:`${start.h}px`,
    transform: `translate(0px, ${lift}px) scale(${scale})`,
    opacity: (fade ? 0.92 : 1),
    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: ease,
  });

  // Ocultamos la pieza real mientras corre la animación (si existe)
  const prevVisibility = pieceEl?.style?.visibility;
  if (pieceEl) pieceEl.style.visibility = "hidden";

  layer.appendChild(ghost);
  await new Promise(requestAnimationFrame);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1)`;
  ghost.style.top = `${start.y}px`;
  if (fade) ghost.style.opacity = "1";
  ghost.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.20))";

  await new Promise((resolve) => {
    const done = () => { ghost.removeEventListener("transitionend", done); resolve(); };
    ghost.addEventListener("transitionend", done, { once: true });
    setTimeout(done, duration + 60); // seguro frente a browsers que no disparan el evento
  });

  ghost.remove();
  // Si no hubo pieceEl (p.ej. render inmediato), no pasa nada.
  if (pieceEl) pieceEl.style.visibility = prevVisibility || "";

  // Si la capa quedó vacía, la removemos
  if (!layer.childElementCount) layer.remove();
}
