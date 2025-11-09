// src/net/index.js
// Stub de la capa WAN para modo training/offline.

function noop() {}
const dummySocket = {
  emit: (...args) => console.warn('[WAN stub] emit', ...args),
  on:   (...args) => console.warn('[WAN stub] on',   ...args),
  off:  (...args) => console.warn('[WAN stub] off',  ...args),
};

export async function ensureWANForMode(mode = 'training') {
  console.warn('[WAN stub] ensureWANForMode:', mode);
  // Devuelve un objeto “habilitado=false” para que tu UI no falle
  return { enabled: false, mode };
}

export function getSocket() {
  console.warn('[WAN stub] getSocket -> dummy');
  return dummySocket; // o devuelve null si prefieres que la UI lo detecte
}
