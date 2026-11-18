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


for (const radioPanel of document.querySelectorAll('[data-panel]')) {
const radioReel = radioPanel?.querySelector('video[data-reel]');
const radioToggle = radioPanel?.querySelector('.radio-reel-toggle');

if (radioReel && radioToggle) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let wantsMotion = !reducedMotion.matches;
  let request = 0;

  function syncRadio() {
    const pending = ++request;
    if (radioPanel.hidden || document.hidden || !wantsMotion) {
      radioReel.pause();
      return;
    }

    if (!radioReel.hasAttribute('src')) radioReel.src = radioReel.dataset.reel;
    else if (radioReel.error) radioReel.load();

    radioReel.play().catch(() => {
      if (pending !== request) return;
      wantsMotion = false;
      radioReel.classList.remove('has-frame');
      radioToggle.textContent = 'Play montage';
    });
  }

  radioReel.addEventListener('playing', () => { radioToggle.textContent = 'Pause montage'; });
  radioReel.addEventListener('pause', () => { radioToggle.textContent = 'Play montage'; });
  radioReel.addEventListener('timeupdate', () => {
    if (radioReel.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) radioReel.classList.add('has-frame');
  });
  radioReel.addEventListener('error', () => {
    wantsMotion = false;
    radioReel.classList.remove('has-frame');
    radioToggle.textContent = 'Play montage';
  });
  radioToggle.addEventListener('click', () => {
    wantsMotion = radioReel.paused;
    syncRadio();
  });
  reducedMotion.addEventListener('change', event => {
    wantsMotion = !event.matches;
    if (event.matches) radioReel.classList.remove('has-frame');
    syncRadio();
  });
  new MutationObserver(syncRadio).observe(radioPanel, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', syncRadio);
  radioToggle.hidden = false;
  syncRadio();
}

}
