// src/ui/pages/Training/editor/ui/patches/fenDownload.js
// Inyecta un botón "Descargar FEN" junto a "Copiar FEN" en el Editor.
// No asume framework; busca el botón de copiar y agrega el de descarga al lado.

function makeButton(label) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn fen-download";
  b.textContent = label;
  Object.assign(b.style, {
    marginLeft: "8px"
  });
  return b;
}

function triggerDownload(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

// Intenta obtener FEN desde el servicio del editor si existe.
// Fallback: lee de un <textarea data-fen> o de un input con [name="fen"] si está presente.
function getFenSafe() {
  try {
    if (window.editorServices?.fen?.exportFen) {
      const fen = window.editorServices.fen.exportFen();
      if (fen) return fen;
    }
  } catch {}
  try {
    const ta = document.querySelector('[data-fen], textarea[name="fen"], input[name="fen"]');
    if (ta && ta.value) return ta.value;
  } catch {}
  return "";
}

// Inserta el botón junto a “Copiar FEN”
export function installFenDownloadButton(root=document) {
  // Heurísticas para encontrar el botón "Copiar FEN"
  const byAttr = root.querySelector('[data-action="copy-fen"]');
  const byText = Array.from(root.querySelectorAll("button, .btn"))
    .find(el => /copiar\s+fen/i.test(el.textContent || ""));
  const anchor = byAttr || byText;

  if (!anchor || anchor.dataset.hasFenDownload) return;

  const btn = makeButton("Descargar .fen");
  btn.addEventListener("click", () => {
    const fen = getFenSafe();
    if (!fen) {
      // UX suave: pequeño shake si no hay FEN disponible
      btn.style.transform = "translateX(2px)";
      setTimeout(() => (btn.style.transform = ""), 120);
      return;
    }
    const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
    triggerDownload(`position-${stamp}.fen`, fen);
  });

  anchor.insertAdjacentElement("afterend", btn);
  anchor.dataset.hasFenDownload = "1";
}

// Auto-instalar cuando cargue el editor
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => installFenDownloadButton());
} else {
  installFenDownloadButton();
}
