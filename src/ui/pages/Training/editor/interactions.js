// src/ui/pages/Training/editor/interactions.js
import { createInteractionsController } from "./interactions.controller.js";
import { onMove, onCaptureHop, onCrown, onInvalid } from "../../../sfx.hooks.js";

export function attachBoardInteractions(container, ctx) {
  const boardEl = container.querySelector("#board");
  if (!boardEl) return;

  const ctrl = createInteractionsController(container, ctx);

  // ————————————————————————————————————————————————
  // MICRO-GUARD: Coalescer anti-duplicados por tipo de evento
  // Impide que el mismo tipo ("move","capture","crown","invalid")
  // dispare más de una vez dentro de un intervalo corto (120ms).
  // ————————————————————————————————————————————————
  const COALESCE_MS = 120;
  const lastFired = new Map(); // type -> timestamp

  function fireOnce(type, fn) {
    const now = performance.now ? performance.now() : Date.now();
    const last = lastFired.get(type) || 0;
    if (now - last < COALESCE_MS) return; // descartamos duplicado cercano
    lastFired.set(type, now);
    try { fn(); } catch {}
  }

  // Wrappers seguros para los hooks
  const fireMove = () => fireOnce("move", onMove);
  const fireCapture = () => fireOnce("capture", onCaptureHop);
  const fireCrown = () => fireOnce("crown", onCrown);
  const fireInvalid = () => fireOnce("invalid", onInvalid);

  // ————————————————————————————————————————————————
  // 1) EVENTOS CUSTOM (si tu controller los emite)
  // ————————————————————————————————————————————————
  const onMoveEvent = () => fireMove();
  const onCaptureEvent = () => fireCapture();
  const onCrownEvent = () => fireCrown();
  const onInvalidEvent = () => fireInvalid();

  boardEl.addEventListener("move:ok", onMoveEvent);
  boardEl.addEventListener("capture:hop", onCaptureEvent);
  boardEl.addEventListener("crown", onCrownEvent);
  boardEl.addEventListener("move:invalid", onInvalidEvent);

  // Por si algunos eventos salen en el contenedor:
  container.addEventListener?.("move:ok", onMoveEvent);
  container.addEventListener?.("capture:hop", onCaptureEvent);
  container.addEventListener?.("crown", onCrownEvent);
  container.addEventListener?.("move:invalid", onInvalidEvent);

  // ————————————————————————————————————————————————
  // 2) WRAP del onClick para inspeccionar el retorno y disparar sonidos
  // ————————————————————————————————————————————————
  const originalOnClick = ctrl.onClick?.bind(ctrl);

  async function onClickWrapped(ev) {
    let result;
    try {
      result = originalOnClick ? originalOnClick(ev) : undefined;
      if (result instanceof Promise) result = await result;
    } catch (err) {
      fireInvalid();
      throw err;
    }

    // Normalizamos señales desde el resultado
    if (typeof result === "boolean") {
      if (result === true) {
        // Si no sabemos si fue captura o movimiento, disparamos move.
        // (Las capturas normalmente también llegan por patch/evento)
        fireMove();
      } else {
        fireInvalid();
      }
    } else if (result && typeof result === "object") {
      // Formato 1: flags directos
      if (result.moved) fireMove();
      if (result.captureHop) fireCapture();
      if (result.crowned) fireCrown();
      if (result.invalid) fireInvalid();

      // Formato 2: { type, ok }
      if (result.type) {
        switch (result.type) {
          case "move":
            if (result.ok !== false) fireMove();
            else fireInvalid();
            break;
          case "captureHop":
            if (result.ok !== false) fireCapture();
            else fireInvalid();
            break;
          case "crown":
            if (result.ok !== false) fireCrown();
            else fireInvalid();
            break;
          case "invalid":
            fireInvalid();
            break;
        }
      }
    }

    return result; // preserva el contrato original
  }

  boardEl.addEventListener("click", onClickWrapped);

  // ————————————————————————————————————————————————
  // 3) MONKEY-PATCH opcional de métodos clave del controller
  //    (Solo si existen. Dispara hooks al éxito; inválido al fallo/throw)
  // ————————————————————————————————————————————————
  const patchMethod = (obj, methodName, onOkHook) => {
    const fn = obj?.[methodName];
    if (typeof fn !== "function") return;
    obj[methodName] = function patchedMethod(...args) {
      const out = fn.apply(this, args);
      if (out instanceof Promise) {
        return out
          .then((res) => {
            if (res) onOkHook();
            else fireInvalid();
            return res;
          })
          .catch((e) => {
            fireInvalid();
            throw e;
          });
      } else {
        if (out) onOkHook();
        else fireInvalid();
        return out;
      }
    };
  };

  // Cubrimos firmas comunes sin asumir implementación interna
  patchMethod(ctrl, "applyMove", fireMove);
  patchMethod(ctrl, "applySimpleMove", fireMove);
  patchMethod(ctrl, "performMove", fireMove);
  patchMethod(ctrl, "doMove", fireMove);

  patchMethod(ctrl, "applySingleCapture", fireCapture);
  patchMethod(ctrl, "applyCaptureStep", fireCapture);
  patchMethod(ctrl, "doCaptureHop", fireCapture);

  patchMethod(ctrl, "promote", fireCrown);
  patchMethod(ctrl, "crown", fireCrown);

  // ————————————————————————————————————————————————
  // Cleanup opcional (si tu app desmonta vistas)
  // ————————————————————————————————————————————————
  return function detachBoardInteractions() {
    boardEl.removeEventListener("click", onClickWrapped);

    boardEl.removeEventListener("move:ok", onMoveEvent);
    boardEl.removeEventListener("capture:hop", onCaptureEvent);
    boardEl.removeEventListener("crown", onCrownEvent);
    boardEl.removeEventListener("move:invalid", onInvalidEvent);

    container.removeEventListener?.("move:ok", onMoveEvent);
    container.removeEventListener?.("capture:hop", onCaptureEvent);
    container.removeEventListener?.("crown", onCrownEvent);
    container.removeEventListener?.("move:invalid", onInvalidEvent);
  };
}
