// Mantiene un buffer de las últimas N jugadas { t:"move", ... } y envía un
// "replay" a pares que entren tarde. No aplica jugadas (el receptor las pasa
// por su handler normal). Se integra con net.onMessage para escuchar.
//
// API:
//   const seqCtl = setupSeqReplay(netIface, currentRoom, { max?:40, log?:false });
//   seqCtl.recordLocalMove(msgMove);
//   seqCtl.sendReplay();

export function setupSeqReplay(net, room, opts = {}) {
  const log = !!opts.log;
  const max = Math.max(8, opts.max || 40);
  const buffer = []; // últimos 'move' tal cual se emitieron/recibieron

  function push(msg) {
    if (!msg || msg.t !== "move") return;
    buffer.push(msg);
    if (buffer.length > max) buffer.shift();
    if (log) console.debug("[seqReplay] push", msg);
  }

  // Captura TODO lo que llega por la red (para replays futuros)
  net.onMessage((msg) => {
    if (msg?.t === "move") push(msg);
  });

  function recordLocalMove(msg) { push(msg); }

  function sendReplay() {
    if (!buffer.length) return;
    try {
      net.send({ t: "replay", room, v: 1, moves: buffer.slice() });
      if (log) console.debug("[seqReplay] sent replay", buffer.length);
    } catch {}
  }

  return { recordLocalMove, sendReplay };
}
