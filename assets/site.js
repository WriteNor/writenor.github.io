(() => {
  'use strict';
  const $ = (s, parent = document) => parent.querySelector(s);
  const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
  const languages = window.WRITENOR_LANGUAGES;
  if (!languages?.en) return;
  const storage = {get(key) {try {return localStorage.getItem(key);} catch {return null;}},set(key,value) {try {localStorage.setItem(key,value);} catch { /* Settings still work without storage. */ }}};
  const aliases = {ua:'uk',jp:'ja',cn:'zh'};
  const normalize = value => {const code = String(value || '').toLowerCase().split(/[-_]/)[0];return aliases[code] || code;};
  const browserLanguage = () => (navigator.languages || [navigator.language]).map(normalize).find(code => languages[code]) || 'en';
  let selected = storage.get('writeNorLang') || 'auto';
  selected = selected === 'auto' ? selected : normalize(selected);
  if (selected !== 'auto' && !languages[selected]) selected = 'auto';
  let locale = selected === 'auto' ? browserLanguage() : selected;
  const t = key => languages[locale]?.[key] ?? languages.en[key] ?? key;
  const isNori = document.body.classList.contains('nori-page');
  let reality = 'present';
  const languageSelect = $('#language');
  const applyLanguage = () => {
    locale = selected === 'auto' ? browserLanguage() : selected;
    document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : locale;
    $$('[data-i18n]').forEach(el => {el.innerHTML = t(el.dataset.i18n);});
    [['data-i18n-aria','aria-label'],['data-i18n-alt','alt'],['data-i18n-placeholder','placeholder']].forEach(([source,target]) => {
      $$(`[${source}]`).forEach(el => el.setAttribute(target,t(el.getAttribute(source))));
    });
    if (languageSelect) {languageSelect.value=selected;languageSelect.options[0].textContent=`${t('auto')} · ${locale.toUpperCase()}`;}
    document.title = t(isNori ? 'nori_meta_title' : 'page_title');
    const description = $('meta[name="description"]');
    if (description) description.content = t(isNori ? 'nori_meta_description' : 'page_description');
    const ogTitle = $('meta[property="og:title"]');
    const ogDescription = $('meta[property="og:description"]');
    if (ogTitle) ogTitle.content=document.title;
    if (ogDescription) ogDescription.content=description?.content || '';
    if ($('#reality-title')) updateReality(reality);
    updateEffectsButton();
    if ($('#lightbox')?.open) showImage(imageIndex);
    window.dispatchEvent(new CustomEvent('writenor:language',{detail:{locale}}));
  };
  languageSelect?.addEventListener('change',() => {selected=languageSelect.value;storage.set('writeNorLang',selected);applyLanguage();});
  window.addEventListener('languagechange',() => {if(selected==='auto') applyLanguage();});

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let effectsPreference = storage.get('writeNorEffects') || 'auto';
  let effectsEnabled = effectsPreference !== 'off' && !reduceMotion.matches;
  function updateEffectsButton() {
    const button=$('.effects-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed',String(effectsEnabled));
    button.setAttribute('aria-label',t(effectsEnabled ? 'effects_on':'effects_off'));
    button.title=t(effectsEnabled ? 'effects_on':'effects_off');
    $('.effects-icon',button).textContent=effectsEnabled?'◉':'○';
  }
  function applyEffects() {
    effectsEnabled=effectsPreference!=='off' && !reduceMotion.matches;
    document.body.classList.toggle('effects-off',!effectsEnabled);
    updateEffectsButton();
    if (!effectsEnabled) $$('.reveal').forEach(el=>el.classList.add('visible'));
    window.dispatchEvent(new Event('writenor:effects'));
  }
  $('.effects-toggle')?.addEventListener('click',()=>{effectsPreference=effectsEnabled?'off':'on';storage.set('writeNorEffects',effectsPreference);applyEffects();});
  reduceMotion.addEventListener('change',applyEffects);
  const menuButton=$('.menu-toggle');
  const closeMenu=()=>{menuButton?.setAttribute('aria-expanded','false');$('.main-nav')?.classList.remove('is-open');};
  menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));$('.main-nav')?.classList.toggle('is-open',open);});
  $$('.main-nav a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  matchMedia('(min-width: 851px)').addEventListener('change',closeMenu);
  $$('.year').forEach(el=>el.textContent=new Date().getFullYear());

  function updateReality(value) {
    reality=value;
    $$('.timeline-switch button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.reality===value)));
    const panel=$('.memory-panel');
    if(panel)panel.dataset.state=value;
    const title=$('#reality-title'),text=$('#reality-text');
    if(title){title.dataset.i18n=`${value}_title`;title.textContent=t(title.dataset.i18n);}
    if(text){text.dataset.i18n=`${value}_text`;text.textContent=t(text.dataset.i18n);}
  }
  let realityTransition=null;
  $$('[data-reality]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.reality;
    if(value===reality)return;
    if(effectsEnabled && !reduceMotion.matches && typeof document.startViewTransition==='function'){
      realityTransition?.skipTransition();
      try{realityTransition=document.startViewTransition(()=>updateReality(value));realityTransition.finished.catch(()=>{});}catch{updateReality(value);}
    }else updateReality(value);
  }));

  const frames=$$('.gallery-frame');
  let imageIndex=0;
  const lightbox=$('#lightbox');
  function showImage(index) {
    imageIndex=(index+frames.length)%frames.length;
    const frame=frames[imageIndex];if(!frame)return;
    const img=$('#lightbox-img');img.src=frame.dataset.image;img.alt=$('img',frame).alt;
    $('#lightbox-caption').textContent=t(frame.dataset.caption);
    $('#lightbox-count').textContent=`VISUAL_ARCHIVE / ${String(imageIndex+1).padStart(2,'0')} — ${String(frames.length).padStart(2,'0')}`;
  }
  frames.forEach((frame,index)=>frame.addEventListener('click',()=>{showImage(index);lightbox.showModal();}));
  $('#lightbox-close')?.addEventListener('click',()=>lightbox.close());
  $('#lightbox-prev')?.addEventListener('click',()=>showImage(imageIndex-1));
  $('#lightbox-next')?.addEventListener('click',()=>showImage(imageIndex+1));
  lightbox?.addEventListener('click',event=>{if(event.target===lightbox){const rect=lightbox.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)lightbox.close();}});
  lightbox?.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();showImage(imageIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();showImage(imageIndex+1);}});

  const terminalOutput=$('#terminal-output');
  function terminalLine(text,{echo=false,key=null}={}) {
    const line=document.createElement('p');
    if(echo)line.className='terminal-echo';
    const prompt=document.createElement('span');prompt.className='terminal-prompt';prompt.textContent='> ';
    const content=document.createElement('span');content.textContent=text;if(key)content.dataset.i18n=key;
    line.append(prompt,content);terminalOutput.append(line);
    while(terminalOutput.children.length>14)terminalOutput.firstElementChild.remove();
    terminalOutput.scrollTop=terminalOutput.scrollHeight;
  }
  function runCommand(raw) {
    const command=raw.trim().toLowerCase();if(!command||!terminalOutput)return;
    const input=$('#command');input.value='';
    if(command==='clear'){terminalOutput.replaceChildren();terminalLine(t('terminal_cleared'),{key:'terminal_cleared'});return;}
    terminalLine(raw.slice(0,60),{echo:true});
    const key=({help:'terminal_help',memory:'terminal_memory',nori:'terminal_nori'})[command]||'terminal_unknown';
    terminalLine(t(key),{key});
  }
  $('#terminal-form')?.addEventListener('submit',event=>{event.preventDefault();runCommand($('#command').value);});
  $$('[data-command]').forEach(button=>button.addEventListener('click',()=>runCommand(button.dataset.command)));

  // Content is visible by default, even if JavaScript, canvas or observers fail.
  if('IntersectionObserver' in window && effectsEnabled){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -20px 0px'});
    document.documentElement.classList.add('js-reveal');$$('.reveal').forEach(el=>observer.observe(el));
    window.addEventListener('beforeprint',()=>$$('.reveal').forEach(el=>el.classList.add('visible')));
  }
  let pointerX=0,pointerY=0;
  if(matchMedia('(pointer: fine)').matches){
    const light=$('.pointer-light');
    window.addEventListener('pointermove',event=>{pointerX=(event.clientX/innerWidth-.5);pointerY=(event.clientY/innerHeight-.5);if(effectsEnabled&&light){light.style.left=`${event.clientX}px`;light.style.top=`${event.clientY}px`;}},{passive:true});
  }

  // A light 2D terrain: no WebGL library, no shader compilation, no loading gate.
  const canvas=$('#terrain');
  if(canvas){
    const ctx=canvas.getContext('2d',{alpha:true});
    if(ctx){
      let width=0,height=0,frameId=0,lastFrame=0,active=true,elapsed=0;
      const compact=()=>width<650;
      function resize(){const bounds=canvas.getBoundingClientRect();width=bounds.width;height=bounds.height;const ratio=Math.min(devicePixelRatio||1,compact()?1.25:1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw(elapsed);}
      function draw(time){
        ctx.clearRect(0,0,width,height);
        const columns=compact()?24:42,rows=compact()?19:28;
        const phase=time*.00018;
        const mesh=[];
        const center=width*.55+pointerX*12;
        for(let row=0;row<=rows;row++){
          const depth=row/rows;
          const spread=width*(.5+depth*1.75);
          const line=[];
          for(let col=0;col<=columns;col++){
            const x=(col/columns-.5)*spread+center;
            const hill=Math.sin(col*.18+phase)*Math.cos(row*.16+phase*.55)*height*.11*(1-depth*.35);
            const y=height*.38+depth*depth*height*.9+hill+pointerY*depth*7;
            line.push({x,y});
          }mesh.push(line);
        }
        ctx.lineWidth=.7;
        for(let row=0;row<rows;row++){
          const alpha=.08+Math.sin(row/rows*Math.PI)*.26;
          ctx.strokeStyle=`rgba(133,70,211,${alpha})`;ctx.beginPath();
          for(let col=0;col<columns;col++){
            const a=mesh[row][col],b=mesh[row][col+1],c=mesh[row+1][col],d=mesh[row+1][col+1];
            ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.moveTo(a.x,a.y);ctx.lineTo(d.x,d.y);
          }ctx.stroke();
        }
      }
      function loop(now){frameId=0;if(!active||document.hidden||!effectsEnabled)return;if(now-lastFrame>=33){elapsed+=Math.min(now-lastFrame,60);lastFrame=now;draw(elapsed);}frameId=requestAnimationFrame(loop);}
      function sync(){if(frameId)cancelAnimationFrame(frameId);frameId=0;if(active&&!document.hidden&&effectsEnabled){lastFrame=performance.now();frameId=requestAnimationFrame(loop);}else draw(elapsed);}
      if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize,{passive:true});
      if('IntersectionObserver' in window)new IntersectionObserver(entries=>{active=entries[0].isIntersecting;sync();},{rootMargin:'50px'}).observe(canvas);
      document.addEventListener('visibilitychange',sync);window.addEventListener('writenor:effects',sync);resize();sync();
    }
  }
  const started=Date.now();
  const timeElement=$('#session-time');
  if(timeElement)setInterval(()=>{if(document.hidden)return;const seconds=Math.floor((Date.now()-started)/1000);timeElement.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;},1000);
  applyLanguage();applyEffects();
})();
