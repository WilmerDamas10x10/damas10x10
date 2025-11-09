// src/ui/pages/Training/editor/interactions/ov2.js

export function setChainAttr(boardEl, on) {
  if (!boardEl) return;
  on ? boardEl.setAttribute("data-chain", "1") : boardEl.removeAttribute("data-chain");
}

export function clearOV2Now(boardEl) {
  const layer = boardEl?.querySelector?.(".ov2-layer");
  if (layer) layer.innerHTML = "";
}
