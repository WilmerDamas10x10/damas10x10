// ================================================
// src/ui/pages/SoploLibre/lib/media.kit.js
// Esqueleto cámara+audio (preview local, mute, devices)
// Sin señalización/red todavía (listo para enchufar luego)
// ================================================

export function createMediaKit({ onStatus } = {}) {
  const state = {
    stream: null,
    audioEnabled: true,
    videoEnabled: true,
    devices: { audioIn: [], videoIn: [] },
    chosen: { audioIn: null, videoIn: null },
  };

  function status(msg) { try { onStatus?.(msg); } catch {} }

  async function listDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    state.devices.audioIn = devices.filter(d => d.kind === "audioinput");
    state.devices.videoIn = devices.filter(d => d.kind === "videoinput");
    return state.devices;
  }

  async function ensurePermission(kind = { audio: true, video: true }) {
    // Solicita permisos suaves para poder enumerar dispositivos con labels
    try {
      const test = await navigator.mediaDevices.getUserMedia(kind);
      test.getTracks().forEach(t => t.stop());
    } catch (e) {
      // no pasa nada: el usuario puede otorgar más tarde
    }
  }

  function buildConstraints() {
    const audio = state.chosen.audioIn
      ? { deviceId: { exact: state.chosen.audioIn } }
      : true;
    const video = state.chosen.videoIn
      ? { deviceId: { exact: state.chosen.videoIn } }
      : { width: { ideal: 640 }, height: { ideal: 360 } };
    return { audio, video };
  }

  async function startLocalPreview(videoEl) {
    if (!navigator.mediaDevices?.getUserMedia) {
      status("getUserMedia no disponible en este navegador");
      return;
    }
    try {
      // si hay stream previo, ciérralo
      stopLocalPreview();

      await ensurePermission();
      await listDevices();

      const constraints = buildConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      state.stream = stream;

      // flags iniciales
      state.audioEnabled = true;
      state.videoEnabled = true;

      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.muted = true;       // evita eco local
        videoEl.playsInline = true; // iOS
        await videoEl.play().catch(() => {});
      }
      status("Preview local iniciado");
      return stream;
    } catch (err) {
      console.error("[media.kit] startLocalPreview error:", err);
      status("No se pudo iniciar la cámara/micrófono");
    }
  }

  function stopLocalPreview(videoEl) {
    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
      state.stream = null;
    }
    if (videoEl) {
      videoEl.pause?.();
      videoEl.srcObject = null;
    }
    status("Preview local detenido");
  }

  function toggleAudio() {
    state.audioEnabled = !state.audioEnabled;
    state.stream?.getAudioTracks().forEach(t => (t.enabled = state.audioEnabled));
    status(state.audioEnabled ? "Micrófono activado" : "Micrófono en mute");
    return state.audioEnabled;
  }

  function toggleVideo(videoEl) {
    state.videoEnabled = !state.videoEnabled;
    state.stream?.getVideoTracks().forEach(t => (t.enabled = state.videoEnabled));
    if (videoEl) videoEl.classList.toggle("is-video-off", !state.videoEnabled);
    status(state.videoEnabled ? "Cámara activada" : "Cámara pausada");
    return state.videoEnabled;
  }

  async function selectDevice(kind, deviceId, videoEl) {
    if (kind === "audioinput") state.chosen.audioIn = deviceId || null;
    if (kind === "videoinput") state.chosen.videoIn = deviceId || null;
    // reinicia preview con el nuevo device
    if (state.stream) await startLocalPreview(videoEl);
  }

  return {
    state,
    listDevices,
    startLocalPreview,
    stopLocalPreview,
    toggleAudio,
    toggleVideo,
    selectDevice,
  };
}
