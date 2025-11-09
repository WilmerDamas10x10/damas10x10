// src/engine/chainPolicies.js
// Lógica pura para cadenas de captura (sin tocar el DOM)

import { applySingleCaptureDeferred, finalizeDeferred } from "./chain.js";
import * as PolicyCfg from "./policies/config.js";
import { selectGlobalWinners } from "../shared/score.js";
import { getPolicy } from "./policies/config.js";
import { isQueenPiece as queenCheck } from "./chain.geom.js";

// ⚠️ IMPORTAMOS EL ENUM DE COLORES PARA NORMALIZAR EL TURNO
import { COLOR } from "@rules";

// ─────────────── Helpers movidos a módulo dedicado ───────────────
import {
  k,
  isQueenPiece,
  isPawnCell,
  isFirstHop,
  isRealPiece,
  firstCapturedPts,
  firstRealBetween,
  hasSingleRealBetween,
  queenLandingSquaresAfterAt,
} from "./chain.geom.js";

// ───────────────── Política activa (con fallback) ─────────────────
const DEFAULT_POLICY = {
  USE_FIRSTPTS_FOR_MIXED_TYPES: true,
  PREFER_QUEEN_ON_MIXED_PURE_TIE: true,
  USE_FIRSTPTS_FOR_PAWN_VS_PAWN: false,
  SAME_PIECE_FIRST_HOP_TIEBREAK_BY_FIRSTPTS: false,
  AUTO_PAWN_FIRSTPTS_WHEN_DIFFER: true,
  // Nuevo flag que podemos forzar con setPolicyOverrides:
  PRIORITIZE_POINTS_OVER_COUNT: false,
};

function activePolicy() {
  try {
    const p = PolicyCfg && typeof PolicyCfg.getPolicy === "function"
      ? PolicyCfg.getPolicy()
      : null;
    return p || DEFAULT_POLICY;
  } catch {
    return DEFAULT_POLICY;
  }
}

// ───────────────── Debug de políticas ─────────────────
const DEBUG_POLICY =
  (typeof window !== "undefined" && (
    (window.__DBG_POLICY__ === true) ||
    (window.location && /[&?]debugPolicy=1\b/.test(window.location.search)) ||
    (window.localStorage && window.localStorage.getItem("dbgPolicy") === "1")
  )) || false;

function dlog(...args) { if (DEBUG_POLICY) console.log("[policy]", ...args); }

// ───────────────── Métricas opcionales ─────────────────
export const ChainMetrics = {
  samePieceEqualTotals: 0,
  samePieceEqualTotalsDiffFirst: 0,
  globalPawnVsPawnEqualTotals: 0,
  globalMixedTie: 0,
  decidedByFirstPts: 0,
};

if (typeof window !== "undefined") {
  window.getChainMetrics = () => JSON.parse(JSON.stringify(ChainMetrics));
  window.resetChainMetrics = () => { Object.keys(ChainMetrics).forEach(k => ChainMetrics[k] = 0); };
}

// ───────────────── Normalización de turno ─────────────────
// Acepta "r","n","rojo","negro","red","black" o el enum COLOR del motor.
function normalizeTurn(t) {
  if (t == null) return t;
  if (t === (COLOR?.ROJO) || t === (COLOR?.NEGRO)) return t; // ya es enum
  const s = String(t).trim().toLowerCase();
  if (s === "r" || s === "rojo" || s === "red")   return COLOR?.ROJO ?? "r";
  if (s === "n" || s === "negro" || s === "black") return COLOR?.NEGRO ?? "n";
  return t; // fallback
}

// ───────────────── Parsing de rutas ─────────────────

