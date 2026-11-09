(() => {
  'use strict';
  if (document.querySelector('.ambient-field')) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const field = document.createElement('div');
  field.className = 'ambient-field';
  field.setAttribute('aria-hidden', 'true');
  const tower = side => `<div class="edge-tower edge-tower--${side}"><div class="edge-tower__body"><div class="edge-tower__spine"></div><div class="edge-tower__trace"></div><div class="edge-tower__trace edge-tower__trace--second"></div><div class="edge-tower__iris"><div class="edge-tower__ring"></div><div class="edge-tower__ring edge-tower__ring--middle"></div><div class="edge-tower__ring edge-tower__ring--inner"></div><div class="edge-tower__sweep"></div><div class="edge-tower__crosshair"></div></div><div class="edge-tower__raster"></div><div class="edge-tower__progress"></div></div></div>`;
  field.innerHTML = `<canvas class="ambient-particles"></canvas><div class="ambient-edge-glow ambient-edge-glow--left"></div><div class="ambient-edge-glow ambient-edge-glow--right"></div><div class="ambient-rail ambient-rail--left"></div><div class="ambient-rail ambient-rail--right"></div>${tower('left')}${tower('right')}<div class="ambient-bloom"></div>`;
  document.body.append(field);
  const canvas = field.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: true });
  const bloom = field.querySelector('.ambient-bloom');
  const nativeScroll = !!window.CSS?.supports?.('animation-timeline', 'scroll(root block)');
  const finePointer = matchMedia('(pointer: fine)');
  const hero = document.querySelector('.hero');
  let width = 0, height = 0, particles = [], frame = 0, previousFrame = 0, elapsed = 0;
  let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0;
  let scrollPosition = window.scrollY, previousScroll = scrollPosition, scrollVelocity = 0;
  let scrollDirty = true, progress = 0, bloomAnimation = null, lastTransformX = NaN, lastTransformY = NaN;
  const enabled = () => !document.body.classList.contains('effects-off') && !reduced.matches;
  const moving = () => enabled() && !document.hidden;
  const wrap = (value, limit) => (value % limit + limit) % limit;
  function randomGenerator(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let value = Math.imul(seed ^ seed >>> 15, 1 | seed); value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value; return ((value ^ value >>> 14) >>> 0) / 4294967296; };
  }
  const glow = document.createElement('canvas');
  glow.width = glow.height = 32;
  const glowContext = glow.getContext('2d');
  if (glowContext) {
    const gradient = glowContext.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, '#ff688fbd'); gradient.addColorStop(.14, '#ff315f80'); gradient.addColorStop(.42, '#ff214233'); gradient.addColorStop(1, '#ff214200');
    glowContext.fillStyle = gradient; glowContext.fillRect(0, 0, 32, 32);
  }
  function updateScroll() {
    scrollPosition = window.scrollY;
    progress = Math.min(1, Math.max(0, scrollPosition / Math.max(1, document.documentElement.scrollHeight - height)));
    if (!nativeScroll) field.style.setProperty('--ambient-scroll', progress.toFixed(5));
    scrollVelocity += Math.max(-28, Math.min(28, scrollPosition - previousScroll)) * .2;
    previousScroll = scrollPosition;
    scrollDirty = false;
  }
  function resize() {
    width = Math.max(1, document.documentElement.clientWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.2 : 1.5, Math.sqrt(4000000 / (width * height)));
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = width < 700 ? 62 : Math.max(90, Math.min(240, Math.round(width * height / 8300)));
    const random = randomGenerator(4312600);
    particles = Array.from({ length: count }, (_, index) => ({
      x: random(), y: random(), depth: .45 + random() * .9, size: index % 19 === 0 ? 3.3 : .8 + random() * 1.35,
      speed: 4 + random() * 11, phase: random() * Math.PI * 2, drift: 3 + random() * 15,
      spark: index % 19 === 0, edge: index % 4 === 0, side: index % 2, slot: random()
    }));
    scrollDirty = true; updateScroll(); draw();
  }
  function draw() {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    if (!enabled()) return;
    const seconds = elapsed / 1000;
    const gutter = Math.max(24, (width - 1260) / 2);
    const inHero = !!hero && scrollPosition < hero.offsetHeight * .72;
    context.globalCompositeOperation = 'source-over';
    for (const particle of particles) {
      let baseX = particle.x * width;
      if (particle.edge && width >= 1440) baseX = particle.side ? width - gutter * (.15 + particle.slot * .8) : gutter * (.15 + particle.slot * .8);
      const x = wrap(baseX + Math.sin(seconds * .18 + particle.phase) * particle.drift + easedX * particle.depth * 13, width);
      const y = wrap(particle.y * height - seconds * particle.speed + easedY * particle.depth * 10 - scrollPosition * (.035 * particle.depth), height);
      const inGutter = x < gutter + 18 || x > width - gutter - 18;
      const contentVeil = inHero || inGutter ? 1 : .37;
      const pulse = .64 + Math.sin(seconds * .8 + particle.phase) * .22;
      const alpha = pulse * contentVeil;
      const size = particle.size * (width < 700 ? .88 : 1);
      if (glowContext && (particle.spark || particle.depth > 1)) {
        context.globalAlpha = alpha * .72;
        const haloSize = size * (particle.spark ? 7 : 5);
        context.drawImage(glow, x - haloSize / 2, y - haloSize / 2, haloSize, haloSize);
      }
      context.globalAlpha = alpha;
      context.fillStyle = particle.spark ? '#ff6085' : '#ff315f';
      context.fillRect(x, y, size, size);
      if (particle.spark) {
        context.globalAlpha = alpha * .2;
        context.fillRect(x - size, y + size * .5, size * 3, .65);
      }
    }
    context.globalAlpha = 1;
  }
  function loop(now) {
    frame = 0;
    if (!moving()) return;
    if (now - previousFrame >= 1000 / 30) {
      elapsed += Math.min(70, now - previousFrame); previousFrame = now;
      if (scrollDirty) updateScroll();
      scrollVelocity *= .89;
      easedX += (pointerX - easedX) * .07; easedY += (pointerY - easedY) * .07;
      const transformX = easedX * 5, transformY = easedY * 4 + scrollVelocity * .1;
      if (!Number.isFinite(lastTransformX) || Math.abs(transformX - lastTransformX) > .02) { field.style.setProperty('--ambient-pointer-x', `${transformX.toFixed(2)}px`); lastTransformX = transformX; }
      if (!Number.isFinite(lastTransformY) || Math.abs(transformY - lastTransformY) > .02) { field.style.setProperty('--ambient-pointer-y', `${transformY.toFixed(2)}px`); lastTransformY = transformY; }
      draw();
    }
    frame = requestAnimationFrame(loop);
  }
  function synchronize() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    field.classList.toggle('ambient-paused', !moving());
    if (!moving()) { bloomAnimation?.cancel(); bloomAnimation = null; }
    if (moving()) { previousFrame = performance.now(); frame = requestAnimationFrame(loop); }
    else draw();
  }
  window.addEventListener('scroll', () => { scrollDirty = true; }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('load', () => { scrollDirty = true; }, { once: true });
  document.addEventListener('visibilitychange', synchronize);
  window.addEventListener('writenor:effects', synchronize);
  if (reduced.addEventListener) reduced.addEventListener('change', synchronize); else reduced.addListener(synchronize);
  if (finePointer.matches) window.addEventListener('pointermove', event => { pointerX = event.clientX / width - .5; pointerY = event.clientY / height - .5; }, { passive: true });
  if ('IntersectionObserver' in window && typeof bloom.animate === 'function') {
    let lastSection = null;
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.target === lastSection || !moving()) continue;
        lastSection = entry.target;
        bloomAnimation?.cancel();
        bloomAnimation = bloom.animate([{ opacity: 0 }, { opacity: .75, offset: .38 }, { opacity: 0 }], { duration: 2200, easing: 'ease-out' });
      }
    }, { threshold: .12, rootMargin: '-8% 0px -15% 0px' });
    document.querySelectorAll('main > section').forEach(section => sectionObserver.observe(section));
  }
  resize(); synchronize();
})();
