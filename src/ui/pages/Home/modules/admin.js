export default function ({ container } = {}){
  console.log('[Home] Admin — módulo cargado');
  if (container) container.innerHTML = `<section class="home"><h2>Admin</h2><p>Pantalla en construcción…</p></section>`;
}
