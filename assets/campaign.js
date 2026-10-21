(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const enabled=()=>!reduced.matches&&!document.body.classList.contains('effects-off');
  const dock=document.querySelector('.conversion-dock');
  if(dock&&'IntersectionObserver' in window){
    const hero=document.querySelector('.hero');
    const end=document.querySelector('#play');
    const contact=document.querySelector('#contact');
    const state={hero:true,end:false,contact:false};
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){if(entry.target===hero)state.hero=entry.isIntersecting;if(entry.target===end)state.end=entry.isIntersecting;if(entry.target===contact)state.contact=entry.isIntersecting;}
      dock.dataset.visible=String(!state.hero&&!state.end&&!state.contact);
    },{threshold:0});
    [hero,end,contact].filter(Boolean).forEach(el=>observer.observe(el));
    const modal=document.querySelector('#lightbox');
    if(modal&&'MutationObserver' in window)new MutationObserver(()=>{dock.classList.toggle('dock-suppressed',modal.open);}).observe(modal,{attributes:true,attributeFilter:['open']});
  }
  // Small physical responses use the browser's animation engine; no permanent JS loop.
  if(matchMedia('(hover: hover) and (pointer: fine)').matches){
    for(const card of document.querySelectorAll('.gallery-frame,.feature-grid article,.memory-panel,.developer-panel')){
      let tick=0;
      card.addEventListener('pointermove',event=>{
        if(!enabled()||tick)return;
        const x=event.clientX,y=event.clientY;
        tick=requestAnimationFrame(()=>{tick=0;const rect=card.getBoundingClientRect();const dx=(x-rect.left)/rect.width;const dy=(y-rect.top)/rect.height;card.style.setProperty('--card-x',`${Math.round(dx*100)}%`);card.style.setProperty('--card-y',`${Math.round(dy*100)}%`);card.style.setProperty('--card-rotate-x',`${((.5-dy)*2.4).toFixed(2)}deg`);card.style.setProperty('--card-rotate-y',`${((dx-.5)*2.4).toFixed(2)}deg`);});
      },{passive:true});
      card.addEventListener('pointerleave',()=>{card.style.setProperty('--card-rotate-x','0deg');card.style.setProperty('--card-rotate-y','0deg');});
    }
    for(const button of document.querySelectorAll('.button'))button.addEventListener('pointerdown',()=>{
      if(!enabled()||typeof button.animate!=='function')return;
      button.animate([{scale:'1'},{scale:'.975'},{scale:'1'}],{duration:280,easing:'cubic-bezier(.2,.7,.2,1)'});
    });
  }
  window.addEventListener('writenor:effects',()=>{
    if(!enabled())for(const el of document.querySelectorAll('[style*="--card-rotate"]')){el.style.setProperty('--card-rotate-x','0deg');el.style.setProperty('--card-rotate-y','0deg');}
  });
})();
