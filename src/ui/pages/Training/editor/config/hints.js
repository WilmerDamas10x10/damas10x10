// src/ui/pages/Training/editor/config/hints.js

/**
 * Construye los "hints" que usan controller e interacciones.
 * En modo OV2-only, devolvemos no-ops para markRouteLabel/markStep
 * (así evitamos textos tipo [object Object] y no pintamos V1).
 */
export function buildHints({
  useOV2,
  clearHints,
  clearVerification,
  markRouteLabel,
  markStep,
  showFirstStepOptions,
  hintMove,
}) {
  const NOOP = () => {};

  const controller = useOV2
    ? {
        clearHints,
        clearVerification,
        showFirstStepOptions,
        markRouteLabel: NOOP,
        markStep: NOOP,
      }
    : {
        clearHints,
        clearVerification,
        showFirstStepOptions,
        markRouteLabel,
        markStep,
      };

  const interactions = useOV2
    ? {
        clearHints,
        hintMove,
        showFirstStepOptions,
        markRouteLabel: NOOP,
        markStep: NOOP,
      }
    : {
        clearHints,
        hintMove,
        showFirstStepOptions,
        markRouteLabel,
        markStep,
      };

  return { controller, interactions };
}
