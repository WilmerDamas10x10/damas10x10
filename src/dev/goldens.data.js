// src/dev/goldens.data.js
// Colección de "posiciones doradas": cada caso define board, turno y lo esperado.
// Edita/añade casos según tus necesidades.

export const GOLDENS = [
  {
    name: "Empate exacto dama vs peón → gana Dama",
    turn: "r",
    board: [
      // 10x10 ejemplo; usa null en casillas vacías
      // r = peón rojo, R = dama roja, n = peón negro, N = dama negra
      // Este caso es ilustrativo; ajusta a tu notación/tablero real
      [null,null,null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null,null,null],
      [null,null,"R",  null,null,null,null,null,null,null],
      [null,null,null, null,"n", null,null,null,null,null],
      [null,null,null, null,null,null,null,null,null,null],
      [null,null,null, null,"n", null,null,null,null,null],
      [null,null,null, null,null,null,null,null,null,null],
      [null,null,null, null,null,null,null,null,null,null],
      [null,null,"r",  null,null,null,null,null,null,null],
      [null,null,null, null,null,null,null,null,null,null],
    ],
    expect: {
      // El motor debe forzar capturar con la Dama (R, en [2,2] en este ejemplo)
      // No imponemos números exactos por si tus reglas de puntos difieren;
      // verificamos que la pieza ganadora incluya la casilla de la Dama.
      mustIncludeWinnerKeys: ["2,2"]
    }
  },
  {
    name: "Sin capturas → turno pasa",
    turn: "n",
    board: Array.from({length:10},()=>Array(10).fill(null)),
    expect: { noWinners: true }
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// GOLDENS: Mixtos peón/dama — empates y preferencias
// Convención de piezas (como el motor):
//   r = peón rojo, R = dama roja, n = peón negro, N = dama negra
// 'turn' usa "r" | "n" (consistente con tus casos existentes)
// Nota: Los 'expect' aquí son orientativos y no estrictos, para no romper tu runner.
// ─────────────────────────────────────────────────────────────────────────────

export const GOLDENS_MIXED_EXTRA = [
  {
    name: "Mixto — Empate puro: preferir dama (flag preferQueenOnTie)",
    turn: "r",
    // Dos rutas de igual cantidad/puntos; una incluye captura de Dama (N) → debe preferirse.
    // Disposición: R cerca del borde, con N y n en diagonales posibles.
    board: (() => {
      const B = Array.from({length:10},()=>Array(10).fill(null));
      B[0][0] = "R"; // Dama roja
      B[1][4] = "N"; // Dama negra
      B[2][2] = "n"; // peón negro
      B[4][4] = "n"; // peón negro
      return B;
    })(),
    // Orientativo: 2 capturas, 2.5 pts, preferir ruta con captura de N
    expect: { cnt: 2, pts: 2.5, winnersHint: "ruta_contra_N_preferida" }
  },
  {
    name: "Mixto — Cantidad > Puntos (2×n = 2.0 supera 1×N = 1.5)",
    turn: "r",
    // Debe ganar la ruta con dos capturas de peón frente a una sola captura de dama.
    board: (() => {
      const B = Array.from({length:10},()=>Array(10).fill(null));
      B[0][0] = "R"; // Dama roja
      B[1][4] = "n";
      B[2][2] = "n";
      B[2][5] = "N";
      B[4][4] = "n";
      return B;
    })(),
    expect: { cnt: 2, pts: 2.0, winnersHint: "cadena_doble_n_sobre_una_N" }
  },
  {
    name: "Mixto — Desempate unificado (mismo cnt/pts, preferir captura de N más temprano)",
    turn: "r",
    // Dos rutas con 2 capturas y 2.5 pts; criterio secundario favorece capturar N antes.
    board: (() => {
      const B = Array.from({length:10},()=>Array(10).fill(null));
      B[0][0] = "R"; // Dama roja
      B[1][3] = "N"; // Dama negra
      B[2][5] = "n"; // peón negro
      B[4][4] = "N"; // Dama negra
      B[6][4] = "n"; // peón negro
      return B;
    })(),
    expect: { cnt: 2, pts: 2.5, winnersHint: "captura_de_N_antes" }
  },
];

// ⬇️ Anexar los mixtos al array principal, si existe.
try {
  if (Array.isArray(GOLDENS)) {
    GOLDENS.push(...GOLDENS_MIXED_EXTRA);
  }
} catch {}
