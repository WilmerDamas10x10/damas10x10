// src/ui/pages/Training/editor/controller.js
// Controlador minimal: decide si continúa la cadena o termina el turno.
// NO pinta overlays ni etiqueta pasos; eso lo hace interactions.js.

// ctx debe proveer:
// - container
// - getBoard(), setBoard(b)
// - getTurn(), setTurn(t)           // COLOR.ROJO | COLOR.NEGRO
// - getStepState(), setStepState(s) // { pos:[r,c] } | null
// - render(), paintState()
// - deps:  { movimientos }          // función de @rules
// - hints: { clearHints, clearVerification }
// - (opcional) onTurnChange(turn)

import { COLOR } from "@rules";

export function makeController(ctx) {
  const {
    container,
    getBoard, setBoard,
    getTurn, setTurn,
    getStepState, setStepState,
    render, paintState,
    deps:  { movimientos },
    hints: { clearHints, clearVerification },
    onTurnChange, // opcional
  } = ctx;

  const setTurnText = () => {
    const te = container?.querySelector?.("#turn");
    if (te) te.textContent = getTurn();
    try { onTurnChange?.(getTurn()); } catch {}
  };

  const switchTurn = () => {
    const cur  = getTurn();
    const next = (cur === COLOR.ROJO) ? COLOR.NEGRO : COLOR.ROJO;
    setTurn(next);
    setTurnText();
  };

  /**
   * Recibe la posición actual de la pieza que acaba de aterrizar (destino del último salto)
   * y decide si hay que seguir capturando con la MISMA pieza o terminar el turno.
   * OJO: no usamos “winners” aquí; interactions.js aplicará los filtros/empates/visited.
   */
  function continueOrEndChain(fromPos) {
    const boardEl = document.getElementById("board");
    try { (clearVerification || clearHints)?.(boardEl); } catch {}
    clearHints?.(boardEl);

    const board = getBoard();
    const mv = movimientos(board, fromPos) || {};
    const captures = Array.isArray(mv.captures) ? mv.captures : [];

    if (captures.length > 0) {
      // Hay más capturas posibles → dejamos que interactions.js filtre por visited y pinte opciones
      setStepState({ pos: fromPos.slice() });
      // No pintamos nada aquí a propósito.
    } else {
      // No hay más capturas → se cierra la cadena y cambia el turno
      setStepState(null);
      switchTurn();
      render(); paintState();
    }
  }

  return { setTurnText, switchTurn, continueOrEndChain };
}
