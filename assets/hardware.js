(function(scope){'use strict';
 function create(scope){
  const roots=new WeakSet(),events=new WeakSet(),presses=new Map(),cancelled=new WeakMap();
  const doc=scope.document;
  const material='.brass,.plaque,.mode-button,.engraved,.brass-plate';
  function signal(event){
   if(!['selection','success'].includes(event)||doc?.visibilityState==='hidden'||!scope.KissatenNative?.available)return Promise.resolve(false);
   // Feedback must never turn a successful save into a failed operation.
   try{return Promise.resolve(scope.KissatenNative.call('haptic',{event})).then(r=>!!r?.played,()=>false);}catch{return Promise.resolve(false);}
  }
  function decorate(button){
   if(!button?.matches?.('button,[role="button"]')||button.matches('.listening-shade,[data-hardware="none"]'))return;
   if(!button.classList.contains('hardware-control'))button.classList.add('hardware-control');
   if(button.matches(material)){
    if(!button.classList.contains('hardware-brass'))button.classList.add('hardware-brass');
    if(![...button.children].some(child=>child.classList.contains('hardware-surface'))){
     const face=doc.createElement('span');face.className='hardware-surface';face.setAttribute('aria-hidden','true');button.append(face);
    }
   }
   if(/^[×✕✖]$/.test(button.textContent.trim())||button.classList.contains('hardware-close')){
    if(!button.classList.contains('hardware-close'))button.classList.add('hardware-close');
    if(!button.getAttribute('aria-label'))button.setAttribute('aria-label','Close');
    if(!button.querySelector('.hardware-close-mark')){
     const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('class','hardware-close-mark');
     const path=doc.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m6 6 12 12M18 6 6 18');svg.append(path);button.replaceChildren(svg);
    }
   }
  }
  function find(event){return (event.composedPath?.()||[event.target]).find(el=>el?.matches?.('button,[role="button"]'));}
  function disabled(button){return !button||button.disabled||button.getAttribute('aria-disabled')==='true'||button.getAttribute('aria-busy')==='true'||button.closest?.('[inert]');}
  function once(event){if(events.has(event))return false;events.add(event);return true;}
  function end(event){if(!once(event))return;const press=presses.get(event.pointerId);if(!press)return;press.button.classList.remove('hardware-down');if(event.type==='pointercancel')cancelled.set(press.button,Date.now()+600);presses.delete(event.pointerId);}
  function clear(){for(const {button}of presses.values())button.classList.remove('hardware-down');presses.clear();}
  function attach(root){
   if(!root||roots.has(root))return;roots.add(root);
   if(root.host&&!root.querySelector('link[data-hardware]')){const style=doc.createElement('link');style.rel='stylesheet';style.href='hardware.css?v=1';style.dataset.hardware='true';root.append(style);}
   root.querySelectorAll('button,[role="button"]').forEach(decorate);
   root.addEventListener('pointerdown',event=>{
    if(!once(event)||event.button>0||event.isPrimary===false)return;
    const button=find(event);if(disabled(button))return;decorate(button);cancelled.delete(button);
    presses.set(event.pointerId,{button,x:event.clientX,y:event.clientY});button.classList.add('hardware-down');
   },true);
   root.addEventListener('pointermove',event=>{
    if(!once(event))return;const press=presses.get(event.pointerId);if(!press)return;
    if(Math.hypot(event.clientX-press.x,event.clientY-press.y)>10){press.button.classList.remove('hardware-down');cancelled.set(press.button,Date.now()+600);}
   },true);
   root.addEventListener('pointerup',end,true);root.addEventListener('pointercancel',end,true);
   root.addEventListener('click',event=>{
    if(!once(event))return;const button=find(event);
    if(button&&event.detail!==0&&cancelled.get(button)>Date.now()){event.preventDefault();event.stopImmediatePropagation();cancelled.delete(button);}
    else if(button&&disabled(button)){event.preventDefault();event.stopImmediatePropagation();}
   },true);
   root.addEventListener('keydown',event=>{if(!once(event)||event.repeat||![' ','Enter'].includes(event.key))return;const button=find(event);if(!disabled(button))button.classList.add('hardware-down');},true);
   root.addEventListener('keyup',event=>{if(once(event))find(event)?.classList.remove('hardware-down');},true);
   root.addEventListener('blur',event=>event.target?.classList?.remove('hardware-down'),true);
   if(scope.MutationObserver){const observer=new scope.MutationObserver(records=>{
    for(const record of records){const owner=record.target.closest?.('button,[role="button"]');if(owner)decorate(owner);
     for(const node of record.addedNodes){if(node.nodeType===3){decorate(node.parentElement?.closest('button,[role="button"]'));continue;}if(node.nodeType!==1)continue;decorate(node);node.querySelectorAll?.('button,[role="button"]').forEach(decorate);}
    }
   });observer.observe(root.nodeType===9?root.documentElement:root,{childList:true,subtree:true});}
  }
  scope.addEventListener?.('blur',clear);scope.addEventListener?.('pagehide',clear);
  doc?.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='hidden')clear();});
  return {attach,selection:()=>signal('selection'),success:()=>signal('success')};
 }
 if(typeof module==='object'&&module.exports)module.exports={create};
 else{scope.KissatenHardware=create(scope);if(scope.document.readyState==='loading')scope.document.addEventListener('DOMContentLoaded',()=>scope.KissatenHardware.attach(scope.document),{once:true});else scope.KissatenHardware.attach(scope.document);}
})(typeof window==='object'?window:globalThis);
