// src/ui/pages/Training/editor/ui/dialogs/namePrompt.js

/**
 * Abre un mini diálogo para pedir el nombre de la posición.
 * Uso callback:
 *   openNameDialog((name) => { ... });
 *
 * También tienes la versión con promesa:
 *   const name = await promptPositionName();
 */

export function openNameDialog(onConfirm) {
  // Evitar duplicados
  let dlg = document.getElementById("pos-name-dialog");
  if (dlg) { try { dlg.remove(); } catch {} }

  dlg = document.createElement("div");
  dlg.id = "pos-name-dialog";
  Object.assign(dlg.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999"
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "#fff",
    padding: "14px",
    borderRadius: "10px",
    minWidth: "280px",
    maxWidth: "95vw",
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  });

  const title = document.createElement("div");
  title.textContent = "Nombre para la posición";
  title.style.fontWeight = "600";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Ej: partida_liga_ronda3";
  Object.assign(input.style, {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px"
  });

  const row = document.createElement("div");
  Object.assign(row.style, { display: "flex", gap: "8px", justifyContent: "flex-end" });

  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.textContent = "Cancelar";

  const btnOk = document.createElement("button");
  btnOk.type = "button";
  btnOk.textContent = "Guardar";

  row.appendChild(btnCancel);
  row.appendChild(btnOk);

  panel.appendChild(title);
  panel.appendChild(input);
  panel.appendChild(row);
  dlg.appendChild(panel);
  document.body.appendChild(dlg);

  setTimeout(() => input.focus(), 0);

  // Helpers
  const close = () => { try { dlg.remove(); } catch {} };
  const doConfirm = () => {
    const name = input.value.trim();
    close();
    try { onConfirm?.(name); } catch {}
  };

  // Eventos
  btnCancel.addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  input.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  btnOk.addEventListener("click", doConfirm);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doConfirm(); });
}

/**
 * Versión Promise del diálogo.
 * Devuelve el nombre (string) o "" si confirmaron vacío, o null si cancelaron.
 */
export function promptPositionName() {
  return new Promise((resolve) => {
    openNameDialog((name) => resolve(name ?? null));
    // Nota: si el usuario hace "Cancelar" o cierra fuera, openNameDialog
    // llamará a close() sin resolver. Para cubrir ese caso:
    const dlg = document.getElementById("pos-name-dialog");
    const observer = new MutationObserver(() => {
      if (!document.getElementById("pos-name-dialog")) {
        try { observer.disconnect(); } catch {}
        // Si no se resolvió ya (por confirm), devolvemos null.
        resolve(null);
      }
    });
    if (dlg) observer.observe(document.body, { childList: true, subtree: true });
  });
}
