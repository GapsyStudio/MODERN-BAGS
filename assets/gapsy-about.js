// @ts-nocheck
/* Gapsy · About — heading letters, features fade up, photos unmask + parallax. Markup: sections/gapsy-about.liquid */
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('about', (el, { desktop, reduce }) => {
    if (reduce) return;
    Gapsy.revealHeading(el.querySelector('[data-reveal-heading]'));
    el.querySelectorAll('[data-about-item]').forEach((item, i) => {
      Gapsy.revealUp(item.querySelectorAll('[data-about-copy] > *'), { trigger: item, stagger: 0.08 });
      Gapsy.revealImage(item.querySelector('[data-about-img]'), { trigger: item, delay: i * 0.08 });
    });
    if (desktop && el.dataset.parallax === 'true') {
      el.querySelectorAll('[data-about-parallax]').forEach((w) => Gapsy.parallax(w, parseFloat(w.dataset.speed || 0), el));
    }
  });
})();
