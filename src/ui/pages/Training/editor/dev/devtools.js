// src/ui/pages/Training/editor/dev/devtools.js
import { COLOR } from "@rules";

/** Lee ?autoOverlays=0/1 y expone un helper para alternar desde consola. */
export function resolveAutoOverlays(defaultValue = true) {
  let value = defaultValue;
  try {
    const p = new URLSearchParams(location.search).get("autoOverlays");
    if (p != null) value = !(p === "0" || p === "false");
  } catch {}
  // Helper global para cambiar y recargar rápido: __setAutoOverlays(0/1)
  try {
    window.__setAutoOverlays = (v) => {
      const u = new URL(location.href);
      if (v == null) u.searchParams.delete("autoOverlays");
      else u.searchParams.set("autoOverlays", v ? "1" : "0");
      location.href = u.toString();
    };
  } catch {}
  return value;
}

/** Registra utilidades de prueba en window (no afecta producción). */
export function setupDevTools(container, { SIZE, setBoard, setTurn, render, paintState }) {
  // Posición de prueba con cadena de capturas
  window.__forceTestCapturas = () => {
    try {
      const empty = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
      const b = empty;
      // r en [6,1] ; n en [5,2], [3,4], [1,6] ; caídas [4,3], [2,5], [0,7]
      b[6][1] = "r";
      b[5][2] = "n";
      b[3][4] = "n";
      b[1][6] = "n";
      setBoard(b);
      setTurn(COLOR.ROJO);
      render(); paintState();
      console.debug("[dev] __forceTestCapturas aplicada");
    } catch (e) {
      console.error("[dev] error creando posición de prueba:", e);
    }
  };
}
