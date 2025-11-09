export default function BtnSettingsBoardPieces({ onClick, disabled=false, label="Tablero & Piezas" } = {
  onClick: null, disabled: false, label: "Tablero & Piezas"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
