// Botones básicos (UI)
export function makeBtn(id, text) {
  const b = document.createElement("button");
  b.id = id;
  b.type = "button";
  b.textContent = text;
  return b;
}
