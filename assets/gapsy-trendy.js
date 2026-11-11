// @ts-nocheck
/* Gapsy · Trendy bags — words rise, gradient square grows to the corner on scroll. Markup: sections/gapsy-trendy.liquid */
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('trendy', (el, { reduce, desktop }) => {
    if (reduce) return;
    const stage = el.querySelector('[data-trendy-stage]');
    const clips = el.querySelectorAll('[data-trendy-clip]');
    const model = el.querySelector('[data-trendy-model]');

    // Words: the same line in both layers moves together.
    const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 75%', once: true } });
    ['0', '1', '2'].forEach((i) => {
      tl.from(el.querySelectorAll(`[data-trendy-line="${i}"]`), { yPercent: 105, duration: 1.1, ease: 'power4.out' }, Number(i) * 0.12);
    });
    tl.from(model, { yPercent: 12, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, 0.1);
    tl.from(el.querySelectorAll('[data-trendy-note]'), { autoAlpha: 0, y: 20, duration: 0.8, stagger: 0.1 }, 0.4);

    // Square grows from its own rect to the top-left corner.
    if (el.dataset.grow === 'true' && desktop) {
      const cs = getComputedStyle(el);
      gsap.fromTo(clips,
        { clipPath: cs.getPropertyValue('--clip').trim() || 'inset(17.49% 26.74% 6.88% 26.74%)' },
        { clipPath: cs.getPropertyValue('--clip-to').trim() || 'inset(0% 26.74% 6.88% 0%)', ease: 'power2.inOut',
          scrollTrigger: { trigger: stage, start: 'top 45%', end: 'bottom 85%', scrub: 0.6 } });
    }
  });
})();
