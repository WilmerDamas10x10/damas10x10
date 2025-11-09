// src/ui/pages/Training/editor/interactions.controller.js
import { applySingleCaptureDeferred, finalizeDeferred } from "../../../../engine/chain.js";
import {
  toArrFromRoute,
  filterRoutesByVisitedSmart,
  allowedFirstFrom,
  computeGlobalAllowed,
  crossesOrLandsVisited,
} from "../../../../engine/chainPolicies.js";
// Paso 3.A — importar el adaptador unificado del motor (fallback seguro)

// ⬇⬇ estos helpers ahora viven en chain.geom.js
import { isQueenPiece as isQueenCell, isPawnCell, isFirstHop } from "../../../../engine/chain.geom.js";

// ⬇⬇ score helpers están en src/shared/score.js
import { keepBestRoutes, scoreRoute } from "../../../../shared/score.js";

import { isGhost } from "@rules";
import { pushMove } from "./services/replay.js";
import { setChainAttr, clearOV2Now } from "./interactions/ov2.js";
import { pruneStepsToAllowed } from "./interactions/allowed.js";
import { hasAnyRealCapture } from "./interactions/captureCheck.js";
import { k, ensureVisited } from "./interactions/visited.js";
import { endTurnAndCheck } from "./interactions/endCheck.js";
import { sfx } from "../../../sound/sfx.js";

// FX (Editor)
import { triggerPieceZoom, triggerCapturedVanish } from "../../../lib/uiFX.js";
// Animación suave de piezas (Editor)
import { animateCellMove, clearGhostArtifacts } from "../../../lib/ghostAnim.js";

// Helper: espera una promesa si existe, manteniendo API sin async/await
function awaitPromise(p) {
  try {
    if (p && typeof p.then === "function") {
      p.then(() => {}).catch(() => {});
    }
  } catch {}
}

// —— Helper FX: localizar la casilla de la pieza capturada entre from → to ——
function findCapturedBetween(board, from, to, colorOf, isGhostFn) {
  const dr = Math.sign(to[0] - from[0]);
  const dc = Math.sign(to[1] - from[1]);
  let rr = from[0] + dr, cc = from[1] + dc;
  const myColor = colorOf(board[from[0]][from[1]]);
  while (rr !== to[0] || cc !== to[1]) {
    const cell = board[rr][cc];
    if (cell && !isGhostFn(cell)) {
      if (colorOf(cell) !== myColor) return [rr, cc]; // enemigo capturado
    }
    rr += dr; cc += dc;
  }
  return null;
}

// —— Helpers de brillo (glow) para la pieza seleccionada ——
function clearSelectedGlow(boardEl){
  try {
    boardEl.querySelectorAll(".piece.glow-selected").forEach(el => {
      el.classList.remove("glow-selected");
      el.style.removeProperty("--ring-color"); // ← limpia el color forzado
    });
  } catch {}
}

function setSelectedGlow(boardEl, r, c){
  clearSelectedGlow(boardEl);
  try {
    const tile  = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    const piece = tile && tile.querySelector(".piece");
    if (!piece) return;

    piece.classList.add("glow-selected");

    // Detecta si la pieza es clara (blanca) con varias heurísticas
    const cellStr   = (tile.getAttribute("data-piece") || tile.getAttribute("data-color") || "") + " " + piece.className;
    const pieceAttr = (piece.getAttribute("data-color") || piece.getAttribute("data-piece-color") || "");
    const tag = (cellStr + " " + pieceAttr).toLowerCase();

    // Ajusta aquí el color que QUIERES para la pieza blanca:
    const colorForLight = "#0e0d0dff";  // dorado (contrasta y combina)
    const colorForDark  = "#FFFFFF";  // blanco para piezas negras

    const isLight = /\bwhite\b|\blight\b|\bw\b|\br\b/.test(tag); // cubre white/light/w/r
    piece.style.setProperty("--ring-color", isLight ? colorForLight : colorForDark);
  } catch {}

  // ——— Notificar selección (evento de UI) para sincronizar efectos remotos ———
  try {
    const b = (typeof getBoard === "function") ? getBoard() : null;
    const color = b?.[r]?.[c] || null; // puede ser char de pieza (sirve como pista visual)
    window.dispatchEvent(new CustomEvent("editor:ui", {
      detail: { op: "select", r, c, color }
    }));
  } catch {}
}


