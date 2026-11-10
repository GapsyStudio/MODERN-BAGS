// @ts-nocheck
/* Gapsy · Header — intro fade, mobile menu, optional hide-on-scroll. Markup: sections/gapsy-header.liquid */
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('header', (el, { desktop, reduce }) => {
    const bar = el.querySelector('[data-header-bar]');
    const items = el.querySelectorAll('[data-header-item]');
    const toggle = el.querySelector('[data-menu-toggle]');
    const menu = el.querySelector('[data-menu]');

    // Intro
    if (bar && bar.classList.contains('gapsy-pre')) {
      gsap.set(bar, { opacity: 1 });
      bar.classList.remove('gapsy-pre');
      if (!reduce) {
        gsap.set(items, { autoAlpha: 0, y: -16 });
        Gapsy.intro.then(() =>
          gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, delay: 0.15 })
        );
      }
    }

    // Mobile menu
    const setOpen = (open) => {
      el.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        menu.hidden = false;
        Gapsy.lenis && Gapsy.lenis.stop();
        if (!reduce) gsap.fromTo(menu.querySelectorAll('[data-menu-link]'), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.05 });
      } else {
        menu.hidden = true;
        Gapsy.lenis && Gapsy.lenis.start();
      }
    };
    const onToggle = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    const onKey = (e) => { if (e.key === 'Escape' && el.classList.contains('is-open')) { setOpen(false); toggle.focus(); } };
    const onLink = () => setOpen(false);
    toggle && toggle.addEventListener('click', onToggle);
    document.addEventListener('keydown', onKey);
    menu && menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', onLink));

    // Sticky hide-on-scroll
    let st = null;
    if (el.dataset.sticky === 'true') {
      st = ScrollTrigger.create({
        start: 'top+=200 top',
        end: 'max',
        onUpdate: (self) => el.classList.toggle('is-hidden', self.direction === 1 && !el.classList.contains('is-open')),
        onLeaveBack: () => el.classList.remove('is-hidden'),
      });
    }

    return () => {
      toggle && toggle.removeEventListener('click', onToggle);
      document.removeEventListener('keydown', onKey);
      menu && menu.querySelectorAll('a').forEach((a) => a.removeEventListener('click', onLink));
      st && st.kill();
      if (desktop && el.classList.contains('is-open')) setOpen(false);
    };
  });
})();
