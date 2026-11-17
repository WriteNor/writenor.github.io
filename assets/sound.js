/* WriteNor — synthesized sound & generative music (WebAudio, no files). Off by default; toggle in header. */
(() => {
  const KEY = 'wnSound', btn = document.querySelector('.sound-toggle');
  let on = false, ctx, master, fx, mg, music = null, lastHover = 0;
  let vol = 0, prev = .6, hb = 0, hbOn = false;
  try { const v = localStorage.getItem('wnVol'); vol = v !== null ? Math.min(1, Math.max(0, +v || 0)) : (localStorage.getItem(KEY) === '1' ? .6 : 0); } catch {}
  on = vol > 0;
  const LBL = { en: 'Sound', ru: 'Звук', uk: 'Звук', pl: 'Dźwięk', de: 'Ton', es: 'Sonido', ja: 'サウンド', zh: '声音' };
  const lang = (document.documentElement.lang || 'en').slice(0, 2), AC = window.AudioContext || window.webkitAudioContext;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12), pick = a => a[Math.random() * a.length | 0], PENT = [69, 72, 74, 76, 79, 81, 84];

  const ready = () => {
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC(); const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
      master = ctx.createGain(); master.gain.value = vol * .8; master.connect(comp); comp.connect(ctx.destination);
      const len = ctx.sampleRate * 2.8 | 0, ir = ctx.createBuffer(2, len, ctx.sampleRate);               // generated reverb tail
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.7); }
      const rev = ctx.createConvolver(); rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = .6; rev.connect(rg); rg.connect(master);
      const dl = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter(); dl.delayTime.value = .34; fb.gain.value = .36; lp.type = 'lowpass'; lp.frequency.value = 1700;
      dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(rev); lp.connect(master);
      fx = ctx.createGain(); fx.gain.value = 1; fx.connect(rev); fx.connect(dl);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx.state === 'running';
  };
  const env = (g, t, v, a, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); };
  const out = (node, dry = 1, wet = .6, dest = master) => { const g = ctx.createGain(); g.gain.value = dry; node.connect(g); g.connect(dest); const w = ctx.createGain(); w.gain.value = wet; node.connect(w); w.connect(fx); };
  const noise = (d, v = .08, f = 3000, q = .8, at = 0, type = 'highpass') => { const t = ctx.currentTime + at, n = Math.max(1, ctx.sampleRate * d | 0), b = ctx.createBuffer(1, n, ctx.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = v; s.connect(fl).connect(g).connect(master); s.start(t); };
  const bell = (m, v = .06, at = 0, dest) => { const t = ctx.currentTime + at, o = ctx.createOscillator(), mo = ctx.createOscillator(), mgn = ctx.createGain(), g = ctx.createGain();
    o.frequency.value = hz(m); mo.frequency.value = hz(m) * 2.76; mgn.gain.setValueAtTime(hz(m) * .9, t); mgn.gain.exponentialRampToValueAtTime(1, t + 1.1); mo.connect(mgn); mgn.connect(o.frequency);
    env(g, t, v, .004, 1.5); o.connect(g); out(g, 1, .9, dest); o.start(t); mo.start(t); o.stop(t + 1.8); mo.stop(t + 1.8); };
  const pluck = (m, v = .07, at = 0, dest) => { const t = ctx.currentTime + at, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = hz(m); f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(450, t + .45); env(g, t, v, .005, .55);
    o.connect(f).connect(g); out(g, 1, .7, dest); o.start(t); o.stop(t + .8); };
  const kick = (v = .5, at = 0, f0 = 72, f1 = 36, dest = master) => { const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + .22); env(g, t, v, .006, .3); o.connect(g).connect(dest); o.start(t); o.stop(t + .4); };
  const pad = (notes, at, dur, v, dest) => { const t = ctx.currentTime + at, lp = ctx.createBiquadFilter(), g = ctx.createGain(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(1100, t + dur * .5); lp.frequency.linearRampToValueAtTime(420, t + dur + 1.5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 1.3); g.gain.setValueAtTime(v, t + dur - .3); g.gain.linearRampToValueAtTime(0, t + dur + 1.6);
    notes.forEach(m => [-6, 6].forEach(dt => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 1.7); }));
    lp.connect(g); out(g, .8, .8, dest); };
  const sub = (m, at, dur, v, dest) => { const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = hz(m); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .25); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + .05); };

  /* ---- generative track: slow minor loop, heartbeat kick, clock ticks, random bell/pluck melody ---- */
  const CH = [[57, 60, 64, 71], [53, 57, 60, 64], [60, 64, 67, 71], [55, 59, 62, 64]], ROOT = [33, 29, 36, 31], P = [.7, .25, .55, .35, .6, .25, .5, .4];
  const startMusic = () => {
    if (music || !ready()) return; mg = ctx.createGain(); mg.gain.setValueAtTime(0, ctx.currentTime); mg.gain.linearRampToValueAtTime(.5, ctx.currentTime + 4); mg.connect(master);
    const step = 60 / 66 / 2; let next = ctx.currentTime + .1, n = 0;
    const sched = () => { while (next < ctx.currentTime + .35) { const at = next - ctx.currentTime, bar = (n / 8 | 0) % 4, s = n % 8, ch = CH[bar];
        if (s === 0) { pad(ch, at, step * 8, .035, mg); sub(ROOT[bar], at, step * 8, .3, mg); kick(.42, at, 70, 36, mg); kick(.26, at + .3, 80, 42, mg); }
        if (s % 2 === 0) noise(.02, .018, 5000, .8, at);
        if (Math.random() < P[s]) pluck(pick(ch) + pick([12, 12, 24]), .035 + Math.random() * .03, at, mg);
        if (s === 6 && bar % 2 === 1 && Math.random() < .7) bell(pick(PENT) + 3, .03, at + step * .5, mg);
        next += step; n++; } };
    music = { id: setInterval(sched, 80) }; sched();
  };
  const stopMusic = () => { if (!music) return; clearInterval(music.id); music = null; const g = mg; g.gain.cancelScheduledValues(ctx.currentTime); g.gain.setValueAtTime(g.gain.value, ctx.currentTime); g.gain.linearRampToValueAtTime(0, ctx.currentTime + .7); setTimeout(() => g.disconnect(), 4500); };

  const sfx = {
    heart() { kick(.35, 0, 62, 34); kick(.22, .22, 56, 32); },
    tick() { noise(.03, .09, 2600); },
    hover() { bell(pick(PENT) + 12, .01); },
    click() { pluck(pick(PENT) - 12, .045); bell(pick(PENT), .02, .02); kick(.1, 0, 90, 50); },
    theme() { [72, 76, 79, 83].forEach((m, i) => bell(m, .03, i * .07)); noise(.35, .015, 900, .5, 0, 'bandpass'); },
    glitch() { noise(.09, .03, 700 + Math.random() * 2500, 4, 0, 'bandpass'); bell(pick(PENT) + 12, .01, .02); },
    scatter() { noise(.3, .025, 500 + Math.random() * 900, 2, 0, 'bandpass'); bell(pick(PENT), .025); kick(.12, 0, 110, 40); }
  };
  const paint = () => { if (!btn) return; btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', LBL[lang] || LBL.en); btn.title = LBL[lang] || LBL.en; if (sl) { sl.value = Math.round(vol * 100); sl.style.setProperty('--v', Math.round(vol * 100) + '%'); } };
  let sl = null;
  const api = window.WNSound = {
    get on() { return on; },
    play(n) { if (on && sfx[n] && ready()) sfx[n](); },
    stage(n) { if (!on || !ready()) return; if (n === 1) sfx.heart(); if (n === 2) [0, .13, .27, .4, .56, .7].forEach((a, i) => bell(57 + [0, 3, 7, 12, 15, 19][i], .03, a)); if (n === 3) [0, .05, .11, .18, .27, .38, .52, .7].forEach((a, i) => { noise(.03, .08 - i * .005, 2400 - i * 160, .8, a); }); },
    setVol(v, quiet) { const was = on; vol = Math.min(1, Math.max(0, v)); on = vol > 0; if (on) prev = vol; try { localStorage.setItem('wnVol', vol); localStorage.setItem(KEY, on ? '1' : '0'); } catch {} paint();
      if (master) master.gain.setTargetAtTime(vol * .8, ctx.currentTime, .05);
      if (on && !was) { if (ready()) { if (!quiet) sfx.heart(); setTimeout(startMusic, 600); } } else if (!on && was) { stopMusic(); api.hold(false); } },
    toggle() { api.setVol(on ? 0 : prev); },
    hold(h) { clearTimeout(hb); hbOn = h; if (!h || !on || !ready()) return; let gap = 950; const beat = () => { if (!hbOn) return; sfx.heart(); gap = Math.max(520, gap - 45); hb = setTimeout(beat, gap); }; beat(); }
  };
  if (btn) { const wrap = document.createElement('span'); wrap.className = 'snd'; sl = document.createElement('input'); sl.type = 'range'; sl.min = 0; sl.max = 100; sl.step = 1; sl.className = 'snd-range'; sl.setAttribute('aria-label', (LBL[lang] || LBL.en) + ' 0–100');
    btn.replaceWith(wrap); wrap.append(btn, sl); sl.addEventListener('input', () => api.setVol(sl.value / 100, true)); sl.addEventListener('change', () => api.play('hover')); }
  paint(); btn && btn.addEventListener('click', e => { e.stopPropagation(); api.toggle(); });
  const first = () => { if (on && ready()) startMusic(); removeEventListener('pointerdown', first); removeEventListener('keydown', first); };
  addEventListener('pointerdown', first); addEventListener('keydown', first);
  document.addEventListener('pointerover', e => { const a = e.target.closest && e.target.closest('a,button,select'); if (a && on && performance.now() - lastHover > 180 && !a.matches('.sound-toggle')) { lastHover = performance.now(); api.play('hover'); } });
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('a,button') && !e.target.closest('.sound-toggle,.theme-toggle')) { api.play('click'); if (on && navigator.vibrate) navigator.vibrate(8); } });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
})();
