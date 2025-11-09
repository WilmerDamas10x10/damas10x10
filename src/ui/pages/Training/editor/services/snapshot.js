// src/ui/pages/Training/editor/services/snapshot.js

// Claves de almacenamiento en el juego (navegador)
export const KEY_AUTO    = "damas10x10:pos:auto";   // slot automático (último guardado)
export const KEY_BY_NAME = "damas10x10:pos:byName"; // diccionario { nombre: snapshot }

// Construye un snapshot estable de la posición actual
export function makeSnapshot(board, turn) {
  return {
    version: 1,
    ts: Date.now(),
    board,
    turn,
  };
}

// ── Almacenamiento por nombre ────────────────────────────────────────────────
export function readByName() {
  try {
    const raw = localStorage.getItem(KEY_BY_NAME);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeByName(map) {
  try {
    localStorage.setItem(KEY_BY_NAME, JSON.stringify(map));
  } catch {}
}

// ── Guardar AUTO y por nombre ────────────────────────────────────────────────
export function saveLocalAutoFrom(board, turn) {
  const snap = makeSnapshot(board, turn);
  try {
    localStorage.setItem(KEY_AUTO, JSON.stringify(snap));
  } catch (e) {
    console.error("[snapshot] no se pudo guardar (auto):", e);
  }
  return snap;
}

export function saveLocalNamed(board, turn, name) {
  const snap = saveLocalAutoFrom(board, turn);
  if (name && typeof name === "string" && name.trim()) {
    const map = readByName();
    map[name.trim()] = snap;
    writeByName(map);
    console.debug("[snapshot] guardado con nombre:", name.trim(), snap);
  } else {
    console.debug("[snapshot] guardado (auto, sin nombre):", snap);
  }
  return snap;
}

// ── Cargar AUTO ──────────────────────────────────────────────────────────────
export function loadLocalAuto() {
  try {
    const raw = localStorage.getItem(KEY_AUTO);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.board)) return null;
    return data;
  } catch (e) {
    console.error("[snapshot] no se pudo leer (auto):", e);
    return null;
  }
}

// ── Compartir (codificar/decodificar) ────────────────────────────────────────
export function encodeSnapshot(snap) {
  // btoa(unescape(encodeURIComponent(...))) para soportar UTF-8
  return btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
}

export function decodeShareCode(code) {
  // inverso de encodeSnapshot
  const json = decodeURIComponent(escape(atob(code)));
  return JSON.parse(json);
}

export async function copyShareCodeFrom(board, turn) {
  try {
    const snap = makeSnapshot(board, turn);
    const code = encodeSnapshot(snap);
    await navigator.clipboard?.writeText(code);
    console.debug("[snapshot] código copiado al portapapeles.");
  } catch (e) {
    console.error("[snapshot] no se pudo copiar el código:", e);
  }
}
