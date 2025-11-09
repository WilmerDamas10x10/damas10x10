// ================================
// media.collapsible.js (lazy-mount panel de medios)
// ================================
import { mountMediaPanel } from "../media.panel.js";
import { createMediaKit } from "../media.kit.js";

export function setupMediaCollapsibleLazy(refs, setStatus = () => {}) {
  const hostGroup = refs.mediaHost || refs.rightPane || refs.root;

  let btnToggle = refs.btnMedia || refs.btnCamMic;
  if (!btnToggle) {
    btnToggle = document.createElement("button");
    btnToggle.type = "button";
    btnToggle.className = "btn";
    btnToggle.textContent = "Cámara y Micrófono";
    hostGroup.appendChild(btnToggle);
  }

  const panel = document.createElement("div");
  panel.className = "mediaPanel";
  panel.style.display = "none";
  hostGroup.appendChild(panel);

  let mounted = false;
  let mediaRefs = null;
  let media = null;

  btnToggle.setAttribute("aria-expanded", "false");
  btnToggle.addEventListener("click", async () => {
    const open = panel.style.display !== "none";
    if (open) {
      panel.style.display = "none";
      btnToggle.setAttribute("aria-expanded", "false");
      btnToggle.classList.remove("is-open");
      return;
    }

    if (!mounted) {
      mediaRefs = mountMediaPanel(panel);
      media = createMediaKit({
        onStatus: (msg) => {
          if (mediaRefs.status) mediaRefs.status.textContent = msg;
          setStatus(msg);
        }
      });

      mediaRefs.btnStartPrev?.addEventListener("click", async () => {
        await media.startLocalPreview(mediaRefs.localVideo);
        mediaRefs.badgeMic && (mediaRefs.badgeMic.textContent = media.state.audioEnabled ? "Mic ON" : "Mic OFF");
        mediaRefs.badgeCam && (mediaRefs.badgeCam.textContent = media.state.videoEnabled ? "Cam ON" : "Cam OFF");
        await refreshDeviceLists();
      });
      mediaRefs.btnStopPrev?.addEventListener("click", () => {
        media.stopLocalPreview(mediaRefs.localVideo);
      });
      mediaRefs.btnToggleMic?.addEventListener("click", () => {
        const on = media.toggleAudio();
        mediaRefs.badgeMic && (mediaRefs.badgeMic.textContent = on ? "Mic ON" : "Mic OFF");
      });
      mediaRefs.btnToggleCam?.addEventListener("click", () => {
        const on = media.toggleVideo(mediaRefs.localVideo);
        mediaRefs.badgeCam && (mediaRefs.badgeCam.textContent = on ? "Cam ON" : "Cam OFF");
      });
      mediaRefs.selMic?.addEventListener("change", (e) => {
        media.selectDevice("audioinput", e.target.value, mediaRefs.localVideo);
      });
      mediaRefs.selCam?.addEventListener("change", (e) => {
        media.selectDevice("videoinput", e.target.value, mediaRefs.localVideo);
      });

      async function refreshDeviceLists() {
        try {
          await media.listDevices();
          const { audioIn, videoIn } = media.state.devices;

          if (mediaRefs.selMic) {
            mediaRefs.selMic.innerHTML = "";
            for (let i = 0; i < audioIn.length; i++) {
              const d = audioIn[i];
              const o = document.createElement("option");
              o.value = d.deviceId;
              o.textContent = d.label || `Mic ${i + 1}`;
              mediaRefs.selMic.appendChild(o);
            }
          }
          if (mediaRefs.selCam) {
            mediaRefs.selCam.innerHTML = "";
            for (let i = 0; i < videoIn.length; i++) {
              const d = videoIn[i];
              const o = document.createElement("option");
              o.value = d.deviceId;
              o.textContent = d.label || `Cam ${i + 1}`;
              mediaRefs.selCam.appendChild(o);
            }
          }
        } catch {}
      }
      try { await media.listDevices(); } catch {}
      mounted = true;
    }

    panel.style.display = "";
    btnToggle.setAttribute("aria-expanded", "true");
    btnToggle.classList.add("is-open");
  });

  document.addEventListener("click", (ev) => {
    if (panel.style.display !== "none" && !hostGroup.contains(ev.target)) {
      panel.style.display = "none";
      btnToggle.setAttribute("aria-expanded", "false");
      btnToggle.classList.remove("is-open");
    }
  });
}
