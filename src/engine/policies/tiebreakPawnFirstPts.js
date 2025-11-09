// Tiebreak específico: SOLO peón vs peón.
// candidates: [ [key, { isQueen, firstRank, allowed, ... }], ... ]
export function tiebreakPawnVsPawnByFirstPts(candidates) {
  if (!Array.isArray(candidates) || candidates.length <= 1) return candidates;

  // Si hay alguna dama en los candidatos (tipo de pieza), no aplicamos este tiebreak
  const hasQueen = candidates.some(([_, v]) => v?.isQueen === true);
  if (hasQueen) return candidates;

  // Entre peones: quedarnos con los de mayor firstRank (1.5→3 > 1.0→2)
  let maxFirst = -1;
  for (const [_, v] of candidates) {
    const fr = Number.isFinite(v?.firstRank) ? v.firstRank : -1;
    if (fr > maxFirst) maxFirst = fr;
  }
  return candidates.filter(([_, v]) => (Number.isFinite(v?.firstRank) ? v.firstRank : -1) === maxFirst);
}
