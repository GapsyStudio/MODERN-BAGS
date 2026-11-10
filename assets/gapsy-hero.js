// @ts-nocheck
/*
  Gapsy · Hero — loader + intro + scroll parallax. Markup: sections/gapsy-hero.liquid
  Intro: stripes slide in from the left with gaps → close into one block → heading letters rise,
  model rises, photos unmask, texts and badge fade in. Calls Gapsy.introDone() so the header follows.
*/
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('hero', (el, { desktop, reduce }) => {
    const q = (s) => [...el.querySelectorAll(s)];
    const title = el.querySelector('[data-hero-title]');
    const stripes = q('[data-hero-stripe]');
    const model = el.querySelector('[data-hero-model]');
    const modelInner = el.querySelector('[data-hero-model-inner]');
    const photos = q('[data-hero-photo]');
    const texts = q('[data-hero-text]');
    const badge = el.querySelector('[data-hero-badge]');
    const pre = q('.gapsy-pre');
    const show = () => { pre.forEach((n) => n.classList.remove('gapsy-pre')); };

    const chars = [];
    q('[data-hero-line]').forEach((line) => chars.push(...Gapsy.split(line, 'chars')));
    const prefix = el.querySelector('[data-hero-prefix]');

    if (reduce || !el.hasAttribute('data-gapsy-intro')) {
      show();
      Gapsy.introDone();
      return () => {};
    }

    // Start states, then reveal the elements (they were hidden by .gapsy-pre to avoid a flash).
    gsap.set(stripes, { clipPath: 'inset(50% 100% 50% 0%)' });
    gsap.set(chars, { yPercent: 110 });
    if (prefix) gsap.set(prefix, { autoAlpha: 0, x: -30 });
    gsap.set(model, { yPercent: 18, autoAlpha: 0 });
    gsap.set(photos, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(q('[data-hero-photo-media] > *'), { scale: 1.35 });
    gsap.set(texts, { autoAlpha: 0, y: 24 });
    if (badge) gsap.set(badge, { autoAlpha: 0, scale: 0.6, rotate: -90 });
    show();

    const tl = gsap.timeline({ delay: 0.2, defaults: { ease: 'power3.out' } });
    tl.to(stripes, { clipPath: 'inset(28% 0% 28% 0%)', duration: 0.9, ease: 'power3.inOut', stagger: { each: 0.07, from: 'start' } })
      .to(badge || {}, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1, ease: 'back.out(1.6)' }, 0.45)
      .to(chars, { yPercent: 0, duration: 0.9, stagger: 0.03 }, 0.35)
      .to(prefix || {}, { autoAlpha: 1, x: 0, duration: 0.9 }, 0.75)
      .to(stripes, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power3.inOut', stagger: { each: 0.04, from: 'center' } }, 1.05)
      .to(model, { yPercent: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out' }, 1.35)
      .add(() => Gapsy.introDone(), 1.5)
      .to(photos, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', stagger: 0.12 }, 1.5)
      .to(q('[data-hero-photo-media] > *'), { scale: 1, duration: 1.4, ease: 'expo.out', stagger: 0.12 }, 1.7)
      .to(texts, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, 1.8)
      .add(() => gsap.set([...stripes, ...photos], { clearProps: 'clipPath' }));

    // Scroll parallax (desktop only; on mobile the stage is in normal flow).
    const triggers = [];
    if (desktop && el.dataset.parallax === 'true') {
      const scrub = { trigger: el, start: 'top top', end: 'bottom top', scrub: true };
      triggers.push(gsap.to(title, { yPercent: 35, ease: 'none', scrollTrigger: scrub }));
      triggers.push(gsap.to(modelInner, { yPercent: -6, ease: 'none', scrollTrigger: { ...scrub } }));
      photos.forEach((p) => {
        const speed = parseFloat(p.dataset.speed || 0);
        triggers.push(gsap.to(p, { y: () => -Gapsy.rem(speed / 16) * 3, ease: 'none', scrollTrigger: { ...scrub, invalidateOnRefresh: true } }));
      });
    }

    return () => { tl.kill(); triggers.forEach((t) => t.scrollTrigger && t.scrollTrigger.kill()); };
  });
})();
