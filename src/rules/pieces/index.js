// src/rules/pieces/index.js
import * as pawn from "./pawn.js";
import * as queen from "./queen.js";

// Peón
export const genPawnMoves     =
  pawn.genPawnMoves     || pawn.generatePawnMoves     || pawn.movimientosPeon;
export const genPawnCaptures  =
  pawn.genPawnCaptures  || pawn.generatePawnCaptures  || pawn.capturasPeon;
export const pawnValue        =
  (typeof pawn.pawnValue === "number" ? pawn.pawnValue : 1);

// Dama
export const genQueenMoves    =
  queen.genQueenMoves   || queen.generateQueenMoves   || queen.movimientosDama;
export const genQueenCaptures =
  queen.genQueenCaptures|| queen.generateQueenCaptures|| queen.capturasDama;
export const queenValue       =
  (typeof queen.queenValue === "number" ? queen.queenValue : 1.5);
