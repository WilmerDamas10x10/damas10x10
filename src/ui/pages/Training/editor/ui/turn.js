// src/ui/pages/Training/editor/ui/turn.js
import { COLOR } from "@rules";

function uiTurnLabel(t) {
  // Mantiene el mapeo que ya usabas: ROJO => "BLANCO", NEGRO => "NEGRO"
  return t === COLOR.ROJO ? "BLANCO" : "NEGRO";
}

/** Actualiza los elementos de UI que muestran el turno actual. */
export function updateTurnUI(container, turn) {
  const label = uiTurnLabel(turn);

  const te = container.querySelector("#turn");
  if (te) te.textContent = label;

  const badge = container.querySelector("#turno-actual");
  if (badge) {
    badge.textContent = label;
    badge.classList.toggle("is-rojo",  turn === COLOR.ROJO);
    badge.classList.toggle("is-negro", turn === COLOR.NEGRO);
  }
}
