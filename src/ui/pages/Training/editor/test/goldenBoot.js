// --- goldenBoot.js (autorun con gating) ---
import { runGoldenOnReady } from "../dev/golden.js";

// Ejecutar SOLO si hay ?golden=1 o localStorage["golden"] === "1"
function shouldRunGolden() {
  try {
    const qs = new URLSearchParams(location.search);
    if (qs.get("golden") === "1") return true;
  } catch {}
  try {
    if (localStorage.getItem("golden") === "1") return true;
  } catch {}
  return false;
}

if (shouldRunGolden()) {
  runGoldenOnReady(); // corre al cargar
} else {
  // No auto-corremos. Si quieres correrlo manual, abre:
  // http://localhost:5173/?golden=1
}
