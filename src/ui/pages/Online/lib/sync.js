// ================================
// src/ui/pages/Online/lib/sync.js
// Pequeño monitor de sincronización y métricas.
// Verifica prevH/nextH, decide cuándo pedir snapshot y
// actualiza un HUD opcional mediante callbacks.
// ================================

import { stateHash } from "./helpers.js";

/**
 * @typedef {Object} SyncMonitor
 * @property {function():{sent:number,recv:number,valid:number,invalid:number}} getMetrics
 * @property {(fn:Function)=>void} onMetrics
 * @property {(n:number)=>void} onNetSent
 * @property {(n:number)=>void} onNetRecv
 * @property {(n:number)=>void} onInvalid
 * @property {(ok:boolean)=>void} setSyncedUI
 * @property {(msg:any)=>{applied:boolean}} handleIncomingState
 * @property {(msg:any)=>{ok:boolean}} verifyMoveHashes
 * @property {(nextH:number)=>{requestState:boolean}} afterApplyMoveCheck
 * @property {()=>void} onLocalChange
 */

/**
 * Crea un monitor de sincronización.
 * @param {{
 *   getBoard: ()=>any,
 *   getTurn: ()=>any,
 *   updateUI?: (ok:boolean)=>void
 * }} deps
 * @returns {SyncMonitor}
 */
export function createSyncMonitor(deps){
  const getBoard = deps.getBoard || (() => null);
  const getTurn  = deps.getTurn  || (() => null);
  const updateUI = typeof deps.updateUI === "function" ? deps.updateUI : (()=>{});

  // --- Métricas simples ---
  const metrics = { sent:0, recv:0, valid:0, invalid:0 };
  let metricsCb = null;

  function bump(key, inc=1){
    metrics[key] = (metrics[key] || 0) + inc;
    try { metricsCb?.(getMetrics()); } catch {}
  }
  function getMetrics(){ return { ...metrics }; }
  function onMetrics(fn){ metricsCb = fn; }

  // --- Estado de sincronización visual ---
  function setSyncedUI(ok){
    try { updateUI(!!ok); } catch {}
  }

  // --- Al enviar / recibir ---
  function onNetSent(n=1){ bump("sent", n); }
  function onNetRecv(n=1){ bump("recv", n); }
  function onInvalid(n=1){ bump("invalid", n); }

  // --- Verificación de hashes para MOVES ---
  function verifyMoveHashes(msg){
    try {
      const nowH = stateHash(getBoard(), getTurn());
      if (msg && typeof msg.prevH === "number") {
        if ((msg.prevH >>> 0) !== (nowH >>> 0)) {
          // Mismatch => inválido
          onInvalid(1);
          setSyncedUI(false);
          return { ok:false };
        }
      }
      bump("valid", 1);
      return { ok:true };
    } catch {
      // Si no podemos calcular, no bloqueamos, pero marcamos inválido para trazas
      onInvalid(1);
      return { ok:true };
    }
  }

  // --- Post-aplicación de jugada (comparar nextH) ---
  function afterApplyMoveCheck(nextH){
    try {
      if (typeof nextH !== "number") return { requestState:false };
      const nowH = stateHash(getBoard(), getTurn());
      if ((nextH >>> 0) !== (nowH >>> 0)) {
        setSyncedUI(false);
        return { requestState:true };
      }
      setSyncedUI(true);
      return { requestState:false };
    } catch {
      return { requestState:false };
    }
  }

  // --- Al recibir snapshot de estado ---
  function handleIncomingState(msg){
    // Aquí no aplicamos el estado; eso lo hace el caller.
    // Solo marcamos la UI como "en proceso de resincronizar" si los hashes no coinciden.
    try {
      if (!msg) return { applied:false };
      const theirH = (typeof msg.h === "number") ? msg.h : stateHash(msg.board, msg.turn);
      const nowH   = stateHash(getBoard(), getTurn());
      setSyncedUI((theirH >>> 0) === (nowH >>> 0));
      return { applied:true };
    } catch {
      // Si algo falla, igual dejamos que el caller pinte y luego revalide.
      setSyncedUI(false);
      return { applied:true };
    }
  }

  // --- Marcar cambios locales (para HUD/UX) ---
  function onLocalChange(){
    // Por ahora solo refrescamos métricas/UI; el caller decide enviar snapshot.
    try { metricsCb?.(getMetrics()); } catch {}
  }

  return {
    getMetrics, onMetrics,
    onNetSent, onNetRecv, onInvalid,
    setSyncedUI,
    handleIncomingState,
    verifyMoveHashes,
    afterApplyMoveCheck,
    onLocalChange,
  };
}
