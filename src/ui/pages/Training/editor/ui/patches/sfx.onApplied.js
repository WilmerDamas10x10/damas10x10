// src/ui/pages/Training/editor/ui/patches/sfx.onApplied.js
// Dispara sonidos cuando el Editor termina de aplicar una jugada (local o remota).

import { sfx } from "../../sfx.bootstrap.js";           // usa tu bootstrap del Editor

// Mapa simple: tipo de evento -> función SFX
const MAP = {
  move:   () => sfx?.move?.(),
  capture:() => sfx?.capture?.(),
  crown:  () => sfx?.crown?.(),
  invalid:() => sfx?.invalid?.(),
};

// Un solo listener global
function onApplied(ev) {
  try {
    const kind = ev?.detail?.kind;
    const fire = MAP[kind];
    if (typeof fire === "function") fire();
  } catch {}
}

// Evitamos instalar dos veces
if (!window.__D10_SFX_APPLIED__) {
  window.addEventListener("editor:applied", onApplied, { passive: true });
  window.__D10_SFX_APPLIED__ = true;
}
