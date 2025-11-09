// src/ui/pages/Training/editor/state/undo.js
import { makeUndoAPI } from "../index.js";

/**
 * Configura Undo/Redo del Editor y expone utilidades.
 * Requiere callbacks para leer/escribir estado y repintar.
 */
export function setupUndo(container, {
  getBoard, setBoard,
  getTurn,  setTurn,
  render, paintState,
  afterApply = () => {}
}) {
  const api = makeUndoAPI({
    getSnapshot: () => ({ board: getBoard().map(r => r.slice()), turn: getTurn() }),
    applySnapshot: (st) => {
      setBoard(st.board.map(r => r.slice()));
      setTurn(st.turn);
      afterApply();
      render(); paintState();
    },
    onUpdate: ({ canUndo, canRedo }) => {
      const u1 = container.querySelector("#btn-undo"); if (u1) u1.disabled = !canUndo;
      const r1 = container.querySelector("#btn-redo"); if (r1) r1.disabled = !canRedo;
    }
  });

  return {
    save: () => api.save(),
    undo: () => api.undo(),
    redo: () => api.redo(),
    updateUI: () => api.updateButtons(),
  };
}
