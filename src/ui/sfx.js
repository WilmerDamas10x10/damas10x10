// src/ui/sfx.js
// Motor de sonidos mínimo con cache y toggle persistente.
// Usa rutas estándar: /sonidos/{move,capture,crown,invalid}.mp3
// Si los archivos no existen, no rompe: hace console.warn una sola vez.

const KEY_ENABLED = "sfx.enabled";
let enabled = true;

// Lee preferencia previa
try {
  const v = localStorage.getItem(KEY_ENABLED);
  if (v === "0" || v === "false") enabled = false;
} catch {}

const cache = new Map();
const warned = new Set();

// Intenta reproducir un sonido por nombre
function play(name, volume = 1.0) {
  if (!enabled) return;
  const url = `/sonidos/${name}.mp3`;
  let audio = cache.get(url);
  if (!audio) {
    try {
      audio = new Audio(url);
      audio.preload = "auto";
      cache.set(url, audio);
    } catch (e) {
      if (!warned.has(url)) {
        console.warn(`[sfx] No se pudo crear Audio para: ${url}`, e);
        warned.add(url);
      }
      return;
    }
  }
  try {
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch((e) => {
      if (!warned.has(url)) {
        console.warn(`[sfx] Error al reproducir ${url}`, e);
        warned.add(url);
      }
    });
  } catch (e) {
    if (!warned.has(url)) {
      console.warn(`[sfx] Error al iniciar ${url}`, e);
      warned.add(url);
    }
  }
}

const api = {
  enable() { enabled = true; try { localStorage.setItem(KEY_ENABLED, "1"); } catch {} },
  disable() { enabled = false; try { localStorage.setItem(KEY_ENABLED, "0"); } catch {} },
  isEnabled() { return enabled; },

  // Atajos
  move() { play("move"); },
  capture() { play("capture"); },
  crown() { play("crown"); },
  invalid() { play("invalid", 0.9); },

  // Bajo nivel
  play,
};

export default api;
// También nombrado, por si en algún lugar lo importas como { sfx }
export const sfx = api;

// Para pruebas rápidas en consola:
// window.sfx = api;
