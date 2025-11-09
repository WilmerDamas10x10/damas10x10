export default function BtnRankedQueue({ onClick, disabled=false, label="Partida Calificada (ELO)" } = {
  onClick: null, disabled: false, label: "Partida Calificada (ELO)"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
