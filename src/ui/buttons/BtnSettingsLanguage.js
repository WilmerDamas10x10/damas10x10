export default function BtnSettingsLanguage({ onClick, disabled=false, label="Idioma" } = {
  onClick: null, disabled: false, label: "Idioma"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
