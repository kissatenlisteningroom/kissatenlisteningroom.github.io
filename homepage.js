'use strict';
document.body.classList.add('js');
const tour=document.querySelector('.walkthrough');
const choices=[...document.querySelectorAll('[data-view]')];
const panels=[...document.querySelectorAll('[data-panel]')];
function choose(view){
  choices.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
  panels.forEach(panel=>{
    panel.toggleAttribute('hidden', panel.dataset.panel!==view);
  });
}
if(tour&&choices.length&&panels.length){tour.classList.add('enhanced');choose('records');choices.forEach((button,index)=>{button.addEventListener('click',()=>choose(button.dataset.view));button.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?choices.length-1:(index+(event.key==='ArrowRight'?1:-1)+choices.length)%choices.length;choices[next].focus();choose(choices[next].dataset.view);});});}
