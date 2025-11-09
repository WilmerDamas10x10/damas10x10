export default function BtnPlayAI({ onClick, disabled=false, label="Jugar vs IA" } = {
  onClick: null, disabled: false, label: "Jugar vs IA"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
