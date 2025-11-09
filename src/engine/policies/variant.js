// src/engine/policies/variant.js
// Estado de variante con persistencia + evento global para quien quiera reaccionar.
// Variantes: "classic" | "international"

const KEY = "rules.variant";
const DEFAULT_VARIANT = "classic"; // cambia a "international" si prefieres por defecto

let current = DEFAULT_VARIANT;
try {
  const saved = localStorage.getItem(KEY);
  if (saved === "classic" || saved === "international") current = saved;
} catch {}

export function getVariant() {
  return current;
}

export function setVariant(next, ctx) {
  if (next !== "classic" && next !== "international") return;
  if (next === current) return;

  current = next;
  try { localStorage.setItem(KEY, next); } catch {}

  // Aviso global para que el motor/UX reaccionen sin acoplarse
  const detail = { variant: current, ctx };
  window.dispatchEvent(new CustomEvent("variant:changed", { detail }));

  // Si tu motor expone algo como ctx.policies?.setVariant, lo intentamos sin romper:
  try { ctx?.policies?.setVariant?.(current); } catch {}
}

export const isClassic = () => current === "classic";
export const isInternational = () => current === "international";
