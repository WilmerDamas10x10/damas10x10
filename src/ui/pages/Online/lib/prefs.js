// ===============================================
// src/ui/pages/Online/lib/prefs.js
// Persistencia local de sesión y estado del tablero
// ===============================================

const KEY_PREFS = "D10_ONLINE_PREFS";
const KEY_STATE = "D10_ONLINE_STATE";

export function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(KEY_PREFS) || "{}"); }
  catch { return {}; }
}

export function savePrefs(partial) {
  try {
    const cur = loadPrefs();
    const next = { ...cur, ...partial, updatedAt: Date.now(), active: true };
    localStorage.setItem(KEY_PREFS, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function clearPrefs() {
  try { localStorage.removeItem(KEY_PREFS); } catch {}
}

export function saveBoardState(board, turn) {
  try {
    // Guardamos tal cual (el caller debe asegurar formato 10x10)
    localStorage.setItem(KEY_STATE, JSON.stringify({
      board, turn, ts: Date.now(),
    }));
  } catch {}
}

export function loadBoardState() {
  try { return JSON.parse(localStorage.getItem(KEY_STATE) || "null"); }
  catch { return null; }
}

export function clearBoardState() {
  try { localStorage.removeItem(KEY_STATE); } catch {}
}