// Devuelve los posibles "to" del PRIMER salto (robusto con formatos largos)
export function toArrFromRoute(rt, origin, board) {
  const [or, oc] = origin || [];
  const atOrigin = board?.[or]?.[oc] ?? null;
  const isQueen = typeof atOrigin === "string" && atOrigin === atOrigin.toUpperCase();

  // 1) Dama legacy con captures[0].r/c
  if (
    isQueen &&
    Array.isArray(rt?.captures) && rt.captures.length &&
    typeof rt.captures[0]?.r === "number" &&
    typeof rt.captures[0]?.c === "number"
  ) {
    const er = rt.captures[0].r, ec = rt.captures[0].c;
    return queenLandingSquaresAfterAt(board, [or, oc], [er, ec]);
  }

  // 2) Dama con captures[0].at
  const hasAt = Array.isArray(rt?.captures) && rt.captures.length && Array.isArray(rt.captures[0]?.at);
  if (hasAt && isQueen) {
    const [er, ec] = rt.captures[0].at;
    return queenLandingSquaresAfterAt(board, [or, oc], [er, ec]);
  }

  // 3) ⭐ Dama con SOLO captures[0].to (sin 'at'): deducimos 'at' y listamos TODOS los aterrizajes
  if (
    isQueen &&
    Array.isArray(rt?.captures) && rt.captures.length &&
    rt.captures[0]?.to && !rt.captures[0]?.at
  ) {
    const to = rt.captures[0].to;
    if (Array.isArray(to) && to.length >= 2) {
      const at = firstRealBetween(board, [or, oc], to);
      if (Array.isArray(at)) {
        return queenLandingSquaresAfterAt(board, [or, oc], at);
      }
    }
  }

  // 4) Otros formatos
  // 4a) path: intentamos todos los nodos que sean 1er salto válido desde (or,oc)
  if (Array.isArray(rt?.path) && rt.path.length > 1) {
    const outs = [];
    for (let i = 1; i < rt.path.length; i++) {
      const to = rt.path[i];
      if (Array.isArray(to) && to.length >= 2 && hasSingleRealBetween(board, [or, oc], to)) {
        outs.push(to);
      }
    }
    if (outs.length) return outs;
    // Fallback: si el path contiene el origen, tomar el siguiente
    const idx = rt.path.findIndex(p => Array.isArray(p) && p[0] === or && p[1] === oc);
    if (idx >= 0 && idx + 1 < rt.path.length) return [rt.path[idx + 1]];
    return [rt.path[1]];
  }

  // 4b) steps: devolvemos el/los primeros 'to' disponibles
  if (Array.isArray(rt?.steps)) {
    const outs = rt.steps.map(s => s?.to).filter(Array.isArray);
    return outs.length ? outs : [];
  }

  // 4c) captures con 'to': devolvemos TODOS los 'to' y luego la geometría valida el 1er salto
  if (Array.isArray(rt?.captures) && rt.captures.length && rt.captures[0]?.to) {
    return rt.captures.map(x => x.to).filter(Array.isArray);
  }

  // 4d) array crudo de coordenadas
  if (Array.isArray(rt) && rt.length > 1 && Array.isArray(rt[0]) && Array.isArray(rt[1])) {
    // Intento robusto: todos los que sean 1er salto válido desde (or,oc)
    const outs = [];
    for (let i = 1; i < rt.length; i++) {
      const to = rt[i];
      if (Array.isArray(to) && to.length >= 2 && hasSingleRealBetween(board, [or, oc], to)) {
        outs.push(to);
      }
    }
    return outs.length ? outs : [rt[1]];
  }

  // 4e) objeto con 'to'
  if (Array.isArray(rt?.to)) return [rt.to];

  // Fallback: si viniera con 'at' pero sin 'to'
  if (hasAt) {
    const [er, ec] = rt.captures[0].at;
    const dr = Math.sign(er - or), dc = Math.sign(ec - oc);
    return [[er + dr, ec + dc]];
  }
  return [];
}

