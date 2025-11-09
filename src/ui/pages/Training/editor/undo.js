// src/ui/pages/Training/editor/undo.js
import { sfx } from "../../../sound/sfx.js";

export function makeUndoAPI({ getSnapshot, applySnapshot, onUpdate }){
  const hist = [];
  const fut  = [];

  function updateButtons(){
    onUpdate({ canUndo: hist.length > 0, canRedo: fut.length > 0 });
  }

  function save(){
    hist.push(getSnapshot());
    fut.length = 0;
    updateButtons();
  }

  function undo(){
    if (!hist.length) return;
    fut.push(getSnapshot());
    applySnapshot(hist.pop());
    updateButtons();
    sfx.click(); // feedback auditivo al deshacer
  }

  function redo(){
    if (!fut.length) return;
    hist.push(getSnapshot());
    applySnapshot(fut.pop());
    updateButtons();
    sfx.click(); // feedback auditivo al rehacer
  }

  return { save, undo, redo, updateButtons };
}
