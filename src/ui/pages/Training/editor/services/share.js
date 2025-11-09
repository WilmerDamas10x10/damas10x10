// src/ui/pages/Training/editor/services/share.js
import { ensureWANForMode, getSocket } from "@wan";

/** Comparte la posición actual por WAN (modo entrenamiento). */
export async function sharePosition(container, { turn, board }) {
  try {
    const qs = new URLSearchParams(location.search);
    const server = qs.get("server") || undefined;
    const room   = qs.get("room")   || (window.SALA || "eco1");

    await ensureWANForMode("entrenamiento", { trainingShare: true, url: server });
    const s = getSocket?.();
    s?.emit("position_share", { room, variant: "10x10", turn, board, from: "training" });

    const btnShare = container.querySelector("#share");
    if (btnShare) { btnShare.textContent = "¡Compartido!"; btnShare.disabled = true; }
  } catch (err) {
    // Silencioso en producción; útil en debug
    console.warn("[WAN share error]", err);
  }
}
