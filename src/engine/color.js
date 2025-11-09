// src/engine/color.js
export const COLOR = { ROJO: "ROJO", NEGRO: "NEGRO" };

export function colorOf(ch) {
  const s = String(ch || "");
  if (s === "r" || s === "R") return COLOR.ROJO;   // blancas/rojo
  if (s === "n" || s === "N") return COLOR.NEGRO;  // negras/negro
  return null;
}
