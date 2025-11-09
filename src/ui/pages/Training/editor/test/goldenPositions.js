// src/ui/pages/Training/editor/test/goldenPositions.js
// Set mínimo de 12 posiciones doradas (10x10) — corregido a casillas oscuras.
// Notación FEN: 10 filas top→bottom separadas por '/', r/R rojas, n/N negras.
// Al final ' r' o ' n' (turno). Puntaje: peón=1, dama=1.5.

export const GOLDEN_POSITIONS = [
  // 1) Básico: 1 captura (R en (0,1), n en (1,2) → aterriza en (2,3)+)
  { name: "Básico — 1 captura con dama",
    turn: "r",
    fen: "1R8/2n7/10/10/10/10/10/10/10/10 r",
    expect: { cnt: 1, pts: 1.0 } },

  // 2) Cadena de 2: n en (1,2) y (3,4)
  { name: "Cadena de 2 capturas con dama",
    turn: "r",
    fen: "1R8/2n7/10/4n5/10/10/10/10/10/10 r",
    expect: { cnt: 2, pts: 2.0 } },

  // 3) Cadena de 3: n en (1,2), (3,4), (5,6)
  { name: "Cadena de 3 capturas con dama",
    turn: "r",
    fen: "1R8/2n7/10/4n5/10/6n3/10/10/10/10 r",
    expect: { cnt: 3, pts: 3.0 } },

  // 4) vs Dama: 1.5 pts
  { name: "Una captura de dama vs dama (1.5 pts)",
    turn: "r",
    fen: "1R8/2N7/10/10/10/10/10/10/10/10 r",
    expect: { cnt: 1, pts: 1.5 } },

  // 5) Mixta N luego n → 2 capturas, 2.5 pts
  { name: "Cadena mixta (N luego n) — 2 capturas, 2.5 pts",
    turn: "r",
    fen: "1R8/2N7/10/4n5/10/10/10/10/10/10 r",
    expect: { cnt: 2, pts: 2.5 } },

  // 6) Mixta n luego N → 2 capturas, 2.5 pts
  { name: "Cadena mixta (n luego N) — 2 capturas, 2.5 pts",
    turn: "r",
    fen: "1R8/2n7/10/4N5/10/10/10/10/10/10 r",
    expect: { cnt: 2, pts: 2.5 } },

  // 7) Subiendo: 1 captura desde abajo
  { name: "Captura hacia arriba-derecha — 1 captura",
    turn: "r",
    fen: "10/10/10/10/10/10/10/10/7n2/8R1 r",
    expect: { cnt: 1, pts: 1.0 } },

  // 8) Subiendo: cadena de 2
  { name: "Cadena de 2 subiendo con dama",
    turn: "r",
    fen: "10/10/10/10/10/10/5n4/10/7n2/8R1 r",
    expect: { cnt: 2, pts: 2.0 } },

  // 9) Subiendo: cadena de 3
  { name: "Cadena de 3 subiendo con dama",
    turn: "r",
    fen: "10/10/10/10/3n6/10/5n4/10/7n2/8R1 r",
    expect: { cnt: 3, pts: 3.0 } },

  // 10) Aterrizaje largo tras 1ª captura (sigue siendo 1 total)
  { name: "Aterrizaje largo tras primera captura (sigue siendo 1 total)",
    turn: "r",
    fen: "1R8/2n7/10/10/10/10/10/10/10/10 r",
    expect: { cnt: 1, pts: 1.0 } },

  // 11) Sin capturas: colocar n en (1,0) — no hay casilla de aterrizaje detrás (borde)
  { name: "Sin capturas disponibles (control)",
    turn: "r",
    fen: "1R8/n9/10/10/10/10/10/10/10/10 r",
    expect: { cnt: 0, pts: 0.0 } },

  // 12) Prioriza cantidad sobre puntos: 2×n (2.0) vs 1×N (1.5) → gana 2.0
  // R en (3,4); n en (4,5) y (6,7); N en (2,3)
  { name: "Prioriza cantidad sobre puntos (2×n = 2.0 vs 1×N = 1.5)",
    turn: "r",
    fen: "10/10/3N6/4R5/5n4/10/7n2/10/10/10 r",
    expect: { cnt: 2, pts: 2.0 } },
];
