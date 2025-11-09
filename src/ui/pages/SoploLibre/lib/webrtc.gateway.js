// ======================================================
// src/ui/pages/SoploLibre/lib/webrtc.gateway.js
// Esqueleto WebRTC sin señalización (listo para enchufar WS)
// - Maneja RTCPeerConnection por peerId (mapa de peers)
// - Stubs: join/leave, setLocalStream, handleRemoteDescription/Candidate
// - Callbacks: onRemoteStream, onConnState, onIce (para señalización futura)
// ======================================================

export function createWebRTCGateway({
  iceServers = [{ urls: "stun:stun.l.google.com:19302" }],
  onRemoteStream,    // (peerId, MediaStream) => void
  onConnState,       // (peerId, stateString) => void
  onIce,             // (peerId, RTCIceCandidate) => void   -> aquí enviarías por WS
  sendSignal,        // (msg:{type, peerId, payload}) => void (opcional)
} = {}) {
  const peers = new Map();      // peerId -> RTCPeerConnection
  const remotes = new Map();    // peerId -> MediaStream (única remota por simplicidad)
  let localStream = null;

  function _status(peerId, label) {
    try { onConnState?.(peerId, label); } catch {}
  }

  function _createPeer(peerId) {
    if (peers.has(peerId)) return peers.get(peerId);

    const pc = new RTCPeerConnection({ iceServers });

    // Cuando llegue media remota
    pc.ontrack = (ev) => {
      const [track] = ev.streams;
      const stream = track || (ev.streams && ev.streams[0]);
      // Normalizar: usamos el primer stream que venga
      const ms = stream instanceof MediaStream ? stream : new MediaStream([ev.track]);
      remotes.set(peerId, ms);
      try { onRemoteStream?.(peerId, ms); } catch {}
    };

    // ICE candidates (enviarías por WS al otro lado)
    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        try {
          onIce?.(peerId, ev.candidate);
          sendSignal?.({ type: "candidate", peerId, payload: ev.candidate });
        } catch {}
      }
    };

    // Estado de conexión (opcional)
    pc.onconnectionstatechange = () => {
      _status(peerId, pc.connectionState);
    };

    // Adjuntar tracks locales si ya existen
    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    }

    peers.set(peerId, pc);
    return pc;
  }

  // API pública:

  // Define/actualiza stream local; no re-negocia aún (simple y seguro)
  function setLocalStream(stream) {
    localStream = stream || null;
    // Opcional: podrías reatachar a cada peer existente
    for (const [peerId, pc] of peers) {
      // Elimina senders previos del mismo tipo para evitar duplicados
      const senders = pc.getSenders?.() || [];
      if (stream) {
        const haveAudio = stream.getAudioTracks();
        const haveVideo = stream.getVideoTracks();

        // Limpieza básica de senders (solo mismo kind)
        for (const s of senders) {
          if (s.track && (s.track.kind === "audio" || s.track.kind === "video")) {
            try { pc.removeTrack(s); } catch {}
          }
        }
        // Re-agregar tracks
        for (const t of haveAudio) pc.addTrack(t, stream);
        for (const t of haveVideo) pc.addTrack(t, stream);
      } else {
        // Sin stream: intentamos parar envío
        for (const s of senders) {
          try { pc.removeTrack(s); } catch {}
        }
      }
      _status(peerId, "localStream:updated");
    }
  }

  // Crea oferta local (luego envías por WS a peerId)
  async function join(peerId) {
    const pc = _createPeer(peerId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    // Enviarías por WS:
    sendSignal?.({ type: "offer", peerId, payload: offer });
    return offer;
  }

  // Recibe answer remoto y lo aplica
  async function handleRemoteDescription(peerId, desc) {
    const pc = _createPeer(peerId);
    const rd = new RTCSessionDescription(desc);
    await pc.setRemoteDescription(rd);
    _status(peerId, "remoteDescription:set");
  }

  // Si a ti te llega una OFFER, respondes con ANSWER:
  async function answer(peerId, remoteOffer) {
    const pc = _createPeer(peerId);
    await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    const ans = await pc.createAnswer();
    await pc.setLocalDescription(ans);
    sendSignal?.({ type: "answer", peerId, payload: ans });
    return ans;
  }

  // Candidates entrantes del otro lado
  async function handleRemoteCandidate(peerId, candidate) {
    const pc = _createPeer(peerId);
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      _status(peerId, "remoteCandidate:added");
    } catch (e) {
      console.warn("[webrtc.gateway] addIceCandidate error", e);
    }
  }

  // Cierra un peer específico
  function leave(peerId) {
    const pc = peers.get(peerId);
    if (pc) {
      try { pc.close(); } catch {}
      peers.delete(peerId);
    }
    remotes.delete(peerId);
    _status(peerId, "left");
  }

  // Limpia todo
  function leaveAll() {
    for (const [peerId, pc] of peers) {
      try { pc.close(); } catch {}
      _status(peerId, "left");
    }
    peers.clear();
    remotes.clear();
  }

  // Exponer para depuración (opcional)
  function exposeDebug(target = window, key = "rtc") {
    try { target[key] = { peers, remotes, join, answer, handleRemoteDescription, handleRemoteCandidate, setLocalStream, leave, leaveAll }; } catch {}
  }

  return {
    setLocalStream,
    join,
    answer,
    handleRemoteDescription,
    handleRemoteCandidate,
    leave,
    leaveAll,
    exposeDebug,
  };
}
