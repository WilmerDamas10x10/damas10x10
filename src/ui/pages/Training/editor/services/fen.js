// src/ui/pages/Training/editor/services/fen.js
// FEN para damas 10x10 o 8x8.
// r/R = rojas (peón/dama), n/N = negras (peón/dama).
// Números = cantidad de vacías consecutivas. Filas separadas por "/". Al final, turno: " r" o " n".
//
// ✅ Soporta AUTOMÁTICAMENTE dos formatos de fila:
//    1) Grid completo (8 o 10 celdas por fila)
//    2) Solo casillas jugables (oscuras): 4 (en 8x8) o 5 (en 10x10)
//       → Se mapean a columnas oscuras con offset por fila.
// ✅ Tras parsear, prueba 4 orientaciones (id / flipH / flipV / flipHV) y
//    elige la que deja MÁS piezas en casillas oscuras, sin cambiar el patrón del tablero.

import { SIZE, dark } from "../index.js"; // ← usa EXACTAMENTE el mismo 'dark' del tablero

/** Normaliza el turno a 'r' | 'n' (acepta r/n/w/b, ROJO/NEGRO, etc.) */
function normTurn(t) {
  const s = String(t ?? "r").trim().toLowerCase();
  if (s === "n" || s === "b" || s === "negro" || s === "black") return "n";
  return "r";
}

/** Crea un tablero H×W con nulls */
function emptyBoard(H, W) {
  return Array.from({ length: H }, () => Array(W).fill(null));
}

/** Exporta un tablero a FEN (H = board.length, W = board[0].length) */
export function toFEN(board, turn = "r") {
  if (!Array.isArray(board) || board.length === 0) {
    throw new Error("toFEN: tablero inválido");
  }
  const H = board.length;
  const W = (board[0] || []).length;
  if (!W) throw new Error("toFEN: filas vacías");

  const rows = [];
  for (let r = 0; r < H; r++) {
    const row = board[r] || [];
    if (row.length !== W) throw new Error("toFEN: filas con anchos distintos");
    let out = "";
    let run = 0;
    for (let c = 0; c < W; c++) {
      const cell = row[c];
      if (!cell) { run++; continue; }
      if (run) { out += String(run); run = 0; }
      out += String(cell); // 'r','R','n','N'
    }
    if (run) out += String(run);
    rows.push(out || String(W));
  }
  return rows.join("/") + " " + normTurn(turn);
}

