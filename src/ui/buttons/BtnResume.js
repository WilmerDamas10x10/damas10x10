export default function BtnResume({ onClick, disabled=false, label="Continuar Partida" } = {
  onClick: null, disabled: false, label: "Continuar Partida"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
