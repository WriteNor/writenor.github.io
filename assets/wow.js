/* WriteNor — wordmark, wow menu, link scramble, come-back effect. */
(() => {
  const root = document.documentElement, $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lang = (root.lang || 'en').slice(0, 2), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* wordmark: decodes in, then trembles / corrupts for a moment (Wri51, WritQ…) and recovers */
  const title = $('.hero-title');
  if (title && !title.dataset.wm) {
    title.dataset.wm = 1; const chars = [], G = '0123456789QXZKB';
    $$('.write,.nor', title).forEach(part => { const txt = part.textContent.trim(); part.textContent = '';
      [...txt].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.dataset.c = c; part.appendChild(s); chars.push(s); }); });
    const rg = () => G[Math.random() * G.length | 0];
    const lock = () => { chars.forEach(s => s.style.width = ''); chars.forEach(s => { s.style.width = s.getBoundingClientRect().width + 'px'; }); };
    (document.fonts && document.fonts.ready || Promise.resolve()).then(lock); let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(lock, 150); });
    const jit = (s, on) => { s.classList.toggle('g', on); s.style.transform = on ? `translate(${(Math.random() * 6 - 3).toFixed(1)}px,${(Math.random() * 4 - 2).toFixed(1)}px) skewX(${(Math.random() * 10 - 5).toFixed(1)}deg)` : ''; };
    const show = () => chars.forEach(s => { s.style.opacity = 1; s.textContent = s.dataset.c; jit(s, false); });
    if (calm) show(); else {
      const delay = root.classList.contains('wn-intro') ? 2800 : 150;
      chars.forEach((s, i) => setTimeout(() => { s.style.opacity = 1; let f = 0; const step = () => { if (f++ < 6) { s.textContent = rg(); setTimeout(step, 42); } else s.textContent = s.dataset.c; }; step(); }, delay + i * 75));
      setTimeout(show, delay + 2200);
      const glitch = big => { const pick = [...chars].sort(() => Math.random() - .5).slice(0, big ? chars.length : 1 + (Math.random() * 3 | 0)); let f = 0;
        const tick = () => { if (f++ < 6) { pick.forEach(s => { s.textContent = rg(); jit(s, true); }); setTimeout(tick, 55 + Math.random() * 35); } else pick.forEach(s => { s.textContent = s.dataset.c; jit(s, false); }); }; tick(); window.WNSound && WNSound.play('glitch'); };
      const loop = () => setTimeout(() => { if (!document.hidden) glitch(Math.random() < .05); loop(); }, 1700 + Math.random() * 2800);
      setTimeout(loop, delay + 2600);
    }
  }

  /* menu: close button, clock, scroll lock */
  const nav = $('#main-nav'), btn = $('.menu-toggle');
  if (nav && btn) {
    const CL = { en: 'Close', ru: 'Закрыть', uk: 'Закрити', pl: 'Zamknij', de: 'Schließen', es: 'Cerrar', ja: '閉じる', zh: '关闭' };
    const x = document.createElement('button'); x.type = 'button'; x.className = 'menu-close'; x.textContent = (CL[lang] || CL.en) + ' ✕';
    x.addEventListener('click', () => btn.click()); nav.prepend(x);
    nav.insertAdjacentHTML('beforeend', '<svg class="menu-clock" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56"/>' + [...Array(12)].map((_, n) => `<line class="tk" x1="60" y1="6" x2="60" y2="${n % 3 ? 11 : 16}" transform="rotate(${n * 30} 60 60)"/>`).join('') + '<line class="hand h" x1="60" y1="60" x2="60" y2="32" stroke-width="2.4"/><line class="hand m" x1="60" y1="60" x2="60" y2="14" stroke-width="1.4"/></svg>');
    const sync = () => root.classList.toggle('menu-open', btn.getAttribute('aria-expanded') === 'true');
    new MutationObserver(sync).observe(btn, { attributes: true, attributeFilter: ['aria-expanded'] });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') btn.click(); });
  }

  /* link scramble on hover */
  if (!calm) $$('.main-nav a,.footer-social a').forEach(a => {
    a.addEventListener('mouseenter', () => { if (a._s) return; const t = a.textContent, G = '01#/\\<>_-+'; let f = 0; a._s = setInterval(() => {
      a.textContent = [...t].map((c, k) => k < f / 1.5 || c === ' ' ? c : G[Math.random() * G.length | 0]).join(''); if (++f > t.length * 1.5) { clearInterval(a._s); a._s = 0; a.textContent = t; } }, 30); });
  });

  /* come-back effect: title + favicon while away, greeting on return */
  const AWAY = { en: 'Nori is still waiting…', ru: 'Нори всё ещё ждёт…', uk: 'Норі досі чекає…', pl: 'Nori wciąż czeka…', de: 'Nori wartet noch…', es: 'Nori sigue esperando…', ja: 'Nori はまだ待っている…', zh: 'Nori 还在等你…' };
  const BACK = { en: 'You came back. The day hasn’t ended.', ru: 'Ты вернулся. День не закончился.', uk: 'Ти повернувся. День не скінчився.', pl: 'Wróciłeś. Ten dzień się nie skończył.', de: 'Du bist zurück. Der Tag ist nicht zu Ende.', es: 'Has vuelto. El día no ha terminado.', ja: 'おかえり。一日はまだ終わっていない。', zh: '你回来了。这一天还没有结束。' };
  const orig = document.title; let icon = $('link[rel~=icon]'), origHref = icon && icon.href, away = false, timer;
  const heart = c => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${c}" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 5 6 5c2.1 0 3.4 1.1 4.2 2.4h3.6C14.6 6.1 15.9 5 18 5c3.4 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z"/></svg>`);
  const toast = document.createElement('div'); toast.className = 'toast-back'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  document.addEventListener('visibilitychange', () => {
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
    if (document.hidden) { away = true; clearTimeout(timer); document.title = '♥ ' + (AWAY[lang] || AWAY.en); icon.href = heart(getComputedStyle(root).getPropertyValue('--accent').trim() || '#9258f5'); }
    else if (away) { away = false; document.title = orig; if (origHref) icon.href = origHref; toast.textContent = BACK[lang] || BACK.en; toast.classList.add('on'); timer = setTimeout(() => toast.classList.remove('on'), 3500); }
  });
})();