// Cruce/aterrizaje en visitadas (origin0 siempre prohibida si así se define)
export function crossesOrLandsVisited(from, to, visited, allowCross = false, origin0 = null) {
  if (!visited || visited.size === 0) return false;
  const [r1, c1] = from, [r2, c2] = to;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  if (Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return false;

  if (allowCross) {
    if (visited.has(k(r2, c2))) return true;
    if (Array.isArray(origin0)) {
      let rr = r1 + dr, cc = c1 + dc;
      while (rr !== r2 || cc !== c2) {
        if (rr === origin0[0] && cc === origin0[1]) return true;
        rr += dr; cc += dc;
      }
    }
    return false;
  }

  let rr = r1 + dr, cc = c1 + dc;
  while (rr !== r2 || cc !== c2) {
    if (visited.has(k(rr, cc))) return true;
    rr += dr; cc += dc;
  }
  return visited.has(k(r2, c2));
}

// Filtro por visitadas con regla de Dama (1er salto estricto; luego puede cruzar)
export function filterRoutesByVisitedSmart(routes, origin, visited, board, origin0) {
  if (!Array.isArray(routes) || !routes.length) return routes || [];
  const queen = isQueenPiece(board?.[origin[0]]?.[origin[1]]);
  const first = isFirstHop(origin, visited);
  const allowCross = queen ? !first : false;

  const out = [];
  for (const rt of routes) {
    const tos = toArrFromRoute(rt, origin, board);
    const ok = (tos || []).some(to =>
      Array.isArray(to) && to.length >= 2 &&
      !crossesOrLandsVisited(origin, to, visited, allowCross, origin0)
    );
    if (ok) out.push(rt);
  }
  return out;
}

// ───────────── Continuación ÓPTIMA (DFS) ─────────────
function evalBestContinuationDFS(board, pos, visited, origin0, movimientos) {
  const res = movimientos(board, pos) || {};
  let caps = Array.isArray(res.captures) ? res.captures : [];
  caps = filterRoutesByVisitedSmart(caps, pos, visited, board, origin0);
  if (!caps.length) return { cnt: 0, pts: 0 };

  let bestCnt = 0, bestPts = 0;

  for (const rt of caps) {
    const tos = toArrFromRoute(rt, pos, board) || [];
    for (const to of tos) {
      if (!Array.isArray(to) || to.length < 2) continue;
      const R = board.length, C = board[0].length;
      if (to[0] < 0 || to[0] >= R || to[1] < 0 || to[1] >= C) continue;

      if (!hasSingleRealBetween(board, pos, to)) continue;

      const nb = board.map(row => row.slice());
      const tmp = { visited: new Set(visited), pos: pos.slice(), deferred: [] };
      const nb2 = applySingleCaptureDeferred(nb, pos, to, tmp);
      const nb2gen = finalizeDeferred(nb2, tmp.deferred);

      const visited2 = new Set(tmp.visited);
      visited2.add(k(to[0], to[1]));

      const stepPts = firstCapturedPts(board, pos, to);
      const cont = evalBestContinuationDFS(nb2gen, to, visited2, origin0, movimientos);

      const totalCnt = 1 + cont.cnt;
      const totalPts = stepPts + cont.pts;

      if (totalCnt > bestCnt || (totalCnt === bestCnt && totalPts > bestPts)) {
        bestCnt = totalCnt; bestPts = totalPts;
      }
    }
  }
  return { cnt: bestCnt, pts: bestPts };
}

// ───────────── Totales del 1er salto ─────────────
export function evalFirstHopTotals(board, from, visited, origin0, movimientos) {
  const res = movimientos(board, from) || {};
  let caps = Array.isArray(res.captures) ? res.captures : [];
  caps = filterRoutesByVisitedSmart(caps, from, visited, board, origin0);
  if (!caps.length) return { items: [], bestCnt: 0, bestPts: 0 };

  const items = [];
  let bestCnt = -1, bestPts = -Infinity;

  // ⚠️ Evaluar TODAS las rutas del primer salto (sin topByCountThenPoints aquí)
  for (const rt of caps) {
    const tos = toArrFromRoute(rt, from, board) || [];
    for (const to of tos) {
      if (!Array.isArray(to) || to.length < 2) continue;

      const queen = isQueenPiece(board?.[from[0]]?.[from[1]]);
      const allowCross = queen ? !isFirstHop(from, visited) : false;
      if (crossesOrLandsVisited(from, to, visited, allowCross, origin0)) continue;

      const R = board.length, C = board[0].length;
      if (to[0] < 0 || to[0] >= R || to[1] < 0 || to[1] >= C) continue;
      if (!hasSingleRealBetween(board, from, to)) continue;

      const nb = board.map(row => row.slice());
      const tmpState = { visited: new Set(visited), pos: from.slice(), deferred: [] };
      const nb2 = applySingleCaptureDeferred(nb, from, to, tmpState);
      const nb2gen = finalizeDeferred(nb2, tmpState.deferred);

      const visited2 = new Set(tmpState.visited);
      visited2.add(k(to[0], to[1]));

      const cont = evalBestContinuationDFS(nb2gen, to, visited2, origin0, movimientos);
      const firstPtsVal = firstCapturedPts(board, from, to);

      const totalCnt = 1 + cont.cnt;
      const totalPts = firstPtsVal + cont.pts;

      items.push({ to, totalCnt, totalPts, firstPts: firstPtsVal });

      if (totalCnt > bestCnt) { bestCnt = totalCnt; bestPts = totalPts; }
      else if (totalCnt === bestCnt && totalPts > bestPts) { bestPts = totalPts; }
    }
  }

  const winners = items.filter(it => it.totalCnt === bestCnt && Math.abs(it.totalPts - bestPts) < 1e-9);
  if (winners.length > 1) {
    ChainMetrics.samePieceEqualTotals++;
    const firstSet = new Set(winners.map(w => w.firstPts));
    if (firstSet.size > 1) ChainMetrics.samePieceEqualTotalsDiffFirst++;
  }

  return { items, bestCnt, bestPts };
}

// --- RAW: versión cruda
export function allowedFirstFromRaw(board, from, visited, origin0, movimientos) {
  const { items, bestCnt, bestPts } =
    evalFirstHopTotals(board, from, visited, origin0, movimientos);

  const allowed = new Set();
  let bestFirst = -Infinity;
  for (const it of items) {
    if (it.totalCnt === bestCnt && it.totalPts >= bestPts - 1e-9) {
      allowed.add(`${it.to[0]},${it.to[1]}`);
      if (typeof it.firstPts === "number") bestFirst = Math.max(bestFirst, it.firstPts);
    }
  }
  if (allowed.size === 0) {
    return { allowed, bestCnt: 0, bestPts: 0, bestFirst: 0 };
  }
  return {
    allowed,
    bestCnt,
    bestPts,
    bestFirst: (bestFirst === -Infinity ? 0 : bestFirst),
  };
}

// Aterrizajes permitidos del PRIMER salto (wrapper opcional)
export function allowedFirstFrom(board, from, visited, origin0, movimientos, opts = {}) {
  const { tiebreakSamePiece = false } = opts;
  const base = allowedFirstFromRaw(board, from, visited, origin0, movimientos);

  if (!tiebreakSamePiece || base.allowed.size <= 1) {
    return base;
  }

  const { items } = evalFirstHopTotals(board, from, visited, origin0, movimientos);
  const filtered = new Set();
  for (const it of items) {
    if (
      it.totalCnt === base.bestCnt &&
      it.totalPts >= base.bestPts - 1e-9 &&
      typeof it.firstPts === "number" &&
      it.firstPts >= base.bestFirst - 1e-9
    ) {
      filtered.add(`${it.to[0]},${it.to[1]}`);
    }
  }
  return { ...base, allowed: filtered };
}

/**
 * Familias globales óptimas por pieza en turno.
 * Devuelve winners, globalCnt, globalPts. En empate exacto, prefiere Dama.
 */
// ...
export function computeGlobalAllowed(board, turn, movimientos, colorOf) {
  const normTurn = normalizeTurn(turn);
  const rows = Array.isArray(board) ? board.length : 0;
  const cols = rows ? board[0].length : 0;

  const candidates = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      if (typeof colorOf === "function" && colorOf(cell) !== normTurn) continue;

      const visited0 = new Set([`${r},${c}`]);
      const origin0 = [r, c];

      let bestCnt = 0, bestPts = 0, allowed = null;
      try {
        const res = allowedFirstFrom(
          board, origin0, visited0, origin0, movimientos,
          { tiebreakSamePiece: false }
        );
        allowed = res?.allowed ?? null;
        bestCnt = typeof res?.bestCnt === "number" ? res.bestCnt : 0;
        bestPts = typeof res?.bestPts === "number" ? res.bestPts : 0;
      } catch {}

      if (allowed && allowed.size) {
        const q = typeof queenCheck === "function"
          ? queenCheck(cell)
          : (typeof isQueenPiece === "function"
             ? isQueenPiece(cell)
             : String(cell) === String(cell).toUpperCase());

        candidates.push({
          pieceId: `${r},${c}`,
          pieceType: q ? "queen" : "pawn",
          count: bestCnt,
          points: bestPts,
          pos: [r, c],
        });
      }
    }
  }

  if (!candidates.length) {
    return { winners: new Set(), globalCnt: 0, globalPts: 0 };
  }

  const policy = typeof getPolicy === "function" ? (getPolicy() || {}) : {};
  const preferQueenOnPureTie = !!policy.PREFER_QUEEN_ON_MIXED_PURE_TIE;
  const prioritizePointsOverCount = !!policy.PRIORITIZE_POINTS_OVER_COUNT;

  const winnersArr = selectGlobalWinners(candidates, {
    preferQueenOnPureTie,
    prioritizePointsOverCount,
  });

  const winners = new Set(
    winnersArr.map(w => w.pieceId || (Array.isArray(w.pos) ? `${w.pos[0]},${w.pos[1]}` : ""))
              .filter(Boolean)
  );

  const globalCnt = winnersArr[0]?.count ?? 0;
  const globalPts = winnersArr[0]?.points ?? 0;

  return { winners, globalCnt, globalPts };
}








