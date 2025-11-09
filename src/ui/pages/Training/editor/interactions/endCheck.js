// src/ui/pages/Training/editor/interactions/endCheck.js
import { setChainAttr, clearOV2Now } from "./ov2.js";
import { pushTurnChange } from "../services/replay.js";
import { computeGlobalAllowed } from "../../../../../engine/chainPolicies.js";
import { sfx } from "../../../../sound/sfx.js"; // ← corregido (4 niveles)

const nameOfTurn = (t) => (t === "r" ? "Rojo" : "Negro");

export function endTurnAndCheck(container, ctx) {
  const {
    getBoard,
    setBoard,
    getTurn,
    render,
    paintState,
    hints: { clearHints },
    controller: { switchTurn },
    rules: { colorOf, movimientos },
  } = ctx;

  switchTurn();
  try { pushTurnChange({ turn: getTurn() }); } catch {}
  try { sfx?.turn?.(); } catch {}

  render();
  paintState();

  const b = getBoard();
  const turnNow = getTurn();
  const be = container.querySelector("#board");

  let { winners } = computeGlobalAllowed(b, turnNow, movimientos, colorOf);
  let hasAny = winners.size > 0;

  if (!hasAny) {
    outer: for (let rr = 0; rr < b.length; rr++) {
      for (let cc = 0; cc < b[rr].length; cc++) {
        const cell = b[rr][cc];
        if (cell && colorOf(cell) === turnNow) {
          const res = movimientos(b, [rr, cc]) || {};
          if ((res.moves && res.moves.length) || (res.captures && res.captures.length)) {
            hasAny = true; break outer;
          }
        }
      }
    }
  }

  if (!hasAny) {
    setChainAttr(be, false);
    clearOV2Now(be);
    clearHints?.(be);
    be?.setAttribute("data-locked", "1");
    const loser = nameOfTurn(turnNow);
    const winner = nameOfTurn(turnNow === "r" ? "n" : "r");
    if (typeof window !== "undefined") {
      setTimeout(() => alert(`Fin de partida: ${loser} sin movimientos.\nGana ${winner}.`), 0);
    } else {
      console.warn(`Fin de partida: ${loser} sin movimientos. Gana ${winner}.`);
    }
  }
}

export default endTurnAndCheck;
