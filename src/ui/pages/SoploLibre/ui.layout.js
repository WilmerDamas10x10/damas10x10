// =========================================
// src/ui/pages/SoploLibre/ui.layout.js
// Layout con dos barras laterales equilibradas
// Izquierda: Estado + Controles + Revisión + Sanciones
// Derecha:   Zoom + Edición + Partida
// =========================================

export function createLayout(root) {
  const host = document.createElement("div");
  host.className = "soploLibre";
  host.dataset.page = "soplo-libre";
  root.innerHTML = "";
  root.appendChild(host);

  const wrap = document.createElement("div");
  wrap.className = "soploLibre__wrap";
  host.appendChild(wrap);

  // ===== LADO IZQUIERDO =====
  const sideLeft = document.createElement("aside");
  sideLeft.className = "soploLibre__side soploLibre__side--left";
  wrap.appendChild(sideLeft);

  // ===== COLUMNA DEL TABLERO =====
  const boardCol = document.createElement("div");
  boardCol.className = "soploLibre__boardCol";
  wrap.appendChild(boardCol);

  const topDock = document.createElement("div");
  topDock.id = "board-top-dock";
  topDock.className = "soploLibre__dock soploLibre__dock--top";
  boardCol.appendChild(topDock);

  const boardHost = document.createElement("div");
  boardHost.id = "board-root";
  boardHost.className = "soploLibre__boardHost";
  boardCol.appendChild(boardHost);

  const bottomDock = document.createElement("div");
  bottomDock.id = "board-bottom-dock";
  bottomDock.className = "soploLibre__dock soploLibre__dock--bottom";
  boardCol.appendChild(bottomDock);

  // ===== LADO DERECHO =====
  const sideRight = document.createElement("aside");
  sideRight.className = "soploLibre__side soploLibre__side--right";
  wrap.appendChild(sideRight);

  // ===================== IZQUIERDA =====================
  // Estado (sin título "Estado" y sin mensaje secundario)
  const grpEstado = document.createElement("div");
  grpEstado.className = "soploLibre__group";
  sideLeft.appendChild(grpEstado);

  // Turno (con mini-ficha + label)
  const turnText = document.createElement("div");
  turnText.id = "turn-text";
  turnText.className = "soploLibre__pill soploLibre__turn";
  // MINI FICHA + LABEL
  const turnPiece = document.createElement("div");
  turnPiece.id = "turn-piece";
  turnPiece.className = "piece piece--rojo"; // se actualizará en index.js
  const turnLabel = document.createElement("span");
  turnLabel.id = "turn-label";
  turnLabel.className = "soploLibre__turnLabel";
  turnText.appendChild(turnPiece);
  turnText.appendChild(turnLabel);
  grpEstado.appendChild(turnText);

  // Eliminamos el contenedor del mensaje bajo "turno".
  // Para compatibilidad con index.js, mantenemos la referencia como null:
  const statusText = null;

  // Controles
  const grpControls = document.createElement("div");
  grpControls.className = "soploLibre__group";
  sideLeft.appendChild(grpControls);

  const hCont = document.createElement("div");
  hCont.className = "soploLibre__groupTitle";
  hCont.textContent = "Controles";
  grpControls.appendChild(hCont);

  const btnReiniciar = document.createElement("button");
  btnReiniciar.id = "btn-reiniciar";
  btnReiniciar.className = "btn btn--block";
  btnReiniciar.textContent = "Reiniciar";
  grpControls.appendChild(btnReiniciar);

  const btnCambiarTurno = document.createElement("button");
  btnCambiarTurno.id = "btn-cambiar-turno";
  btnCambiarTurno.className = "btn btn--block";
  btnCambiarTurno.textContent = "Cambiar turno";
  grpControls.appendChild(btnCambiarTurno);

  const btnDeshacer = document.createElement("button");
  btnDeshacer.id = "btn-deshacer";
  btnDeshacer.className = "btn btn--block";
  btnDeshacer.textContent = "Deshacer";
  grpControls.appendChild(btnDeshacer);

  const btnVolver = document.createElement("button");
  btnVolver.id = "btn-volver";
  btnVolver.className = "btn btn--block btn--subtle";
  btnVolver.textContent = "Volver";
  grpControls.appendChild(btnVolver);

  // Revisión
  const grpRevision = document.createElement("div");
  grpRevision.className = "soploLibre__group";
  sideLeft.appendChild(grpRevision);

  const hRev = document.createElement("div");
  hRev.className = "soploLibre__groupTitle";
  hRev.textContent = "Revisión";
  grpRevision.appendChild(hRev);

  const btnRevisionStart = document.createElement("button");
  btnRevisionStart.id = "btn-revision-start";
  btnRevisionStart.className = "btn btn--block";
  btnRevisionStart.textContent = "Acordar revisión";
  grpRevision.appendChild(btnRevisionStart);

  const rowRev = document.createElement("div");
  rowRev.style.display = "grid";
  rowRev.style.gridTemplateColumns = "1fr 1fr";
  rowRev.style.gap = "8px";
  grpRevision.appendChild(rowRev);

  const btnRevConfirmRed = document.createElement("button");
  btnRevConfirmRed.id = "btn-revision-confirm-red";
  btnRevConfirmRed.className = "btn";
  btnRevConfirmRed.textContent = "Confirmar ROJO";
  btnRevConfirmRed.disabled = true;
  rowRev.appendChild(btnRevConfirmRed);

  const btnRevConfirmBlack = document.createElement("button");
  btnRevConfirmBlack.id = "btn-revision-confirm-black";
  btnRevConfirmBlack.className = "btn";
  btnRevConfirmBlack.textContent = "Confirmar NEGRO";
  btnRevConfirmBlack.disabled = true;
  rowRev.appendChild(btnRevConfirmBlack);

  const rowRev2 = document.createElement("div");
  rowRev2.style.display = "grid";
  rowRev2.style.gridTemplateColumns = "1fr 1fr";
  rowRev2.style.gap = "8px";
  grpRevision.appendChild(rowRev2);

  const btnRevApply = document.createElement("button");
  btnRevApply.id = "btn-revision-apply";
  btnRevApply.className = "btn btn--primary";
  btnRevApply.textContent = "Retroceder 1 jugada";
  btnRevApply.disabled = true;
  rowRev2.appendChild(btnRevApply);

  const btnRevCancel = document.createElement("button");
  btnRevCancel.id = "btn-revision-cancel";
  btnRevCancel.className = "btn btn--subtle";
  btnRevCancel.textContent = "Cerrar revisión";
  btnRevCancel.disabled = true;
  rowRev2.appendChild(btnRevCancel);

  // Sanciones
  const grpSanc = document.createElement("div");
  grpSanc.className = "soploLibre__group";
  sideLeft.appendChild(grpSanc);

  const hSanc = document.createElement("div");
  hSanc.className = "soploLibre__groupTitle";
  hSanc.textContent = "Sanciones (Soplo Libre)";
  grpSanc.appendChild(hSanc);

  const btnSoplar = document.createElement("button");
  btnSoplar.id = "btn-soplar";
  btnSoplar.className = "btn btn--block btn--warn";
  btnSoplar.textContent = "Soplar";
  grpSanc.appendChild(btnSoplar);

  const btnObligar = document.createElement("button");
  btnObligar.id = "btn-obligar";
  btnObligar.className = "btn btn--block btn--primary";
  btnObligar.textContent = "Obligar a capturar";
  grpSanc.appendChild(btnObligar);

  // ===================== DERECHA =====================
  // Zoom
  const grpZoom = document.createElement("div");
  grpZoom.className = "soploLibre__group";
  sideRight.appendChild(grpZoom);

  const hZoom = document.createElement("div");
  hZoom.className = "soploLibre__groupTitle";
  hZoom.textContent = "Tamaño del tablero";
  grpZoom.appendChild(hZoom);

  const zoomRow = document.createElement("div");
  zoomRow.className = "zoomRow";
  grpZoom.appendChild(zoomRow);

  const zoomVal = document.createElement("div");
  zoomVal.className = "zoomVal";
  zoomVal.id = "zoom-val";
  zoomVal.textContent = "100%";
  zoomRow.appendChild(zoomVal);

  const btnZoomOut = document.createElement("button");
  btnZoomOut.id = "btn-zoom-out";
  btnZoomOut.className = "btn";
  btnZoomOut.textContent = "−";
  btnZoomOut.title = "Reducir";
  zoomRow.appendChild(btnZoomOut);

  const btnZoomReset = document.createElement("button");
  btnZoomReset.id = "btn-zoom-reset";
  btnZoomReset.className = "btn";
  btnZoomReset.textContent = "100%";
  btnZoomReset.title = "Restablecer";
  zoomRow.appendChild(btnZoomReset);

  const btnZoomIn = document.createElement("button");
  btnZoomIn.id = "btn-zoom-in";
  btnZoomIn.className = "btn";
  btnZoomIn.textContent = "+";
  btnZoomIn.title = "Ampliar";
  zoomRow.appendChild(btnZoomIn);

  const btnRotateBoard = document.createElement("button");
  btnRotateBoard.id = "btn-rotate-board";
  btnRotateBoard.className = "btn btn--block";
  btnRotateBoard.textContent = "Girar tablero";
  grpZoom.appendChild(btnRotateBoard);

  // Edición
  const grpEdit = document.createElement("div");
  grpEdit.className = "soploLibre__group";
  sideRight.appendChild(grpEdit);

  const hEdit = document.createElement("div");
  hEdit.className = "soploLibre__groupTitle";
  hEdit.textContent = "Edición";
  grpEdit.appendChild(hEdit);

  const btnClearBoard = document.createElement("button");
  btnClearBoard.id = "btn-clear-board";
  btnClearBoard.className = "btn btn--block";
  btnClearBoard.textContent = "Limpiar tablero";
  grpEdit.appendChild(btnClearBoard);

  const btnPopulateInitial = document.createElement("button");
  btnPopulateInitial.id = "btn-populate-initial";
  btnPopulateInitial.className = "btn btn--block";
  btnPopulateInitial.textContent = "Piezas iniciales";
  grpEdit.appendChild(btnPopulateInitial);

  // NUEVO: herramienta mover
  const btnMoveTool = document.createElement("button");
  btnMoveTool.id = "btn-move-tool";
  btnMoveTool.className = "btn btn--block";
  btnMoveTool.textContent = "Mover pieza (libre)";
  grpEdit.appendChild(btnMoveTool);

  const btnPlacePawnRed = document.createElement("button");
  btnPlacePawnRed.id = "btn-place-pawn-red";
  btnPlacePawnRed.className = "btn btn--block";
  btnPlacePawnRed.textContent = "Colocar Peón Rojo";
  grpEdit.appendChild(btnPlacePawnRed);

  const btnPlacePawnBlack = document.createElement("button");
  btnPlacePawnBlack.id = "btn-place-pawn-black";
  btnPlacePawnBlack.className = "btn btn--block";
  btnPlacePawnBlack.textContent = "Colocar Peón Negro";
  grpEdit.appendChild(btnPlacePawnBlack);

  const btnPlaceKingRed = document.createElement("button");
  btnPlaceKingRed.id = "btn-place-king-red";
  btnPlaceKingRed.className = "btn btn--block";
  btnPlaceKingRed.textContent = "Colocar Dama Roja";
  grpEdit.appendChild(btnPlaceKingRed);

  const btnPlaceKingBlack = document.createElement("button");
  btnPlaceKingBlack.id = "btn-place-king-black";
  btnPlaceKingBlack.className = "btn btn--block";
  btnPlaceKingBlack.textContent = "Colocar Dama Negra";
  grpEdit.appendChild(btnPlaceKingBlack);

  // Partida (Pausa/Empate/Rendición)
  const grpGame = document.createElement("div");
  grpGame.className = "soploLibre__group";
  sideRight.appendChild(grpGame);

  const hGame = document.createElement("div");
  hGame.className = "soploLibre__groupTitle";
  hGame.textContent = "Partida";
  grpGame.appendChild(hGame);

  // Pausa
  const btnPauseStart = document.createElement("button");
  btnPauseStart.id = "btn-pause-start";
  btnPauseStart.className = "btn btn--block";
  btnPauseStart.textContent = "Solicitar pausa";
  grpGame.appendChild(btnPauseStart);

  const rowPause = document.createElement("div");
  rowPause.style.display = "grid";
  rowPause.style.gridTemplateColumns = "1fr 1fr";
  rowPause.style.gap = "8px";
  grpGame.appendChild(rowPause);

  const btnPauseConfirmRed = document.createElement("button");
  btnPauseConfirmRed.id = "btn-pause-confirm-red";
  btnPauseConfirmRed.className = "btn";
  btnPauseConfirmRed.textContent = "Conf. ROJO";
  btnPauseConfirmRed.disabled = true;
  rowPause.appendChild(btnPauseConfirmRed);

  const btnPauseConfirmBlack = document.createElement("button");
  btnPauseConfirmBlack.id = "btn-pause-confirm-black";
  btnPauseConfirmBlack.className = "btn";
  btnPauseConfirmBlack.textContent = "Conf. NEGRO";
  btnPauseConfirmBlack.disabled = true;
  rowPause.appendChild(btnPauseConfirmBlack);

  const rowPause2 = document.createElement("div");
  rowPause2.style.display = "grid";
  rowPause2.style.gridTemplateColumns = "1fr 1fr";
  rowPause2.style.gap = "8px";
  grpGame.appendChild(rowPause2);

  const btnPauseResume = document.createElement("button");
  btnPauseResume.id = "btn-pause-resume";
  btnPauseResume.className = "btn btn--primary";
  btnPauseResume.textContent = "Reanudar";
  btnPauseResume.disabled = true;
  rowPause2.appendChild(btnPauseResume);

  const btnPauseCancel = document.createElement("button");
  btnPauseCancel.id = "btn-pause-cancel";
  btnPauseCancel.className = "btn btn--subtle";
  btnPauseCancel.textContent = "Cancelar";
  btnPauseCancel.disabled = true;
  rowPause2.appendChild(btnPauseCancel);

  // Empate
  const btnDrawStart = document.createElement("button");
  btnDrawStart.id = "btn-draw-start";
  btnDrawStart.className = "btn btn--block";
  btnDrawStart.textContent = "Proponer empate";
  grpGame.appendChild(btnDrawStart);

  const rowDraw = document.createElement("div");
  rowDraw.style.display = "grid";
  rowDraw.style.gridTemplateColumns = "1fr 1fr";
  rowDraw.style.gap = "8px";
  grpGame.appendChild(rowDraw);

  const btnDrawConfirmRed = document.createElement("button");
  btnDrawConfirmRed.id = "btn-draw-confirm-red";
  btnDrawConfirmRed.className = "btn";
  btnDrawConfirmRed.textContent = "Aceptar ROJO";
  btnDrawConfirmRed.disabled = true;
  rowDraw.appendChild(btnDrawConfirmRed);

  const btnDrawConfirmBlack = document.createElement("button");
  btnDrawConfirmBlack.id = "btn-draw-confirm-black";
  btnDrawConfirmBlack.className = "btn";
  btnDrawConfirmBlack.textContent = "Aceptar NEGRO";
  btnDrawConfirmBlack.disabled = true;
  rowDraw.appendChild(btnDrawConfirmBlack);

  const btnDrawCancel = document.createElement("button");
  btnDrawCancel.id = "btn-draw-cancel";
  btnDrawCancel.className = "btn btn--subtle btn--block";
  btnDrawCancel.textContent = "Cancelar propuesta";
  btnDrawCancel.disabled = true;
  grpGame.appendChild(btnDrawCancel);

  // Rendición
  const btnResign = document.createElement("button");
  btnResign.id = "btn-resign";
  btnResign.className = "btn btn--warn btn--block";
  btnResign.textContent = "Rendirse (dar victoria)";
  grpGame.appendChild(btnResign);

  // ==== Refs que usamos en index.js ====
  return {
    root: host,
    wrap,
    sideLeft, sideRight,
    boardHost, boardTopDock: topDock, boardBottomDock: bottomDock,

    // Indicadores
    turnText, statusText, turnPiece, turnLabel,

    // Izquierda
    btnReiniciar, btnCambiarTurno, btnDeshacer, btnVolver,
    btnRevisionStart, btnRevConfirmRed, btnRevConfirmBlack, btnRevApply, btnRevCancel,
    btnSoplar, btnObligar,

    // Derecha
    btnZoomIn, btnZoomOut, btnZoomReset, btnRotateBoard, zoomVal,
    btnClearBoard, btnPopulateInitial, btnMoveTool,
    btnPlacePawnRed, btnPlacePawnBlack, btnPlaceKingRed, btnPlaceKingBlack,
    btnPauseStart, btnPauseConfirmRed, btnPauseConfirmBlack, btnPauseResume, btnPauseCancel,
    btnDrawStart, btnDrawConfirmRed, btnDrawConfirmBlack, btnDrawCancel,
    btnResign,
  };
}
