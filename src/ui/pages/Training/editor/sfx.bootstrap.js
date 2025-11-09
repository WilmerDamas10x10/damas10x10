// src/ui/pages/Training/editor/sfx.bootstrap.js
// Motor de sonidos del Editor, sin inyectar botones (toolbar/flotante).
// El toggle visual lo maneja ./ui/patches/sfxToggle.js

import { installSFX, sfx as _sfx } from "../../../sound/sfx.js";

const SFX_PREF_KEY = "damas10x10.sfx.enabled";
let _guardsInstalled = false;

function _getEnabled() {
  const v = localStorage.getItem(SFX_PREF_KEY);
  return v === null ? true : v === "1";
}
function _persist(on) {
  try { localStorage.setItem(SFX_PREF_KEY, on ? "1" : "0"); } catch {}
}

function _applyMasterGain(on) {
  try {
    const cand = [
      _sfx?.master, _sfx?._master, _sfx?.gainNode, _sfx?._gainNode, _sfx?.masterGain, _sfx?._masterGain
    ].find(Boolean);
    const g = cand?.gain;
    if (g && typeof g.value === "number") g.value = on ? 1 : 0;
    else if (typeof _sfx?.setMasterGain === "function") _sfx.setMasterGain(on ? 1 : 0);
  } catch {}
}

export function setSfxEnabled(on) {
  try {
    if (_sfx?.setEnabled) _sfx.setEnabled(on);
    else if (on && _sfx?.enable) _sfx.enable();
    else if (!on && _sfx?.disable) _sfx.disable();
    if ("enabled" in _sfx) _sfx.enabled = !!on;
  } catch {}
  _applyMasterGain(!!on);
  window.__sfxEnabled = !!on;
  _persist(!!on);
  try { window.dispatchEvent(new CustomEvent("sfx:toggle", { detail: { on: !!on } })); } catch {}
}

function installGuards() {
  if (_guardsInstalled) return;
  const names = ["click","move","capture","crown","deny","invalid","promote","play","beep","ping"]
    .filter((k) => typeof _sfx?.[k] === "function");
  const orig = Object.create(null);
  names.forEach((name) => {
    if (orig[name]) return;
    orig[name] = _sfx[name];
    _sfx[name] = (...args) => {
      if (!_getEnabled()) return;
      try { return orig[name].apply(_sfx, args); } catch {}
    };
  });
  window.__SFX_ORIG__ = orig;
  _guardsInstalled = true;
}

export function toggleSfx() {
  const now = !_getEnabled();
  setSfxEnabled(now);
  try { (window.toast || ((m)=>console.log("[SFX]", m)))( now ? "Sonidos: ON" : "Sonidos: OFF" ); } catch {}
  return now;
}

export function initEditorSFX(container) {
  // Bootstrap
  installSFX({
    unlockOn: ["pointerdown", "touchstart", "keydown"],
    masterGain: 0.9,
    resumeOnVisibility: true,
    sources: {
      click:   "/sonidos/click.mp3",
      move:    "/sonidos/mover.mp3",
      capture: "/sonidos/captura.mp3",
      crown:   "/sonidos/coronar.mp3",
      deny:    "/sonidos/error.mp3",
    },
    volume: 1.0,
    enabled: true,
    minGapMs: 60,
  });
  window.__sfx = _sfx;

  installGuards();
  setSfxEnabled(_getEnabled());

  // Alt+S: toggle
  window.addEventListener("keydown", (ev) => {
    const key = String(ev.key || "").toLowerCase();
    if (ev.altKey && key === "s") { ev.preventDefault(); toggleSfx(); }
  }, { passive: false });

  // Compatibilidad: dejar accesible globalmente si algún patch lo usa
  try { window.__toggleSfx = toggleSfx; } catch {}
}

// Exportamos el objeto de efectos por si lo referencian
export const sfx = _sfx;
export default { initEditorSFX, toggleSfx, setSfxEnabled, sfx };
