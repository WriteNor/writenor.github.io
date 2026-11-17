/* WriteNor — theme toggle + intro (heart → code → time). */
(() => {
  const root = document.documentElement;
  const save = t => { try { localStorage.setItem('wnTheme', t); } catch {} };
  const label = { en: 'Switch theme', ru: 'Сменить тему', uk: 'Змінити тему', pl: 'Zmień motyw', de: 'Design wechseln', es: 'Cambiar tema', ja: 'テーマを切り替え', zh: '切换主题' };
  const lang = (root.lang || 'en').slice(0, 2);
  const btn = document.querySelector('.theme-toggle');
  const apply = t => { root.dataset.theme = t; root.style.colorScheme = t; btn?.setAttribute('aria-pressed', t === 'light'); document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#e8dcc0' : '#09090d'); };
  if (btn) {
    btn.setAttribute('aria-label', label[lang] || label.en);
    apply(root.dataset.theme || 'dark');
    btn.addEventListener('click', e => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      const r = btn.getBoundingClientRect();
      root.style.setProperty('--tx', (r.left + r.width / 2) + 'px'); root.style.setProperty('--ty', (r.top + r.height / 2) + 'px');
      save(next); window.WNSound && WNSound.play('theme');
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!still && document.startViewTransition) document.startViewTransition(() => apply(next));
      else { if (!still) { root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 600); } apply(next); }
    });
  }

  const el = document.getElementById('wn-intro');
  if (!el) return;
  const SKIP = { en: 'Skip', ru: 'Пропустить', uk: 'Пропустити', pl: 'Pomiń', de: 'Überspringen', es: 'Omitir', ja: 'スキップ', zh: '跳过' };
  const CODE = ['<b>&gt;</b> memory.restore()', 'if (present.frozen) {', '  past.advance();', '}', '<b>&gt;</b> day.end = <b>null</b>;'];
  let timers = [], raf = 0, running = false;
  const clear = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); };
  const finish = () => { clear(); running = false; el.classList.add('out'); root.classList.remove('wn-intro'); try { sessionStorage.setItem('wnIntroSeen', '1'); } catch {} setTimeout(() => { el.hidden = true; }, 400); document.dispatchEvent(new Event('wn:introend')); };
  const run = () => {
    if (running) return; running = true;
    el.hidden = false; el.classList.remove('out'); root.classList.add('wn-intro');
    el.innerHTML = '<svg class="wn-heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 5 6 5c2.1 0 3.4 1.1 4.2 2.4h3.6C14.6 6.1 15.9 5 18 5c3.4 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z"/></svg><pre class="wn-code" aria-hidden="true"></pre><svg class="wn-clock" viewBox="0 0 120 120" aria-hidden="true"><circle class="ring" cx="60" cy="60" r="54" pathLength="100"/><line class="tk big" x1="60" y1="8" x2="60" y2="16" transform="rotate(0 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(30 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(60 60 60)"/><line class="tk big" x1="60" y1="8" x2="60" y2="16" transform="rotate(90 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(120 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(150 60 60)"/><line class="tk big" x1="60" y1="8" x2="60" y2="16" transform="rotate(180 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(210 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(240 60 60)"/><line class="tk big" x1="60" y1="8" x2="60" y2="16" transform="rotate(270 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(300 60 60)"/><line class="tk" x1="60" y1="8" x2="60" y2="13" transform="rotate(330 60 60)"/><line class="hand h" x1="60" y1="60" x2="60" y2="34"/><line class="hand m" x1="60" y1="60" x2="60" y2="20"/><circle cx="60" cy="60" r="3" fill="currentColor"/></svg><button type="button" class="wn-skip">' + (SKIP[lang] || SKIP.en) + '</button>';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'WriteNor');
    el.querySelector('.wn-skip').addEventListener('click', finish);
    el.querySelector('.wn-skip').focus({ preventScroll: true });
    const stage = n => { el.dataset.stage = n; window.WNSound && WNSound.stage(n); };
    const pre = el.querySelector('.wn-code');
    stage(1);
    timers.push(setTimeout(() => {           // STAGE 02 — code types in
      stage(2); const t0 = performance.now(), total = CODE.join('\n').replace(/<[^>]+>/g, '').length;
      const tick = now => { const p = Math.min(1, (now - t0) / 750); let n = Math.floor(p * total), out = '', plain = 0;
        for (const line of CODE) { const txt = line.replace(/<[^>]+>/g, ''); if (plain + txt.length <= n) { out += line + '\n'; plain += txt.length; } else { out += txt.slice(0, Math.max(0, n - plain)).replace(/&gt;/g, '>'); break; } }
        pre.innerHTML = out; if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, 850));
    timers.push(setTimeout(() => {           // STAGE 03 — time
      stage(3);
    }, 1750));
    timers.push(setTimeout(finish, 2700));
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && running) finish(); });
  document.querySelectorAll('[data-boot-replay]').forEach(b => b.addEventListener('click', run));
  if (root.classList.contains('wn-intro')) run(); else el.hidden = true;
})();
