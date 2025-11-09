// Shim para importar las reglas del motor sin depender del alias @rules.
// Ajusta las rutas si tu árbol difiere.

export { COLOR, colorOf } from "../../../../../engine/rules/index.js";
export { movimientos }   from "../../../../../engine/rules/movimientos.js";

/*
Si tu repo usa otros nombres/rutas, prueba (una de estas):
// export { COLOR, colorOf } from "../../../../../engine/pieces.js";
// export { movimientos }   from "../../../../../engine/movimientos.js";
// export { COLOR, colorOf, movimientos } from "../../../../../engine/rules.js";
*/
