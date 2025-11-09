// src/ui/pages/Training/editor/ui/dialogs/importCode.js
import { decodeShareCode } from "../../services/snapshot.js";

/**
 * Abre un diálogo para pegar el código Base64 y, si es válido,
 * llama a onImport(snap).
 */
export function openImportCodeDialog({ onImport } = {}) {
  let dlg = document.getElementById("pos-import-dialog");
  if (dlg) dlg.remove();

  dlg = document.createElement("div");
  dlg.id = "pos-import-dialog";
  Object.assign(dlg.style, {
    position: "fixed", inset: "0", background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: "9999"
  });

  const panel = document.createElement("div");
  Object.assign(panel.style, {
    background: "#fff", padding: "16px", borderRadius: "12px",
    width: "min(720px, 95vw)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    display: "flex", flexDirection: "column", gap: "10px"
  });

  const title = document.createElement("div");
  title.textContent = "Importar código de posición";
  title.style.fontWeight = "700";

  const ta = document.createElement("textarea");
  ta.placeholder = "Pega aquí el código Base64…";
  Object.assign(ta.style, {
    width: "100%", minHeight: "140px", padding: "8px",
    border: "1px solid #ddd", borderRadius: "8px", fontFamily: "monospace"
  });

  const row = document.createElement("div");
  Object.assign(row.style, { display: "flex", gap: "8px", justifyContent: "flex-end" });

  const btnCancel = document.createElement("button");
  btnCancel.textContent = "Cancelar";
  const btnOk = document.createElement("button");
  btnOk.textContent = "Importar";

  row.appendChild(btnCancel); row.appendChild(btnOk);
  panel.appendChild(title); panel.appendChild(ta); panel.appendChild(row);
  dlg.appendChild(panel); document.body.appendChild(dlg);
  setTimeout(() => ta.focus(), 0);

  const close = () => { try { dlg.remove(); } catch {} };
  btnCancel.addEventListener("click", close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });

  const doImport = () => {
    const code = (ta.value || "").trim();
    if (!code) return;
    try {
      const snap = decodeShareCode(code);
      if (!Array.isArray(snap?.board)) { console.warn("[pos] código inválido"); return; }
      try { onImport?.(snap); } catch (e) { console.error(e); }
      close();
    } catch (e) {
      console.error("[pos] error importando código:", e);
    }
  };

  btnOk.addEventListener("click", doImport);
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) doImport(); });
}
