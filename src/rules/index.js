// src/rules/index.js
export * from "./constants.js";
export * from "./utils.js";
export * from "./movegen.js";
export * from "./apply.js";
export * from "./policies.js";
export * from "./verify.js";

// Re-exporta el barril de piezas (NO importes pawn.js/queen.js aquí)
export * from "./pieces/index.js";
// reexporta utilidades para poder importarlas desde "@rules"
export { GHOST, isGhost } from "./utils.js";
export * from "../engine/chain.js";
