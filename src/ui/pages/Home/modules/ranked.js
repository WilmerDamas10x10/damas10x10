export default function ({ container } = {}){
  console.log('[Home] Clasificadas — módulo cargado');
  if (container) container.innerHTML = `<section class="home"><h2>Clasificadas (ELO)</h2><p>Pantalla en construcción…</p></section>`;
}
