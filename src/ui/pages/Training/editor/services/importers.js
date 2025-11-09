// src/ui/pages/Training/editor/services/importers.js

// Normaliza diversos formatos de snapshot a { board, turn, size, ts }
export function normalizeSnapshot(raw, fallbackTurn, SIZE) {
  if (!raw) return null;

  // 1) Objeto con board/turn
  if (Array.isArray(raw.board) && typeof raw.turn !== "undefined") {
    return { board: raw.board, turn: raw.turn, size: raw.size ?? SIZE, ts: Date.now() };
  }

  // 2) Matriz 2D cruda
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    return { board: raw, turn: fallbackTurn, size: SIZE, ts: Date.now() };
  }

  // 3) Forma { data: { board, turn }, ts? }
  if (raw.data && Array.isArray(raw.data.board) && typeof raw.data.turn !== "undefined") {
    return { board: raw.data.board, turn: raw.data.turn, size: raw.data.size ?? SIZE, ts: raw.ts ?? Date.now() };
  }

  return null;
}
