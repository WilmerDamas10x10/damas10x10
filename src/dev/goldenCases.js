// src/dev/goldenCases.js
// Colección de "posiciones doradas" para validar reglas sin tocar la UI.
// Formato: { name, fen, expect?: { winnersEmpty?: boolean, preferQueenInTie?: boolean } }
//
// IMPORTANTE: El FEN usa tu formato (r/R = rojas peón/dama, n/N = negras peón/dama),
// números = casillas vacías consecutivas, filas separadas por '/', y al final
// un espacio + 'r' o 'n' para indicar a quién le toca mover.
//
// Los casos de ejemplo son deliberadamente simples. Puedes añadir los tuyos
// más adelante (pegar FEN desde tu editor con "Copiar FEN").

const cases = [
  // Caso A: sin capturas para el turno => winners vacío
  {
    name: "Sin capturas disponibles para el turno",
    // Tablero casi vacío; turno rojo, no hay captura posible
    fen: "10/10/10/10/10/10/10/10/10/10 r",
    expect: { winnersEmpty: true }
  },

  // Caso B: empate exacto peón vs dama => preferir Dama
  // NOTA: Dependiendo de tu implementación y orientación, puede que requiera ajuste fino.
  // Déjalo como ejemplo; si no aplica en tu variante, puedes reemplazarlo por uno tuyo.
  {
    name: "Empate exacto peón vs dama (preferir Dama)",
    // Escenario de ejemplo mínimo: ajusta si tu motor no lo reconoce como empate exacto.
    // Idea: una dama y un peón del mismo color con la misma captura disponible.
    // Aquí lo dejamos como placeholder para que luego pegues un FEN real tuyo.
    fen: "10/10/10/10/10/10/10/10/10/10 r",
    expect: { preferQueenInTie: true }
  },

  // Agrega aquí tus propios casos:
  // {
  //   name: "Mi caso X",
  //   fen: "n1n1n1n1n1/1n1n1n1n1n/n5n3/1n7n/6n3/7r2/r9/5r1r1r/r1r1r1r1r1/1r1r1r1r1r r",
  //   expect: { /* ... */ }
  // },
];

export default cases;
