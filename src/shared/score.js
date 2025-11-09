// src/shared/score.js
// Fuente ÚNICA de puntaje/desempate de rutas de captura
// Regla: cnt = Nº de capturas; pts = Dama (R/N) = 1.5, peón (r/n) = 1.0
// Soporta {captures}, {steps}, {path}, arrays simples.

export function scoreRoute(rt) {
  let pts = 0, cnt = 0;

  if (Array.isArray(rt?.captures)) {
    for (const cap of rt.captures) {
      const piece = cap?.cell ?? cap?.piece ?? null;
      pts += (piece === "R" || piece === "N") ? 1.5 : 1;
      cnt++;
    }
    return { cnt, pts };
  }

  if (Array.isArray(rt?.steps)) {
    cnt = rt.steps.length;
    pts = cnt; // fallback razonable si no tenemos pieza exacta
    return { cnt, pts };
  }

  if (Array.isArray(rt?.path)) {
    cnt = Math.max(0, rt.path.length - 1);
    pts = cnt;
    return { cnt, pts };
  }

  if (Array.isArray(rt) && rt.length > 1 && Array.isArray(rt[0]) && Array.isArray(rt[1])) {
    cnt = Math.max(0, rt.length - 1);
    pts = cnt;
    return { cnt, pts };
  }

  return { cnt: 0, pts: 0 };
}

export function topByCountThenPoints(routes) {
  if (!Array.isArray(routes) || routes.length === 0) return routes || [];
  let bestCnt = -1, bestPts = -Infinity;

  for (const rt of routes) {
    const { cnt, pts } = scoreRoute(rt);
    if (cnt > bestCnt) { bestCnt = cnt; bestPts = pts; }
    else if (cnt === bestCnt && pts > bestPts) { bestPts = pts; }
  }

  return routes.filter(rt => {
    const { cnt, pts } = scoreRoute(rt);
    return cnt === bestCnt && (bestCnt === 0 || Math.abs(pts - bestPts) < 1e-9);
  });
}

export function bestMetrics(routes) {
  if (!Array.isArray(routes) || routes.length === 0) return { maxCnt: 0, maxPts: 0 };

  let maxCnt = 0, maxPts = 0;
  for (const rt of routes) {
    const { cnt, pts } = scoreRoute(rt);
    if (cnt > maxCnt) { maxCnt = cnt; maxPts = pts; }
    else if (cnt === maxCnt && pts > maxPts) { maxPts = pts; }
  }
  return { maxCnt, maxPts };
}

export function keepBestRoutes(routes) {
  return topByCountThenPoints(routes);
}

/**
 * @typedef {Object} Candidate
 * @property {string|number} pieceId
 * @property {string} pieceType  // "queen"/"dama"/"R"/"N" o "pawn"/"peon"/"r"/"n"
 * @property {number} count
 * @property {number} points
 * @property {any} [route]
 */

/**
 * Selecciona ganadores globales con criterio configurable:
 *  - Por defecto: cantidad → puntos
 *  - Si opts.prioritizePointsOverCount === true: puntos → cantidad
 * En empate puro final: preferir dama si opts.preferQueenOnPureTie === true
 *
 * @param {Candidate[]} candidates
 * @param {{ preferQueenOnPureTie?: boolean, prioritizePointsOverCount?: boolean }} [opts]
 * @returns {Candidate[]}
 */
export function selectGlobalWinners(candidates, opts = {}) {
  const { preferQueenOnPureTie = false, prioritizePointsOverCount = false } = opts;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const getNum = (v, f = 0) => (typeof v === "number" && Number.isFinite(v) ? v : f);
  const isQueenType = (t) => {
    const s = (t ?? "").toString().toLowerCase();
    return s === "queen" || s === "dama" || s === "r" || s === "n" || s === "q";
  };

  const primaryKey   = prioritizePointsOverCount ? "points" : "count";
  const secondaryKey = prioritizePointsOverCount ? "count"  : "points";

  // 1) Máximo por clave primaria
  const maxPrimary = candidates.reduce((m, c) => Math.max(m, getNum(c[primaryKey])), -Infinity);
  const step1 = candidates.filter((c) => getNum(c[primaryKey]) === maxPrimary);
  if (step1.length <= 1) return step1.slice();

  // 2) Máximo por clave secundaria
  const maxSecondary = step1.reduce((m, c) => Math.max(m, getNum(c[secondaryKey])), -Infinity);
  const step2 = step1.filter((c) => getNum(c[secondaryKey]) === maxSecondary);
  if (step2.length <= 1) return step2.slice();

  // 3) Preferir damas si queda empate puro y la política lo solicita
  if (preferQueenOnPureTie) {
    const queens = step2.filter((c) => isQueenType(c.pieceType));
    if (queens.length > 0) return queens.slice();
  }

  // Empate real: devolver todos
  return step2.slice();
}