// UI wrapper
export function allowedFirstFromUI(board, from, visited, origin0, movimientos) {
  return allowedFirstFrom(
    board, from, visited, origin0, movimientos,
    { tiebreakSamePiece: false }
  );
}

// =====================================================================
// [PASO 2] Adapter NO intrusivo para winners globales (aún sin conectar)
// - No modifica la lógica actual. Nadie lo llama todavía.
// - Normaliza los candidatos y aplica la preferencia por dama si la política lo pide.
// =====================================================================

/**
 * Normaliza el tipo de pieza a "queen" o "pawn" a partir de diferentes convenciones:
 * - Damas: "queen", "dama", "q", "R", "N"
 * - Peones: "pawn", "peon", "peón", "p", "r", "n"
 * Si no reconoce, devuelve el string en minúsculas.
 */
function normalizePieceType(t) {
  const s = (t ?? "").toString();
  const low = s.toLowerCase();

  // Queens (dama)
  if (low === "queen" || low === "dama" || low === "q" || s === "R" || s === "N") {
    return "queen";
  }

  // Pawns (peón)
  if (
    low === "pawn" || low === "peon" || low === "peón" ||
    low === "p" || low === "r" || low === "n"
  ) {
    return "pawn";
  }

  return low;
}

/**
 * Recibe candidatos crudos del motor/UI y devuelve los ganadores globales unificados.
 * NO muta los objetos originales.
 * @param {Array<{ pieceId?:string|number, pieceType?:string, type?:string, kind?:string, char?:string, count?:number, points?:number, route?:any }>} rawCandidates
 * @returns {Array}
 */
export function computeGlobalWinnersUnified(rawCandidates) {
  const list = Array.isArray(rawCandidates) ? rawCandidates : [];
  if (list.length === 0) return [];

  const policy = getPolicy?.() || {};
  const preferQueenOnPureTie = !!policy.PREFER_QUEEN_ON_MIXED_PURE_TIE;

  // Normaliza forma mínima requerida por selectGlobalWinners
  const candidates = list.map((c) => {
    const pieceType =
      c.pieceType ?? c.type ?? c.kind ?? c.char ?? ""; // tolerante a distintas formas
    return {
      ...c,
      pieceType: normalizePieceType(pieceType),
      count: typeof c.count === "number" ? c.count : 0,
      points: typeof c.points === "number" ? c.points : 0,
    };
  });

  return selectGlobalWinners(candidates, {
    preferQueenOnPureTie,
    prioritizePointsOverCount: !!policy.PRIORITIZE_POINTS_OVER_COUNT,
  });
}