/** Parsea FEN a { board, turn }. Soporta 10x10 y 8x8, y autodetecta "grid" vs "solo oscuras". */
export function fromFEN(fen) {
  const txt = String(fen || "").trim();
  if (!txt) throw new Error("FEN vacío");

  // "cuerpo" + turno opcional final
  const m = /^(.*?)(?:\s+([rRnNwWbB]))?\s*$/.exec(txt);
  if (!m) throw new Error("FEN inválido");
  const rowsPart = m[1].trim();
  const turnRaw = (m[2] || "r").toLowerCase();

  const rows = rowsPart.split("/");
  if (rows.length !== 10 && rows.length !== 8) {
    throw new Error("FEN debe tener 8 o 10 filas");
  }
  const H = rows.length;
  const W = (H === 8 ? 8 : 10);
  const PLAYABLE = W / 2; // 4 en 8x8; 5 en 10x10

  // ───────────── Helpers ─────────────
  const TOK_RE = /(\d+|[rRnN])/g;

  function countOnDark(B) {
    let total = 0, onDark = 0;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const v = B[r]?.[c];
        if (v && v !== "." && v !== " ") {
          total++;
          if (dark(r, c)) onDark++;
        }
      }
    }
    return { total, onDark };
  }

  function flipH(B) { // espejo horizontal por fila
    const out = new Array(H);
    for (let r = 0; r < H; r++) out[r] = (B[r] || []).slice().reverse();
    return out;
  }
  function flipV(B) { // espejo vertical (invierte orden de filas)
    const out = new Array(H);
    for (let r = 0; r < H; r++) out[r] = (B[H - 1 - r] || []).slice();
    return out;
  }

  // Parse tipo GRID (cuenta 8/10 celdas por fila)
  function parseRowAsGrid(tokens, rIdx) {
    const out = Array(W).fill(null);
    let c = 0;
    for (const tk of tokens) {
      if (/^\d+$/.test(tk)) {
        const n = parseInt(tk, 10);
        if (!(n > 0)) return null;
        c += n;
        if (c > W) return null;
      } else {
        if (!/^[rRnN]$/.test(tk)) return null;
        if (c >= W) return null;
        out[c++] = tk;
      }
    }
    if (c !== W) return null;
    return out;
  }

  // Parse tipo OSCURAS (solo 4/5 celdas jugables por fila)
  function parseRowAsDark(tokens, rIdx) {
    const out = Array(W).fill(null);
    const offset = (rIdx % 2 === 0 ? 1 : 0); // en filas pares, oscuras en 1,3,5... (con patrón actual)
    let k = 0; // índice de casilla jugable dentro de la fila (0..PLAYABLE-1)
    for (const tk of tokens) {
      if (/^\d+$/.test(tk)) {
        const n = parseInt(tk, 10);
        if (!(n > 0)) return null;
        k += n;
        if (k > PLAYABLE) return null;
      } else {
        if (!/^[rRnN]$/.test(tk)) return null;
        if (k >= PLAYABLE) return null;
        const c = offset + 2 * k;
        out[c] = tk;
        k++;
      }
    }
    if (k !== PLAYABLE) return null;
    return out;
  }

  // Intenta fila a fila como GRID y como OSCURAS, y luego elige
  // la variante por fila que deja más piezas sobre casillas oscuras.
  function parseBody(rows) {
    const B_grid = emptyBoard(H, W);
    const B_dark = emptyBoard(H, W);
    let ok_grid = true, ok_dark = true;

    for (let r = 0; r < H; r++) {
      const tokens = (rows[r] || "").match(TOK_RE) || [];
      const g = parseRowAsGrid(tokens, r);
      const d = parseRowAsDark(tokens, r);
      if (!g) ok_grid = false; else B_grid[r] = g;
      if (!d) ok_dark = false; else B_dark[r] = d;
    }

    if (ok_grid && !ok_dark) return B_grid;
    if (!ok_grid && ok_dark) return B_dark;
    if (ok_grid && ok_dark) {
      // Ambas valen: escogemos la que deja más piezas en oscuras
      const cg = countOnDark(B_grid).onDark;
      const cd = countOnDark(B_dark).onDark;
      return (cd >= cg) ? B_dark : B_grid;
    }
    // Ninguna encajó exactamente → lanzar error claro
    throw new Error("FEN inválido: filas no cuadran con 8/10 celdas ni con jugables");
  }

  // 1) Parseo base (grid o jugables)
  const baseBoard = parseBody(rows);

  // 2) Auto-orientación para maximizar piezas en casillas oscuras
  const candidates = [
    { name: "id",  B: baseBoard },
    { name: "h",   B: flipH(baseBoard) },
    { name: "v",   B: flipV(baseBoard) },
    { name: "hv",  B: flipH(flipV(baseBoard)) },
  ];
  let best = candidates[0];
  let bestScore = countOnDark(best.B);
  for (let i = 1; i < candidates.length; i++) {
    const score = countOnDark(candidates[i].B);
    if (score.onDark > bestScore.onDark) {
      best = candidates[i];
      bestScore = score;
    }
  }

  // Nota: si la FEN estaba perfecta, ganará "id" (no se toca nada).
  // Si venía espejada/rotada, elegimos la que más cuadre con casillas oscuras.

  const turn = normTurn(turnRaw);
  return { board: best.B, turn };
}
