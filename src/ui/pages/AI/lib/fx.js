// src/ui/pages/AI/lib/fx.js
// Efectos visuales reutilizables para IA

import { COLOR, colorOf } from "@engine";
import { animateCellMove } from "../../../lib/ghostAnim.js";
import { triggerCapturedVanish } from "../../../lib/uiFX.js";

// Ajustes globales de FX (mismos valores que en el original)
export const FX_CAPTURE_MS = 2000;
export const FX_MOVE_MS    = 220;

// Color del anillo según color de la pieza (negras => blanco; rojas/blancas => negro)
export function ringColorFor(ch){
  try {
    return colorOf(ch) === COLOR.NEGRO ? "#FFFFFF" : "#0e0d0dff";
  } catch {
    return "#FFFFFF";
  }
}

export function getPieceEl(boardEl, rc){
  const [r, c] = rc;
  return boardEl?.querySelector?.(`[data-r="${r}"][data-c="${c}"] .piece`) || null;
}

// Anillo sobre pieza real
export function glowAI(boardEl, rc, { duration = 800, pieceChar = null } = {}){
  const [r, c] = rc;
  const tile = boardEl?.querySelector?.(`[data-r="${r}"][data-c="${c}"]`);
  const el = tile?.querySelector?.(".piece");
  if (!el) return;

  let ringColor = "#0e0d0dff";
  try {
    const col = colorOf(pieceChar);
    ringColor = (col === COLOR.NEGRO) ? "#FFFFFF" : "#0e0d0dff";
  } catch {
    ringColor = "#FFFFFF";
  }

  el.classList.add("glow-selected");
  el.style.setProperty("--ring-color", ringColor);

  window.setTimeout(() => {
    el.classList.remove("glow-selected");
    el.style.removeProperty("--ring-color");
  }, duration);
}

// Anillo sobre “ghost” de movimiento (cuando aparece el fantasma)
export function ringOnNextGhost(pieceChar, { duration = 800 } = {}){
  const color = (colorOf(pieceChar) === COLOR.NEGRO) ? "#FFFFFF" : "#0e0d0dff";

  const apply = (el) => {
    if (!el) return;
    el.querySelectorAll('[data-ghost-ring]').forEach(n => n.remove());

    const ring = document.createElement('div');
    ring.setAttribute('data-ghost-ring', '');
    Object.assign(ring.style, {
      position: 'absolute',
      inset: '-4px',
      borderRadius: '50%',
      pointerEvents: 'none',
      boxShadow: `0 0 0 6px ${color}`,
      zIndex: '2'
    });

    const prevPos = el.style.position;
    if (!prevPos || prevPos === 'static') el.style.position = 'relative';

    el.appendChild(ring);
    window.setTimeout(() => {
      ring.remove();
      if (prevPos === '' || prevPos === 'static') el.style.position = prevPos || '';
    }, duration);
  };

  const now = document.querySelector('.ghost-layer .piece');
  if (now) { apply(now); return; }

  const obs = new MutationObserver(() => {
    const el = document.querySelector('.ghost-layer .piece');
    if (el) { apply(el); obs.disconnect(); }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 1200);
}

// Re-export de helpers de animación
export { animateCellMove, triggerCapturedVanish };
