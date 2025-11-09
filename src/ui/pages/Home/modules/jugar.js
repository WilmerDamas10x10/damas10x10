export default function ({ container } = {}){
  console.log('[Home] Jugar — módulo cargado');
  // Ejemplo: navegar o montar UI
  // import('./../../router.js').then(({ navigate }) => navigate('/play'));
  if (container) container.innerHTML = `<section class="home"><h2>Jugar</h2><p>Pantalla en construcción…</p></section>`;
}
