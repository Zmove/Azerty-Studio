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
  const billingThumb = $('[data-billing-thumb]'), billingTrack = $('[data-billing-track]');
  function setBilling(b) {
    if (b === billing) return;
    billing = b;
    billingBtns.forEach(btn => {
      const on = btn.dataset.billing === b;
      btn.style.color = on ? '#181714' : '#ece8e1';
      btn.setAttribute('aria-pressed', on);
    });
    if (billingThumb) billingThumb.style.transform = b === 'monthly' ? 'translateX(0)' : 'translateX(100%)';
    $$('[data-bind]').forEach(el => { el.textContent = PRICES[b][el.dataset.bind]; });
    if (motion) $$('[data-price]').forEach(el => el.animate([{ opacity: 0, transform: 'translateY(28px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 800, easing: ease }));
  }
  billingBtns.forEach(btn => btn.addEventListener('click', () => setBilling(btn.dataset.billing)));
  // Petit coup de pouce visuel sur le sélecteur quand il apparaît
  if (billingTrack && billingThumb && motion && 'IntersectionObserver' in window) {
    const bio = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      bio.disconnect();
      if (billing !== 'monthly') return;
      billingThumb.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(22%)', offset: .35 }, { transform: 'translateX(-4%)', offset: .7 }, { transform: 'translateX(0)' }], { duration: 1100, delay: 700, easing: 'cubic-bezier(.65,0,.35,1)' });
      billingTrack.animate([{ boxShadow: '0 0 0 0 color-mix(in oklch,var(--acc,#ec7a3c) 50%,transparent)' }, { boxShadow: '0 0 0 14px transparent' }], { duration: 1200, delay: 700, easing: 'ease-out' });
    }, { threshold: 1 });
    bio.observe(billingTrack);
  }

  // ---------- Le concept, en quatre temps (défilement épinglé) ----------
  const qa = (root, s) => [...root.querySelectorAll(s)];
  const S = {
    root: $('[data-story]'), row: $('[data-story-row]'), rail: $('[data-story-row] > ol'), stageCol: $('[data-stage-col]'), stage: $('[data-stage]'), bar: $('[data-story-bar]'), n: $('[data-story-n]'), steps: $$('[data-step]'),
    form: $('[data-l-form]'), type: $('[data-type]'), chips: $$('[data-chip]'), slots: $$('[data-slot]'), book: $('[data-book]'), bookT: $('[data-book-t]'),
    prep: $('[data-l-prep]'), winA: $('[data-win="a"]'), winB: $('[data-win="b"]'), prepT: $('[data-prep-t]'), prepS: $('[data-prep-status]'),
    cmp: $('[data-l-cmp]'), cmpA: $('[data-cmp-a]'), cmpH: $('[data-cmp-h]'), hint: $('[data-cmp-hint]'), choice: $('[data-l-choice]'),
    resNone: $('[data-result="none"]'), resPicked: $('[data-result="picked"]'), pickedL: $('[data-picked-l]'), choiceBtns: $$('[data-choice]')
  };
  let cmpPos = 50, cmpTween = 0, touched = false, dragging = false, choice = null;
  let storyStep = -1, storyNarrow = false, typedN = -1, booked, prepPct = -1;

  function setCmp(v) {
    cmpPos = v;
    S.cmpA.style.clipPath = 'inset(0 ' + (100 - v).toFixed(2) + '% 0 0)';
    S.cmpH.style.left = v.toFixed(2) + '%';
  }
  function tweenCmp(to) {
    cancelAnimationFrame(cmpTween);
    const from = cmpPos, t0 = performance.now(), dur = motion ? 900 : 1;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setCmp(from + (to - from) * e);
      if (t < 1) cmpTween = requestAnimationFrame(step);
    };
    cmpTween = requestAnimationFrame(step);
  }
  function renderChoice() {
    const styles = {
      A: ['var(--acc,#ec7a3c)', '#181714', 'var(--acc,#ec7a3c)'],
      B: ['var(--acc,#ec7a3c)', '#181714', 'var(--acc,#ec7a3c)'],
      none: ['#ece8e1', '#181714', '#ece8e1']
    };
    S.choiceBtns.forEach(btn => {
      const c = btn.dataset.choice, on = choice === c;
      btn.style.background = on ? styles[c][0] : 'transparent';
      btn.style.color = on ? styles[c][1] : '#ece8e1';
      btn.style.borderColor = on ? styles[c][2] : 'rgba(236,232,225,.2)';
      btn.setAttribute('aria-pressed', on);
    });
    S.resNone.hidden = choice !== 'none';
    S.resPicked.hidden = choice !== 'A' && choice !== 'B';
    if (choice === 'A' || choice === 'B') S.pickedL.textContent = choice;
  }
  function choose(c) {
    choice = choice === c ? null : c;
    touched = !!choice;
    renderChoice();
    tweenCmp(choice === 'A' ? 100 : choice === 'B' ? 0 : 50);
    if (choice && motion) {
      if (choice === 'none') S.resNone.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.34,1.4,.64,1)' });
      else S.resPicked.animate([{ opacity: 0, transform: 'translate(-50%,-12px) scale(.9)' }, { opacity: 1, transform: 'translate(-50%,0) scale(1)' }], { duration: 700, easing: 'cubic-bezier(.34,1.4,.64,1)' });
    }
  }
  S.choiceBtns.forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.choice)));

  function setPosFrom(e) {
    const r = S.cmp.getBoundingClientRect();
    touched = true;
    setCmp(Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100)));
  }
  if (S.cmp) {
    S.cmp.addEventListener('pointerdown', e => { dragging = true; S.cmp.style.cursor = 'grabbing'; S.cmp.setPointerCapture && S.cmp.setPointerCapture(e.pointerId); setPosFrom(e); });
    S.cmp.addEventListener('pointermove', e => { if (dragging) setPosFrom(e); });
    const stop = () => { dragging = false; S.cmp.style.cursor = 'grab'; };
    S.cmp.addEventListener('pointerup', stop);
    S.cmp.addEventListener('pointercancel', stop);
  }

  function fitStage() {
    if (!S.stageCol) return;
    const h = S.stageCol.clientHeight, w = S.stageCol.clientWidth;
    S.stage.style.maxWidth = Math.max(0, Math.min(w, h * 1.6)) + 'px';
  }
  function layoutStory() {
    if (!S.row) return;
    storyNarrow = window.innerWidth < 860;
    S.row.style.flexDirection = storyNarrow ? 'column' : 'row';
    S.row.style.alignItems = storyNarrow ? 'stretch' : 'center';
    S.rail.style.flex = storyNarrow ? '0 0 auto' : '0 0 clamp(240px,30%,440px)';
    storyStep = -1;
    storyFx(window.innerHeight);
    fitStage();
  }

  // Toute la séquence est pilotée par la position de défilement dans [data-story]
  function storyFx(vh) {
    if (!S.root) return;
    const cl = v => Math.min(1, Math.max(0, v));
    const r = S.root.getBoundingClientRect();
    const p = cl(-r.top / (r.height - vh));
    const seg = (a, b) => cl((p - a) / (b - a));
    const eo = t => 1 - Math.pow(1 - t, 3), io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = p >= .76 ? 3 : p >= .53 ? 2 : p >= .25 ? 1 : 0;
    S.bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (step !== storyStep) {
      storyStep = step;
      S.n.textContent = '0' + (step + 1);
      S.steps.forEach((li, i) => {
        const on = i === step;
        li.style.opacity = on ? '1' : '.32';
        li.style.display = storyNarrow && !on ? 'none' : '';
        li.querySelector('[data-step-body]').style.gridTemplateRows = on ? '1fr' : '0fr';
        li.querySelector('[data-step-n]').style.color = on ? 'var(--acc,#ec7a3c)' : '#9b968c';
      });
    }
    // 01 — formulaire (factice : rien n'est envoyé)
    const fOut = io(seg(.2, .28));
    S.form.style.opacity = (1 - fOut).toFixed(3);
    S.form.style.transform = 'translateY(' + (-fOut * 4).toFixed(2) + '%) scale(' + (1 - fOut * .12).toFixed(4) + ')';
    S.form.style.filter = fOut > 0 ? 'blur(' + (fOut * 10).toFixed(1) + 'px)' : '';
    const txt = S.type.dataset.text, nC = Math.round(txt.length * seg(.015, .09));
    if (nC !== typedN) { typedN = nC; S.type.textContent = txt.slice(0, nC); }
    let k = 0;
    S.chips.forEach(c => {
      const on = c.hasAttribute('data-pick') && p > .1 + (k++) * .016;
      c.style.background = on ? 'var(--acc,#ec7a3c)' : '';
      c.style.color = on ? '#181714' : '';
      c.style.borderColor = on ? 'var(--acc,#ec7a3c)' : '';
    });
    S.slots.forEach((sl, i) => {
      const on = i === 3 && p > .155;
      sl.style.background = on ? '#ece8e1' : '';
      sl.style.color = on ? '#181714' : '';
      sl.style.borderColor = on ? '#ece8e1' : '';
    });
    const isBooked = p > .18;
    if (isBooked !== booked) {
      booked = isBooked;
      S.book.style.background = booked ? 'var(--acc,#ec7a3c)' : '#ece8e1';
      S.book.style.transform = booked ? 'scale(1.03)' : '';
      S.bookT.textContent = booked ? '✓ Visio réservée — jeudi 15:30' : 'Réserver ma visio →';
    }
    // 02 — préparation des maquettes
    const pin = eo(seg(.23, .31)), split = eo(seg(.25, .36)), merge = io(seg(.47, .55));
    S.prep.style.opacity = (pin * (1 - seg(.555, .575))).toFixed(3);
    const sp = split * (1 - merge);
    const sc = (.3 + .16 * split) * (1 - merge) + merge;
    const y = (1 - pin) * 6 - 3 * sp;
    S.winA.style.transform = 'translate(' + (-26 * sp).toFixed(2) + '%,' + y.toFixed(2) + '%) rotate(' + (-3 * sp).toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
    S.winB.style.transform = 'translate(' + (26 * sp).toFixed(2) + '%,' + (y + 4 * sp).toFixed(2) + '%) rotate(' + (3 * sp).toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
    const bA = seg(.33, .44), bB = seg(.355, .465);
    [[S.winA, bA], [S.winB, bB]].forEach(([w, b]) => {
      w.querySelector('[data-render]').style.clipPath = 'inset(0 0 ' + ((1 - b) * 100).toFixed(2) + '% 0)';
      const scan = w.querySelector('[data-scan]');
      scan.style.top = (b * 100).toFixed(2) + '%';
      scan.style.opacity = b > 0 && b < 1 ? '1' : '0';
    });
    const pct = Math.round((bA + bB) * 50);
    if (pct !== prepPct) { prepPct = pct; S.prepT.textContent = pct >= 100 ? 'Deux maquettes prêtes ✓' : 'Préparation des maquettes · ' + pct + '%'; }
    S.prepS.style.opacity = (1 - merge).toFixed(3);
    // 03 — comparaison
    const cIn = seg(.53, .56);
    S.cmp.style.opacity = cIn.toFixed(3);
    S.cmp.style.pointerEvents = cIn > .9 ? 'auto' : 'none';
    S.hint.style.opacity = (seg(.56, .6) * (1 - seg(.72, .76))).toFixed(3);
    if (!touched && !choice) {
      const t = seg(.57, .74), fr = [50, 14, 86, 50], f = t * 3, i = Math.min(2, Math.floor(f));
      setCmp(fr[i] + (fr[i + 1] - fr[i]) * io(f - i));
    }
    if (p < .5 && (touched || choice)) { touched = false; if (choice) { choice = null; renderChoice(); } setCmp(50); }
    // 04 — choix
    const ch = eo(seg(.76, .8));
    S.choice.style.opacity = ch.toFixed(3);
    S.choice.style.transform = 'translate(-50%,' + ((1 - ch) * 24).toFixed(1) + 'px)';
    S.choice.style.pointerEvents = ch > .6 ? 'auto' : 'none';
  }

  if (S.root) {
    layoutStory();
    if ('ResizeObserver' in window && S.stageCol) new ResizeObserver(fitStage).observe(S.stageCol);
    const caret = $('[data-caret]');
    if (caret && motion) caret.animate([{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0, offset: .51 }, { opacity: 0 }], { duration: 1000, iterations: Infinity });
  }

  // ---------- Simulation IA : « IA + Alex » contre « IA seule » ----------
  const D = {
    root: $('[data-duo]'), canvas: $('[data-canvas]'), log: $('[data-log]'), tag: $('[data-duo-tag]'),
    ai: $('[data-cur="ai"]'), hu: $('[data-cur="hu"]'), title: $('[data-title]'), img: $('[data-duo-img]'),
    blk: { title: $('[data-blk="title"]'), btn: $('[data-blk="btn"]'), img: $('[data-blk="img"]'), cards: $('[data-blk="cards"]') },
    cards: $$('[data-card]'), live: $('[data-live]'), modeBtns: $$('[data-duo-mode]'),
    speed: $('[data-gauge="speed"]'), fit: $('[data-gauge="fit"]')
  };
  let duo = 'pair', duoTok = 0, duoVisible = false, duoT0 = 0;

  function duoReset(final) {
    D.log.innerHTML = '';
    D.tag.style.opacity = '0';
    D.title.textContent = 'Cuisine de saison, sans détour.';
    D.title.style.fontFamily = ''; D.title.style.fontStyle = '';
    Object.values(D.blk).forEach(b => { b.style.transform = ''; b.style.outline = ''; b.style.color = ''; });
    D.blk.btn.style.background = '#d4532b';
    D.img.style.filter = '';
    D.cards.forEach(c => { c.style.transform = ''; c.style.borderRadius = ''; });
    qa(D.canvas, '[data-sk]').forEach(k => { k.style.opacity = final ? '0' : '1'; });
    D.ai.style.opacity = '1';
    D.hu.style.opacity = duo === 'solo' ? '0' : '1';
    duoT0 = performance.now();
  }
  function moveCur(who, blk, fx, fy) {
    const c = D.canvas.getBoundingClientRect(), r = D.blk[blk].getBoundingClientRect();
    const el = who === 'ai' ? D.ai : D.hu;
    el.style.left = ((r.left - c.left + r.width * fx) / c.width * 100).toFixed(2) + '%';
    el.style.top = ((r.top - c.top + r.height * fy) / c.height * 100).toFixed(2) + '%';
  }
  function clickCur(who) {
    const el = who === 'ai' ? D.ai : D.hu;
    el.firstChild.animate([{ transform: 'scale(1)' }, { transform: 'scale(.78)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
  }
  function duoLog(who, text) {
    const ai = who === 'ai';
    const sec = Math.floor((performance.now() - duoT0) / 1000);
    const li = document.createElement('li');
    li.style.cssText = 'display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:baseline;font:400 14px/1.45 Geist,sans-serif;color:#c9c4bb';
    li.innerHTML = '<span style="padding:4px 8px;border-radius:99px;font:500 10px/1 \'Geist Mono\',monospace;letter-spacing:.08em;text-transform:uppercase;' + (ai ? 'background:var(--acc,#ec7a3c);color:#181714' : 'background:#ece8e1;color:#181714') + '">' + (ai ? 'IA' : 'Alex') + '</span><span style="text-wrap:pretty' + (ai ? '' : ';color:#ece8e1') + '"></span><span style="font:500 11px/1 \'Geist Mono\',monospace;color:#9b968c">00:' + String(sec).padStart(2, '0') + '</span>';
    li.children[1].textContent = text;
    D.log.prepend(li);
    li.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: ease });
    while (D.log.children.length > 7) D.log.lastChild.remove();
  }
  async function duoCycle(sleep) {
    const solo = duo === 'solo';
    duoReset();
    const sk = b => qa(D.blk[b], '[data-sk]').forEach(k => { k.style.opacity = '0'; });
    const ring = (b, color, dashed) => { D.blk[b].style.outline = color ? '2px ' + (dashed ? 'dashed ' : 'solid ') + color : ''; D.blk[b].style.outlineOffset = '6px'; };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const titles = ['Bienvenue chez Aurèle !', 'Le goût du Doubs.', 'Une table, une saison.', 'Restaurant moderne & convivial', 'Cuisine de saison, sans détour.'];
    const filters = ['hue-rotate(70deg) saturate(1.6)', 'grayscale(1)', 'sepia(.9)', 'contrast(1.5) saturate(.5)', 'hue-rotate(200deg)', 'saturate(2.2)'];
    const colors = ['#3b6cf6', '#2bb673', '#8a5cf6', '#e0b100', '#d4532b'];
    const steps = [
      { b: 'title', ai: '5 accroches générées en 2 secondes', hu: 'Retient la plus sobre, ajuste le rythme',
        gen: i => { D.title.textContent = titles[i % titles.length]; D.title.style.fontFamily = i % 2 ? "'Instrument Serif',serif" : ''; },
        ok: () => { D.title.textContent = 'Cuisine de saison, sans détour.'; D.title.style.fontFamily = ''; },
        bad: () => { D.title.textContent = 'Bienvenue chez Aurèle !'; D.title.style.fontFamily = "'Instrument Serif',serif"; D.blk.title.style.transform = 'rotate(-1.2deg) translateX(3%)'; D.blk.title.style.color = '#3b6cf6'; } },
      { b: 'img', ai: '6 traitements d’image proposés', hu: 'Garde la lumière naturelle du lieu',
        gen: i => { D.img.style.filter = filters[i % filters.length]; },
        ok: () => { D.img.style.filter = ''; },
        bad: () => { D.img.style.filter = filters[0]; D.blk.img.style.transform = 'translate(3%,2%) rotate(1.4deg)'; } },
      { b: 'btn', ai: 'Propose 5 palettes d’accent', hu: 'Choisit la terre cuite, vérifie le contraste',
        gen: i => { D.blk.btn.style.background = colors[i % colors.length]; },
        ok: () => { D.blk.btn.style.background = '#d4532b'; },
        bad: () => { D.blk.btn.style.background = '#2bb673'; D.blk.btn.style.transform = 'translateX(28%) rotate(-2deg)'; } },
      { b: 'cards', ai: 'Génère la grille et le code des cartes', hu: 'Aligne la grille, relit le code',
        gen: () => D.cards.forEach(c => { c.style.transform = 'translate(' + rnd(-8, 8).toFixed(1) + '%,' + rnd(-16, 16).toFixed(1) + '%) rotate(' + rnd(-3, 3).toFixed(1) + 'deg)'; c.style.borderRadius = rnd(0, 2.4).toFixed(1) + 'cqw'; }),
        ok: () => D.cards.forEach(c => { c.style.transform = ''; c.style.borderRadius = ''; }),
        bad: () => {} }
    ];
    await sleep(700);
    for (const st of steps) {
      moveCur('ai', st.b, .3, .45);
      await sleep(950);
      clickCur('ai'); ring(st.b, 'var(--acc,#ec7a3c)', true); sk(st.b); duoLog('ai', st.ai);
      for (let i = 0; i < 9; i++) { st.gen(i); await sleep(solo ? 90 : 120); }
      if (solo) { st.bad(); ring(st.b, ''); await sleep(450); continue; }
      moveCur('hu', st.b, .72, .6);
      await sleep(1000);
      clickCur('hu'); ring(st.b, '#181714'); st.ok(); duoLog('hu', st.hu);
      await sleep(900);
      ring(st.b, '');
    }
    moveCur('ai', 'img', .5, .82);
    if (!solo) moveCur('hu', 'title', .9, .1);
    await sleep(600);
    if (solo) duoLog('ai', 'Termine en 9 s. Aucune décision prise.');
    else duoLog('hu', 'Valide la maquette, prête à présenter');
    D.tag.textContent = solo ? '⚠ Incohérent · à reprendre' : '✓ Prête à présenter';
    D.tag.style.background = solo ? '#181714' : 'var(--acc,#ec7a3c)';
    D.tag.style.color = solo ? '#ece8e1' : '#181714';
    D.tag.style.opacity = '1';
    await sleep(3600);
  }
  async function runDuo() {
    const tok = ++duoTok;
    const sleep = ms => new Promise(r => setTimeout(r, ms)).then(() => { if (tok !== duoTok) throw 'stop'; });
    try { for (;;) await duoCycle(sleep); } catch (e) { if (e !== 'stop') console.error(e); }
  }
  function setDuo(m) {
    if (duo === m) return;
    duo = m;
    D.modeBtns.forEach(btn => {
      const on = btn.dataset.duoMode === m;
      btn.style.background = on ? (m === 'solo' ? 'var(--acc,#ec7a3c)' : '#ece8e1') : 'transparent';
      btn.style.color = on ? '#181714' : '#ece8e1';
      btn.setAttribute('aria-pressed', on);
    });
    D.speed.style.width = m === 'solo' ? '100%' : '86%';
    D.fit.style.width = m === 'solo' ? '22%' : '96%';
    if (duoVisible) runDuo(); else duoReset(true);
  }
  if (D.root) {
    D.modeBtns.forEach(btn => btn.addEventListener('click', () => setDuo(btn.dataset.duoMode)));
    if (motion && D.live) D.live.animate([{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 1400, iterations: Infinity });
    if (!motion || !('IntersectionObserver' in window)) duoReset(true);
    else {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !duoVisible) { duoVisible = true; runDuo(); }
        else if (!en.isIntersecting && duoVisible) { duoVisible = false; duoTok++; }
      }, { threshold: .35 }).observe(D.canvas);
    }
  }

  // ---------- Appel à l'action final ----------
  function setupCta() {
    const btn = $('[data-cta-btn]');
    if (btn) {
      const fill = btn.querySelector('[data-cta-fill]'), t = btn.querySelector('[data-cta-t]'), sub = btn.querySelector('[data-cta-s]'), ar = btn.querySelector('[data-cta-arrow]');
      btn.addEventListener('mouseenter', () => { fill.style.width = 'calc(100% - 18px)'; t.style.color = '#181714'; sub.style.color = '#181714'; ar.style.transform = 'rotate(0deg)'; btn.style.borderColor = 'var(--acc,#ec7a3c)'; });
      btn.addEventListener('mouseleave', () => { fill.style.width = 'clamp(52px,4.4vw,64px)'; t.style.color = ''; sub.style.color = ''; ar.style.transform = ''; btn.style.borderColor = ''; });
    }
    const sec = $('#cta'), field = $('[data-cta-field]');
    if (!sec || !field || !motion) return;
    $$('[data-cta-glow]').forEach((g, i) => {
      const k = [[-6, -4, 1.12], [9, 7, .9], [-8, 10, 1.18]][i] || [5, 5, 1.05];
      g.animate([
        { translate: '0 0', scale: '1' },
        { translate: k[0] + 'vw ' + k[1] + 'vw', scale: String(k[2]) },
        { translate: (-k[1]) + 'vw ' + (k[0] * .6) + 'vw', scale: String(2 - k[2]) },
        { translate: '0 0', scale: '1' }
      ], { duration: 16000 + i * 5000, iterations: Infinity, easing: 'ease-in-out' });
    });
    if (!finePointer) return;
    sec.addEventListener('mousemove', e => {
      const r = sec.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      field.style.transform = 'translate3d(' + (x * 14).toFixed(2) + 'vw,' + (y * 10).toFixed(2) + 'vw,0)';
    });
    sec.addEventListener('mouseleave', () => { field.style.transform = ''; });
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
    storyFx(vh);
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
  window.addEventListener('resize', () => { layoutStory(); scrollFx(); });

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
  setupCta();
  setupMarquee();
})();
