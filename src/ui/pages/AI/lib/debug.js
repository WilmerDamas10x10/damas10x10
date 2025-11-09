// src/ui/pages/AI/lib/debug.js
// Registro JSON y snapshot de estado para depuración

import { SIZE, colorOf, movimientos as baseMovimientos } from "@engine";

let JSON_RECORDING = false;
const JSON_LOG = [];

export const isRecording = () => JSON_RECORDING;

export function toggleRecording(on){
  JSON_RECORDING = (typeof on === "boolean") ? on : !JSON_RECORDING;
  if (JSON_RECORDING) JSON_LOG.length = 0;
  return JSON_RECORDING;
}

export function recordJSON(evt){
  if (!JSON_RECORDING) return;
  JSON_LOG.push({ ts: Date.now(), ...evt });
}

export function getLog(){
  return JSON_LOG.slice();
}

export function tryCopyClipboard(text){
  if (navigator?.clipboard?.writeText){
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export function exportAsFile(obj, filename = "debug_damas.json"){
  try{
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  }catch(err){
    console.error("[JSON] export error:", err);
    alert("No se pudo exportar el JSON: " + err?.message);
  }
}

function jsonKey(rc){ return `${rc[0]},${rc[1]}`; }

/* Snapshot autocontenible de tablero + posibles jugadas/capturas */
export function buildDebugSnapshot(board, turn, aiSide){
  const SIZE_LOCAL = SIZE;
  const pieces = [];
  const allMoves = { ROJO: {}, NEGRO: {} };
  const allCaps  = { ROJO: {}, NEGRO: {} };

  for (let r = 0; r < SIZE_LOCAL; r++){
    for (let c = 0; c < SIZE_LOCAL; c++){
      const ch = board[r][c];
      if (!ch) continue;
      const color = colorOf(ch);
      pieces.push({ r, c, ch, color });

      const mv = baseMovimientos(board, [r,c]) || {};
      const moves = mv.moves || mv.movs || [];
      const caps  = mv.captures || mv.capturas || mv.takes || [];
      const bucketM = color === "R" || color === 1 ? allMoves.ROJO : allMoves.NEGRO;
      const bucketC = color === "R" || color === 1 ? allCaps.ROJO  : allCaps.NEGRO;

      bucketM[jsonKey([r,c])] = moves;
      bucketC[jsonKey([r,c])] = caps;
    }
  }

  const anyCapROJO = Object.values(allCaps.ROJO).some(arr => Array.isArray(arr) && arr.length);
  const anyCapNEGRO = Object.values(allCaps.NEGRO).some(arr => Array.isArray(arr) && arr.length);

  return {
    meta: {
      createdAt: new Date().toISOString(),
      size: SIZE_LOCAL,
      turn,
      aiSide,
      mustCapture: { ROJO: anyCapROJO, NEGRO: anyCapNEGRO }
    },
    board,
    pieces,
    moves: allMoves,
    captures: allCaps,
    log: JSON_RECORDING ? getLog() : []
  };
}
