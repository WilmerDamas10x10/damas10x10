// src/engine/policies/tiebreak.js
// Desempate entre piezas (candidatos = [ [key, {allowed,cnt,ptsRank,firstRank,isQueen}], ... ])
export function tiebreakPieces(candidates, POLICY) {
  if (!Array.isArray(candidates) || candidates.length <= 1) return candidates;

  const hasQueenType = candidates.some(([_, v]) => v.isQueen);
  const hasPawnType  = candidates.some(([_, v]) => !v.isQueen);
  let chosen = candidates;

  // Mixto peón–dama → usar firstPts; si persiste, preferir Dama
  if (POLICY.USE_FIRSTPTS_FOR_MIXED_TYPES && hasQueenType && hasPawnType) {
    let maxFirst = -Infinity;
    for (const [_, v] of chosen) if (v.firstRank > maxFirst) maxFirst = v.firstRank;
    chosen = chosen.filter(([_, v]) => v.firstRank === maxFirst);

    const stillHasQ = chosen.some(([_, v]) => v.isQueen);
    const stillHasP = chosen.some(([_, v]) => !v.isQueen);
    if (POLICY.PREFER_QUEEN_ON_MIXED_PURE_TIE && stillHasQ && stillHasP) {
      chosen = chosen.filter(([_, v]) => v.isQueen);
    }
    return chosen;
  }

  // Solo peones
  if (!hasQueenType && hasPawnType) {
    // Opción A: usar firstPts siempre (si la política lo dice)
    if (POLICY.USE_FIRSTPTS_FOR_PAWN_VS_PAWN) {
      let maxFirst = -Infinity;
      for (const [_, v] of chosen) if (v.firstRank > maxFirst) maxFirst = v.firstRank;
      chosen = chosen.filter(([_, v]) => v.firstRank === maxFirst);
      return chosen;
    }
    // Opción B: solo cuando difieren (1.5 vs 1.0)
    if (POLICY.AUTO_PAWN_FIRSTPTS_WHEN_DIFFER) {
      let maxFirst = -Infinity, minFirst = +Infinity;
      for (const [_, v] of chosen) {
        if (v.firstRank > maxFirst) maxFirst = v.firstRank;
        if (v.firstRank < minFirst) minFirst = v.firstRank;
      }
      if (maxFirst !== minFirst) {
        chosen = chosen.filter(([_, v]) => v.firstRank === maxFirst);
      }
      return chosen;
    }
  }

  // Si nada aplicó, mantener todos (libertad para el jugador)
  return chosen;
}
