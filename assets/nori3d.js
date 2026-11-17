/* WriteNor — living portrait of Nori (WebGL): pseudo-3D parallax, liquid cursor distortion, click shockwave, glitch bands, theme duotone. */
(() => {
  const stage = document.querySelector('.nori-stage'), cv = stage && stage.querySelector('canvas'); if (!cv) return;
  const root = document.documentElement, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(root).getPropertyValue(n).trim(), light = () => root.dataset.theme === 'light';
  const hex = c => { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16) / 255); };
  const palette = () => { const a = hex(css('--accent') || '#9258f5'); return light() ? { lo: a, hi: [.17, .1, .12] } : { lo: a.map(v => v * .8), hi: [.95, .92, 1] }; };
  const VS = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
  const FS = `uniform sampler2D uTex; uniform float uTime,uGlitch,uAssemble,uClickT,uMouseOn,uHold; uniform vec2 uMouse,uTilt; uniform vec3 uLo,uHi; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  vec2 crop(vec2 p){ return vec2(p.x,.2479+p.y*.6618); }
  float lum(vec3 c){ return dot(c,vec3(.299,.587,.114)); }
  float tone(float l){ return clamp((l-.06)*1.9,0.,1.); }
  void main(){
    vec2 p=vUv, c=p*2.-1.; float l0=lum(texture2D(uTex,crop(p)).rgb);
    vec2 q=p-uTilt*(l0-.28)*.05;
    vec2 d=c-uMouse; float dist=length(d)+1e-4; float lens=exp(-dist*dist*6.)*uMouseOn;
    q+=d/dist*lens*.03*sin(uTime*3.-dist*16.);
    float rr=length(c-uMouse*0.); float front=uClickT*1.8; float wv=sin((rr-front)*28.)*exp(-pow(rr-front,2.)*22.)*exp(-uClickT*1.3); q+=normalize(c+1e-4)*wv*.05*step(uClickT,3.);
    float band=floor(vUv.y*34.); float hb=h(vec2(band,floor(uTime*10.))); q.x+=step(.72,hb)*uGlitch*(1.-uHold*.95)*(hb-.85)*.5;
    float ca=.003+.02*uGlitch+.012*lens;
    vec3 t3=vec3(tone(lum(texture2D(uTex,crop(q+vec2(ca,0.))).rgb)),tone(lum(texture2D(uTex,crop(q)).rgb)),tone(lum(texture2D(uTex,crop(q-vec2(ca,0.))).rgb)));
    vec3 col=mix(uLo,uHi,smoothstep(.3,.95,t3));
    // frameless: edges dissolve into blocks of pixels ("memory fading")
    float m=smoothstep(-.95,-.05,c.x)*smoothstep(1.,.72,c.x)*smoothstep(1.,.86,c.y)*smoothstep(-1.,-.2,c.y);
    float n=h(floor(vUv*vec2(60.,70.))+floor(uTime*1.5)*.01);
    float a=smoothstep(0.,.22,m*1.18-n*.5);
    float vis=step(h(floor(vUv*80.)),uAssemble*1.25-(1.-vUv.y)*.2);
    float al=smoothstep(.04,.5,t3.g)*a*vis*(.9+.1*sin(vUv.y*1100.+uTime*2.));
    col+=uLo*wv*.3; col*=1.+uHold*.4*pow(.5+.5*sin(uTime*6.),8.);
    gl_FragColor=vec4(col,al);
  }`;

  function fallback(img) {                      // no WebGL: still portrait, faded edges
    const g = cv.getContext('2d'); const draw = () => { const r = stage.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); cv.width = r.width * dpr; cv.height = r.height * dpr;
      const w = Math.min(cv.width, cv.height / 1.15), h = w * 1.15, x = (cv.width - w) / 2, y = (cv.height - h) / 2; g.drawImage(img, 0, 150, 946, 1100, x, y, w, h);
      const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.45, 'rgba(0,0,0,1)'); gr.addColorStop(.9, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height); g.globalCompositeOperation = 'source-over'; };
    draw(); addEventListener('resize', draw); }

  function run(img) {
    const T = window.THREE; let renderer; try { renderer = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, powerPreference: 'low-power' }); } catch (e) { return fallback(img); }
    renderer.setClearColor(0, 0);
    const tex = new T.Texture(img); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, .1, 60), grp = new T.Group(); scene.add(grp);
    const U = { uTex: { value: tex }, uTime: { value: 0 }, uGlitch: { value: 0 }, uAssemble: { value: calm ? 1 : 0 }, uClickT: { value: 99 }, uMouseOn: { value: 0 }, uHold: { value: 0 }, uMouse: { value: new T.Vector2(9, 9) }, uTilt: { value: new T.Vector2() }, uLo: { value: new T.Vector3() }, uHi: { value: new T.Vector3() } };
    const mat = new T.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false });
    grp.add(new T.Mesh(new T.PlaneGeometry(2, 2.3), mat));
    const colors = () => { const P = palette(); U.uLo.value.set(...P.lo); U.uHi.value.set(...P.hi); mat.blending = light() ? T.NormalBlending : T.AdditiveBlending; mat.needsUpdate = true; };
    let ppw = 1, W = 1, H = 1;
    const fit = () => { const r = stage.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); renderer.setSize(W, H, false); cam.aspect = W / H;
      ppw = Math.min(W / 2, H / 2.3) * .98; const hh = H / (2 * ppw), tn = Math.tan(35 * Math.PI / 360); cam.position.z = hh / tn; cam.updateProjectionMatrix(); };
    colors(); fit(); new MutationObserver(() => { colors(); if (calm) renderer.render(scene, cam); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    new ResizeObserver(() => { fit(); if (calm) renderer.render(scene, cam); }).observe(stage);

    let mx = 0, my = 0, rx = 0, ry = 0, tOn = 0, tx = 0, ty = 0, lastX = 0, lastY = 0, lastSnd = 0, holding = false;
    const L = (root.lang || 'en').slice(0, 2), cap = document.createElement('div'); cap.className = 'nori-cap'; cap.setAttribute('aria-hidden', 'true'); stage.parentElement.appendChild(cap);
    const HINT = { en: 'Hold the portrait', ru: 'Удерживай портрет', uk: 'Утримуй портрет', pl: 'Przytrzymaj portret', de: 'Porträt gedrückt halten', es: 'Mantén el retrato', ja: '肖像を長押し', zh: '按住肖像' };
    const WHISP = { en: 'Nori hears you.', ru: 'Нори слышит тебя.', uk: 'Норі чує тебе.', pl: 'Nori cię słyszy.', de: 'Nori hört dich.', es: 'Nori te oye.', ja: 'Nori には聞こえている。', zh: 'Nori 听得见你。' };
    const setCap = h => { cap.textContent = (h ? WHISP : HINT)[L] || (h ? WHISP : HINT).en; cap.classList.toggle('hold', h); }; setCap(false);
    const rel = () => { if (!holding) return; holding = false; setCap(false); window.WNSound && WNSound.hold(false); };
    addEventListener('pointerup', rel); addEventListener('pointercancel', rel); addEventListener('blur', rel);
    addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(), px = (e.clientX - (r.left + r.width / 2)) / ppw, py = -(e.clientY - (r.top + r.height / 2)) / ppw;
      mx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)); my = Math.max(-1, Math.min(1, -((e.clientY - r.top) / r.height * 2 - 1)));
      U.uMouse.value.set(px, py / 1.15); tOn = Math.abs(px) < 1.25 && Math.abs(py) < 1.45 ? 1 : 0;
      if (tOn && Math.hypot(e.clientX - lastX, e.clientY - lastY) > 180 && performance.now() - lastSnd > 600) { lastSnd = performance.now(); lastX = e.clientX; lastY = e.clientY; window.WNSound && WNSound.play('glitch'); } }, { passive: true });
    document.addEventListener('pointerleave', () => { tOn = 0; });
    addEventListener('pointerdown', e => { const r = stage.getBoundingClientRect(), px = (e.clientX - (r.left + r.width / 2)) / ppw, py = -(e.clientY - (r.top + r.height / 2)) / ppw;
      if (Math.abs(px) < 1.1 && Math.abs(py) < 1.3 && e.clientY < innerHeight) { U.uClickT.value = 0; window.WNSound && WNSound.play('scatter'); holding = true; setCap(true); setTimeout(() => holding && window.WNSound && WNSound.hold(true), 350); } });
    let t = 0, last = performance.now(), vis = true, raf = 0, assembleAt = null, nextGl = 2.5;
    const startAssemble = () => { if (assembleAt === null) assembleAt = t + .1; };
    if (root.classList.contains('wn-intro')) { document.addEventListener('wn:introend', startAssemble, { once: true }); setTimeout(startAssemble, 4200); } else startAssemble();
    const frame = now => { raf = 0; if (!vis || document.hidden) return; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; U.uTime.value = t;
      if (assembleAt !== null) U.uAssemble.value = Math.min(1, Math.max(0, (t - assembleAt) / 1.8));
      U.uMouseOn.value += (tOn - U.uMouseOn.value) * Math.min(1, dt * 7); U.uClickT.value = Math.min(99, U.uClickT.value + dt); U.uHold.value += ((holding ? 1 : 0) - U.uHold.value) * Math.min(1, dt * 3);
      if (t > nextGl) { U.uGlitch.value = 1; nextGl = t + 3 + Math.random() * 4; } U.uGlitch.value *= Math.pow(.0008, dt);
      tx += (mx - tx) * Math.min(1, dt * 3); ty += (my - ty) * Math.min(1, dt * 3); U.uTilt.value.set(tx, ty);
      rx += (my * -.12 - rx) * Math.min(1, dt * 3); ry += (mx * .22 - ry) * Math.min(1, dt * 3); grp.rotation.set(rx, ry + Math.sin(t * .35) * .04, 0); grp.scale.setScalar(1 + Math.sin(t * .8) * .006);
      renderer.render(scene, cam); raf = requestAnimationFrame(frame); };
    if (calm) { U.uAssemble.value = 1; renderer.render(scene, cam); return; }
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
    raf = requestAnimationFrame(frame);
  }

  const loadThree = () => window.THREE ? Promise.resolve() : new Promise(res => { const s = document.createElement('script'); s.src = '/assets/three.min.js'; s.onload = res; s.onerror = res; document.head.appendChild(s); });
  const img = new Image(); img.decoding = 'async';
  const go = () => { img.src = '/assets/nori.webp'; img.onload = () => loadThree().then(() => window.THREE ? run(img) : fallback(img)); };
  (window.requestIdleCallback || (f => setTimeout(f, 200)))(go, { timeout: 1200 });
})();
