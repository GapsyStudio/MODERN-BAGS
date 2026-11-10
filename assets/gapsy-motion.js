// @ts-nocheck
/*
  Gapsy · Modern Bags — animation core.
  - Registers GSAP + ScrollTrigger (text is split by Gapsy.split, no SplitText needed), starts Lenis smooth scroll on the real scroller
    (Horizon scrolls `.page-wrapper` on desktop ≥990px, `window` on mobile).
  - Each section script calls Gapsy.register('name', (el, { desktop, mobile, reduce }) => cleanup).
    Sections are mounted with gsap.matchMedia, re-mounted in the theme editor on section:load.
  - Gapsy.intro: Promise resolved when the preloader finishes (or immediately if there is none).
  Smooth scroll can be switched off in Theme settings → Modern Bags · Motion.
*/
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  const plugins = [ScrollTrigger];
  if (window.SplitText) plugins.push(SplitText);
  gsap.registerPlugin(...plugins);

  const cfg = window.GapsyConfig || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inEditor = !!(window.Shopify && Shopify.designMode);
  const pageWrapper = document.querySelector('.page-wrapper');
  const wrapperScrolls = () =>
    !!pageWrapper &&
    /(auto|scroll)/.test(getComputedStyle(pageWrapper).overflowY) &&
    getComputedStyle(document.documentElement).overflowY === 'hidden';
  const scroller = wrapperScrolls() ? pageWrapper : window;
  ScrollTrigger.defaults({ scroller });

  // Scrollbar width of .page-wrapper → used by fixed elements so they don't cover it.
  const setSbw = () => {
    const w = scroller === window ? 0 : pageWrapper.offsetWidth - pageWrapper.clientWidth;
    document.documentElement.style.setProperty('--gapsy-sbw', `${w}px`);
  };
  setSbw();
  window.addEventListener('resize', setSbw);

  let lenis = null;
  if (window.Lenis && !reduce && !inEditor && cfg.smooth !== false) {
    const lerp = typeof cfg.lerp === 'number' ? cfg.lerp : 0.1;
    lenis = new Lenis(
      scroller === window
        ? { lerp, autoRaf: true }
        : { wrapper: pageWrapper, content: pageWrapper, lerp, autoRaf: true }
    );
    lenis.on('scroll', ScrollTrigger.update);
    const syncSize = () => lenis && lenis.resize();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(syncSize);
      ro.observe(document.body);
      if (scroller !== window) [...pageWrapper.children].forEach((c) => ro.observe(c));
    }
    ScrollTrigger.addEventListener('refresh', syncSize);
    window.addEventListener('load', syncSize);
  }

  if (!inEditor) {
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (wrapperScrolls() !== (scroller !== window)) location.reload();
      }, 300);
    });
  }

  // Intro gate: the preloader resolves it; without a preloader it resolves at once.
  let introDone;
  const intro = new Promise((r) => (introDone = r));
  // The hero (data-gapsy-intro) calls Gapsy.introDone() during its load animation.
  if (!document.querySelector('[data-gapsy-intro]') || reduce || inEditor) introDone();
  setTimeout(() => introDone(), 4000);

  const rem = (n) => parseFloat(getComputedStyle(document.documentElement).fontSize) * n;

  // Split an element's text into masked chars or words once (DOM is not restored by mm.revert()).
  function split(el, type = 'chars') {
    if (!el) return [];
    if (el.dataset.split === type) return [...el.querySelectorAll('.gapsy-mask > span')];
    el.dataset.split = type;
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const makeMask = (text) => {
            const mask = document.createElement('span');
            mask.className = 'gapsy-mask';
            const inner = document.createElement('span');
            inner.textContent = text;
            mask.appendChild(inner);
            out.push(inner);
            return mask;
          };
          child.textContent.split(/(\s+)/).forEach((word) => {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(' ')); return; }
            if (type === 'words') { frag.appendChild(makeMask(word)); return; }
            // chars: keep each word unbreakable so lines wrap between words only
            const w = document.createElement('span');
            w.className = 'gapsy-word';
            [...word].forEach((c) => w.appendChild(makeMask(c)));
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('gapsy-mask') && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    // Screen readers get the plain text once; the split spans are hidden from them.
    const label = el.textContent.trim().replace(/\s+/g, ' ');
    walk(el);
    const sr = document.createElement('span');
    sr.className = 'gapsy-visually-hidden';
    sr.textContent = label;
    [...el.childNodes].forEach((n) => n.nodeType === 1 && n.setAttribute('aria-hidden', 'true'));
    el.appendChild(sr);
    return out;
  }

  const registry = {};
  const mounted = new Map();
  function mount(el) {
    const fn = registry[el.dataset.gapsySection];
    if (!fn || mounted.has(el)) return;
    const mm = gsap.matchMedia();
    mm.add(
      { desktop: '(min-width: 992px)', mobile: '(max-width: 991px)', reduce: '(prefers-reduced-motion: reduce)' },
      (ctx) => fn(el, ctx.conditions)
    );
    mounted.set(el, mm);
  }
  function unmount(el) {
    const mm = mounted.get(el);
    if (mm) { mm.revert(); mounted.delete(el); }
  }

  window.Gapsy = {
    lenis, scroller, reduce, inEditor, intro, introDone, rem, split,
    register(name, fn) {
      registry[name] = fn;
      document.querySelectorAll(`[data-gapsy-section="${name}"]`).forEach(mount);
    },
    scrollTo(target) {
      if (lenis) lenis.scrollTo(target, { offset: -rem(1) });
      else if (typeof target !== 'number') target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    },
  };

  document.addEventListener('shopify:section:load', (e) => {
    e.target.querySelectorAll('[data-gapsy-section]').forEach(mount);
    ScrollTrigger.refresh();
  });
  document.addEventListener('shopify:section:unload', (e) => {
    e.target.querySelectorAll('[data-gapsy-section]').forEach(unmount);
  });
  window.addEventListener('load', () => ScrollTrigger.refresh());
  // Images/fonts that change the page height after load → recalc trigger positions.
  if (window.ResizeObserver) {
    let lastH = 0, rt;
    const main = document.querySelector('#MainContent') || document.body;
    new ResizeObserver(([e]) => {
      const h = Math.round(e.contentRect.height);
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      clearTimeout(rt);
      rt = setTimeout(() => ScrollTrigger.refresh(), 200);
    }).observe(main);
  }
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());

  // Cart count: any element with [data-cart-count] is refreshed after AJAX adds.
  window.addEventListener('gapsy:cart-updated', (e) => {
    const count = e.detail && typeof e.detail.item_count === 'number' ? e.detail.item_count : null;
    if (count === null) return;
    document.querySelectorAll('[data-cart-count]').forEach((n) => (n.textContent = count));
  });
})();
