// src/ui/pages/Training/editor/ui/patches/sfxToggle.js
// Toggle de sonidos (🔊/🔇) + beeps WebAudio para move/capture/promote/invalid
// No requiere assets. Persistencia en localStorage: "sfx.enabled" = "1" | "0"

const LS_KEY = "sfx.enabled";

function getEnabled() {
  try { return localStorage.getItem(LS_KEY) !== "0"; } catch { return true; }
}
function setEnabled(on) {
  try { localStorage.setItem(LS_KEY, on ? "1" : "0"); } catch {}
}

function ensureAudioCtx() {
  const w = window;
  const Ctx = w.AudioContext || w.webkitAudioContext;
  if (!Ctx) return null;
  if (!w.__SFX_CTX) w.__SFX_CTX = new Ctx();
  return w.__SFX_CTX;
}

function beep({ freq = 440, dur = 0.09, type = "sine", gain = 0.06 } = {}) {
  if (!getEnabled()) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(gain, now);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
  // pequeño “fade” para evitar clicks
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
}

function moveSfx()    { beep({ freq: 520, dur: .07, type: "triangle" }); }
function captureSfx() { beep({ freq: 360, dur: .12, type: "square", gain: .08 }); }
function promoteSfx() { beep({ freq: 760, dur: .16, type: "sine" }); }
function invalidSfx() { beep({ freq: 180, dur: .10, type: "sawtooth" }); }

function findToolbar(root) {
  return root.querySelector("#editor-toolbar") || root.querySelector(".editor-toolbar") || root.body;
}

function renderToggle(root) {
  const tb = findToolbar(root);
  if (!tb) return;
  if (tb.querySelector("#btn-sfx-toggle")) return;

  const b = document.createElement("button");
  b.id = "btn-sfx-toggle";
  b.type = "button";
  b.setAttribute("aria-pressed", getEnabled() ? "true" : "false");
  b.title = "Sonido (Alt+S)";
  b.textContent = getEnabled() ? "🔊" : "🔇";
  Object.assign(b.style, {
    marginLeft: "8px",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #eee",
    background: "#fff",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: "1",
  });

  b.addEventListener("click", () => {
    const next = !getEnabled();
    setEnabled(next);
    b.textContent = next ? "🔊" : "🔇";
    b.setAttribute("aria-pressed", next ? "true" : "false");
    try { (window.toast || ((m)=>console.log("[SFX]", m)))(next ? "Sonido: ON" : "Sonido: OFF"); } catch {}
    // iOS/Android requieren interacción para reanudar AudioContext
    try { ensureAudioCtx()?.resume?.(); } catch {}
  });

  // Atajo Alt+S
  window.addEventListener("keydown", (e) => {
    const k = String(e.key || "").toLowerCase();
    if (e.altKey && k === "s") {
      b.click();
      e.preventDefault();
    }
  });

  tb.appendChild(b);
}

export function installSfxToggle(root = document) {
  renderToggle(root);

  // Expone/cablea funciones en window.sfx para que el editor las use
  const safe = (fn) => (...a) => { try { fn(...a); } catch {} };
  const wsfx = (window.sfx = window.sfx || {});
  wsfx.move    = safe(moveSfx);
  wsfx.capture = safe(captureSfx);
  wsfx.promote = safe(promoteSfx);
  wsfx.invalid = safe(invalidSfx);

  // “Reanudar” el contexto al primer click si estaba suspendido
  window.addEventListener("pointerdown", () => {
    try { ensureAudioCtx()?.resume?.(); } catch {}
  }, { once: true });
}

// Auto-instalación
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => installSfxToggle());
} else {
  installSfxToggle();
}
