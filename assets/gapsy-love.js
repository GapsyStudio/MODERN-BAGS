// @ts-nocheck
/* Gapsy · Designed with love — photos open between the words on scroll. Markup: sections/gapsy-love.liquid */
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('love', (el, { reduce }) => {
    if (reduce) return;
    const line = el.querySelector('[data-love-line]');
    const words = el.querySelectorAll('[data-love-word]');
    const photos = el.querySelectorAll('[data-love-photo]');
    const inner = el.querySelectorAll('[data-love-photo-in] > *');

    gsap.from(words, { yPercent: 105, duration: 1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: line, start: 'top 90%', once: true } });

    if (photos.length && el.dataset.open === 'true') {
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 25%', scrub: 0.6, invalidateOnRefresh: true } })
        .from(photos, { width: 0, marginLeft: 0, marginRight: 0, ease: 'power2.inOut', stagger: 0.05 })
        .from(inner, { scale: 1.6, ease: 'power2.out', stagger: 0.05 }, 0);
    }
    Gapsy.revealUp(el.querySelectorAll('[data-love-fade]'), { trigger: line, start: 'top 70%', stagger: 0.12, y: 24 });
  });
})();
