// src/ui/pages/Training/editor/ui/patches/goldenButton.js
// Inserta un botón "GOLDEN" en la toolbar del Editor para ejecutar los tests a demanda.

function findToolbarAnchor(root) {
  // 1) Intentar cerca de "Cambiar turno"
  const change = root.querySelector("#btn-cambiar-turno");
  if (change?.parentElement) return change.parentElement;

  // 2) Intentar cerca de "Compartir"
  const share = root.querySelector("#btn-share") ||
                Array.from(root.querySelectorAll("button"))
                  .find(b => /compartir/i.test(b.textContent || ""));
  if (share?.parentElement) return share.parentElement;

  // 3) Toolbar contenedora
  const tb = root.querySelector("#editor-toolbar") ||
             root.querySelector(".editor-toolbar");
  if (tb) return tb;

  // 4) Fallback
  return root.body || root;
}

function makeGoldenBtn() {
  const b = document.createElement("button");
  b.id = "btn-golden";
  b.type = "button";
  b.textContent = "GOLDEN";
  b.title = "Ejecutar pruebas doradas";
  Object.assign(b.style, {
    marginLeft: "8px",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #eee",
    background: "#fff8e1",
    cursor: "pointer",
    fontWeight: 700,
    letterSpacing: "0.4px"
  });
  b.addEventListener("mouseenter", () => b.style.background = "#ffefc6");
  b.addEventListener("mouseleave", () => b.style.background = "#fff8e1");
  return b;
}

async function runGoldensSafe() {
  try {
    // Si ya está expuesto por el runner:
    if (typeof window.runGoldenTests === "function") {
      await window.runGoldenTests();
      return;
    }
    // Carga perezosa del runner si no está en window:
    const mod = await import("../../dev/golden.js");
    if (typeof mod.runGoldenTests === "function") {
      await mod.runGoldenTests();
      return;
    }
    alert("Runner GOLDEN no disponible.");
  } catch (e) {
    console.error("[GOLDEN] error al ejecutar:", e);
    alert("No se pudieron ejecutar las pruebas.");
  }
}

export function installGoldenButton(root = document) {
  // Evitar duplicados
  if (root.querySelector("#btn-golden")) return;

  const anchor = findToolbarAnchor(root);
  const btn = makeGoldenBtn();
  btn.addEventListener("click", () => runGoldensSafe());

  // Insertar al final del contenedor de botones
  if (anchor && anchor.appendChild) {
    anchor.appendChild(btn);
  } else {
    (root.body || root).appendChild(btn);
  }
}

// Auto-montaje al cargar el Editor
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => installGoldenButton());
} else {
  installGoldenButton();
}
