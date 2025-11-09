// src/ui/pages/Online/lib/editorToolbar.js
// Toolbar de edición reutilizable para el modo Online.
// No asume motor específico: recibe funciones por parámetros.
// API esperado (todos opcionales):
//   getPlacing(): string|null           -> herramienta activa actual ('r','R','n','N','erase'|null)
//   setPlacing(tool: string|null): void -> cambia herramienta activa
//   clearBoard(): void                  -> limpiar tablero (si existe)
//   exitEdit(): void                    -> salir de modo edición (si existe)

export function attachEditorToolbar(host, api = {}) {
  const {
    getPlacing = () => null,
    setPlacing = () => {},
    clearBoard = null,
    exitEdit = null,
  } = api || {};

  // ——— inyectar estilos una sola vez ———
  const STYLE_ID = "online-editor-toolbar-style";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .online-editor-toolbar {
        position: absolute;
        top: 8px; right: 8px;
        display: inline-flex; gap: 6px;
        padding: 6px; border-radius: 12px;
        background: rgba(20,20,24,0.85);
        box-shadow: 0 6px 24px rgba(0,0,0,0.3);
        backdrop-filter: blur(6px);
        z-index: 9999;
      }
      .online-editor-toolbar button {
        min-width: 34px; height: 34px;
        padding: 0 10px; border: 0; border-radius: 10px;
        font: 600 13px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto;
        cursor: pointer; opacity: 0.9;
      }
      .online-editor-toolbar button:hover { opacity: 1; }
      .online-editor-toolbar button[data-active="1"] {
        outline: 2px solid #72d6ff; outline-offset: 0;
      }
      .online-editor-toolbar .grp { display: inline-flex; gap: 6px; }
      .online-editor-toolbar .sep {
        width: 1px; background: rgba(255,255,255,0.12); margin: 0 2px;
      }
      .online-editor-toolbar .btn-erase { background:#2b2b31; color:#eee; }
      .online-editor-toolbar .btn-r { background:#c43; color:#fff; }
      .online-editor-toolbar .btn-R { background:#a22; color:#fff; }
      .online-editor-toolbar .btn-n { background:#333; color:#ddd; }
      .online-editor-toolbar .btn-N { background:#111; color:#ddd; }
      .online-editor-toolbar .btn-clear { background:#444; color:#fff; }
      .online-editor-toolbar .btn-done { background:#0a7; color:#012; }
      @media (max-width: 640px) {
        .online-editor-toolbar { top: 6px; right: 6px; transform: scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  // ——— host destino ———
  const parent =
    host ||
    document.getElementById("app") ||
    document.body;

  // contenedor
  const root = document.createElement("div");
  root.className = "online-editor-toolbar";

  // helpers
  let active = sanitizeTool(getPlacing());

  function sanitizeTool(t) {
    const ok = ["erase", "r", "R", "n", "N", null, undefined];
    return ok.includes(t) ? t : null;
  }

  function makeBtn(cls, label, title, onClick) {
    const b = document.createElement("button");
    b.className = cls;
    b.textContent = label;
    if (title) b.title = title;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick && onClick();
    });
    return b;
  }

  // herramientas principales
  const btnErase = makeBtn("btn-erase", "⨯", "Borrar pieza (herramienta: erase)", () => toggleTool("erase"));
  const btnR = makeBtn("btn-r", "r", "Peón Rojo", () => toggleTool("r"));
  const btnRR = makeBtn("btn-R", "R", "Dama Roja", () => toggleTool("R"));
  const btnN = makeBtn("btn-n", "n", "Peón Negro", () => toggleTool("n"));
  const btnNN = makeBtn("btn-N", "N", "Dama Negra", () => toggleTool("N"));

  // acciones (opcionales)
  const btnClear = clearBoard ? makeBtn("btn-clear", "🧹", "Limpiar tablero", () => clearBoard && clearBoard()) : null;
  const btnDone  = exitEdit  ? makeBtn("btn-done",  "✔︎", "Terminar edición", () => exitEdit && exitEdit()) : null;

  // layout
  const grpTools = document.createElement("div");
  grpTools.className = "grp";
  grpTools.append(btnErase, btnR, btnRR, btnN, btnNN);

  root.appendChild(grpTools);
  root.appendChild(divSep());

  if (btnClear) {
    const grpOps = document.createElement("div");
    grpOps.className = "grp";
    grpOps.append(btnClear);
    root.appendChild(grpOps);
  }

  if (btnDone) {
    root.appendChild(divSep());
    const grpEnd = document.createElement("div");
    grpEnd.className = "grp";
    grpEnd.append(btnDone);
    root.appendChild(grpEnd);
  }

  parent.appendChild(root);

  function divSep() {
    const d = document.createElement("div");
    d.className = "sep";
    return d;
  }

  function toggleTool(tool) {
    active = active === tool ? null : tool;
    setPlacing && setPlacing(active);
    refresh();
  }

  function refresh() {
    const current = sanitizeTool(getPlacing());
    const on = (btn, id) => btn && btn.setAttribute("data-active", current === id ? "1" : "0");
    on(btnErase, "erase");
    on(btnR, "r");
    on(btnRR, "R");
    on(btnN, "n");
    on(btnNN, "N");
  }

  // estado inicial
  refresh();

  // API pública de la toolbar
  return {
    root,
    refresh,
    getActive: () => sanitizeTool(getPlacing()),
    setActive: (tool) => { active = sanitizeTool(tool); setPlacing && setPlacing(active); refresh(); },
    destroy: () => { root.remove(); },
  };
}

export default attachEditorToolbar;
