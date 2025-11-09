export default function BtnSettingsCameraMic({ onClick, disabled=false, label="Cámara & Micro" } = {
  onClick: null, disabled: false, label: "Cámara & Micro"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
