// @ts-nocheck
/* Gapsy · Footer — wordmark fits the container width, letters rise, columns fade. Markup: sections/gapsy-footer.liquid */
(() => {
  if (!window.Gapsy) return;
  Gapsy.register('footer', (el, { reduce }) => {
    const mark = el.querySelector('[data-footer-wordmark]');
    let ro = null;
    if (mark) {
      // Fit: scale the CSS font-size so the word is exactly as wide as its container.
      const fit = () => {
        mark.style.fontSize = '';
        const cs = getComputedStyle(mark.parentElement);
        const box = mark.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const r = document.createRange();
        r.selectNodeContents(mark);
        // ignore the screen-reader copy added by Gapsy.split (its text overflows its 1px box)
        const sr = mark.querySelector(':scope > .gapsy-visually-hidden');
        if (sr) r.setEndBefore(sr);
        const w = r.getBoundingClientRect().width;
        if (w && box) mark.style.fontSize = `${(parseFloat(getComputedStyle(mark).fontSize) * box) / w}px`;
      };
      fit();
      document.fonts && document.fonts.ready.then(fit);
      let lastW = 0;
      if (window.ResizeObserver) {
        ro = new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w !== lastW) { lastW = w; fit(); } });
        ro.observe(mark.parentElement);
      }
      if (!reduce) {
        const chars = Gapsy.split(mark, 'chars');
        gsap.from(chars, { yPercent: 105, duration: 1.2, ease: 'power4.out', stagger: 0.04, scrollTrigger: { trigger: mark, start: 'top 95%', once: true } });
      }
    }
    if (!reduce) Gapsy.revealUp(el.querySelectorAll('[data-footer-fade]'), { stagger: 0.08, y: 24 });
    return () => { ro && ro.disconnect(); };
  });
})();
