// @ts-nocheck
/*
  Gapsy · cursor + magnetic elements.
  Cursor (snippets/gapsy-cursor.liquid): follows the mouse with gsap.quickTo; .is-link over a/button,
  .is-label + text over [data-cursor="View"]. Desktop with a fine pointer only, off for reduced motion.
  Magnetic: [data-magnetic] elements lean towards the cursor (strength via data-magnetic="0.3").
*/
(() => {
  if (!window.gsap) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 992px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;

  const cursor = document.querySelector('[data-gapsy-cursor]');
  if (cursor) {
    const text = cursor.querySelector('[data-cursor-text]');
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    let shown = false;
    window.addEventListener('pointermove', (e) => {
      if (!shown) { gsap.set(cursor, { x: e.clientX, y: e.clientY }); cursor.classList.add('is-ready'); shown = true; }
      xTo(e.clientX); yTo(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, label, select, [role="button"]');
      cursor.classList.toggle('is-label', !!lab);
      cursor.classList.toggle('is-link', !lab && !!link);
      if (lab) text.textContent = lab.dataset.cursor;
    });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));
  }

  const bind = (el) => {
    if (el.dataset.magneticBound) return;
    el.dataset.magneticBound = '1';
    const k = parseFloat(el.dataset.magnetic) || 0.3;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * k);
      yTo((e.clientY - (r.top + r.height / 2)) * k);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
    });
  };
  const scan = (root = document) => root.querySelectorAll('[data-magnetic]').forEach(bind);
  scan();
  document.addEventListener('shopify:section:load', (e) => scan(e.target));
  // product cards / drawer items are added later
  let raf = 0;
  new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => scan()); }).observe(document.body, { childList: true, subtree: true });
})();
