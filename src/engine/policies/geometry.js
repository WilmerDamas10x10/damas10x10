// utilidades geométricas (sin reglas)
export const k = (r,c)=>`${r},${c}`;
export const sameDiag = (a,b) => Math.abs(a[0]-b[0]) === Math.abs(a[1]-b[1]);
export const dir = (a,b) => [Math.sign(b[0]-a[0]), Math.sign(b[1]-a[1])];

// Itera casillas estrictamente entre a y b (excluye extremos)
export function forEachBetween(a, b, cb) {
  const [dr, dc] = dir(a,b);
  let r = a[0] + dr, c = a[1] + dc;
  while (r !== b[0] || c !== b[1]) {
    if (cb(r,c) === false) break;
    r += dr; c += dc;
  }
}
