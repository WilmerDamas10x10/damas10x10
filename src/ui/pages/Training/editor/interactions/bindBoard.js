// src/ui/pages/Training/editor/interactions/bindBoard.js
import { attachBoardInteractions } from "../index.js";

/**
 * Facade mínima para adjuntar interacciones al tablero.
 * Mantiene al Editor.js libre de objetos grandes inline.
 */
export function bindBoardInteractions(container, opts) {
  attachBoardInteractions(container, {
    SIZE: opts.SIZE,
    getBoard: opts.getBoard,
    setBoard: opts.setBoard,
    getTurn: opts.getTurn,
    setTurn: opts.setTurn,
    getStepState: opts.getStepState,
    setStepState: opts.setStepState,
    getPlacing: opts.getPlacing,
    render: opts.render,
    paintState: opts.paintState,
    saveForUndo: opts.saveForUndo,
    rules: opts.rules,
    editorMoves: opts.editorMoves,
    hints: opts.hints,
    controller: opts.controller,
  });
}
