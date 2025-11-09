export default function BtnTournamentArena({ onClick, disabled=false, label="Torneo Arena" } = {
  onClick: null, disabled: false, label: "Torneo Arena"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
