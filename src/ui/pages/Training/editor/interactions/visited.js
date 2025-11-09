// src/ui/pages/Training/editor/interactions/visited.js

// Key para sets/lookup
export const k = (r, c) => `${r},${c}`;

// Garantiza que stepState.visited exista y añade el origen si viene
export function ensureVisited(stepState, origin) {
  if (!stepState) return null;
  if (!(stepState.visited instanceof Set)) stepState.visited = new Set();
  if (Array.isArray(origin) && origin.length >= 2) {
    stepState.visited.add(k(origin[0], origin[1]));
  }
  return stepState.visited;
}
