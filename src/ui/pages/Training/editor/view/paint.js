// src/ui/pages/Training/editor/view/paint.js
import { paintState as paintStateExternal } from "../index.js";

/**
 * Pinta la vista base (sin OV2). El overlay se maneja en el Editor
 * para garantizar que exista layout y tamaño del board.
 */
export function paintView({
  boardEl,
  board,
  turn,
  setTurn,
  stepState,
  setStepState,
  container,
  dbgEl,
  showDebug = false,
}) {
  paintStateExternal({
    boardEl,
    board,
    turn,
    setTurn,
    stepState,
    setStepState,
    container,
    dbgEl,
    showDebug,
  });
}
