// src/ui/sfx.hooks.js
// Hooks centralizados para sonidos con debounce para 'invalid'.
// Usamos el MISMO motor del Editor (WebAudio + mapeo de rutas).

import { sfx } from "./sound/sfx.js"; // ⬅️ antes apuntaba a "./sfx.js"

function debounce(fn, delay = 120) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export const onMove = () => {
  try { sfx?.move?.(); } catch {}
};

export const onCaptureHop = () => {
  try { sfx?.capture?.(); } catch {}
};

export const onCrown = () => {
  try { sfx?.crown?.(); } catch {}
};

export const onInvalid = debounce(() => {
  try { sfx?.invalid?.(); } catch {}
}, 140);
