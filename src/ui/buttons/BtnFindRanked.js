export default function BtnFindRanked({ onClick, disabled=false, label="Buscar Partida (ELO)" } = {
  onClick: null, disabled: false, label: "Buscar Partida (ELO)"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
