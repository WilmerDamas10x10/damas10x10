export default function BtnPuzzlesDaily({ onClick, disabled=false, label="Puzzles Diarios" } = {
  onClick: null, disabled: false, label: "Puzzles Diarios"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
