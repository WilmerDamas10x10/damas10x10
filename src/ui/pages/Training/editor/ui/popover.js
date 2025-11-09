// Menú contextual simple (popover)
export function openPopoverMenu(items, anchorEl) {
  document.getElementById("ctx-popover")?.remove();

  const pop = document.createElement("div");
  pop.id = "ctx-popover";
  Object.assign(pop.style, {
    position: "fixed",
    zIndex: 10000,
    background: "#fff",
    border: "1px solid #e6e6e6",
    borderRadius: "10px",
    boxShadow: "0 10px 24px rgba(0,0,0,.18)",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "220px",
  });

  const r = anchorEl?.getBoundingClientRect?.();
  const x = r ? Math.min(r.left, window.innerWidth - 240) : (window.innerWidth - 240) / 2;
  const y = r ? Math.min(r.bottom + 8, window.innerHeight - 180) : (window.innerHeight - 120) / 2;
  pop.style.left = Math.max(8, x) + "px";
  pop.style.top  = Math.max(8, y) + "px";

  for (const it of items) {
    const btn = document.createElement("button");
    btn.textContent = it.label;
    Object.assign(btn.style, {
      textAlign: "left",
      padding: "8px 10px",
      borderRadius: "8px",
      border: "1px solid #eee",
      background: "#fafafa",
      cursor: "pointer",
    });
    btn.addEventListener("mouseenter", () => (btn.style.background = "#f2f2f2"));
    btn.addEventListener("mouseleave", () => (btn.style.background = "#fafafa"));
    btn.addEventListener("click", (e) => {
      try { it.action?.(e); } finally { pop.remove(); }
    });
    pop.appendChild(btn);
  }

  document.body.appendChild(pop);
  setTimeout(() =>
    document.addEventListener(
      "mousedown",
      (ev) => { if (!pop.contains(ev.target)) pop.remove(); },
      { once: true },
    ),
  0);
}
