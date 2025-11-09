// src/ui/net/wsClient.js
// Cliente WebSocket minimalista con "join" de sala y callbacks.

export function createWSClient({
  url,
  room,               // string: sala
  onOpen,             // () => void
  onMessage,          // (data: any) => void
  onClose,            // () => void
  onError,            // () => void
}) {
  let ws = null;

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      try { onOpen?.(); } catch {}
      // Enviar join de sala al abrir
      try { ws.send(JSON.stringify({ t: "join", room })); } catch {}
    };

    ws.onmessage = (ev) => {
      let data = ev.data;
      try { data = JSON.parse(ev.data); } catch {}
      try { onMessage?.(data); } catch {}
    };

    ws.onclose = () => { try { onClose?.(); } catch {} };
    ws.onerror  = () => { try { onError?.(); } catch {} };

    // Objeto de control que devolvemos al llamante
    return {
      send(obj) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify(obj)); } catch {}
        }
      },
      close() {
        try { ws?.close(); } catch {}
      }
    };
  }

  return { connect };
}

