// src/ui/pages/AI/index.js
// IA — Orquestador con Minimax (capturas + quiet + quiescence)

import {
  SIZE, dark, startBoard, drawBoard,
  clearHints, hintMove, showFirstStepOptions, markRouteLabel, paintState,
  makeController, attachBoardInteractions,
  COLOR, colorOf, movimientos as baseMovimientos, aplicarMovimiento as baseAplicarMovimiento,
} from "@engine";
import { onMove, onCaptureHop } from "../../sfx.hooks.js";
import { initEditorSFX } from "../Training/editor/sfx.bootstrap.js";
import { ensureGlobalFX } from "../../kit/globalFX.js";
import "../../../styles/board.css";
import "../../../styles/board/cells.css";
import "../Training/editor/editor.fx.css";

// FX / helpers locales (sin cambiar tu estructura actual)
import { animateCellMove } from "../../lib/ghostAnim.js";
import { triggerCapturedVanish } from "../../lib/uiFX.js";
import { isGhost } from "@rules";

// === Minimax reforzado ===
import { minimaxChooseBestMove } from "../../../ai/minimax.js";
// Evaluador
import { evaluate } from "../../../ai/eval.js";

// Ajustes FX
const FX_CAPTURE_MS = 2000;
const FX_MOVE_MS    = 220;

/* ——— utilidades mínimas locales (las que ya usabas) ——— */
function cloneBoard(b){ return b.map(r => r.slice()); }
function last(arr){ return arr[arr.length-1]; }
function rc(p){ return Array.isArray(p) ? p : [p.r, p.c]; }

function crownIfNeeded(b, to){
  try{
    const [r,c] = to;
    const piece = b[r][c];
    if (piece === "r" && r === 0) b[r][c] = "R";
    if (piece === "n" && r === SIZE - 1) b[r][c] = "N";
  }catch{}
}
function routeHasCapture(route){
  const caps = route?.captures || route?.capturas || route?.takes || [];
  return Array.isArray(caps) && caps.length > 0;
}
function ringColorFor(ch){
  try {
    return colorOf(ch) === COLOR.NEGRO ? "#FFFFFF" : "#0e0d0dff";
  } catch {
    return "#FFFFFF";
  }
}

function diagPassCells(from, to){
  const [fr, fc] = from, [tr, tc] = to;
  const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
  const cells = [];
  let r = fr + dr, c = fc + dc;
  while (r !== tr && c !== tc){
    cells.push([r, c]);
    r += dr; c += dc;
  }
  return cells;
}
function findMidOnCurrentBoard(b, from, to){
  const cells = diagPassCells(from, to);
  let mid = null; let count = 0;
  for (const [r, c] of cells){
    const ch = b[r][c];
    if (ch && !isGhost(ch)) { count++; mid = [r, c]; }
  }
  return count === 1 ? mid : null;
}

