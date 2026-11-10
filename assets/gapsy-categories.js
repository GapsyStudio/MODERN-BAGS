// @ts-nocheck
/* Gapsy · Categories — heading letters, pill cards rise in a stagger, photos settle. Markup: sections/gapsy-categories.liquid */
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('categories', (el, { desktop, reduce }) => {
    if (reduce) return;
    Gapsy.revealHeading(el.querySelector('[data-reveal-heading]'));
    const items = el.querySelectorAll('[data-cats-item]');
    const list = el.querySelector('.gapsy-cats__list');
    if (items.length) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
      tl.from(items, { y: desktop ? Gapsy.rem(14) : Gapsy.rem(4), autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12 })
        .from(el.querySelectorAll('[data-cats-img] > *'), { scale: 1.2, duration: 1.6, ease: 'expo.out', stagger: 0.12, clearProps: 'transform' }, 0);
    }
    Gapsy.revealUp(el.querySelectorAll('[data-cats-foot] > *'), { stagger: 0.1 });
  });
})();
