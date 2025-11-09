// ===============================================
// src/ui/pages/SoploLibre/lib/board.responsive.js
// Calcula y fija --board-base según el ancho disponible
// del contenedor, manteniendo cuadrado y respetando límites.
// ===============================================
export function attachResponsiveBoard(refs, opts = {}) {
  const host = refs?.boardHost;    // div.soploLibre__boardHost
  const root = refs?.root;         // div.soploLibre (raíz de la página)
  if (!host || !root) return () => {};

  const MIN = opts.min ?? 280;     // tamaño mínimo del tablero (px)
  const MAX = opts.max ?? 1024;    // tamaño máximo razonable (px)

  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const avail = Math.floor(entry.contentRect.width || host.clientWidth || 0);
      // Aseguramos cuadrado y que nunca desborde ni se quede minúsculo
      const size = Math.max(MIN, Math.min(avail, MAX));
      root.style.setProperty('--board-base', `${size}px`);
    }
  });

  ro.observe(host);
  // Primera pasada por si el observer tarda
  queueMicrotask(() => {
    const avail = Math.floor(host.clientWidth || 0);
    const size = Math.max(MIN, Math.min(avail, MAX));
    root.style.setProperty('--board-base', `${size}px`);
  });

  // Retorno cleanup
  return () => ro.disconnect();
}
