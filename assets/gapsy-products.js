// @ts-nocheck
/*
  Gapsy · Products — reveal + product card behaviour (swatches, AJAX add to cart).
  Markup: sections/gapsy-products.liquid + snippets/gapsy-product-card.liquid.
  Gapsy.initCards(root) is also usable on other pages (collection grid).
*/
(() => {
  if (!window.Gapsy) return;

  async function addToCart(id, button) {
    button.classList.add('is-loading');
    try {
      const res = await fetch(`${(window.Shopify && Shopify.routes && Shopify.routes.root) || '/'}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: Number(id), quantity: 1 }] }),
      });
      if (!res.ok) throw new Error('add failed');
      const cart = await (await fetch(`${(window.Shopify && Shopify.routes && Shopify.routes.root) || '/'}cart.js`)).json();
      window.dispatchEvent(new CustomEvent('gapsy:cart-updated', { detail: cart }));
      button.classList.add('is-added');
      setTimeout(() => button.classList.remove('is-added'), 1600);
      return true;
    } catch (e) {
      return false;
    } finally {
      button.classList.remove('is-loading');
    }
  }

  Gapsy.initCards = (root) => {
    const off = [];
    root.querySelectorAll('[data-product-card]').forEach((card) => {
      const img = card.querySelector('[data-card-img-wrap] img');
      const idInput = card.querySelector('[data-card-id]');
      const button = card.querySelector('[data-card-cart]');
      const form = card.querySelector('[data-card-form]');
      card.querySelectorAll('[data-swatch]').forEach((sw) => {
        const onClick = () => {
          card.querySelectorAll('[data-swatch]').forEach((o) => { o.classList.toggle('is-active', o === sw); o.setAttribute('aria-checked', String(o === sw)); });
          const label = card.querySelector('[data-swatch-label]');
          if (label) label.textContent = sw.dataset.label;
          if (idInput) idInput.value = sw.dataset.variant;
          if (button) button.disabled = sw.dataset.available !== 'true';
          if (img && sw.dataset.src) {
            gsap.to(img, { opacity: 0, duration: 0.15, onComplete: () => {
              img.srcset = sw.dataset.srcset || '';
              img.src = sw.dataset.src;
              gsap.to(img, { opacity: 1, duration: 0.35 });
            } });
          }
        };
        sw.addEventListener('click', onClick);
        off.push(() => sw.removeEventListener('click', onClick));
      });
      if (form && button) {
        const onSubmit = async (e) => {
          e.preventDefault();
          const ok = await addToCart(idInput.value, button);
          if (!ok) form.submit();
        };
        form.addEventListener('submit', onSubmit);
        off.push(() => form.removeEventListener('submit', onSubmit));
      }
    });
    return () => off.forEach((f) => f());
  };

  Gapsy.register('products', (el, { desktop, reduce }) => {
    const cleanup = Gapsy.initCards(el);
    if (!reduce) {
      Gapsy.revealHeading(el.querySelector('[data-reveal-heading]'));
      const items = el.querySelectorAll('[data-product-item]');
      items.forEach((item, i) => {
        gsap.from(item, {
          y: desktop ? Gapsy.rem(6 + (i % 3) * 4) : Gapsy.rem(3), autoAlpha: 0, duration: 1.2, ease: 'expo.out', delay: (i % 3) * 0.1,
          scrollTrigger: { trigger: item.parentElement, start: 'top 85%', once: true },
        });
      });
      Gapsy.revealUp(el.querySelectorAll('[data-products-more]'));
    }
    return cleanup;
  });
})();
