export default function BtnTrainingEditor({ onClick, disabled=false, label="Entrenamiento / Editor" } = {
  onClick: null, disabled: false, label: "Entrenamiento / Editor"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
