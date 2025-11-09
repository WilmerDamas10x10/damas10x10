// src/ui/pages/Training/editor/dev/golden.js
// Runner de "posiciones doradas" — Paso 1 (cnt/pts + resumen visible).
// Prioridad: FEN (simple y estable). En Paso 2 añadiremos checks de chain-lock y coronación.

import { computeGlobalAllowed } from "../../../../../engine/chainPolicies.js";
import { fromFEN } from "../services/fen.js";
import { COLOR, colorOf, movimientos } from "@rules";
import { GOLDEN_POSITIONS } from "../test/goldenPositions.js";

/* ── Logger silencioso por defecto ───────────────────────────────────────── */
// Activa logs con:
//   - query:  ?goldenlog=1
//   - o localStorage: localStorage.setItem("golden.log","1")
const GOLDEN_LOG_ON =
  (new URLSearchParams(location.search).get("goldenlog") === "1") ||
  (localStorage.getItem("golden.log") === "1");

const dlog = (...a) => { if (GOLDEN_LOG_ON) console.log(...a); };

/* ── Gating de ejecución ─────────────────────────────────────────────────── */
// Autorun SOLO si:
//   - query:  ?golden=1
//   - o localStorage: localStorage.setItem("golden","1")
function shouldAutorun() {
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get("golden") === "1") return true;
  } catch {}
  try {
    if (localStorage.getItem("golden") === "1") return true;
  } catch {}
  return false;
}

// ── Utilidades ───────────────────────────────────────────────────────────────
function parseTurnFromFEN(fen) {
  const m = /\s([rRnNwWbB])\s*$/.exec(String(fen || ""));
  if (!m) return COLOR.ROJO;
  const t = m[1].toLowerCase();
  return (t === "n" || t === "b") ? COLOR.NEGRO : COLOR.ROJO;
}
function pickTurn(caseTurn, fen) {
  const t = String(caseTurn ?? "").trim().toLowerCase();
  if (["r","w","white","blanco"].includes(t)) return COLOR.ROJO;
  if (["n","b","black","negro"].includes(t)) return COLOR.NEGRO;
  return parseTurnFromFEN(fen);
}
function evalBoard(board, turn) {
  return computeGlobalAllowed(board, turn, movimientos, colorOf, { preferQueenInTie: true });
}
function scanBoard(board) {
  const rows = board?.length ?? 0, cols = rows ? board[0].length : 0;
  const pieces = [], counts = { r:0, R:0, n:0, N:0, other:0 };
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
    const ch = board[r][c];
    if (!ch || ch==="." || ch===" ") continue;
    if (Object.prototype.hasOwnProperty.call(counts, ch)) counts[ch]++; else counts.other++;
    pieces.push({ ch, r, c });
  }
  return { pieces, counts };
}

// ── Runner ───────────────────────────────────────────────────────────────────
export async function runGoldenTests() {
  try {
    const rows = [];

    for (const it of (Array.isArray(GOLDEN_POSITIONS) ? GOLDEN_POSITIONS : [])) {
      const { name, fen, expect } = it || {};
      let pass = false, info = "";

      try {
        if (!fen || typeof fen !== "string") {
          rows.push({ name, pass:false, info:"Falta FEN (Paso 1 usa FEN)" });
          continue;
        }

        // Preparar tablero y turno
        const parsed = fromFEN(fen);
        const board = parsed.board;
        const forcedTurn = pickTurn(it.turn ?? expect?.turn, fen);

        // Evaluar
        const res = evalBoard(board, forcedTurn);

        // Verificaciones mínimas (cnt/pts)
        const okCnt = (expect?.cnt==null) || (expect.cnt === res.globalCnt);
        const okPts = (expect?.pts==null) || (Math.abs((expect.pts ?? 0) - res.globalPts) < 1e-9);
        pass = okCnt && okPts;
        info = `cnt=${res.globalCnt} pts=${res.globalPts.toFixed(1)}`;

        // Logs útiles (silenciados por defecto)
        const diag = scanBoard(board);
        if (GOLDEN_LOG_ON) {
          console.group(`[golden] ${name}`);
          try { console.table(diag.pieces); } catch { dlog(diag.pieces); }
          console.log("counts:", diag.counts, "turn:", (forcedTurn===COLOR.ROJO?"ROJO":"NEGRO"));
          console.log("→", info, "| winners:", [...(res?.winners ?? [])]);
          console.groupEnd?.();
        }

      } catch (e) {
        pass = false;
        info = "Excepción al evaluar";
        console.warn("[golden] error en caso:", name, e);
      }
      rows.push({ name, pass, info });
    }

    // Resumen visible
    const ok = rows.filter(r => r.pass).length;
    const detail = rows.map(r => `${r.pass ? "✅" : "❌"} ${r.name} — ${r.info}`).join("\n");
    alert(`Golden tests: ${ok}/${rows.length} OK.\n\n${detail}`);
  } catch (e) {
    console.error("[golden] runner failed:", e);
    alert("No se pudieron ejecutar las pruebas.");
  }
}

// Exponer runner manual para consola/test
window.runGoldenTests = runGoldenTests;

/* ── Hook que espera al DOM y, si procede, lanza las pruebas ──────────────── */
// Esto es lo que importa goldenBoot.js
export function runGoldenOnReady() {
  // Reexpone por si HMR reinyecta el módulo
  window.runGoldenTests = runGoldenTests;

  const launch = () => { if (shouldAutorun()) runGoldenTests(); };
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", launch, { once: true });
  } else {
    queueMicrotask(launch);
  }
}
