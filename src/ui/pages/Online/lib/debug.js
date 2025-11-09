// ================================
// src/ui/pages/Online/lib/debug.js
// Helpers de depuración (texto <-> tablero ASCII)
// Requiere SIZE y cellChar en el scope de quien lo use.
// Por eso recibimos SIZE y cellChar por parámetro.
// ================================

/**
 * Convierte un board 10x10 a ASCII (r,n,R,N y "." para vacío)
 * @param {string[][]} b
 * @param {function(any):string} cellChar
 */
export function boardToAscii(b, cellChar) {
  return b.map(row => row.map(x => cellChar(x)).join("")).join("\n");
}

/**
 * Parsea texto (10 líneas × 10 chars) o JSON 10×10 a board
 * Devuelve una matriz 10x10 con "", "r","n","R","N".
 * @param {string} text
 * @param {number} SIZE
 */
export function parseTextBoard(text, SIZE){
  const t = (text || "").trim();
  if (!t) throw new Error("Texto vacío");

  // JSON 10x10
  if (t.startsWith("[") || t.startsWith("{")){
    const data = JSON.parse(t);
    if (!Array.isArray(data) || data.length !== SIZE) throw new Error("JSON debe ser 10 filas");
    const out = Array.from({length: SIZE}, (_, r) =>
      Array.from({length: SIZE}, (_, c) => {
        const v = (data[r][c] ?? "").toString();
        const ch = (v === "." || v === "-" || v === "0") ? "" : v;
        return ch;
      })
    );
    return out;
  }

  // 10 líneas × 10 chars
  const lines = t.split(/\r?\n/).map(s => s.trim());
  if (lines.length !== SIZE) throw new Error("Debes ingresar exactamente 10 líneas");
  const grid = lines.map(line => {
    if (line.length !== SIZE) throw new Error("Cada línea debe tener 10 caracteres");
    return line.split("").map(ch => (ch === "." || ch === "-" || ch === "0") ? "" : ch);
  });
  return grid;
}
