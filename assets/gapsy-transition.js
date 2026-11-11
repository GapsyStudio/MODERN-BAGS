// @ts-nocheck
/*
  Gapsy · page transition — stripes cover on leave, uncover on arrival.
  Markup: snippets/gapsy-transition.liquid. The "covered on arrival" state is set before first paint by
  the inline script in layout/theme.liquid (class .gapsy-pt-in on <html>).
  Skips: other domains, new tabs/modifier keys, #anchors, downloads, cart/checkout forms, JS links.
*/
(() => {
  const el = document.querySelector('[data-gapsy-pt]');
  if (!el || !window.gsap) return;
  const html = document.documentElement;
  const stripes = el.querySelectorAll('.gapsy-pt__stripe');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'gapsy-pt';
  const store = (v) => { try { v ? sessionStorage.setItem(KEY, '1') : sessionStorage.removeItem(KEY); } catch (e) {} };

  const reveal = () => {
    if (!html.classList.contains('gapsy-pt-in')) return;
    gsap.set(stripes, { clipPath: 'inset(0% 0% 0% 0%)' });
    html.classList.remove('gapsy-pt-in');
    gsap.to(stripes, {
      clipPath: 'inset(0% 0% 0% 100%)', duration: 0.7, ease: 'power3.inOut', stagger: 0.06, delay: 0.05,
      onComplete: () => gsap.set(stripes, { clearProps: 'clipPath' }),
    });
    store(false);
  };
  if (document.readyState === 'complete') reveal(); else window.addEventListener('load', reveal, { once: true });
  setTimeout(reveal, 1200); // do not wait for slow images

  // Back/forward cache: never come back to a covered page.
  window.addEventListener('pageshow', (e) => {
    document.querySelectorAll('.gapsy-card__image').forEach((i) => (i.style.viewTransitionName = ''));
    if (e.persisted) { html.classList.remove('gapsy-pt-in', 'gapsy-pt-out'); gsap.set(stripes, { clearProps: 'clipPath' }); store(false); }
  });

  if (reduce) return;
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.dataset.noTransition !== undefined) return;
    if (a.hasAttribute('data-cart-open') && window.Gapsy && Gapsy.cart) return; // opens the bag drawer instead
    // Product card → product page: let the browser morph the photo (View Transitions) instead of stripes.
    const card = a.closest('[data-product-card]');
    const morph = card && 'onpagereveal' in window && document.querySelector('[data-gapsy-pt]') !== null;
    if (morph && !reduce) {
      const img = card.querySelector('.gapsy-card__image');
      if (img) {
        document.querySelectorAll('.gapsy-card__image').forEach((i) => (i.style.viewTransitionName = ''));
        img.style.viewTransitionName = 'gapsy-product';
        try { sessionStorage.setItem('gapsy-vt', '1'); } catch (err) {}
        return; // normal navigation; the browser does the morph
      }
    }
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page / #anchor
    if (/^\/(cart\/(add|change|clear)|checkout|account\/logout)/.test(url.pathname) || /^(mailto|tel|javascript):/.test(a.getAttribute('href'))) return;
    e.preventDefault();
    html.classList.add('gapsy-pt-out');
    store(true);
    gsap.fromTo(stripes, { clipPath: 'inset(0% 100% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.inOut', stagger: 0.05,
      onComplete: () => { location.href = url.href; },
    });
  });
})();
