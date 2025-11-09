// ===============================================
// src/ui/pages/Online/lib/resumeBanner.js
// Muestra un overlay con "Reanudar / Descartar"
// ===============================================
export function showResumeBanner(info, onResume, onDiscard) {
  const root = document.createElement("div");
  root.className = "resume-overlay";
  const txtNet = info?.net?.toUpperCase?.() || "—";
  const txtMe  = info?.me || "—";
  const txtRoom = info?.room || "—";

  root.innerHTML = `
    <div class="card">
      <h4>Reanudar sesión anterior</h4>
      <p>Encontramos una sesión previa. ¿Deseas reanudarla?</p>
      <div class="kv"><span>Red:</span> ${txtNet}</div>
      <div class="kv"><span>Sala:</span> ${txtRoom}</div>
      <div class="kv"><span>Yo:</span> ${txtMe}</div>
      <div class="row" style="margin-top:12px;">
        <button id="rb-resume">Reanudar</button>
        <button id="rb-discard" class="secondary">Descartar</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  function dispose() { try { root.remove(); } catch {} }

  root.querySelector("#rb-resume")?.addEventListener("click", () => {
    try { onResume?.(); } catch {}
    dispose();
  });
  root.querySelector("#rb-discard")?.addEventListener("click", () => {
    try { onDiscard?.(); } catch {}
    dispose();
  });
}
