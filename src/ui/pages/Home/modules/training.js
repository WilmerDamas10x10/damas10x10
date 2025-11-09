// src/ui/pages/Home/modules/training.js
// Puente que abre el Editor/Entrenamiento en #app

console.log("[Home] Entrenamiento — módulo cargado (abriendo Editor)");

export default async function openTraining() {
  try {
    const host = document.getElementById("app") || document.body;
    if (host.dataset.view === "training-editor") return;

    const { default: TrainingEditor } = await import("../../Training/editor/Editor.js");

    host.dataset.view = "training-editor";
    host.innerHTML = "";
    TrainingEditor(host);

    // Botón "Descargar .fen"
    try {
      const { installFenDownloadButton } = await import("../../Training/editor/ui/patches/fenDownload.js");
      installFenDownloadButton(document);
    } catch (e) {
      console.warn("[training] Patch fenDownload no disponible:", e);
    }

    // ⬇⬇ HUD A/V (Mic, Cam, Audio, Apariencia & Tema por variante)
    try {
      await import("../../Training/editor/ui/patches/hudAV.js");
      if (typeof window.installBoardHUD === "function") window.installBoardHUD();
    } catch (e) {
      console.warn("[training] HUD A/V no disponible:", e);
    }
  } catch (err) {
    console.error("[training] No se pudo abrir el Editor:", err);
    location.hash = "#/training/editor";
  }
}
