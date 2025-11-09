export default function BtnChatRoom({ onClick, disabled=false, label="Chat de Sala" } = {
  onClick: null, disabled: false, label: "Chat de Sala"
}){
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.disabled = !!disabled;
  btn.className = 'btn-primary';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}
