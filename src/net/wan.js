// src/net/wan.js
// Política: NO conectamos automáticamente. Solo al pulsar "Compartir".

let socket = null;
let shareEnabled = false;   // bandera de "compartir" habilitado
let connecting = false;

export function getSocket() {
  return socket;
}

export function isShareEnabled() {
  return shareEnabled;
}

/**
 * Habilita/deshabilita la intención de compartir (sin conectar).
 * Úsalo al entrar en modos donde compartir tendría sentido.
 */
export function ensureWANForMode(mode, opts = {}) {
  const { trainingShare = false } = opts;

  // Habilita compartir si el modo lo requiere o si se pasa explícitamente.
  // NO conecta aquí.
  shareEnabled = Boolean(trainingShare) || mode === "faceToFace" || mode === "online-share";

  if (!shareEnabled) {
    console.log("[WAN] Modo local: compartir deshabilitado (sin conexión).");
  } else {
    console.log("[WAN] Compartir habilitado (pero sin conectar hasta que el usuario lo pida).");
  }
  return shareEnabled;
}

/**
 * Conecta SOLO cuando el usuario pulsa "Compartir".
 * Si no existe cliente de Socket.IO o no hay backend, no rompe (degrada con warn).
 */
export async function connectIfUserShares(url) {
  if (!shareEnabled) {
    console.log("[WAN] Compartir no está habilitado; no se conecta.");
    return null;
  }
  if (typeof window === "undefined" || typeof window.io !== "function") {
    console.warn("[WAN] Cliente de Socket.IO no cargado; omitiendo conexión.");
    return null;
  }
  if (socket && socket.connected) {
    return socket; // ya conectado
  }
  if (connecting) {
    // evita doble conexión; espera a que termine el intento en curso
    return new Promise((resolve) => {
      const t = setInterval(() => {
        if (!connecting) { clearInterval(t); resolve(socket || null); }
      }, 50);
    });
  }

  connecting = true;
  try {
    const target = url || location.origin;
    const s = window.io(target, {
      path: "/socket.io",
      transports: ["websocket"], // evita polling cuando no hay endpoint
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    s.on("connect",       () => console.log("[WAN] conectado:", s.id));
    s.on("disconnect",    (why) => console.log("[WAN] disconnect:", why));
    s.on("connect_error", (err) => console.warn("[WAN] connect_error:", err?.message || err));

    socket = s;
    return socket;
  } finally {
    connecting = false;
  }
}

/**
 * Desconecta si estaba conectado (para "Dejar de compartir").
 */
export function disconnectIfAny() {
  if (socket) {
    try { socket.disconnect(); } catch {}
    socket = null;
    console.log("[WAN] desconectado.");
  }
}

/**
 * Emite un evento si hay conexión; si no, no hace nada (silencioso).
 */
export function emitIfConnected(eventName, payload) {
  if (socket && socket.connected) {
    socket.emit(eventName, payload);
    return true;
  }
  return false;
}
