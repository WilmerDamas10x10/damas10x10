// src/ai/eval.js
// Evaluador heurístico para Damas 10x10
// Firma: evaluate(board, me, { COLOR, SIZE, colorOf, movimientos })

export function evaluate(board, me, ctx) {
  const { COLOR, SIZE, colorOf, movimientos } = ctx;

  // === Pesos (ajustables) ===
  const W = {
    // materiales (mantener relación 1 : 1.5)
    MAN: 1.0,
    KING: 1.5,

    // heurísticas
    MOBILITY: 0.030,          // diferencia de cantidad de movimientos
    CENTER: 0.015,            // control del centro
    ADVANCE: 0.010,           // avance a coronación (solo peones)
    BACKRANK_GUARD: 0.050,    // peones defendiendo fila inicial
    SUPPORT: 0.020,           // peón con soporte diagonal
    HANGING: 0.080,           // penalización por pieza colgada (capturable ya)
    KING_STUCK: 0.040,        // dama con movilidad pobre
    TEMPO: 0.010              // pequeño bono si es tu turno (si la llamas con esa info)
  };

  // ==== helpers locales ====
  const opp = (s) => (s === COLOR.ROJO ? COLOR.NEGRO : COLOR.ROJO);
  const isMan = (ch) => !!ch && ch === ch.toLowerCase();
  const isKing = (ch) => !!ch && ch === ch.toUpperCase();

  // máscara de centro (6x6 central) y “nucleo” (4x4)
  const center6 = (r, c) => r >= 2 && r <= SIZE - 3 && c >= 2 && c <= SIZE - 3;
  const core4   = (r, c) => r >= 3 && r <= SIZE - 4 && c >= 3 && c <= SIZE - 4;

  // fila de salida
  const isBackRank = (side, r) =>
    (side === COLOR.ROJO && r === SIZE - 1) || (side === COLOR.NEGRO && r === 0);

  // distancia normalizada a coronación (0..1; 1 = ya corona en la próxima)
  function promoProgress(side, r) {
    if (side === COLOR.ROJO) {
      return (SIZE - 1 - r) / (SIZE - 1);
    } else {
      return r / (SIZE - 1);
    }
  }

  // vecinas diagonales (para “soporte”)
  const diagAdj = [
    [-1, -1], [-1, 1],
    [ 1, -1], [ 1, 1]
  ];

  // recorrer el tablero una sola vez para recolectar info base
  let matMe = 0, matOp = 0;
  let centerMe = 0, centerOp = 0;
  let advanceMe = 0, advanceOp = 0;
  let supportMe = 0, supportOp = 0;
  let backGuardMe = 0, backGuardOp = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const ch = board[r][c];
      if (!ch) continue;

      const side = colorOf(ch);
      const mine = (side === me);

      // material
      const val = isKing(ch) ? W.KING : W.MAN;
      if (mine) matMe += val; else matOp += val;

      // control del centro (peso mayor en el núcleo)
      let cen = 0;
      if (center6(r, c)) cen += 1;
      if (core4(r, c))   cen += 1;
      if (mine) centerMe += cen; else centerOp += cen;

      // avance (solo peones)
      if (isMan(ch)) {
        const prog = promoProgress(side, r);
        if (mine) advanceMe += prog; else advanceOp += prog;

        // soporte: si tiene un aliado en una diagonal adyacente, pequeño bono
        let hasSupport = false;
        for (const [dr, dc] of diagAdj) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
          const nb = board[rr][cc];
          if (nb && colorOf(nb) === side) { hasSupport = true; break; }
        }
        if (hasSupport) {
          if (mine) supportMe += 1; else supportOp += 1;
        }
      }

      // back-rank guard: peones en la fila de salida valen un poco
      if (isMan(ch) && isBackRank(side, r)) {
        if (mine) backGuardMe += 1; else backGuardOp += 1;
      }
    }
  }

  // movilidad (conteo de jugadas legales)
  function countMoves(b, side) {
    let total = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const ch = b[r][c];
        if (!ch || colorOf(ch) !== side) continue;
        const mv = movimientos(b, [r, c]) || {};
        const caps = mv.captures || mv.capturas || mv.takes || [];
        const quiet = mv.moves || mv.movs || [];
        total += (Array.isArray(caps) ? caps.length : 0) + (Array.isArray(quiet) ? quiet.length : 0);
      }
    }
    return total;
  }

  const mobMe = countMoves(board, me);
  const mobOp = countMoves(board, opp(me));

  // piezas colgadas: si el rival tiene una captura cuyo “mid” es mi pieza
  function diagPassCells(fr, fc, tr, tc) {
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
    if (!dr || !dc) return [];
    const cells = [];
    let r = fr + dr, c = fc + dc;
    while (r !== tr && c !== tc) { cells.push([r, c]); r += dr; c += dc; }
    return cells;
  }

  function countHanging(b, sideHanging) {
    const foe = opp(sideHanging);
    let hanging = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const ch = b[r][c];
        if (!ch || colorOf(ch) !== foe) continue;
        const mv = movimientos(b, [r, c]) || {};
        const caps = mv.captures || mv.capturas || mv.takes || [];
        if (!Array.isArray(caps) || caps.length === 0) continue;

        // si cualquier salto tiene exactamente una “mid” y esa mid es del ladoHanging, esa pieza está colgada
        for (const rt of caps) {
          const path = (rt?.path || rt?.ruta || rt?.steps || []);
          for (let i = 0; i < path.length - 1; i++) {
            const [fr, fc] = Array.isArray(path[i]) ? path[i] : [path[i].r, path[i].c];
            const [tr, tc] = Array.isArray(path[i+1]) ? path[i+1] : [path[i+1].r, path[i+1].c];
            const between = diagPassCells(fr, fc, tr, tc).filter(([rr, cc]) => !!b[rr][cc]);
            if (between.length === 1) {
              const [mr, mc] = between[0];
              const midCh = b[mr][mc];
              if (midCh && colorOf(midCh) === sideHanging) {
                hanging += isKing(midCh) ? 1.5 : 1.0; // ponderar por tipo
              }
            }
          }
        }
      }
    }
    return hanging;
  }

  const hangMe = countHanging(board, me);
  const hangOp = countHanging(board, opp(me));

  // damas “atascadas”: muy poca movilidad en damas
  function countKingStuck(b, side) {
    let stuck = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const ch = b[r][c];
        if (!ch || colorOf(ch) !== side || !isKing(ch)) continue;
        const mv = movimientos(b, [r, c]) || {};
        const caps = mv.capturas || mv.captures || [];
        const quiet = mv.movs || mv.moves || [];
        const deg = (Array.isArray(caps) ? caps.length : 0) + (Array.isArray(quiet) ? quiet.length : 0);
        if (deg <= 1) stuck += 1; // muy pocos escapes
      }
    }
    return stuck;
  }

  const stuckMe = countKingStuck(board, me);
  const stuckOp = countKingStuck(board, opp(me));

  // === Ensamble del score ===
  let score =
    // material
    (matMe - matOp) +

    // movilidad
    W.MOBILITY * (mobMe - mobOp) +

    // centro
    W.CENTER * (centerMe - centerOp) +

    // avance a coronación
    W.ADVANCE * (advanceMe - advanceOp) +

    // back-rank guard
    W.BACKRANK_GUARD * (backGuardMe - backGuardOp) +

    // soporte
    W.SUPPORT * (supportMe - supportOp) +

    // piezas colgadas (penaliza al que está colgado)
    (-W.HANGING * hangMe + W.HANGING * hangOp) +

    // damas atascadas (penaliza al que está atascado)
    (-W.KING_STUCK * stuckMe + W.KING_STUCK * stuckOp);

  // TEMPO (si usas un “turn” global, puedes inyectarlo por ctx.turn)
  if (ctx.turn != null) {
    score += (ctx.turn === me ? W.TEMPO : -W.TEMPO);
  }

  return score;
}
