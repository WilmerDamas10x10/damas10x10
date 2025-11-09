import { computeGlobalAllowed } from "../engine/chainPolicies.js";
import { movimientos, colorOf } from "../engine/rules.js";


function runCase(board, turn, expectKeys) {
  const { winners } = computeGlobalAllowed(board, turn, movimientos, colorOf);
  const got = Array.from(winners.keys()).sort();
  const want = [...expectKeys].sort();
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    throw new Error(`Esperaba winners=${want} pero obtuve ${got}`);
  }
}

// Imagen 1: gana SOLO el peón que captura DAMA primero
runCase(BOARD_IMG1, "r", new Set(["rPeonQueCapDamaKey"]));

// Imagen 2: deben quedar PERMITIDOS ambos peones simétricos
runCase(BOARD_IMG2, "r", new Set(["p1Key","p2Key"]));

console.log("OK: regressions Imagen 1 + Imagen 2");
