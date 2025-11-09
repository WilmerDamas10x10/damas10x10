// src/rules/constants.js
export const SIZE  = 10;
export const COLOR = { ROJO: 'ROJO', NEGRO: 'NEGRO' };

// Compat: 4 diagonales para movegen
export const DIAG = [
  [-1, -1],
  [-1,  1],
  [ 1, -1],
  [ 1,  1],
];


// Dirección "hacia adelante" por color (filas crecen hacia abajo)


// Las filas crecen hacia ABAJO.
// Queremos NEGRAS arriba (avanzan hacia abajo) y ROJAS abajo (avanzan hacia arriba).
export const FORWARD = {
  ROJO:  -1, // rojas abajo → suben
  NEGRO:  1, // negras arriba → bajan
};