// src/ui/pages/Training/editor/services/boardForSave.js
// Deja el tablero listo para guardar/compartir (aplica deferred y limpia ghosts)
export function boardForSaveRaw(board, stepState, { finalizeDeferred, isGhost }) {
  let clean = board;
  try {
    if (stepState?.deferred?.length) {
      clean = finalizeDeferred(clean, stepState.deferred);
    }
  } catch (e) {
    console.warn("[guardar] finalizeDeferred:", e);
  }
  try {
    clean = clean.map(row =>
      row.map(cell => {
        if (typeof isGhost === "function" && isGhost(cell)) return null;
        if (cell && typeof cell === "string" && cell.toLowerCase() === "g") return null;
        return cell;
      })
    );
  } catch {}
  return clean;
}
