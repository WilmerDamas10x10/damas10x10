// ================================
// src/ui/patches/layout.moves.js
// Dock “Goldens / Export Replay (dev) / Mark Undo (dev)” debajo de
// “Pruebas (dev)” en la columna izquierda, de forma resiliente.
// ================================

const TEXT = {
  goldens: ["goldens", "golden"],
  exportReplay: ["export replay"],
  markUndo: ["mark undo"],
  pruebas: ["pruebas (dev)", "pruebas"],
  guardar: ["guardar posición", "guardar posicion"],
};

const ID_WRAP = "dev-actions-docked";
const CLASS_MIRROR = "btn";
const ENFORCE_MS = 600;        // cada 0.6s re-asegura el layout
const ENFORCE_MAX_LOOPS = 40;  // ~24s de “autocuración” tras cada cambio grande

const NORM = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
const $all = (r, sel) => Array.from((r || document).querySelectorAll(sel));

function findByText(root, needles) {
  const list = (Array.isArray(needles) ? needles : [needles]).map(NORM);
  return $all(root || document, "button, .btn, a, [role='button'], input[type='button'], input[type='submit']")
    .find((el) => {
      const t = NORM(el.textContent || el.value || "");
      return list.some((n) => t.includes(n));
    }) || null;
}

function hideStrong(el) {
  if (!el) return;
  el.style.setProperty("display", "none", "important");
  el.setAttribute("data-patched-hidden", "1");
}

function makeBtn(label, id) {
  const b = document.createElement("button");
  b.type = "button";
  b.id = id;
  b.className = CLASS_MIRROR;
  b.style.width = "100%";
  b.style.marginTop = "6px";
  b.textContent = label;
  return b;
}

function findLeftAnchor(root) {
  // 1) justo debajo de “Pruebas (dev)”
  const pruebas = findByText(root, TEXT.pruebas);
  if (pruebas) return pruebas;

  // 2) debajo de “Guardar posición”
  const guardar = findByText(root, TEXT.guardar);
  if (guardar) return guardar;

  // 3) última esperanza: cualquier columna que contenga esos botones
  const leftCol =
    root.querySelector(".area-left") ||
    root.querySelector('[data-area="left"]') ||
    root.querySelector("#left") ||
    (guardar && (guardar.closest("aside,section,div") || guardar.parentElement)) ||
    null;

  if (!leftCol) return null;
  const lastBtn = $all(leftCol, "button, .btn, [role='button']").pop();
  return lastBtn || leftCol;
}

function ensureDock(root, refs) {
  const anchor = findLeftAnchor(root);
  if (!anchor) return false;

  // crea/recupera el contenedor
  let wrap = document.getElementById(ID_WRAP);
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = ID_WRAP;
    wrap.style.marginTop = "8px";
    if (anchor.insertAdjacentElement) {
      anchor.insertAdjacentElement("afterend", wrap);
    } else {
      (anchor.parentElement || root.body || root).appendChild(wrap);
    }
  }

  // si el contenedor fue movido/barrido, re-colócalo
  if (wrap.previousElementSibling !== anchor) {
    try { wrap.remove(); } catch {}
    if (anchor.insertAdjacentElement) anchor.insertAdjacentElement("afterend", wrap);
    else (anchor.parentElement || root.body || root).appendChild(wrap);
  }

  // (re)crear botones espejos idempotentemente
  const need = [
    { id: "btn-goldens-left", label: "Goldens", click: () => refs.g?.click?.() || window.runGoldens?.() },
    { id: "btn-export-replay-left", label: "Export Replay (dev)", click: () => refs.e?.click?.() || window.dispatchEvent(new CustomEvent("replay:export:click")) },
    { id: "btn-mark-undo-left", label: "Mark Undo (dev)", click: () => refs.m?.click?.() || window.dispatchEvent(new CustomEvent("undo:mark:click")) },
  ];

  for (const spec of need) {
    let b = document.getElementById(spec.id);
    if (!b) {
      b = makeBtn(spec.label, spec.id);
      wrap.appendChild(b);
      b.addEventListener("click", () => spec.click());
    }
  }

  return true;
}

function collectRefs(root) {
  const g = document.getElementById("btn-goldens-ui") ||
            findByText(root, TEXT.goldens);

  const e = root.querySelector('[data-dev="export-replay"]') ||
            findByText(root, TEXT.exportReplay);

  const m = root.querySelector('[data-dev="mark-undo"]') ||
            findByText(root, TEXT.markUndo);

  return { g, e, m };
}

function enforce(root) {
  const refs = collectRefs(root);

  // esconder originales (aunque reaparezcan)
  hideStrong(refs.g);
  hideStrong(refs.e);
  hideStrong(refs.m);

  // anclar espejos a la izquierda
  ensureDock(root, refs);
}

export function installLayoutMoves(root = document) {
  // 1) Enforcer periódico (autocurativo)
  let loops = 0;
  const tick = () => {
    enforce(root);
    if (loops++ < ENFORCE_MAX_LOOPS) timer = setTimeout(tick, ENFORCE_MS);
  };
  let timer = setTimeout(tick, 60);

  // 2) Observer: cualquier cambio grande vuelve a correr y reinicia ventana de curación
  const obs = new MutationObserver(() => {
    loops = 0; // reactiva la ventana de autocuración
    enforce(root);
  });
  obs.observe(root.body || root, { childList: true, subtree: true });

  // 3) Primer golpe inmediato
  enforce(root);
}
