// @ts-nocheck
/*
  Gapsy · Marquee — endless sideways line. Markup: sections/gapsy-marquee.liquid.
  The track holds 3 copies of the group; x wraps by one group width. Scroll velocity adds speed
  and scrolling up turns the direction (optional). Pauses off screen. Reduced motion: still.
*/
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('marquee', (el, { reduce }) => {
    if (reduce || el.offsetParent === null) return; // hidden on phones
    const track = el.querySelector('[data-marquee-track]');
    const group = el.querySelector('[data-marquee-group]');
    const base = parseFloat(el.dataset.speed || 60); // px per second @1440
    let dir = el.dataset.direction === 'right' ? 1 : -1;
    const startDir = dir;
    let x = 0, boost = 0, width = group.offsetWidth, visible = true;
    const setX = gsap.quickSetter(track, 'x', 'px');
    const measure = () => { width = group.offsetWidth; };
    const ro = window.ResizeObserver ? new ResizeObserver(measure) : null;
    ro && ro.observe(group);

    const tick = (time, delta) => {
      if (!visible || !width) return;
      const dt = Math.min(delta, 50) / 1000;
      const speed = Gapsy.rem(base / 16) * (1 + boost);
      x += dir * speed * dt;
      if (x <= -width) x += width;
      if (x > 0) x -= width;
      setX(x);
      boost *= 0.92;
    };
    gsap.ticker.add(tick);

    const st = ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { visible = self.isActive; },
      onUpdate: (self) => {
        if (el.dataset.scroll !== 'true') return;
        boost = Math.min(8, Math.abs(self.getVelocity()) / 300);
        dir = self.direction === 1 ? startDir : -startDir;
      },
    });
    visible = st.isActive;

    return () => { gsap.ticker.remove(tick); st.kill(); ro && ro.disconnect(); };
  });
})();
