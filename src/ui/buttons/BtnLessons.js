export default function BtnLessons({ onClick, disabled=false, label="Lecciones" } = {
  onClick: null, disabled: false, label: "Lecciones"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
