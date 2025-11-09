export default function BtnSettingsAudio({ onClick, disabled=false, label="Audio & Sonidos" } = {
  onClick: null, disabled: false, label: "Audio & Sonidos"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
