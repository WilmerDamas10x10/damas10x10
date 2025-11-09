// =====================================================
// src/ui/pages/SoploLibre/lib/media.panel.js
// Renderiza un panel mínimo para cámara/audio y expone refs
// =====================================================
export function mountMediaPanel(host) {
  const wrap = document.createElement("section");
  wrap.className = "mediaPanel";

  wrap.innerHTML = `
    <header class="mediaPanel__hdr">
      <strong>Audio & Cámara</strong>
      <div class="mediaPanel__status" data-ref="status">—</div>
    </header>

    <div class="mediaPanel__body">
      <div class="mediaPanel__video">
        <video data-ref="localVideo" class="mediaPanel__local" autoplay playsinline></video>
        <div class="mediaPanel__badges">
          <span data-ref="badgeMic" class="badge">Mic ON</span>
          <span data-ref="badgeCam" class="badge">Cam ON</span>
        </div>
      </div>

      <div class="mediaPanel__controls">
        <div class="row">
          <button data-ref="btnStartPrev" class="btn">Iniciar preview</button>
          <button data-ref="btnStopPrev"  class="btn btn--ghost">Detener</button>
        </div>
        <div class="row">
          <button data-ref="btnToggleMic" class="btn">Mute mic</button>
          <button data-ref="btnToggleCam" class="btn btn--ghost">Apagar cam</button>
        </div>
        <div class="row">
          <label>Micrófono</label>
          <select data-ref="selMic" class="select"></select>
        </div>
        <div class="row">
          <label>Cámara</label>
          <select data-ref="selCam" class="select"></select>
        </div>
      </div>
    </div>

    <footer class="mediaPanel__ftr">
      <div class="mediaPanel__grid" data-ref="remoteGrid">
        <!-- Aquí irán <video> remotos cuando agreguemos WebRTC -->
      </div>
    </footer>
  `;

  host.appendChild(wrap);

  // Refs expuestos
  const q = (sel) => wrap.querySelector(sel);
  return {
    root: wrap,
    status: q('[data-ref="status"]'),
    localVideo: q('[data-ref="localVideo"]'),
    remoteGrid: q('[data-ref="remoteGrid"]'),
    badgeMic: q('[data-ref="badgeMic"]'),
    badgeCam: q('[data-ref="badgeCam"]'),
    btnStartPrev: q('[data-ref="btnStartPrev"]'),
    btnStopPrev: q('[data-ref="btnStopPrev"]'),
    btnToggleMic: q('[data-ref="btnToggleMic"]'),
    btnToggleCam: q('[data-ref="btnToggleCam"]'),
    selMic: q('[data-ref="selMic"]'),
    selCam: q('[data-ref="selCam"]'),
  };
}
