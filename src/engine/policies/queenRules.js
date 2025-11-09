// BEGIN queenRules.js
// src/engine/policies/queenRules.js
// Reglas auxiliares para el 1er salto de DAMA durante cadenas.
// - Ignora GHOST como bloqueadores/capturados reales.
// - No toca DOM ni usa estado externo.

import { dentro, valorPieza, isGhost } from "../../rules/utils.js";

/**
 * Devuelve todas las casillas de aterrizaje válidas para una DAMA
 * DESPUÉS de capturar la pieza ubicada en `at` (entre `origin` y `at`).
 * Reglas:
 * - Debe ser la MISMA diagonal (origin → at → destino).
 * - Desde la casilla inmediatamente posterior a `at`, avanza mientras la casilla
 *   esté vacía (null/undefined) o sea GHOST.
 * - Se detiene ANTES del siguiente bloqueador REAL (no GHOST).
 *
 * Retorna: Array de pares [r, c] con las casillas de aterrizaje válidas.
 */
export function queenLandingSquaresAfterAt(board, origin, at) {
  const [r0, c0] = origin || [];
  const [ra, ca] = at || [];
  if (!Number.isInteger(r0) || !Number.isInteger(c0)) return [];
  if (!Number.isInteger(ra) || !Number.isInteger(ca)) return [];

  const dr = Math.sign(ra - r0);
  const dc = Math.sign(ca - c0);

  // Debe ser diagonal y que at esté en línea con origin
  if (!Number.isFinite(dr) || !Number.isFinite(dc)) return [];
  if (Math.abs(ra - r0) !== Math.abs(ca - c0)) return [];

  const result = [];
  let r = ra + dr;
  let c = ca + dc;

  while (dentro(r, c)) {
    const cell = board?.[r]?.[c] ?? null;

    // Si hay un bloqueador REAL (no GHOST), nos detenemos antes de él
    if (cell && !isGhost(cell)) break;

    // Si está vacío o es GHOST, es aterrizable
    result.push([r, c]);

    // Seguimos avanzando por la misma diagonal
    r += dr;
    c += dc;
  }

  return result;
}

/**
 * Retorna los puntos (valor de pieza) de la ÚNICA pieza REAL (no GHOST)
 * que se encuentra entre `from` y `to` en la MISMA diagonal.
 * - Si no hay ninguna REAL, retorna 0.
 * - Si hay MÁS de una REAL, retorna 0 (no es un primer salto válido “único”).
 * - Si hay exactamente UNA REAL, retorna el valor de esa pieza (via valorPieza()).
 *
 * Útil para validar el “primer salto” de la DAMA y desempates por tipo capturado.
 */
export function firstCapturedPts(board, from, to) {
  const [r1, c1] = from || [];
  const [r2, c2] = to || [];
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);

  if (!Number.isFinite(dr) || !Number.isFinite(dc)) return 0;
  if (Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return 0; // debe ser diagonal

  let found = null;

  let rr = r1 + dr;
  let cc = c1 + dc;
  while (rr !== r2 || cc !== c2) {
    const cell = board?.[rr]?.[cc] ?? null;

    // Contabilizamos solo bloqueadores REALES (no GHOST)
    if (cell && !isGhost(cell)) {
      if (found) {
        // Ya había una real previa → más de una real, no es válido como "único".
        return 0;
      }
      found = cell;
    }

    rr += dr;
    cc += dc;
  }

  return found ? (valorPieza(found) || 0) : 0;
}

/**
 * Versión booleana conveniente: ¿hay EXACTAMENTE una pieza REAL entre from y to?
 * (Atajo sobre firstCapturedPts)
 */
export function firstHopHasSingleRealBlocker(board, from, to) {
  return firstCapturedPts(board, from, to) > 0;
}
// END queenRules.js
