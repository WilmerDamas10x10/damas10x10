// src/ui/sound/sfx.js

// ===== Singleton de Audio =====
let _ctx = null;
let _master = null;       // Master GainNode
let _buffers = new Map(); // nombre -> AudioBuffer
let _enabled = true;
let _minGapMs = 60;

// Control de antispam por sonido
const _lastAt = new Map();

// Estado global de mute (getter/setter con efecto en master gain)
let _muted = false;

// Utilidad now
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

// Crea/reusa el AudioContext y master gain
function ensureAudio() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (!_master) {
    _master = _ctx.createGain();
    _master.gain.value = _muted ? 0 : 1;
    _master.connect(_ctx.destination);
  }
  return _ctx;
}

// Carga y decodifica un buffer
async function loadBuffer(name, url) {
  const ctx = ensureAudio();
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  const buf = await ctx.decodeAudioData(arr);
  _buffers.set(name, buf);
  return buf;
}

// Reproduce un buffer por nombre (respeta mute, enabled, minGap)
function play(name, vol = 1.0) {
  if (!_enabled) return;
  if (_muted) return;
  const ctx = ensureAudio();
  const buf = _buffers.get(name);
  if (!buf) return;

  const t = now();
  const last = _lastAt.get(name) || 0;
  if (t - last < _minGapMs) return; // antispam
  _lastAt.set(name, t);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const gain = ctx.createGain();
  gain.gain.value = vol;

  // src -> gain -> master -> dest
  src.connect(gain);
  gain.connect(_master);
  src.start();
}

// API pública SFX (por compatibilidad con tu código actual)
export const sfx = {
  // banderas/props (con getter/setter en "muted")
  get muted() { return _muted; },
  set muted(v) {
    _muted = !!v;
    if (_master) _master.gain.value = _muted ? 0 : 1;
  },

  // disparadores estándar
  click:   () => play("click"),
  move:    () => play("move"),
  capture: () => play("capture"),
  crown:   () => play("crown"),
  promote: () => play("crown"),   // alias usado en algunas rutas
  invalid: () => play("deny"),

  // util opcional para disparar nombre arbitrario
  play: (name, vol = 1.0) => play(name, vol),
};

// API de configuración/instalación
export function installSFX({
  sources = {},      // { move: "url", capture: "url", ... }
  volume  = 1.0,     // volumen base (aplicado por sonido si lo usas)
  enabled = true,
  minGapMs = 60,
} = {}) {
  _enabled = !!enabled;
  _minGapMs = Math.max(0, Number(minGapMs) || 0);

  // Pre-carga todos los archivos definidos
  const entries = Object.entries(sources || {});
  if (entries.length) {
    ensureAudio();
    // Nota: no esperamos a que terminen todos; puedes si quieres:
    entries.forEach(([name, url]) => {
      // Best-effort: si falla, no rompe el resto
      loadBuffer(name, url).catch((e) => {
        console.warn("[sfx] no se pudo cargar", name, url, e);
      });
    });
  }

  // expón una ganancia base si luego quieres usarla (no requerida)
  // mantenemos compat con volumen por sonido usando gain local en play()
  sfx.baseVolume = Math.max(0, Number(volume) || 0);
}

// API de desbloqueo por gesto (iOS/Safari)
export const SFX = {
  unlock: () => {
    try {
      ensureAudio();
      if (_ctx && _ctx.state === "suspended") {
        _ctx.resume();
      }
    } catch (e) {
      console.warn("[sfx] unlock falló:", e);
    }
  },
};

// Helpers opcionales: set/get mute explícitos
export function setMuted(on) { sfx.muted = !!on; }
export function isMuted() { return sfx.muted; }

// Por si quieres habilitar/deshabilitar todo sfx a nivel lógico
export function setEnabled(on) { _enabled = !!on; }
export function isEnabled() { return _enabled; }
