// Interactions de la page d'accueil — portage vanilla du script de la maquette
// (design/Accueil.dc.html). Aucune dépendance.
(() => {
  const ACCENT = '#ec7a3c';
  const ease = 'cubic-bezier(.16,1,.3,1)';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduced;
  const finePointer = matchMedia('(pointer:fine)').matches;

  document.documentElement.style.setProperty('--acc', ACCENT);

  // ---------- Clavier AZERTY ----------
  const KEYS = ['A', 'Z', 'E', 'R', 'T', 'Y'];
  const KEY_UP = 'inset 0 1px 0 rgba(255,255,255,.08), 0 6px 0 #0b0a09, 0 16px 28px rgba(0,0,0,.5)';
  const KEY_DOWN = 'inset 0 1px 0 rgba(255,255,255,.05), 0 2px 0 #0b0a09, 0 6px 14px rgba(0,0,0,.45)';
  const pressed = {};
  let typed = '';
  const keyEls = Object.fromEntries($$('[data-key]').map(b => [b.dataset.key, b]));
  const averti = $('[data-averti]');

  function renderKeys() {
    const ok = typed === 'AZERTY';
    if (averti) averti.hidden = !ok;
    KEYS.forEach(k => {
      const b = keyEls[k];
      if (!b) return;
      const cap = b.querySelector('[data-key-cap]');
      b.style.transform = pressed[k] ? 'translateY(5px)' : 'translateY(0)';
      b.style.boxShadow = pressed[k] ? KEY_DOWN : KEY_UP;
      cap.style.color = pressed[k] || ok ? 'var(--acc,#ec7a3c)' : '#ece8e1';
      cap.style.textShadow = pressed[k] ? '0 0 28px var(--acc,#ec7a3c)' : 'none';
    });
  }
  function press(k, down) {
    if (!!pressed[k] === down) return;
    pressed[k] = down;
    if (down) typed = (typed + k).slice(-6);
    renderKeys();
  }
  Object.entries(keyEls).forEach(([k, b]) => {
    b.addEventListener('pointerdown', () => press(k, true));
    b.addEventListener('pointerup', () => press(k, false));
    b.addEventListener('pointerleave', () => press(k, false));
  });
  window.addEventListener('keydown', e => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && e.target.closest && e.target.closest('input,textarea,[contenteditable="true"]')) return;
    const k = (e.key || '').toUpperCase();
    if (KEYS.includes(k)) press(k, true);
  });
  window.addEventListener('keyup', e => { const k = (e.key || '').toUpperCase(); if (KEYS.includes(k)) press(k, false); });

  // ---------- Tarifs : mensuel / paiement unique ----------
  const PRICES = {
    monthly: { oneP: '19,90€', oneU: 'par mois', oneN: 'Sur 12 mois', multiP: '39,90€', multiU: 'par mois', multiN: 'Sur 12 mois' },
    once: { oneP: '790€', oneU: 'une seule fois', oneN: 'Hébergement offert', multiP: '1 990€', multiU: 'une seule fois', multiN: 'Hébergement offert' }
  };
  let billing = 'monthly';
  const billingBtns = $$('[data-billing]');
  function setBilling(b) {
    if (b === billing) return;
    billing = b;
    billingBtns.forEach(btn => {
      const on = btn.dataset.billing === b;
      btn.style.background = on ? '#181714' : 'transparent';
      btn.style.color = on ? '#ece8e1' : '#181714';
      btn.setAttribute('aria-pressed', on);
    });
    $$('[data-bind]').forEach(el => { el.textContent = PRICES[b][el.dataset.bind]; });
    if (motion) $$('[data-price]').forEach(el => el.animate([{ opacity: 0, transform: 'translateY(28px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 800, easing: ease }));
  }
  billingBtns.forEach(btn => btn.addEventListener('click', () => setBilling(btn.dataset.billing)));

  // ---------- Comparateur A / B ----------
  const cmp = $('[data-compare]'), cmpA = $('[data-compare-a]'), cmpHandle = $('[data-compare-handle]');
  let touched = false, dragging = false;
  function setPos(pos) {
    cmpA.style.clipPath = 'inset(0 ' + (100 - pos).toFixed(2) + '% 0 0)';
    cmpHandle.style.left = pos.toFixed(2) + '%';
  }
  function setPosFrom(e) {
    const r = cmp.getBoundingClientRect();
    touched = true;
    setPos(Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100)));
  }
  if (cmp) {
    cmp.addEventListener('pointerdown', e => { dragging = true; cmp.style.cursor = 'grabbing'; cmp.setPointerCapture && cmp.setPointerCapture(e.pointerId); setPosFrom(e); });
    cmp.addEventListener('pointermove', e => { if (dragging) setPosFrom(e); });
    const stop = () => { dragging = false; cmp.style.cursor = 'grab'; };
    cmp.addEventListener('pointerup', stop);
    cmp.addEventListener('pointercancel', stop);
    if (motion && 'IntersectionObserver' in window) {
      const hio = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return;
        hio.disconnect();
        const frames = [50, 22, 78, 50], seg = 900, t0 = performance.now() + 500;
        const step = now => {
          if (touched) return;
          const t = Math.max(0, now - t0) / seg, i = Math.floor(t);
          if (i >= frames.length - 1) { setPos(50); return; }
          const f = t - i, e = f < .5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
          setPos(frames[i] + (frames[i + 1] - frames[i]) * e);
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
      hio.observe(cmp);
    }
  }

  // ---------- Découpage de texte en caractères ----------
  function splitText(el) {
    const chars = [], pairs = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          const holder = document.createElement('span');
          holder.style.display = 'contents';
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { holder.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.style.cssText = 'display:inline-block;white-space:nowrap';
            for (const ch of part) {
              const c = document.createElement('span');
              c.textContent = ch;
              c.style.display = 'inline-block';
              w.appendChild(c); chars.push(c);
            }
            holder.appendChild(w);
          });
          n.replaceWith(holder);
          pairs.push([n, holder]);
        } else if (n.nodeType === 1 && !/^(IMG|BR)$/.test(n.tagName) && !n.hasAttribute('data-pill')) walk(n);
      });
    };
    walk(el);
    return { chars, restore: () => pairs.forEach(([n, h]) => { if (h.isConnected) h.replaceWith(n); }) };
  }

  function animateChars(el, mode) {
    const { chars, restore } = splitText(el);
    if (!chars.length) return;
    const stagger = Math.min(mode === 'rise' ? 50 : 22, 900 / chars.length);
    const kf = mode === 'rise'
      ? [{ transform: 'translateY(100%)' }, { transform: 'none' }]
      : mode === 'mask'
        ? [{ transform: 'translateY(110%) rotate(8deg)' }, { transform: 'none' }]
        : [{ opacity: 0, transform: 'translateY(.4em) rotate(3deg)', filter: 'blur(3px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }];
    let last;
    chars.forEach((c, i) => { last = c.animate(kf, { duration: mode === 'rise' ? 1300 : 1000, delay: (+(el.dataset.delay || 0)) + i * stagger, easing: ease, fill: 'backwards' }); });
    // Remet les nœuds texte d'origine une fois l'animation terminée
    if (last) last.finished.then(restore).catch(() => {});
  }

  // ---------- Point qui rebondit ----------
  let bouncing = false;
  function bounce() {
    const d = $('[data-bounce]');
    if (!d || bouncing || !motion) return;
    bouncing = true;
    const up = 'cubic-bezier(.2,.75,.35,1)', fall = 'cubic-bezier(.65,0,.9,.45)';
    const a = d.animate([
      { transform: 'translateY(0) scale(1,1)', easing: 'ease-out' },
      { transform: 'translateY(0) scale(1.4,.6)', offset: .12, easing: up },
      { transform: 'translateY(-.6em) scale(.82,1.22)', offset: .36, easing: 'ease-out' },
      { transform: 'translateY(-.68em) scale(1,1)', offset: .44, easing: fall },
      { transform: 'translateY(0) scale(1.35,.65)', offset: .6, easing: up },
      { transform: 'translateY(-.16em) scale(.92,1.1)', offset: .74, easing: fall },
      { transform: 'translateY(0) scale(1.12,.88)', offset: .86, easing: 'ease-out' },
      { transform: 'translateY(0) scale(1,1)' }
    ], { duration: 1400 });
    const done = () => { bouncing = false; };
    a.finished.then(done).catch(done);
  }

  // ---------- Intro du hero ----------
  function heroIntro() {
    if (!motion) return;
    const arrow = $('[data-arrow-loop]');
    if (arrow) arrow.animate([
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(150%)', opacity: 0, offset: .4 },
      { transform: 'translateY(-150%)', opacity: 0, offset: .41 },
      { transform: 'translateY(0)', opacity: 1, offset: .8 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 2200, iterations: Infinity, easing: 'cubic-bezier(.65,0,.35,1)', delay: 1600 });
    const loop = delay => setTimeout(() => {
      if (window.scrollY < window.innerHeight && !document.hidden) bounce();
      loop(4000 + Math.random() * 3000);
    }, delay);
    loop(2300);
    $$('[data-hero]').forEach((el, i) => { el.dataset.delay = 200 + i * 380; animateChars(el, 'mask'); });
    $$('[data-pill]').forEach(el => el.animate([{ transform: 'translateY(.06em) scale(0)', opacity: 0 }, { transform: 'translateY(.06em) scale(1)', opacity: 1 }], { duration: 1200, delay: 650, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' }));
    $$('[data-hero-fade]').forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 1200, delay: 900 + i * 140, easing: ease, fill: 'backwards' }));
  }

  // ---------- Apparitions au défilement ----------
  function setupReveal() {
    if (!motion || !('IntersectionObserver' in window)) return;
    const vh = window.innerHeight;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        const d = +(el.dataset.delay || 0);
        if (el.hasAttribute('data-split')) {
          el.style.opacity = '';
          animateChars(el, el.dataset.splitMode);
        } else if (el.hasAttribute('data-clip')) {
          el.style.clipPath = '';
          el.animate([{ clipPath: 'inset(22% 12% 22% 12% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 8px)' }], { duration: 1600, delay: d, easing: ease, fill: 'backwards' });
          const img = el.querySelector('img');
          if (img && !img.hasAttribute('data-parallax')) img.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 1800, delay: d, easing: ease, fill: 'backwards' });
        } else if (el.hasAttribute('data-seq')) {
          const items = [...el.querySelectorAll('[data-seq-i]')], gap = 420;
          items.forEach((it, i) => {
            it.style.opacity = '';
            const op = it.hasAttribute('data-op');
            it.animate(op
              ? [{ opacity: 0, transform: 'scale(0) rotate(-140deg)' }, { opacity: 1, transform: 'none' }]
              : [{ opacity: 0, transform: 'translateX(-56px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
              { duration: op ? 900 : 1100, delay: i * gap, easing: op ? 'cubic-bezier(.34,1.56,.64,1)' : ease, fill: 'backwards' });
          });
          const last = items[items.length - 1];
          if (last) last.animate([{ transform: 'none' }, { transform: 'scale(1.05)' }, { transform: 'none' }], { duration: 800, delay: items.length * gap + 500, easing: ease });
        } else if (el.hasAttribute('data-pop')) {
          el.style.opacity = '';
          el.animate([
            { opacity: 0, transform: 'translateY(30px) scale(.6)', clipPath: 'inset(0 50% 0 50% round 999px)' },
            { opacity: 1, transform: 'translateY(0) scale(1)', clipPath: 'inset(0 0% 0 0% round 999px)' }
          ], { duration: 1100, delay: 700, easing: 'cubic-bezier(.34,1.45,.64,1)', fill: 'backwards' });
          const ar = el.querySelector('[data-pop-arrow]');
          if (ar) {
            ar.animate([{ transform: 'translateX(-24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, delay: 1300, easing: ease, fill: 'backwards' });
            ar.animate([{ transform: 'none' }, { transform: 'translateX(6px)', offset: .15 }, { transform: 'none', offset: .3 }, { transform: 'none' }], { duration: 2600, delay: 2400, iterations: Infinity, easing: 'ease-in-out' });
          }
        } else if (el.hasAttribute('data-keys')) {
          [...el.children].forEach((k, i) => {
            k.style.opacity = '';
            k.animate([{ opacity: 0, transform: 'translateY(-90px) rotate(' + (i % 2 ? 8 : -8) + 'deg)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 1100, delay: i * 80, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' });
          });
        } else {
          el.style.opacity = '';
          el.animate([{ opacity: 0, transform: 'translateY(56px)' }, { opacity: 1, transform: 'none' }], { duration: 1200, delay: d, easing: ease, fill: 'backwards' });
        }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    $$('[data-reveal],[data-split],[data-clip],[data-keys],[data-seq],[data-pop]').forEach(el => {
      if (el.getBoundingClientRect().top > vh) {
        if (el.hasAttribute('data-clip')) el.style.clipPath = 'inset(22% 12% 22% 12% round 18px)';
        else if (el.hasAttribute('data-keys')) [...el.children].forEach(k => { k.style.opacity = '0'; });
        else if (el.hasAttribute('data-seq')) el.querySelectorAll('[data-seq-i]').forEach(k => { k.style.opacity = '0'; });
        else el.style.opacity = '0';
      }
      io.observe(el);
    });
  }

  function setupMarks() {
    if (!motion) return;
    $$('[data-mark]').forEach(el => el.animate([{ backgroundPosition: '0% 0' }, { backgroundPosition: '-200% 0' }], { duration: 5000, iterations: Infinity, easing: 'linear' }));
  }

  function setupCounters() {
    if (!motion || !('IntersectionObserver' in window)) return;
    const cio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        cio.unobserve(el);
        const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), dur = 1800;
        const step = now => {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
          el.textContent = (target * e).toFixed(dec).replace('.', ',');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(el => cio.observe(el));
  }

  // ---------- Effets liés au défilement ----------
  const els = {
    scale: $$('[data-scale]'),
    drift: $$('[data-drift]'),
    dots: $$('[data-dot]'),
    final: $('[data-final]'),
    rings: $$('[data-ring]'),
    parallax: $$('[data-parallax]'),
    speed: $$('[data-speed]'),
    rows: $$('[data-row]')
  };
  const header = $('[data-header]'), navbar = $('[data-navbar]');
  const proc = $('[data-process]'), fill = $('[data-fill]');
  let lastY = window.scrollY, navSolid, navHidden, finalOn, activeRow, hoverRow = false, ringAnims = [];
  let marquee = null, mTarget = 1, mRate = 1;

  function setFinal(on) {
    const fin = els.final;
    fin.style.background = on ? 'var(--acc,#ec7a3c)' : '#181714';
    fin.style.color = on ? '#181714' : '#ece8e1';
    fin.style.borderColor = on ? 'var(--acc,#ec7a3c)' : '';
    fin.style.transform = on ? 'scale(1.22)' : '';
    fin.style.boxShadow = on ? '0 0 48px color-mix(in oklch, var(--acc,#ec7a3c) 55%, transparent)' : '';
    ringAnims.forEach(a => a.cancel());
    ringAnims = [];
    if (!on || !motion) return;
    fin.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1.22)' }], { duration: 900, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    els.rings.forEach((ring, i) => {
      ringAnims.push(ring.animate([
        { transform: 'scale(1)', opacity: .55 },
        { transform: 'scale(2.6)', opacity: 0 }
      ], { duration: 2400, delay: 300 + i * 1200, iterations: Infinity, easing: 'cubic-bezier(.16,1,.3,1)' }));
    });
  }

  function setActiveRow(i) {
    if (i === activeRow) return;
    activeRow = i;
    els.rows.forEach((r, j) => {
      const on = j === i;
      r.style.background = on ? 'var(--acc,#ec7a3c)' : '';
      r.style.paddingLeft = r.style.paddingRight = on ? 'clamp(16px,2vw,32px)' : '';
      const ar = r.querySelector('[data-row-arrow]');
      if (ar) { ar.style.width = on ? '1.1em' : '0'; ar.style.opacity = on ? '1' : '0'; }
    });
  }

  function scrollFx() {
    const vh = window.innerHeight, sy = window.scrollY;
    const v = sy - lastY; lastY = sy;
    if (navbar) {
      const solid = sy > 40;
      if (solid !== navSolid) {
        navSolid = solid;
        const nb = navbar.style;
        nb.background = solid ? 'rgba(24,23,20,.72)' : 'rgba(24,23,20,0)';
        nb.borderColor = solid ? 'rgba(236,232,225,.1)' : 'transparent';
        nb.backdropFilter = nb.webkitBackdropFilter = solid ? 'blur(18px) saturate(1.4)' : 'blur(0px)';
        nb.boxShadow = solid ? '0 12px 40px -12px rgba(0,0,0,.45)' : 'none';
      }
      if (Math.abs(v) > 4) {
        const hide = v > 0 && sy > vh * 0.8;
        if (hide !== navHidden) { navHidden = hide; header.style.transform = hide ? 'translateY(-120%)' : ''; }
      }
    }
    if (marquee) mTarget = Math.max(-7, Math.min(9, 1 + v * 0.18));
    if (proc && fill) {
      const r = proc.getBoundingClientRect();
      fill.style.transform = 'scaleY(' + Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height)) + ')';
    }
    els.dots.forEach(d => {
      const r = d.getBoundingClientRect(), on = r.top + r.height / 2 < vh * 0.6;
      d.style.background = on ? 'var(--acc,#ec7a3c)' : '#181714';
      d.style.color = on ? '#181714' : '';
      d.style.borderColor = on ? 'var(--acc,#ec7a3c)' : '';
    });
    if (els.final) {
      const r = els.final.getBoundingClientRect(), on = r.top + r.height / 2 < vh * 0.6;
      if (on !== finalOn) { finalOn = on; setFinal(on); }
    }
    if (els.rows.length && !hoverRow) {
      let best = -1, bd = Infinity;
      els.rows.forEach((r, j) => {
        const b = r.getBoundingClientRect(), c = b.top + b.height / 2, dist = Math.abs(c - vh * 0.5);
        if (b.top < vh * 0.7 && b.bottom > vh * 0.3 && dist < bd) { bd = dist; best = j; }
      });
      setActiveRow(best);
    }
    if (!motion) return;
    els.speed.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top > vh * 1.2 || r.bottom < -vh * 0.2) return;
      const cur = parseFloat(el.dataset.ty || 0);
      const y = (r.top - cur + r.height / 2 - vh / 2) * -parseFloat(el.dataset.speed);
      el.dataset.ty = y;
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    });
    if (sy < vh * 1.3) els.drift.forEach(el => { el.style.transform = 'translate3d(' + (sy * parseFloat(el.dataset.drift)).toFixed(1) + 'px,0,0)'; });
    els.scale.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) return;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8))), e = 1 - Math.pow(1 - p, 3);
      el.style.transform = 'scale(' + (0.82 + 0.18 * e).toFixed(4) + ')';
    });
    els.parallax.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const y = (r.top + r.height / 2 - vh / 2) * -parseFloat(img.dataset.parallax);
      img.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(1.15)';
    });
  }

  els.rows.forEach((r, j) => {
    r.addEventListener('mouseenter', () => { hoverRow = true; setActiveRow(j); });
    r.addEventListener('mouseleave', () => { hoverRow = false; scrollFx(); });
  });
  let raf = 0;
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; scrollFx(); }); }, { passive: true });

  // ---------- Effets pointeur (souris uniquement) ----------
  function setupPointerFx() {
    if (!finePointer) return;
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        const k = el.closest('#tarifs') ? 13 : 5;
        el.style.transform = 'perspective(1000px) rotateX(' + (-y * k).toFixed(2) + 'deg) rotateY(' + (x * k).toFixed(2) + 'deg) translateY(-8px)' + (k > 5 ? ' scale(1.015)' : '');
        if (k > 5) el.style.boxShadow = (-x * 30).toFixed(0) + 'px ' + (30 - y * 20).toFixed(0) + 'px 60px -20px rgba(24,23,20,.35)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.boxShadow = ''; });
    });
    $$('[data-magnetic]').forEach(el => {
      const f = parseFloat(el.dataset.magnetic) || 0.25;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * f).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * f).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    const pill = $('[data-pill]'), pimg = pill && pill.querySelector('img');
    if (pill && motion) window.addEventListener('mousemove', e => {
      if (window.scrollY > window.innerHeight) return;
      const r = pill.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.4)));
      const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.4)));
      pill.style.transform = 'translateY(.06em) perspective(500px) rotateY(' + (dx * 30).toFixed(1) + 'deg) rotateX(' + (-dy * 30).toFixed(1) + 'deg)';
      if (pimg) pimg.style.transform = 'scale(1.25) translate(' + (-dx * 7).toFixed(1) + '%,' + (-dy * 7).toFixed(1) + '%)';
    });
    const h1 = $('[data-h1]');
    if (h1) { h1.addEventListener('mouseenter', bounce); h1.addEventListener('click', bounce); }
    const logo = $('[data-logo]');
    if (logo && motion) {
      const letters = [...logo.querySelectorAll('[data-logo-l]')], studio = logo.querySelector('[data-logo-s]'), dot = logo.querySelector('[data-logo-d]');
      let busy = false;
      logo.addEventListener('mouseenter', () => {
        if (busy) return; busy = true;
        letters.forEach((l, i) => l.animate([
          { transform: 'none', color: '#ece8e1' },
          { transform: 'translateY(3px) scale(1.15,.75)', color: 'var(--acc,#ec7a3c)', offset: .25 },
          { transform: 'translateY(-5px) scale(.92,1.1)', color: 'var(--acc,#ec7a3c)', offset: .55, easing: 'cubic-bezier(.33,0,.2,1)' },
          { transform: 'translateY(0) scale(1)', color: '#ece8e1' }
        ], { duration: 560, delay: i * 55, easing: 'ease-out' }));
        studio.animate([{ transform: 'translateX(0) skewX(0)' }, { transform: 'translateX(4px) skewX(-8deg)', offset: .5 }, { transform: 'translateX(0) skewX(0)' }], { duration: 700, delay: 300, easing: ease });
        const a = dot.animate([{ transform: 'none' }, { transform: 'translateY(-7px) rotate(-12deg)', offset: .4 }, { transform: 'translateY(0) scale(1.2,.8)', offset: .7, easing: 'cubic-bezier(.33,0,.2,1)' }, { transform: 'translateY(0) rotate(0) scale(1)' }], { duration: 720, delay: 480, easing: 'ease-out' });
        a.finished.then(() => { busy = false; }).catch(() => { busy = false; });
      });
    }
    const glow = $('[data-glow]');
    if (glow && motion) {
      glow.animate([
        { translate: '0 0', scale: '1' },
        { translate: '-9vw 6vw', scale: '1.14' },
        { translate: '-3vw 13vw', scale: '0.94' },
        { translate: '6vw 4vw', scale: '1.08' },
        { translate: '0 0', scale: '1' }
      ], { duration: 22000, iterations: Infinity, easing: 'ease-in-out' });
      window.addEventListener('mousemove', e => {
        if (window.scrollY > window.innerHeight) return;
        glow.style.transform = 'translate3d(' + ((e.clientX / window.innerWidth - .5) * -160).toFixed(0) + 'px,' + ((e.clientY / window.innerHeight - .5) * 120).toFixed(0) + 'px,0)';
      });
    }
  }

  // ---------- Curseur personnalisé ----------
  function setupCursor() {
    if (!finePointer) return;
    const c = document.createElement('div');
    Object.assign(c.style, {
      position: 'fixed', left: '0', top: '0', width: '14px', height: '14px', marginLeft: '-7px', marginTop: '-7px',
      borderRadius: '50%', background: '#ece8e1', mixBlendMode: 'difference', pointerEvents: 'none', zIndex: '9999',
      display: 'grid', placeItems: 'center', color: '#181714', font: '500 12px/1 "Geist Mono", monospace',
      letterSpacing: '.06em', textTransform: 'uppercase', opacity: '0',
      transition: 'width .45s cubic-bezier(.16,1,.3,1), height .45s cubic-bezier(.16,1,.3,1), margin .45s cubic-bezier(.16,1,.3,1), background .3s, opacity .3s'
    });
    document.body.appendChild(c);
    let x = -100, y = -100, cx = -100, cy = -100, mode = '';
    const setMode = (m, label) => {
      if (m === mode) return;
      mode = m;
      const s = m === 'label' ? 96 : m === 'link' ? 56 : 14;
      c.style.width = c.style.height = s + 'px';
      c.style.marginLeft = c.style.marginTop = -s / 2 + 'px';
      c.style.mixBlendMode = m === 'label' ? 'normal' : 'difference';
      c.style.background = m === 'label' ? 'var(--acc,#ec7a3c)' : '#ece8e1';
      c.textContent = m === 'label' ? label : '';
    };
    window.addEventListener('mousemove', e => {
      x = e.clientX; y = e.clientY; c.style.opacity = '1';
      const t = e.target && e.target.closest ? e.target : null;
      const lab = t && t.closest('[data-cursor]');
      if (lab) setMode('label', lab.getAttribute('data-cursor'));
      else if (t && t.closest('header')) setMode('');
      else if (t && t.closest('a,button,[role=tablist]')) setMode('link');
      else setMode('');
    });
    document.addEventListener('mouseout', e => { if (!e.relatedTarget) c.style.opacity = '0'; });
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      c.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ---------- Bandeau défilant ----------
  function setupMarquee() {
    const m = $('[data-marquee]');
    if (!motion || !m) return;
    marquee = m.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 42000, iterations: Infinity });
    const loop = () => {
      mTarget += (1 - mTarget) * 0.04;
      mRate += (mTarget - mRate) * 0.12;
      marquee.playbackRate = mRate;
      requestAnimationFrame(loop);
    };
    loop();
  }

  scrollFx();
  heroIntro();
  setupMarks();
  setupReveal();
  setupCounters();
  setupCursor();
  setupPointerFx();
  setupMarquee();
})();