// Exporta un controlador con el mismo comportamiento que había en interactions.js
export function createInteractionsController(container, ctx) {
  const {
    SIZE,
    getBoard,
    setBoard,
    getTurn,
    getStepState,
    setStepState,
    getPlacing,
    render,
    paintState,
    saveForUndo,
    rules: { colorOf, movimientos, aplicarMovimiento },
    hints: { clearHints, hintMove, showFirstStepOptions, markRouteLabel },
    controller: { continueOrEndChain },
  } = ctx;

  let __chainFrom = null;
  const boardEl = container.querySelector("#board");

  function finalizeChainNow() {
    const ss = getStepState();
    if (!ss) return;
    const nb2 = finalizeDeferred(getBoard(), ss.deferred || []);
    setBoard(nb2);
    setStepState(null);
    setChainAttr(boardEl, false);
    clearOV2Now(boardEl);
    clearSelectedGlow(boardEl);
    render();
    paintState();
  }

  // ——— Cerrar cadena y limpiar al cambiar de variante ———
  function onVariantChanged() {
    try {
      // Si hay cadena activa, la cerramos y aplicamos capturas diferidas
      const ss = getStepState?.();
      if (ss) finalizeChainNow();
    } catch {}

    // Limpieza visual y reset de estado local
    try { clearHints?.(boardEl); } catch {}
    try { setChainAttr(boardEl, false); } catch {}
    try { clearOV2Now(boardEl); } catch {}
    try { clearGhostArtifacts(boardEl); } catch {}
    try { clearSelectedGlow(boardEl); } catch {}
    __chainFrom = null;

    // Re-pintar para reflejar la nueva política
    try { render?.(); paintState?.(); } catch {}
  }

  // Suscripción al evento que dispara el selector de variante del Editor
  document.addEventListener("damas:variant-changed", onVariantChanged);

  const _continueBase = continueOrEndChain;

  function continueChain(dest) {
    const prev = getStepState();

    // registrar salto actual (replay)
    try {
      const origin =
        (prev && Array.isArray(prev.origin0)) ? prev.origin0 :
        (prev && Array.isArray(prev.pos))     ? prev.pos   :
        null;
      const fromArr = Array.isArray(__chainFrom) ? __chainFrom : origin;
      if (fromArr && Array.isArray(dest)) {
        const b0 = getBoard();
        const piece0 = b0?.[fromArr[0]]?.[fromArr[1]] || null;
        const isQ0 = piece0 ? isQueenCell(piece0) : false;
        const willPromote = (!isQ0) && (dest[0] === 0 || dest[0] === SIZE - 1);
        pushMove({
          from: `${fromArr[0]},${fromArr[1]}`,
          to: `${dest[0]},${dest[1]}`,
          piece: isQ0 ? "Q" : "P",
          capture: true,
          promote: willPromote,
        });
      }
    } catch {}

    const prevVisited = prev?.visited instanceof Set ? new Set(prev.visited) : new Set();
    const origin0 = prev?.origin0 ? prev.origin0.slice() : null;

    _continueBase(dest);

    const ss = getStepState();
    const boardNow = getBoard();

    if (!ss) {
      const nb2 = finalizeDeferred(boardNow, prev?.deferred || []);
      if (nb2 !== boardNow) { setBoard(nb2); render(); paintState(); }
      setChainAttr(boardEl, false);
      clearOV2Now(boardEl);
      clearSelectedGlow(boardEl);
      return;
    }

    ss.visited = prevVisited;
    ss.origin0 = origin0 || ss.origin0;
    ss.visited.add(k(dest[0], dest[1]));
    ss.deferred = prev?.deferred || ss.deferred;
    setStepState(ss);

    const from = ss.pos;
    const res = movimientos(boardNow, from) || {};
    let caps = Array.isArray(res.captures) ? res.captures : [];
    caps = filterRoutesByVisitedSmart(caps, from, ss.visited, boardNow, ss.origin0);
    caps = keepBestRoutes(caps);

    if (
      !caps.length ||
      !hasAnyRealCapture(
        boardNow, from, ss.visited, ss.origin0, SIZE,
        colorOf, isQueenCell, isFirstHop, crossesOrLandsVisited, isGhost
      )
    ) {
      clearHints(boardEl);
      const nb2 = finalizeDeferred(getBoard(), ss.deferred || []); // limpia GHOSTs
      setBoard(nb2);
      setStepState(null);
      setChainAttr(boardEl, false);
      clearOV2Now(boardEl);
      __chainFrom = null;
      clearSelectedGlow(boardEl);
      endTurnAndCheck(container, ctx);
      return;
    }

    clearHints(boardEl);
    showFirstStepOptions(boardEl, caps, [from[0], from[1]]);

    const { allowed: allowedNow } = allowedFirstFrom(
      boardNow, from, ss.visited, ss.origin0, movimientos,
      { tiebreakSamePiece: false }
    );

    // Si tras restricciones no hay aterrizajes permitidos, termina cadena y pasa turno
    if (!allowedNow || allowedNow.size === 0) {
      clearHints(boardEl);
      finalizeChainNow();
      __chainFrom = null;
      clearSelectedGlow(boardEl);
      endTurnAndCheck(container, ctx);
      return;
    }

    pruneStepsToAllowed(boardEl, allowedNow);

    for (const rt of caps) {
      const s = scoreRoute(rt);
      const tos = toArrFromRoute(rt, from, boardNow) || [];
      const labelText = `${s.cnt || 0} cap · ${s.pts || 0} pts`;
      for (const to of tos) {
        const key = `${to[0]},${to[1]}`;
        if (!allowedNow.has(key)) continue;
        const tEl = boardEl.querySelector(`[data-r="${to[0]}"][data-c="${to[1]}"]`);
        if (tEl) tEl.setAttribute("title", labelText);
      }
    }
  }

  function onClick(e) {
    const tile = e.target.closest("[data-r]");
    if (!tile) return;
    if (boardEl.getAttribute("data-locked") === "1") return;

    const r = +tile.dataset.r, c = +tile.dataset.c;

    let board = getBoard();
    let stepState = getStepState();
    const placing = getPlacing();
    const turn = getTurn();

    // 1) Edición manual
    if (placing) {
      if (stepState && stepState.deferred && stepState.deferred.length) {
        finalizeChainNow();
      }
      const isDark = tile.dataset.dark === "1";
      if (placing !== "x" && !isDark) { sfx.invalid(); return; }
      if ((placing === "n" && r === SIZE - 1) || (placing === "r" && r === 0)) {
        tile.classList.add("shake");
        sfx.invalid();
        setTimeout(() => tile.classList.remove("shake"), 200);
        return;
      }
      saveForUndo();
      const nb = board.map((row) => row.slice());
      nb[r][c] = placing === "x" ? null : placing;
      setBoard(nb);
      render();
      paintState();
      return;
    }

    // 2) Cadena: primer/continuación salto cliqueable
    if (tile.dataset.step) {
      const st = JSON.parse(tile.dataset.step);
      const from = st.from;
      const to = st.to;
      let dest = to;

      const dr = Math.sign(to[0] - from[0]);
      const dc = Math.sign(to[1] - from[1]);

      const isQ = isQueenCell(board[from[0]][from[1]]);
      if (!isQ && Math.abs(to[0] - from[0]) === 1 && Math.abs(to[1] - from[1]) === 1) {
        const jr = from[0] + 2 * dr;
        const jc = from[1] + 2 * dc;
        if (jr >= 0 && jr < SIZE && jc >= 0 && jc < SIZE && !board[jr][jc]) {
          dest = [jr, jc];
        }
      }

      if (!stepState || !Array.isArray(stepState.pos)) {
        stepState = { pos: from.slice(), visited: new Set([k(from[0], from[1])]), origin0: from.slice() };
        setStepState(stepState);
        setChainAttr(boardEl, true);
        clearOV2Now(boardEl);
      }
      const visited = ensureVisited(stepState, from);

      // Gate de primer salto (si falla, inválido)
      {
        const { allowed } = allowedFirstFrom(
          board, from, visited, stepState.origin0, movimientos,
          { tiebreakSamePiece: false }
        );
        if (allowed && !allowed.has(`${dest[0]},${dest[1]}`)) { sfx.invalid(); return; }
      }

      if (crossesOrLandsVisited(from, dest, visited, isQ && !isFirstHop(from, visited), stepState.origin0)) {
        sfx.invalid();
        return;
      }

      const wasPawn = isPawnCell(board[from[0]][from[1]]);

      // ⬇⬇ Animación de cada salto de captura (Editor)
      awaitPromise(animateCellMove(
        boardEl,
        from,
        dest,
        { pieceChar: (board?.[from[0]]?.[from[1]] || null), lift: 10 }
      ));

      // FX: desvanecer la pieza capturada (si existe) — antes de aplicar la captura
      try {
        const cap = findCapturedBetween(board, from, dest, colorOf, isGhost);
        if (cap) triggerCapturedVanish(boardEl, cap, { duration: 2000 });
      } catch {}

      saveForUndo();
      const nb = applySingleCaptureDeferred(board, from, dest, stepState);
      setBoard(nb);
      sfx.capture(); // sonido de captura

      visited.add(k(dest[0], dest[1]));
      stepState.pos = dest.slice();

      setChainAttr(boardEl, true);
      clearOV2Now(boardEl);

      render();
      paintState();

      // CORONACIÓN dentro de cadena → sonido
      if (wasPawn && (dest[0] === 0 || dest[0] === SIZE - 1)) {
        try {
          pushMove({
            from: `${from[0]},${from[1]}`,
            to: `${dest[0]},${dest[1]}`,
            piece: "P",
            capture: true,
            promote: true
          });
        } catch {}
        sfx.promote();

        clearHints(boardEl);
        const nb2 = finalizeDeferred(getBoard(), stepState?.deferred || []);
        setBoard(nb2);
        setStepState(null);
        setChainAttr(boardEl, false);
        clearOV2Now(boardEl);
        __chainFrom = null;
        clearSelectedGlow(boardEl);
        endTurnAndCheck(container, ctx);
        return;
      }

      continueChain(dest);
      return;
    }

    // 3) Cadena: fallback manual
    if (stepState) {
      (function () {
        const first = isFirstHop(stepState.pos, stepState.visited);
        if (!first) return;

        const from0 = stepState.pos;
        const visited0 = ensureVisited(stepState, from0);

        const { allowed: allowed0 } = allowedFirstFrom(
          board, from0, visited0, stepState.origin0, movimientos,
          { tiebreakSamePiece: false }
        );

        const key = `${r},${c}`;
        const isSameOrigin = r === from0[0] && c === from0[1];
        const isStepTile = !!tile.dataset.step;
        const isAllowedFirstLanding = tile.dataset.dark === "1" && allowed0.has(key);

        if (!isSameOrigin && !isStepTile && !isAllowedFirstLanding) {
          clearHints(boardEl);
          const nb2 = finalizeDeferred(getBoard(), stepState?.deferred || []);
          setBoard(nb2);
          setStepState(null);
          setChainAttr(boardEl, false);
          clearOV2Now(boardEl);
          sfx.invalid();
          clearSelectedGlow(boardEl);
          stepState = null;
        }
      })();

      if (!stepState) {
        // cae a selección normal
      } else {
        if (
          board[r][c] &&
          Array.isArray(stepState.pos) &&
          (r !== stepState.pos[0] || c !== stepState.pos[1])
        ) {
          tile.classList.add("shake");
          sfx.invalid();
          setTimeout(() => tile.classList.remove("shake"), 200);
          return;
        }
        if (tile.dataset.dark !== "1") {
          tile.classList.add("shake");
          sfx.invalid();
          setTimeout(() => tile.classList.remove("shake"), 120);
          return;
        }

        const from = stepState.pos;
        const to = [r, c];
        const visited = ensureVisited(stepState, from);

        {
          const { allowed } = allowedFirstFrom(
            board, from, visited, stepState.origin0, movimientos,
            { tiebreakSamePiece: false }
          );
          if (allowed && !allowed.has(`${to[0]},${to[1]}`)) { sfx.invalid(); return; }
        }

        if (
          crossesOrLandsVisited(
            from, to, visited,
            isQueenCell(board[from[0]][from[1]]) && !isFirstHop(from, visited),
            stepState.origin0
          )
        ) { sfx.invalid(); return; }

        const diag = Math.abs(to[0] - from[0]) === Math.abs(to[1] - from[1]);
        const emptyDest = !board[to[0]][to[1]];
        const span = Math.abs(to[0] - from[0]);

        if (diag && emptyDest && span >= 2) {
          const dr = Math.sign(to[0] - from[0]);
          const dc = Math.sign(to[1] - from[1]);

          const myColor = colorOf(board[from[0]][from[1]]);
          let rr = from[0] + dr, cc = from[1] + dc;
          let enemies = 0, friendly = 0;

          while (rr !== to[0] || cc !== to[1]) {
            const cell = board[rr][cc];
            if (cell && !isGhost(cell)) {
              if (colorOf(cell) === myColor) { friendly++; break; }
              enemies++;
            }
            rr += dr; cc += dc;
          }

          if (friendly === 0 && enemies === 1) {
            const wasPawn = isPawnCell(board[from[0]][from[1]]);

            // ⬇⬇ Animación de cada salto de captura (fallback)
            awaitPromise(animateCellMove(
              boardEl,
              from,
              to,
              { pieceChar: (board?.[from[0]]?.[from[1]] || null), lift: 10 }
            ));

            // FX: desvanecer la pieza capturada (si existe) — antes de aplicar la captura
            try {
              const cap = findCapturedBetween(board, from, to, colorOf, isGhost);
              if (cap) triggerCapturedVanish(boardEl, cap, { duration: 2000 });
            } catch {}

            saveForUndo();
            const nb = applySingleCaptureDeferred(board, from, to, stepState);
            setBoard(nb);
            sfx.capture(); // sonido de captura (fallback)

            visited.add(k(to[0], to[1]));
            stepState.pos = to.slice();

            setChainAttr(boardEl, true);
            clearOV2Now(boardEl);

            render();
            paintState();

            // CORONACIÓN en fallback → sonido
            if (wasPawn && (to[0] === 0 || to[0] === SIZE - 1)) {
              try {
                pushMove({
                  from: `${from[0]},${from[1]}`,
                  to: `${to[0]}`, // to[1] queda implícito si mantienes formato, corrige si necesitas string
                  piece: "P",
                  capture: true,
                  promote: true
                });
              } catch {}
              sfx.promote();

              clearHints(boardEl);
              const nb2 = finalizeDeferred(getBoard(), stepState?.deferred || []);
              setBoard(nb2);
              setStepState(null);
              setChainAttr(boardEl, false);
              clearOV2Now(boardEl);
              __chainFrom = null;
              clearSelectedGlow(boardEl);
              endTurnAndCheck(container, ctx);
              return;
            }

            continueChain(to);
            return;
          }
        }

        sfx.invalid();
        return;
      }
    }

    // 4) Movimiento simple (sin cadena)
    if (!stepState && tile.dataset.move) {
      const move = JSON.parse(tile.dataset.move);

      // si hay obligación global de capturar, bloquear
      try {
        const { winners } = computeGlobalAllowed(board, turn, movimientos, colorOf);
        if (winners && winners.size > 0) {
          tile.classList.add("shake");
          setTimeout(() => tile.classList.remove("shake"), 160);
          clearHints?.(boardEl);
          sfx.invalid();
          return;
        }
      } catch {}

      // ⬇⬇ Animación de movimiento simple (Editor)
      awaitPromise(animateCellMove(
        boardEl,
        move.from,
        move.to,
        { pieceChar: (board?.[move.from[0]]?.[move.from[1]] || null) }
      ));

      saveForUndo();
      const nb = aplicarMovimiento(board, move);
      setBoard(nb);

      try {
        const piece0 = board?.[move.from[0]]?.[move.from[1]] || null;
        const piece1 = nb?.[move.to[0]]?.[move.to[1]] || null;
        const isQ0 = piece0 ? isQueenCell(piece0) : false;
        const isQ1 = piece1 ? isQueenCell(piece1) : false;

        if (!isQ0 && isQ1) {
          sfx.promote(); // coronación por movimiento simple
        } else {
          sfx.move();    // movimiento sin captura
        }
      } catch {
        sfx.move();
      }

      __chainFrom = null;
      clearSelectedGlow(boardEl);
      endTurnAndCheck(container, ctx);
      return;
    }

    // 5) Selección de origen — obligación global + verificación extra
    const cell = board[r][c];
    if (!cell || colorOf(cell) !== turn) {
      clearHints(boardEl);
      sfx.invalid();
      return;
    }

    let { winners, globalCnt, globalPts } = computeGlobalAllowed(board, turn, movimientos, colorOf);

    if (winners.size) {
      const key = `${r},${c}`;
      if (!winners.has(key)) {
        clearHints(boardEl);
        sfx.invalid();
        return;
      }

      clearHints(boardEl);
      // FX: zoom al seleccionar la pieza de origen (con obligación)
      try { triggerPieceZoom(boardEl, [r, c], { duration: 240 }); } catch {}
      // FX: brillo de selección
      setSelectedGlow(boardEl, r, c);

      const visited0 = new Set([k(r, c)]);
      const { allowed: allowed0, bestCnt: myCnt, bestPts: myPts } = allowedFirstFrom(
        board, [r, c], visited0, [r, c], movimientos,
        { tiebreakSamePiece: false }
      );

      const SCALE = 2;
      const myRank = Math.round((myPts || 0) * SCALE);
      const globRank = Math.round((globalPts || 0) * SCALE);
      if (!allowed0.size || myCnt !== globalCnt || myRank !== globRank) {
        clearHints(boardEl);
        sfx.invalid();
        return;
      }

      const res = movimientos(board, [r, c]) || {};
      let routes = Array.isArray(res.captures) ? res.captures : [];
      routes = filterRoutesByVisitedSmart(routes, [r, c], visited0, board, [r, c]);
      routes = keepBestRoutes(routes);
      if (!routes.length) {
        clearHints(boardEl);
        sfx.invalid();
        return;
      }

      if (typeof markRouteLabel === "function") {
        markRouteLabel(boardEl, [r, c], "★", {
          text: `OBLIGATORIA: ${globalCnt || 0} cap · ${globalPts || 0} pts`,
        });
      }
      showFirstStepOptions(boardEl, routes, [r, c]);
      pruneStepsToAllowed(boardEl, allowed0);
      setStepState({ pos: [r, c], visited: visited0, origin0: [r, c] });
      return;
    }

    // Sin obligación: capturas/movimientos de esta ficha
    clearHints(boardEl);
    // FX: zoom + brillo al seleccionar la pieza de origen (sin obligación)
    try { triggerPieceZoom(boardEl, [r, c], { duration: 220 }); } catch {}
    setSelectedGlow(boardEl, r, c);

    const res = movimientos(board, [r, c]) || {};
    const moves = res.moves || [];
    let captures = res.captures || [];

    if (captures.length) {
      const visited0 = new Set([k(r, c)]);
      const { allowed: allowed0 } = allowedFirstFrom(
        board, [r, c], visited0, [r, c], movimientos,
        { tiebreakSamePiece: false }
      );
      if (!allowed0.size) { sfx.invalid(); return; }

      captures = filterRoutesByVisitedSmart(captures, [r, c], visited0, board, [r, c]);
      captures = keepBestRoutes(captures);
      if (!captures.length) { sfx.invalid(); return; }

      showFirstStepOptions(boardEl, captures, [r, c]);
      pruneStepsToAllowed(boardEl, allowed0);
      setStepState({ pos: [r, c], visited: visited0, origin0: [r, c] });
    } else {
      if (!moves.length) { sfx.invalid(); return; }
      for (const m of moves) {
        hintMove(boardEl, m.to, { from: [r, c], to: m.to, captures: m.captures ?? [] });
      }
    }
  }

  return { onClick };
}
