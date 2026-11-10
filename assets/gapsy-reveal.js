// @ts-nocheck
/*
  Gapsy · shared scroll reveals, used by several sections:
  Gapsy.revealHeading(el)  → letters of [data-reveal-heading] rise from a mask when it enters.
  Gapsy.revealUp(nodes)    → fade + rise, staggered.
  Gapsy.revealImage(wrap)  → clip from the bottom + inner image settles from scale 1.25.
  Gapsy.parallax(node, px) → moves node by ±px (@1440, scales with rem) while it crosses the screen.
  All return tweens/ScrollTriggers that die with the section's gsap.matchMedia context.
*/
(() => {
  if (!window.Gapsy) return;
  const enter = (trigger, start = 'top 85%') => ({ trigger, start, once: true });

  Gapsy.revealHeading = (heading, opts = {}) => {
    if (!heading) return null;
    const chars = Gapsy.split(heading, 'chars');
    return gsap.from(chars, {
      yPercent: 110, duration: 1, ease: 'power3.out', stagger: opts.stagger || 0.025,
      scrollTrigger: enter(heading, opts.start),
    });
  };
  Gapsy.revealUp = (nodes, opts = {}) => {
    const list = gsap.utils.toArray(nodes);
    if (!list.length) return null;
    return gsap.from(list, {
      y: opts.y || 40, autoAlpha: 0, duration: opts.duration || 0.9, ease: 'power3.out', stagger: opts.stagger || 0.1,
      scrollTrigger: enter(opts.trigger || list[0], opts.start),
    });
  };
  Gapsy.revealImage = (wrap, opts = {}) => {
    if (!wrap) return null;
    const inner = wrap.querySelector('img, svg');
    const tl = gsap.timeline({ scrollTrigger: enter(opts.trigger || wrap, opts.start), delay: opts.delay || 0 });
    tl.from(wrap, { clipPath: opts.from || 'inset(100% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' });
    if (inner) tl.from(inner, { scale: 1.25, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }, 0.2);
    return tl;
  };
  Gapsy.parallax = (node, px, trigger) => {
    if (!node || !px) return null;
    return gsap.fromTo(node, { y: () => Gapsy.rem(px / 16) }, {
      y: () => -Gapsy.rem(px / 16), ease: 'none',
      scrollTrigger: { trigger: trigger || node, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  };
})();
