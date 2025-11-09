// src/ui/pages/AI/lib/utils.js
// Utilidades puras para IA (geom, normalización, scoring, etc.)

import { SIZE, COLOR, colorOf } from "@engine";
import { isGhost } from "@rules";

/* Básicos */
export const cloneBoard = (b) => b.map(r => r.slice());
export const last = (arr) => arr[arr.length - 1];
export const rc = (p) => Array.isArray(p) ? p : [p.r, p.c];

export function hasOpponentPieces(b, side){
  for (let r = 0; r < SIZE; r++){
    for (let c = 0; c < SIZE; c++){
      const ch = b[r][c];
      if (ch && colorOf(ch) !== side) return true;
    }
  }
  return false;
}

export function routeHasCapture(route){
  const caps = route?.captures || route?.capturas || route?.takes || [];
  return Array.isArray(caps) && caps.length > 0;
}

export function crownIfNeeded(b, to){
  try{
    const [r, c] = to;
    const piece = b[r][c];
    if (piece === "r" && r === 0) b[r][c] = "R";
    if (piece === "n" && r === SIZE - 1) b[r][c] = "N";
  }catch{}
}

/* Geometría y lectura de diagonal */
export function diagPassCells(from, to){
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

/* Encuentra la (única) casilla ocupada no-GHOST entre from->to en el tablero actual */
export function findMidOnCurrentBoard(b, from, to){
  const cells = diagPassCells(from, to);
  let mid = null; let count = 0;
  for (const [r, c] of cells){
    const ch = b[r][c];
    if (ch && !isGhost(ch)) { count++; mid = [r, c]; }
  }
  return count === 1 ? mid : null;
}

/* Normalización de rutas de captura */
function sameRC(a, b){ return a && b && a[0] === b[0] && a[1] === b[1]; }

export function normalizeCapturePath(originRC, rawPath){
  let arr = (rawPath || []).map(rc);
  if (arr.length < 1) return [];
  if (sameRC(arr[arr.length - 1], originRC) && !sameRC(arr[0], originRC)){
    arr = arr.slice().reverse();
  }
  if (!sameRC(arr[0], originRC)){
    arr = [originRC, ...arr];
  }
  const norm = [];
  for (const p of arr){
    if (!norm.length || !sameRC(norm[norm.length - 1], p)) norm.push(p);
  }
  return norm.length >= 2 ? norm : [];
}

/* Scoring de ruta de captura (peón=1.0, dama=1.5) */
export function capturePoints(ch){
  return (ch === "R" || ch === "N") ? 1.5 : 1.0;
}

/* Simula la ruta de captura y suma puntos; no modifica el board original */
export function scoreCaptureRoute(origBoard, side, path){
  if (!Array.isArray(path) || path.length < 2){
    return { valid:false, count:0, points:-Infinity };
  }
  const b = origBoard.map(row => row.slice());
  let cur = path[0];
  let points = 0;
  let count  = 0;

  for (let i = 1; i < path.length; i++){
    const nxt = path[i];
    const fr = cur[0], fc = cur[1], tr = nxt[0], tc = nxt[1];
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);

    if (dr === 0 || dc === 0) return { valid:false, count:0, points:-Infinity };
    if (Math.abs(tr - fr) !== Math.abs(tc - fc)) return { valid:false, count:0, points:-Infinity };

    let r = fr + dr, c = fc + dc;
    let foundMid = null, midCh = null, pieceCount = 0;

    while (r !== tr && c !== tc){
      const ch = b[r][c];
      if (ch){ pieceCount++; foundMid = [r, c]; midCh = ch; }
      r += dr; c += dc;
    }

    if (pieceCount !== 1) return { valid:false, count:0, points:-Infinity };
    if (colorOf(midCh) === side) return { valid:false, count:0, points:-Infinity };

    const piece = b[fr][fc];
    b[fr][fc] = null;
    b[foundMid[0]][foundMid[1]] = null;
    b[tr][tc] = piece;

    count++;
    points += capturePoints(midCh);
    cur = nxt;
  }
  return { valid:true, count, points };
}

/* Compat: ubica la pieza comida (mid) entre from->to */
export function aiFindCapturedMid(board, from, to, side){
  const [fr, fc] = from, [tr, tc] = to;
  const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
  if (dr === 0 || dc === 0) return null;
  if (Math.abs(tr - fr) !== Math.abs(tc - fc)) return null;

  let r = fr + dr, c = fc + dc;
  let found = null, count = 0;

  while (r !== tr && c !== tc){
    const ch = board[r][c];
    if (ch){
      count++;
      if (colorOf(ch) === side) return null;
      found = [r, c];
    }
    r += dr; c += dc;
  }
  return (count === 1) ? found : null;
}

/* Anti-revisita (no reutilizar casillas/medias) */
export function aiPathNoRevisit(origBoard, side, path){
  if (!Array.isArray(path) || path.length < 2) return false;
  const b = origBoard.map(row => row.slice());

  const usedMids = new Set();
  const visited  = new Set();
  const key = (r,c) => `${r},${c}`;

  let cur = path[0];
  visited.add(key(cur[0], cur[1]));

  for (let i = 1; i < path.length; i++){
    const nxt = path[i];
    const fr = cur[0], fc = cur[1], tr = nxt[0], tc = nxt[1];
    const dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);

    if (dr === 0 || dc === 0) return false;
    if (Math.abs(tr - fr) !== Math.abs(tc - fc)) return false;

    let r = fr + dr, c = fc + dc;
    let foundMid = null, count = 0;
    const pass = [];

    while (r !== tr && c !== tc){
      const ch = b[r][c];
      if (ch){
        count++;
        if (colorOf(ch) === side) return false;
        foundMid = [r, c];
      } else {
        if (visited.has(key(r, c))) return false;
        pass.push([r, c]);
      }
      r += dr; c += dc;
    }

    if (count !== 1 || !foundMid) return false;

    const midKey = key(foundMid[0], foundMid[1]);
    if (usedMids.has(midKey)) return false;
    usedMids.add(midKey);

    const piece = b[fr][fc];
    b[fr][fc] = null;
    b[foundMid[0]][foundMid[1]] = null;
    b[tr][tc] = piece;

    for (const [vr, vc] of pass) visited.add(key(vr, vc));
    visited.add(midKey);
    visited.add(key(tr, tc));

    cur = nxt;
  }
  return true;
}
