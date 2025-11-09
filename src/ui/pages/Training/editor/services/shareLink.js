// src/ui/pages/Training/editor/services/shareLink.js
import { fromFEN } from "./fen.js";

// ----- Base64 URL helpers -----
function base64UrlEncode(str) {
  const utf8 = new TextEncoder().encode(str);
  let bin = "";
  utf8.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlDecode(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ----- Public API -----
export function makeShareLinkToTraining(snap) {
  const json = JSON.stringify(snap);
  const b64 = base64UrlEncode(json);
  const { origin, pathname, hash } = window.location;
  if (hash && hash.startsWith("#/")) {
    return `${origin}${pathname}#/training?pos=${b64}`;
  } else {
    const url = new URL(origin + "/training");
    url.searchParams.set("pos", b64);
    return url.toString();
  }
}

// Lee ?pos= (base64url/json/atob) o ?fen= y devuelve {board, turn}
export function parseSharedFromURL() {
  const url = new URL(window.location.href);
  const raw = url.searchParams.get("pos") ?? url.searchParams.get("fen");
  if (!raw) return null;

  const candidates = [];
  // primero intenta decodeURIComponent
  try { candidates.push(decodeURIComponent(raw)); } catch { candidates.push(raw); }

  for (const cand of candidates) {
    // 1) JSON directo
    try {
      const obj = JSON.parse(cand);
      if (obj?.board && Array.isArray(obj.board)) {
        return { board: obj.board, turn: (obj.turn ?? "r") };
      }
      if (typeof obj?.fen === "string") {
        return fromFEN(obj.fen);
      }
    } catch {}

    // 2) base64url → JSON
    try {
      const maybeJson = base64UrlDecode(cand);
      const obj = JSON.parse(maybeJson);
      if (obj?.board && Array.isArray(obj.board)) {
        return { board: obj.board, turn: (obj.turn ?? "r") };
      }
      if (typeof obj?.fen === "string") {
        return fromFEN(obj.fen);
      }
    } catch {}

    // 3) base64 estándar (por compatibilidad antigua)
    try {
      const maybeJson = atob(cand);
      const obj = JSON.parse(maybeJson);
      if (obj?.board && Array.isArray(obj.board)) {
        return { board: obj.board, turn: (obj.turn ?? "r") };
      }
      if (typeof obj?.fen === "string") {
        return fromFEN(obj.fen);
      }
    } catch {}

    // 4) FEN plano
    try {
      return fromFEN(cand);
    } catch {}
  }
  return null;
}

export function cleanShareParamsInURL() {
  const url = new URL(window.location.href);
  url.searchParams.delete("pos");
  url.searchParams.delete("fen");
  window.history.replaceState({}, "", url.toString());
}

// (export opcional por si quieres testear estos helpers)
export const _base64url = { encode: base64UrlEncode, decode: base64UrlDecode };
