// src/ui/pages/Training/editor/interactions/allowed.js
// Poda de overlay a lo permitido (helper de UI puro)

export function pruneStepsToAllowed(boardEl, allowed) {
  if (!boardEl || !(allowed instanceof Set)) return;
  boardEl.querySelectorAll("[data-step]").forEach((tile) => {
    try {
      const st = JSON.parse(tile.dataset.step || "{}");
      const key = `${st.to?.[0]},${st.to?.[1]}`;
      if (!allowed.has(key)) {
        delete tile.dataset.step;
        tile.classList.remove("hint-step");
        const badge = tile.querySelector(".hop-index");
        if (badge) badge.remove();
      }
    } catch {}
  });
}
