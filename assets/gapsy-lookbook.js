// @ts-nocheck
/*
  Gapsy · Lookbook — vertical scroll drives a horizontal track. Markup: sections/gapsy-lookbook.liquid.
  The section gets the height 100vh + track overflow; its inner wrapper is CSS-sticky (no GSAP pin,
  which does not work with Horizon's .page-wrapper scroller). Photos drift inside their frames,
  the progress line fills. Mobile / reduced motion: a swipe row (.is-static).
*/
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('lookbook', (el, { desktop, reduce }) => {
    const track = el.querySelector('[data-lookbook-track]');
    const progress = el.querySelector('[data-lookbook-progress]');
    if (!desktop || reduce) {
      el.classList.toggle('is-static', !!reduce && desktop);
      return () => el.classList.remove('is-static');
    }
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const setH = () => { el.style.height = `${window.innerHeight + dist()}px`; };
    setH();

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${dist()}`, scrub: 0.4, invalidateOnRefresh: true, onRefreshInit: setH },
    });
    tl.to(track, { x: () => -dist(), ease: 'none' }, 0);
    if (progress) tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);

    el.querySelectorAll('[data-lookbook-img]').forEach((img) => {
      gsap.fromTo(img, { xPercent: 8 }, {
        xPercent: -8, ease: 'none',
        scrollTrigger: { trigger: img.closest('[data-lookbook-look]'), containerAnimation: tl, start: 'left right', end: 'right left', scrub: true },
      });
    });
    el.querySelectorAll('[data-lookbook-look]').forEach((look, i) => {
      // looks already on screen when the section arrives reveal on the vertical scroll,
      // the rest when they slide in horizontally
      const onScreen = look.offsetLeft < window.innerWidth * 0.9;
      gsap.from(look.querySelector('.gapsy-lookbook__frame'), {
        clipPath: 'inset(0% 0% 0% 100%)', duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath', delay: onScreen ? i * 0.12 : 0,
        scrollTrigger: onScreen
          ? { trigger: el, start: 'top 70%', once: true }
          : { trigger: look, containerAnimation: tl, start: 'left 90%', once: true },
      });
    });
    Gapsy.revealHeading(el.querySelector('.gapsy-lookbook__intro--desktop [data-reveal-heading]'));

    const onResize = () => setH();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => { window.removeEventListener('resize', onResize); el.style.height = ''; gsap.set(track, { clearProps: 'transform' }); };
  });
})();
