// src/ui/pages/Training/editor/dev/replayHook.js
import { startReplay, toJSONString, pushUndo } from "../services/replay.js";

export function installReplayDevHook() {
  try {
    startReplay();

    const toolbar =
      document.querySelector("#toolbar") ||
      document.querySelector("[data-toolbar]") ||
      document.body;

    if (!toolbar) return;
    if (toolbar.querySelector("#btn-replay-dev")) return;

    const btn = document.createElement("button");
    btn.id = "btn-replay-dev";
    btn.type = "button";
    btn.textContent = "Export Replay (dev)";
    btn.style.marginLeft = "8px";
    btn.addEventListener("click", () => {
      try {
        const json = toJSONString();
        console.log("[replay] JSON:", JSON.parse(json));
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "replay.json";
        a.click();
        URL.revokeObjectURL(url);
        alert("Replay exportado (se descargó replay.json y está en la consola).");
      } catch (e) {
        console.error(e);
        alert("No se pudo exportar el replay.");
      }
    });

    toolbar.appendChild(btn);

    const btn2 = document.createElement("button");
    btn2.id = "btn-replay-undo-dev";
    btn2.type = "button";
    btn2.textContent = "Mark Undo (dev)";
    btn2.style.marginLeft = "8px";
    btn2.addEventListener("click", () => {
      try {
        pushUndo();
        alert("Se registró un evento de undo (dev).");
      } catch (e) {
        console.error(e);
        alert("No se pudo registrar undo.");
      }
    });
    toolbar.appendChild(btn2);
  } catch (e) {
    console.warn("[replay] no inició:", e);
  }
}