// Ghost ring
function ringOnNextGhost(pieceChar, { duration = 800 } = {}) {
  const color = (colorOf(pieceChar) === COLOR.NEGRO) ? "#FFFFFF" : "#0e0d0dff";
  const apply = (el) => {
    if (!el) return;
    el.querySelectorAll('[data-ghost-ring]').forEach(n => n.remove());
    const ring = document.createElement('div');
    ring.setAttribute('data-ghost-ring', '');
    Object.assign(ring.style, {
      position: 'absolute',
      inset: '-4px',
      borderRadius: '50%',
      pointerEvents: 'none',
      boxShadow: `0 0 0 6px ${color}`,
      zIndex: '2'
    });
    const prevPos = el.style.position;
    if (!prevPos || prevPos === 'static') el.style.position = 'relative';
    el.appendChild(ring);
    window.setTimeout(() => {
      ring.remove();
      if (prevPos === '' || prevPos === 'static') el.style.position = prevPos || '';
    }, duration);
  };
  const now = document.querySelector('.ghost-layer .piece');
  if (now) { apply(now); return; }
  const obs = new MutationObserver(() => {
    const el = document.querySelector('.ghost-layer .piece');
    if (el) { apply(el); obs.disconnect(); }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 1200);
}

// Captura (un hop) local: respeta FX.sfx
function fallbackSingleCapture(board, from, to){
  const nb = board.map(r => r.slice());
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = nb[fr][fc];
  if (!piece) return nb;

  const stepR = tr > fr ? 1 : -1;
  const stepC = tc > fc ? 1 : -1;

  let r = fr + stepR, c = fc + stepC;
  let capR = null, capC = null;

  while (r !== tr && c !== tc){
    if (nb[r][c]) { capR = r; capC = c; break; }
    r += stepR; c += stepC;
  }

  nb[tr][tc] = piece;
  nb[fr][fc] = null;
  if (capR != null && capC != null) nb[capR][capC] = null;
  crownIfNeeded(nb, [tr, tc]);
  return nb;
}
function doHop(board, from, to){
  try { onCaptureHop(); } catch {}
  return fallbackSingleCapture(board, from, to);
}

export default function mountAI(container){
  if (!container) return;

  initEditorSFX();
  ensureGlobalFX();

  // Estado
  let board = startBoard();
  let turn  = COLOR.ROJO;
  let stepState = null;

  // Barra temporal de edición
  let placing = null;
  const undoStack = [];

  // IA
  let aiSide   = COLOR.NEGRO;
  let thinking = false;

  // Captura obligatoria — solo HUMANO (visual / compat)
  function anyCaptureAvailableFor(color){
    for (let r=0; r<SIZE; r++){
      for (let c=0; c<SIZE; c++){
        const ch = board[r][c];
        if (!ch || colorOf(ch) !== color) continue;
        const mv = baseMovimientos(board, [r, c]) || {};
        const caps = mv.captures || mv.capturas || mv.takes || [];
        if (Array.isArray(caps) && caps.length) return true;
      }
    }
    return false;
  }
  function filterByMustCapture(result, must){
    if (!must) return result;
    if (Array.isArray(result)) return result.filter(routeHasCapture);
    if (result && typeof result === "object"){
      const caps = result.captures || result.capturas || result.takes || [];
      return { ...result, captures:caps, capturas:caps, takes:caps, moves:[], movs:[] };
    }
    return result;
  }

  // Reemplazo quirúrgico (modo IA: sin soplo ni obligar a capturar en humano)
  function movimientosForced(...args){
    return baseMovimientos(...args) || {};
  }
  function aplicarMovimientoForced(b, payload){
    const nb = baseAplicarMovimiento(b, payload);
    try { crownIfNeeded(nb, payload?.to); } catch {}
    return nb;
  }

  // UI
  container.innerHTML = `
    <div class="col" style="gap:12px; padding:16px; max-width:980px; margin:0 auto;">
      <h2 style="margin:0;">Jugar contra la IA</h2>

      <div id="toolbar" class="row" style="gap:8px; flex-wrap:wrap; margin-top:6px;">
        <button class="btn" id="btn-empty">Vaciar</button>
        <button class="btn" id="btn-init">Inicial</button>
        <button class="btn" id="btn-turn">Turno</button>
        <button class="btn" id="btn-undo">Deshacer</button>
        <span style="width:12px;"></span>
        <button class="btn" id="btn-eraser">Borrador</button>
        <button class="btn" id="btn-man-r">Peón ROJO</button>
        <button class="btn" id="btn-man-n">Peón NEGRO</button>
        <button class="btn" id="btn-queen-r">Dama ROJA</button>
        <button class="btn" id="btn-queen-n">Dama NEGRA</button>

        <span style="width:12px;"></span>
        <label class="btn btn--subtle">Lado IA:
          <select id="ai-side" class="btn" style="margin-left:6px">
            <option value="N">Negro</option>
            <option value="R">Rojo</option>
          </select>
        </label>
        <button class="btn" id="btn-ai-move">Mover IA</button>
        <button class="btn" id="btn-restart">Reiniciar</button>
        <button class="btn" id="btn-back">Volver</button>
      </div>

      <div class="row" style="gap:8px; align-items:center; flex-wrap:wrap;">
        <span id="turn-info" class="btn btn--subtle"></span>
        <span id="ai-info" class="btn btn--subtle"></span>
        <span id="place-info" class="btn btn--subtle" style="display:none;"></span>
        <span id="capture-info" class="btn btn--subtle" style="display:none;">Captura obligatoria (humano)</span>
      </div>

      <div class="card" style="margin-top:12px; padding:12px;"><div id="board"></div></div>
    </div>
  `;

  const $boardEl     = container.querySelector("#board");
  const $turnInfo    = container.querySelector("#turn-info");
  const $aiInfo      = container.querySelector("#ai-info");
  const $placeInfo   = container.querySelector("#place-info");
  const $captureInfo = container.querySelector("#capture-info");
  const $btnEmpty   = container.querySelector("#btn-empty");
  const $btnInit    = container.querySelector("#btn-init");
  const $btnTurn    = container.querySelector("#btn-turn");
  const $btnUndo    = container.querySelector("#btn-undo");
  const $btnEraser  = container.querySelector("#btn-eraser");
  const $btnManR    = container.querySelector("#btn-man-r");
  const $btnManN    = container.querySelector("#btn-man-n");
  const $btnQueenR  = container.querySelector("#btn-queen-r");
  const $btnQueenN  = container.querySelector("#btn-queen-n");
  const $btnBack    = container.querySelector("#btn-back");
  const $btnRestart = container.querySelector("#btn-restart");
  const $btnAiMove  = container.querySelector("#btn-ai-move");
  const $aiSideSel  = container.querySelector("#ai-side");

  function render(){ drawBoard($boardEl, board, SIZE, dark); }

  function setCaptureInfo() {
    const isHumanTurn = turn !== aiSide;
    const must = isHumanTurn && anyCaptureAvailableFor(turn);
    $captureInfo.style.display = must ? "inline-flex" : "none";
  }
  function setTurnText(){
    $turnInfo.textContent = `Turno: ${turn === COLOR.ROJO ? "ROJO" : "NEGRO"}`;
    setCaptureInfo();
  }
  function setAiText(){
    $aiInfo.textContent = thinking ? "IA: pensando…" : `IA: ${aiSide === COLOR.ROJO ? "ROJO" : "NEGRO"}`;
    setCaptureInfo();
  }
  function setPlacing(p){
    placing = p;
    const map = { x:"Borrador", r:"Peón ROJO", n:"Peón NEGRO", R:"Dama ROJA", N:"Dama NEGRA" };
    $placeInfo.style.display = p ? "inline-flex" : "none";
    $placeInfo.textContent   = p ? `Modo colocar: ${map[p]||""}` : "";
    [$btnEraser,$btnManR,$btnManN,$btnQueenR,$btnQueenN].forEach(b=>b?.classList.remove("btn--active"));
    if (p === "x") $btnEraser?.classList.add("btn--active");
    if (p === "r") $btnManR?.classList.add("btn--active");
    if (p === "n") $btnManN?.classList.add("btn--active");
    if (p === "R") $btnQueenR?.classList.add("btn--active");
    if (p === "N") $btnQueenN?.classList.add("btn--active");
  }

  const baseCtx = {
    SIZE,
    container,
    getBoard: () => board,
    setBoard: (b) => { board = b; },
    getTurn:  () => turn,
    setTurn:  (t) => { turn = t; setTurnText(); setAiText(); maybeAi(); },

    getStepState: () => stepState,
    setStepState: (s) => { stepState = s; },

    getPlacing: () => placing,

    render,
    paintState: () => paintState({
      boardEl: $boardEl, board, turn,
      setTurn: (t) => { turn = t; setTurnText(); setAiText(); maybeAi(); },
      stepState, setStepState: (s) => { stepState = s; },
      container, showDebug: false
    }),

    saveForUndo: () => { undoStack.push(cloneBoard(board)); if (undoStack.length > 100) undoStack.shift(); },

    rules: { colorOf, movimientos: movimientosForced, aplicarMovimiento: aplicarMovimientoForced },
    deps:  { movimientos: movimientosForced, aplicarMovimiento: aplicarMovimientoForced, rules: { colorOf } },
    hints: { clearHints, hintMove, showFirstStepOptions, markRouteLabel },

    onTurnChange: () => { setTurnText(); setAiText(); maybeAi(); },
  };

  const baseController = makeController({
    container,
    getBoard: baseCtx.getBoard,
    setBoard: baseCtx.setBoard,
    getTurn:  baseCtx.getTurn,
    setTurn:  baseCtx.setTurn,
    getStepState: baseCtx.getStepState,
    setStepState: baseCtx.setStepState,
    render: baseCtx.render,
    paintState: baseCtx.paintState,
    deps:  baseCtx.deps,
    hints: baseCtx.hints,
  });

  const controller = {
    ...baseController,
    continueOrEndChain: (route, ...rest) => {
      if (anyCaptureAvailableFor(turn) && !routeHasCapture(route)) return;
      return baseController.continueOrEndChain?.(route, ...rest);
    }
  };

  const ctx = { ...baseCtx, controller };

  try {
    container.rules = { colorOf, movimientos: movimientosForced, aplicarMovimiento: aplicarMovimientoForced };
    window.__rules  = Object.assign({}, window.__rules || {}, container.rules);
  } catch {}

  // Montaje
  render(); setTurnText(); setAiText(); ctx.paintState();
  try { attachBoardInteractions(container, ctx); } catch {}

  // ===== IA: decisión unificada con MINIMAX =====
  async function doAiMove(){
    if (thinking) return;
    thinking = true; setAiText();
    await new Promise(res => setTimeout(res, FX_MOVE_MS));

    try {
      const best = minimaxChooseBestMove(
        board,
        aiSide,
        6, // profundidad mayor para evaluar más variantes
        {
          COLOR, SIZE, colorOf,
          movimientos: baseMovimientos,
          aplicarMovimiento: baseAplicarMovimiento,
          crownIfNeeded,
          evaluate
        },
        {
          rootCaptureOnly: true,
          quiescence: true,
          useSEE: true,
          seePenaltyMargin: -0.05,
          timeMs: 800 // más presupuesto para subir fuerza efectiva
        }
      );

      if (!best) {
        // Sin jugadas posibles
        turn = (turn === COLOR.ROJO) ? COLOR.NEGRO : COLOR.ROJO;
        render(); ctx.paintState(); setTurnText(); setAiText();
        return;
      }

      if (best.type === "capture") {
        // Reproducimos secuencia con FX, hop por hop
        const path = best.path;
        try { onMove(); } catch {}
        for (let i=0; i<path.length-1; i++){
          const from = path[i];
          const to   = path[i+1];

          const mid = findMidOnCurrentBoard(board, from, to);

          const chFrom = board?.[from[0]]?.[from[1]] || null;
          ringOnNextGhost(chFrom, { duration: 800 });
          await animateCellMove($boardEl, from, to, { pieceChar: chFrom, ringColor: ringColorFor(chFrom), lift: 10 });
          if (mid) triggerCapturedVanish($boardEl, mid, { duration: FX_CAPTURE_MS });

          board = doHop(board, from, to);
        }
      } else {
        // Quiet move
        const m = best;
        const chFrom = board?.[m.from[0]]?.[m.from[1]] || null;
        try { onMove(); } catch {}
        ringOnNextGhost(chFrom, { duration: 800 });
        await animateCellMove($boardEl, m.from, m.to, { pieceChar: chFrom, lift: 10 });

        board = baseAplicarMovimiento(board, { from: m.from, to: m.to });
        crownIfNeeded(board, m.to);
      }

      stepState = null;
      turn = (turn === COLOR.ROJO) ? COLOR.NEGRO : COLOR.ROJO;
      render(); ctx.paintState(); setTurnText(); setAiText();

    } catch (e){
      console.warn("[IA] fallo aplicando jugada:", e);
    } finally {
      thinking = false; setAiText();
    }
  }

  function maybeAi(){
    const sel = $aiSideSel?.value || "N";
    aiSide = (sel === "R") ? COLOR.ROJO : COLOR.NEGRO;
    if (turn === aiSide && !thinking) doAiMove();
  }

  // Botones
  $btnBack?.addEventListener("click", () => {
    container.innerHTML = "";
    import("../Home/index.js").then(mod => mod.default?.(container));
  });
  $btnRestart?.addEventListener("click", () => {
    board = startBoard(); stepState = null; turn = COLOR.ROJO;
    render(); ctx.paintState(); setTurnText(); setAiText(); maybeAi();
  });
  $btnAiMove?.addEventListener("click", () => doAiMove());
  $aiSideSel?.addEventListener("change", () => { maybeAi(); setCaptureInfo(); });

  // Edición mínima que ya tenías
  function repaint(){
    ctx.setBoard(board);
    render();
    ctx.paintState();
    setCaptureInfo();
  }
  $btnEmpty?.addEventListener("click", () => {
    ctx.saveForUndo();
    board = Array.from({length: SIZE}, () => Array.from({length: SIZE}, () => null));
    repaint();
  });
  $btnInit?.addEventListener("click", () => {
    ctx.saveForUndo();
    board = startBoard();
    repaint();
  });
  $btnTurn?.addEventListener("click", () => {
    turn = (turn === COLOR.ROJO) ? COLOR.NEGRO : COLOR.ROJO;
    setTurnText(); setAiText(); ctx.paintState(); maybeAi();
  });
  $btnUndo?.addEventListener("click", () => {
    const prev = undoStack.pop();
    if (prev){ board = prev; repaint(); }
  });
  function setPlacingHandler(p){
    const mapBtn = { x:$btnEraser, r:$btnManR, n:$btnManN, R:$btnQueenR, N:$btnQueenN };
    placing = (placing === p) ? null : p;
    const map = { x:"Borrador", r:"Peón ROJO", n:"Peón NEGRO", R:"Dama ROJA", N:"Dama NEGRA" };
    $placeInfo.style.display = placing ? "inline-flex" : "none";
    $placeInfo.textContent   = placing ? `Modo colocar: ${map[placing]}` : "";
    [$btnEraser,$btnManR,$btnManN,$btnQueenR,$btnQueenN].forEach(b=>b?.classList.remove("btn--active"));
    if (placing) mapBtn[placing]?.classList.add("btn--active");
  }
  $btnEraser?.addEventListener("click", () => setPlacingHandler("x"));
  $btnManR?.addEventListener("click", () => setPlacingHandler("r"));
  $btnManN?.addEventListener("click", () => setPlacingHandler("n"));
  $btnQueenR?.addEventListener("click", () => setPlacingHandler("R"));
  $btnQueenN?.addEventListener("click", () => setPlacingHandler("N"));

  // Arranque
  maybeAi();
}
