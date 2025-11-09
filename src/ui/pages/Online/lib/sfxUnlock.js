// ===============================================
// src/ui/pages/Online/lib/sfxUnlock.js
// Overlay para desbloquear audio (resume AudioContext).
// Devuelve una función remove() para cerrar el overlay manualmente.
// ===============================================

function audioCtxRunning(ctx) {
  return !!ctx && (ctx.state === "running");
}

async function tryResumeContext(ctx) {
  try { await ctx.resume?.(); } catch {}
  // 'Ping' silencioso por si el navegador requiere actividad audible
  try {
    const g = ctx.createGain(); g.gain.value = 0;
    const o = ctx.createOscillator();
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.05);
  } catch {}
  return audioCtxRunning(ctx);
}

async function ensureAnyAudioUnlocked() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return true; // no hay WebAudio: consideramos "ok"
  // Reusa un contexto global si existe
  let ctx = window.__D10_AC;
  if (!ctx) {
    try { ctx = new AC(); window.__D10_AC = ctx; } catch { return false; }
  }
  if (audioCtxRunning(ctx)) return true;
  return await tryResumeContext(ctx);
}

/**
 * Crea un overlay para desbloquear audio. Llama onUnlocked() al lograrlo.
 * @param {{onUnlocked?:()=>void, auto?:boolean}} opts
 */
export function createSFXUnlockOverlay(opts = {}) {
  const onUnlocked = typeof opts.onUnlocked === "function" ? opts.onUnlocked : () => {};
  const auto = opts.auto !== false; // por defecto true: escucha click/keydown/touch

  // Si ya está desbloqueado, no mostramos nada
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC && window.__D10_AC && window.__D10_AC.state === "running") {
    queueMicrotask(onUnlocked);
    return () => {};
  }

  const root = document.createElement("div");
  root.className = "sfx-unlock";
  root.innerHTML = `
    <div class="card">
      <h4>Habilitar sonido</h4>
      <p>Para poder reproducir efectos de sonido, el navegador requiere una interacción.</p>
      <button type="button" id="btn-sfx-unlock">Activar ahora</button>
      <span class="muted">Puedes hacer clic en el tablero o presionar cualquier tecla.</span>
    </div>
  `;
  document.body.appendChild(root);

  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    try { root.remove(); } catch {}
    window.removeEventListener("pointerdown", onInteract, true);
    window.removeEventListener("keydown", onInteract, true);
    window.removeEventListener("touchstart", onInteract, true);
  }

  async function onInteract(ev) {
    // Intento de desbloqueo
    const ok = await ensureAnyAudioUnlocked();
    if (ok) {
      dispose();
      try { onUnlocked(); } catch {}
    }
  }

  root.querySelector("#btn-sfx-unlock")?.addEventListener("click", onInteract);

  if (auto) {
    window.addEventListener("pointerdown", onInteract, true);
    window.addEventListener("keydown", onInteract, true);
    window.addEventListener("touchstart", onInteract, true);
  }

  return dispose;
}
