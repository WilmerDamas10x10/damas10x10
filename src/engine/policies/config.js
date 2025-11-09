// src/engine/policies/config.js
// Política de reglas centralizada (leída por chainPolicies.js).
// Permite alternar "clásica" / "internacional" y sobreescribir flags en caliente.
//
// Cómo funciona (sin que tengas que hacer nada):
// - chainPolicies.js llama a getPolicy().
// - Aquí devolvemos una política basada en la "variante" guardada (localStorage)
//   o la que se haya fijado con window.setRulesVariant(...).
// - Si no hay nada configurado, usa valores por defecto (sanos).

// Valores por defecto (coherentes con lo que ya vienes usando)
const DEFAULT_POLICY = {
  // Si en el primer salto hay empate entre peón y dama con el MISMO total (capturas/puntos),
  // preferimos la Dama.
  PREFER_QUEEN_ON_MIXED_PURE_TIE: true,

  // Para comparar primer salto entre destinos, usamos "firstPts" (dama=1.5, peón=1.0)
  // al evaluar totales; esto ya lo usas en el motor.
  USE_FIRSTPTS_FOR_MIXED_TYPES: true,

  // En peón vs peón, por defecto no metemos firstPts (da igual).
  USE_FIRSTPTS_FOR_PAWN_VS_PAWN: false,

  // Empates DENTRO de la misma pieza por primer salto (desactivado en la UI por ahora).
  SAME_PIECE_FIRST_HOP_TIEBREAK_BY_FIRSTPTS: false,

  // Si el primer capturado difiere (peón vs dama), el primer salto “vale” esos puntos.
  AUTO_PAWN_FIRSTPTS_WHEN_DIFFER: true,

  // ⚠️ NUEVO: prioridad global PUNTOS→CANTIDAD (false = clásica CANTIDAD→PUNTOS)
  PRIORITIZE_POINTS_OVER_COUNT: false,
};

// “Plantillas” por variante.
const POLICY_BY_VARIANT = {
  classic: {
    ...DEFAULT_POLICY,
    SAME_PIECE_FIRST_HOP_TIEBREAK_BY_FIRSTPTS: false,
  },
  international: {
    ...DEFAULT_POLICY,
    SAME_PIECE_FIRST_HOP_TIEBREAK_BY_FIRSTPTS: true,
    USE_FIRSTPTS_FOR_PAWN_VS_PAWN: true,
  },
};

// Estado interno
let currentVariant = null;   // "classic" | "international" | null
let overrides = null;        // objeto con flags que pisan la política de variante

function readPersisted() {
  try {
    const v = localStorage.getItem("rulesVariant");
    currentVariant = v && (v === "classic" || v === "international") ? v : null;
  } catch {}
  try {
    const raw = localStorage.getItem("policyOverrides");
    overrides = raw ? JSON.parse(raw) : null;
  } catch { overrides = null; }
}
readPersisted();

// Aplica overrides (si existen) a una política base
function applyOverrides(base) {
  if (!overrides || typeof overrides !== "object") return base;
  return { ...base, ...overrides };
}

/** Devuelve la política efectiva actual. */
export function getPolicy() {
  const base =
    (currentVariant && POLICY_BY_VARIANT[currentVariant]) ||
    DEFAULT_POLICY;
  return applyOverrides(base);
}

/** Cambia la variante y persiste. */
export function setRulesVariant(variant) {
  const v = (variant === "classic" || variant === "international") ? variant : null;
  currentVariant = v;
  try {
    if (v) localStorage.setItem("rulesVariant", v);
    else localStorage.removeItem("rulesVariant");
  } catch {}
}

/** Aplica overrides específicos y persiste. */
export function setPolicyOverrides(obj) {
  overrides = (obj && typeof obj === "object") ? { ...obj } : null;
  try {
    if (overrides) localStorage.setItem("policyOverrides", JSON.stringify(overrides));
    else localStorage.removeItem("policyOverrides");
  } catch {}
}

// Hooks de conveniencia en window
if (typeof window !== "undefined") {
  window.setRulesVariant = setRulesVariant;
  window.setPolicyOverrides = setPolicyOverrides;
  window.getPolicy = getPolicy;
}
