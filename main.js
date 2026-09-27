// Kosmetolog/Laser Szczecin, wspólne skrypty dla index.html i uslugi.html
(function () {
  if (window.lucide) lucide.createIcons();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nagłówek: cień po przewinięciu, pasek CTA na telefonie
  const header = document.getElementById('site-header');
  const mobileCta = document.getElementById('mobile-cta');
  const contact = document.getElementById('kontakt');
  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (mobileCta) {
      let show = y > 520;
      if (contact && contact.getBoundingClientRect().top < window.innerHeight * 0.85) show = false;
      mobileCta.classList.toggle('is-visible', show);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu mobilne
  const menuBtn = document.getElementById('menu-toggle');
  const menuPanel = document.getElementById('menu-panel');
  if (menuBtn && menuPanel) {
    const setMenu = (open) => {
      menuPanel.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
      menuBtn.querySelector('[data-icon="open"]').classList.toggle('hidden', open);
      menuBtn.querySelector('[data-icon="close"]').classList.toggle('hidden', !open);
    };
    menuBtn.addEventListener('click', () => setMenu(!menuPanel.classList.contains('is-open')));
    menuPanel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  // Pojawianie się sekcji
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Wideo w lustrze: bez autoodtwarzania przy ograniczonym ruchu
  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    if (reduceMotion) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    } else {
      heroVideo.play().catch(() => {});
    }
  }

  // Filtry galerii
  const chips = document.querySelectorAll('[data-filter]');
  const tiles = document.querySelectorAll('#galeria .tile');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      tiles.forEach((t) => {
        t.hidden = !(f === 'all' || t.dataset.cat.split(' ').includes(f));
      });
    });
  });

  // Podstrona zabiegów: podświetlenie aktywnej kategorii w pasku
  const jump = document.getElementById('jump-nav');
  if (jump && 'IntersectionObserver' in window) {
    const links = Array.from(jump.querySelectorAll('a[href^="#"]'));
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const active = byId.get(entry.target.id);
        links.forEach((a) => {
          a.classList.toggle('is-active', a === active);
          if (a === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
        if (active) jump.scrollTo({ left: active.offsetLeft - 20, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  // Lightbox (zdjęcia i wideo)
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const stage = lb.querySelector('.lb-stage');
  const caption = lb.querySelector('.lb-caption');
  const btnPrev = lb.querySelector('.lb-prev');
  const btnNext = lb.querySelector('.lb-next');
  let items = [];
  let index = 0;
  let lastFocus = null;

  function render() {
    const item = items[index];
    stage.innerHTML = '';
    let el;
    if (item.dataset.type === 'video') {
      el = document.createElement('video');
      el.src = item.dataset.src;
      el.controls = true;
      el.playsInline = true;
      el.autoplay = true;
      if (item.dataset.poster) el.poster = item.dataset.poster;
    } else {
      el = document.createElement('img');
      el.src = item.dataset.src;
      el.alt = item.dataset.caption || '';
    }
    stage.appendChild(el);
    caption.textContent = item.dataset.caption || '';
    const multi = items.length > 1;
    btnPrev.hidden = !multi;
    btnNext.hidden = !multi;
  }

  function open(trigger) {
    const group = trigger.dataset.group;
    items = Array.from(document.querySelectorAll(`[data-lb][data-group="${group}"]`)).filter((el) => !el.hidden);
    index = Math.max(0, items.indexOf(trigger));
    lastFocus = trigger;
    render();
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }

  function close() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    const v = stage.querySelector('video');
    if (v) v.pause();
    setTimeout(() => { lb.hidden = true; stage.innerHTML = ''; }, 350);
    if (lastFocus) lastFocus.focus();
  }

  function step(dir) {
    index = (index + dir + items.length) % items.length;
    render();
  }

  document.querySelectorAll('[data-lb]').forEach((el) => {
    el.addEventListener('click', () => open(el));
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  btnPrev.addEventListener('click', () => step(-1));
  btnNext.addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && items.length > 1) step(-1);
    if (e.key === 'ArrowRight' && items.length > 1) step(1);
    if (e.key === 'Tab') {
      const focusables = Array.from(lb.querySelectorAll('button:not([hidden]), video'));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
