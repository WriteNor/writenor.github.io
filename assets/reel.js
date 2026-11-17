/* WriteNor — cinematic chapter rail, runtime timecode and opening letterbox. */
(() => {
  const S = [['top', 'Signal'], ['invitation', 'Invitation'], ['story', 'Story'], ['archive', 'Archive'], ['experience', 'Inside'], ['nori', 'Nori'], ['play', 'Play'], ['game-file', 'Game file'], ['contact', 'Transmission']]
    .map(([id, n]) => [document.getElementById(id), n, id]).filter(s => s[0]);
  if (S.length < 3) return;
  const reel = document.createElement('div'); reel.className = 'reel';
  reel.innerHTML = '<nav aria-label="Chapters"><ol>' + S.map(([, n, id], i) => `<li><a href="#${id}"><i></i><span>${n}</span></a></li>`).join('') + '</ol></nav><div class="reel-tc" aria-hidden="true"><b></b><span>00:00:00:00</span></div>';
  document.body.appendChild(reel);
  const links = [...reel.querySelectorAll('a')], tc = reel.querySelector('.reel-tc span'), z = n => String(n | 0).padStart(2, '0');
  let cur = -1, raf = 0;
  const upd = () => { raf = 0; const h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0; let k = 0;
    S.forEach(([el], i) => { if (el.getBoundingClientRect().top < innerHeight * .45) k = i; });
    if (k !== cur) { links.forEach((a, i) => a.classList.toggle('on', i === k)); cur = k; }
    reel.style.setProperty('--p', p); const f = Math.round(p * 5400 * 24); tc.textContent = `${z(f / 86400)}:${z(f / 1440 % 60)}:${z(f / 24 % 60)}:${z(f % 24)}`; };
  addEventListener('scroll', () => { raf || (raf = requestAnimationFrame(upd)); }, { passive: true }); addEventListener('resize', upd); upd();
  setTimeout(() => reel.classList.add('open'), 4200);
})();
