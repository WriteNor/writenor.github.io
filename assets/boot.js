(() => {
  'use strict';

  const root = document.documentElement;
  const SESSION_KEY = 'writeNorBootSeenV2';
  const DURATION = 1750;
  const home = (location.pathname === '/' || location.pathname === '/index.html') && !document.body.classList.contains('nori-page');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const copy = {
    en: { label: 'WriteNor introduction', eyebrow: 'BOOT:// MEMORY ARCHIVE', stages: ['Restoring memory', 'Reading the past', 'Reconstructing the present', 'Opening WriteNor'], note: 'A day that never ends. A memory that remains.', skip: 'Skip', progress: 'Opening sequence' },
    ru: { label: 'Заставка WriteNor', eyebrow: 'BOOT:// АРХИВ ПАМЯТИ', stages: ['Восстанавливаем память', 'Считываем прошлое', 'Собираем настоящее', 'Открываем WriteNor'], note: 'День, который не кончается. Память, которая осталась.', skip: 'Пропустить', progress: 'Вступительная заставка' },
    uk: { label: 'Заставка WriteNor', eyebrow: 'BOOT:// АРХІВ ПАМ’ЯТІ', stages: ['Відновлюємо пам’ять', 'Зчитуємо минуле', 'Відтворюємо сьогодення', 'Відкриваємо WriteNor'], note: 'День, що не закінчується. Пам’ять, що залишилася.', skip: 'Пропустити', progress: 'Вступна заставка' },
    pl: { label: 'Wprowadzenie do WriteNor', eyebrow: 'BOOT:// ARCHIWUM PAMIĘCI', stages: ['Przywracanie pamięci', 'Odczytywanie przeszłości', 'Odtwarzanie teraźniejszości', 'Otwieranie WriteNor'], note: 'Dzień, który się nie kończy. Wspomnienie, które zostało.', skip: 'Pomiń', progress: 'Sekwencja wstępna' },
    de: { label: 'WriteNor-Intro', eyebrow: 'BOOT:// ERINNERUNGSARCHIV', stages: ['Erinnerung wiederherstellen', 'Vergangenheit lesen', 'Gegenwart rekonstruieren', 'WriteNor öffnen'], note: 'Ein Tag ohne Ende. Eine Erinnerung, die bleibt.', skip: 'Überspringen', progress: 'Eröffnungssequenz' },
    es: { label: 'Introducción de WriteNor', eyebrow: 'BOOT:// ARCHIVO DE MEMORIA', stages: ['Restaurando recuerdos', 'Leyendo el pasado', 'Reconstruyendo el presente', 'Abriendo WriteNor'], note: 'Un día que nunca termina. Un recuerdo que permanece.', skip: 'Saltar', progress: 'Secuencia de apertura' },
    ja: { label: 'WriteNorのイントロ', eyebrow: 'BOOT:// 記憶アーカイブ', stages: ['記憶を復元中', '過去を読み取り中', '現在を再構築中', 'WriteNorを開いています'], note: '終わらない一日。消えない記憶。', skip: 'スキップ', progress: 'オープニング' },
    zh: { label: 'WriteNor 开场', eyebrow: 'BOOT:// 记忆档案', stages: ['正在恢复记忆', '正在读取过去', '正在重构现在', '正在打开 WriteNor'], note: '永不结束的一天。始终留存的记忆。', skip: '跳过', progress: '开场序列' }
  };
  const locale = () => copy[(root.lang || 'en').toLowerCase().split('-')[0]] || copy.en;
  const settingOff = () => {
    if (document.body.classList.contains('effects-off') || reduced.matches) return true;
    try { return localStorage.getItem('writeNorEffects') === 'off'; } catch { return false; }
  };
  const seen = () => { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; } };
  const markSeen = () => { try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* The short sequence remains skippable if session storage is blocked. */ } };
  const isHistoryNavigation = () => {
    try { return performance.getEntriesByType('navigation')[0]?.type === 'back_forward' || performance.navigation?.type === 2; } catch { return false; }
  };
  let active = null;

  function removePending() { root.classList.remove('boot-pending'); }

  function finish(immediate = false) {
    removePending();
    if (!active) return;
    const current = active;
    active = null;
    cancelAnimationFrame(current.frame);
    clearTimeout(current.deadline);
    current.element.querySelector('.wn-boot__fill').style.transform = 'scaleX(1)';
    current.animation?.cancel();
    document.removeEventListener('keydown', current.keydown, true);
    document.removeEventListener('focusin', current.focusin);
    const restoreFocus = current.element.contains(document.activeElement);
    current.element.classList.add('is-leaving');
    const remove = () => {
      current.element.remove();
      if (!restoreFocus) return;
      const target = current.previousFocus?.isConnected && current.previousFocus !== document.body && current.previousFocus !== root
        ? current.previousFocus
        : document.querySelector('main a[href]');
      target?.focus({ preventScroll: true });
    };
    if (immediate) remove(); else setTimeout(remove, 190);
  }

  function localize() {
    if (!active) return;
    const text = locale();
    active.element.setAttribute('aria-label', text.label);
    active.element.querySelector('.wn-boot__eyebrow').textContent = text.eyebrow;
    active.element.querySelector('.wn-boot__note').textContent = text.note;
    active.element.querySelector('.wn-boot__skip-label').textContent = text.skip;
    active.element.querySelector('[role="progressbar"]').setAttribute('aria-label', text.progress);
    active.element.querySelector('.wn-boot__status').textContent = text.stages[active.stage];
  }

  function start(manual = false) {
    if (!home || active || settingOff() || document.hidden || (!manual && (seen() || isHistoryNavigation() || performance.now() > 2800))) {
      removePending();
      return;
    }
    const element = document.createElement('section');
    element.className = 'wn-boot';
    element.setAttribute('role', 'region');
    element.innerHTML = '<div class="wn-boot__corner" aria-hidden="true">WRITENOR_CORE / OPENING SEQUENCE<br>MEMORY_001 / TERAWWW</div><div class="wn-boot__panel"><p class="wn-boot__eyebrow"></p><div class="wn-boot__title" aria-label="WriteNor">WRITE<span aria-hidden="true">NOR</span></div><span class="wn-boot__ring" aria-hidden="true"></span><div class="wn-boot__progress"><span class="wn-boot__status"></span><span class="wn-boot__percent" aria-hidden="true">00%</span></div><div class="wn-boot__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="wn-boot__fill"></span></div><div class="wn-boot__bottom"><p class="wn-boot__note"></p><button class="wn-boot__skip" type="button"><span class="wn-boot__skip-label"></span><span aria-hidden="true">↵</span></button></div></div>';
    const state = { element, previousFocus: document.activeElement, stage: 0, frame: 0, deadline: 0, animation: null, keydown: null, focusin: null };
    active = state;
    document.body.prepend(element);
    removePending();
    markSeen();
    localize();
    element.querySelector('.wn-boot__skip').addEventListener('click', () => finish(true));
    state.keydown = event => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        finish(true);
      }
    };
    state.focusin = event => { if (active === state && !element.contains(event.target)) finish(true); };
    document.addEventListener('keydown', state.keydown, true);
    document.addEventListener('focusin', state.focusin);
    const meter = element.querySelector('.wn-boot__fill');
    const percentage = element.querySelector('.wn-boot__percent');
    const progress = element.querySelector('[role="progressbar"]');
    if (typeof meter.animate === 'function') {
      try {
        state.animation = meter.animate([
          { transform: 'scaleX(0)', offset: 0 },
          { transform: 'scaleX(.28)', offset: .28 },
          { transform: 'scaleX(.63)', offset: .52 },
          { transform: 'scaleX(.8)', offset: .77 },
          { transform: 'scaleX(1)', offset: 1 }
        ], { duration: DURATION - 120, easing: 'linear', fill: 'forwards' });
      } catch { /* The transform below supplies the same animation without WAAPI. */ }
    }
    const started = performance.now();
    let lastAnnounced = -1;
    function tick(now) {
      if (active !== state) return;
      const elapsed = now - started;
      const portion = Math.min(elapsed / (DURATION - 120), 1);
      const value = Math.round(portion * 100);
      percentage.textContent = `${String(value).padStart(2, '0')}%`;
      if (!state.animation) meter.style.transform = `scaleX(${portion})`;
      const stage = Math.min(3, Math.floor(portion * 4));
      if (state.stage !== stage) { state.stage = stage; localize(); }
      if (Math.floor(value / 20) !== lastAnnounced) {
        lastAnnounced = Math.floor(value / 20);
        progress.setAttribute('aria-valuenow', String(value));
      }
      if (elapsed >= DURATION) finish(); else state.frame = requestAnimationFrame(tick);
    }
    state.frame = requestAnimationFrame(tick);
    state.deadline = setTimeout(() => finish(true), DURATION + 100);
  }

  document.addEventListener('click', event => {
    if (!event.target.closest('[data-boot-replay]')) return;
    event.preventDefault();
    start(true);
  });
  window.addEventListener('writenor:boot-replay', () => start(true));
  window.addEventListener('writenor:language', localize);
  window.addEventListener('writenor:effects', () => { if (settingOff()) finish(true); });
  reduced.addEventListener('change', () => { if (reduced.matches) finish(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(true); });
  window.addEventListener('pagehide', () => finish(true));
  try { start(); } catch { finish(true); }
})();
