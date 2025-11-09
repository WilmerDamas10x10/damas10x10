// ============================================
// src/ui/patches/editor.left.injections.js
// Ajustes visuales mínimos y seguros para la
// columna izquierda del Editor.
// export { installEditorLeftInjections }
// ============================================

export function installEditorLeftInjections(container) {
  try {
    if (!container) return;
    // Asegura que la columna izquierda tenga un contenedor lógico
    // sin romper la estructura existente.
    const leftCandidate =
      container.querySelector('[data-area="left"]') ||
      container.querySelector('.toolbar-vertical') ||
      container.querySelector('.col');

    if (leftCandidate) {
      leftCandidate.setAttribute('data-area', 'left');
    }
  } catch (e) {
    console.warn('[editor.left.injections] No se pudo inyectar:', e);
  }
}
