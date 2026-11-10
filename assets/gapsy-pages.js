// @ts-nocheck
/*
  Gapsy · inner pages: product, collection, cart. One file registers all three.
  Markup: sections/gapsy-product.liquid, gapsy-collection.liquid, gapsy-cart.liquid.
*/
(() => {
  if (!window.Gapsy) return;
  const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';

  async function addToCart(items) {
    const res = await fetch(`${root}cart/add.js`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.description || data.message || 'Could not add to cart');
    const cart = await (await fetch(`${root}cart.js`)).json();
    window.dispatchEvent(new CustomEvent('gapsy:cart-updated', { detail: cart }));
    return cart;
  }
  Gapsy.addToCart = addToCart;

  // Formats cents with the store's money format ({{amount}}, {{amount_no_decimals}}, {{amount_with_comma_separator}}…)
  const money = (cents, format) => {
    const fmt = format || '${{amount}}';
    const n = (cents / 100);
    const group = (x, d, t, s) => { const [a, b] = x.toFixed(d).split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, t) + (b ? s + b : ''); };
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (m, k) => ({
      amount: group(n, 2, ',', '.'),
      amount_no_decimals: group(n, 0, ',', '.'),
      amount_with_comma_separator: group(n, 2, '.', ','),
      amount_no_decimals_with_comma_separator: group(n, 0, '.', ','),
      amount_with_apostrophe_separator: group(n, 2, "'", '.'),
      amount_with_space_separator: group(n, 2, ' ', ','),
    }[k] || group(n, 2, ',', '.')));
  };

  /* ---------------- Product ---------------- */
  Gapsy.register('product', (el, { desktop, reduce }) => {
    const off = [];
    const on = (node, ev, fn) => { if (!node) return; node.addEventListener(ev, fn); off.push(() => node.removeEventListener(ev, fn)); };
    const product = JSON.parse(el.querySelector('[data-product-json]').textContent);
    const form = el.querySelector('.gapsy-product__form');
    const moneyEl = el.querySelector('[data-money-format]');
    const moneyFormat = moneyEl ? JSON.parse(moneyEl.textContent) : null;
    const idInput = el.querySelector('[data-product-id]');
    const addBtn = el.querySelector('[data-product-add]');
    const addLabel = el.querySelector('[data-product-add-label]');
    const priceEl = el.querySelector('[data-product-price]');
    const compareEl = el.querySelector('[data-product-compare]');
    const errorEl = el.querySelector('[data-product-error]');
    const toast = el.querySelector('[data-product-toast]');
    const track = el.querySelector('[data-product-track]');
    const slides = [...el.querySelectorAll('[data-product-slide]')];
    const indexEl = el.querySelector('[data-product-index]');
    const labels = { add: addBtn.dataset.addLabel || 'Add to cart', soldOut: addBtn.dataset.soldOutLabel || 'Sold out' };

    const selected = () => [...el.querySelectorAll('[data-option-index]:checked')].sort((a, b) => a.dataset.optionIndex - b.dataset.optionIndex).map((i) => i.value);
    const findVariant = (opts) => product.variants.find((v) => v.options.every((o, i) => o === opts[i]));

    function showMedia(mediaId) {
      const slide = slides.find((s) => s.dataset.mediaId === String(mediaId));
      if (!slide) return;
      slides.forEach((s) => s.classList.toggle('is-current', s === slide));
      if (desktop) {
        const top = slide.getBoundingClientRect().top - (Gapsy.scroller === window ? 0 : Gapsy.scroller.getBoundingClientRect().top);
        if (Math.abs(top) > 40) Gapsy.lenis ? Gapsy.lenis.scrollTo(slide, { offset: -Gapsy.rem(2) }) : slide.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (track) {
        track.scrollTo({ left: slide.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      }
    }

    function update() {
      const opts = selected();
      opts.forEach((v, i) => { const lab = el.querySelector(`[data-option-value="${i}"]`); if (lab) lab.textContent = v; });
      // grey out values that do not exist with the other selected options
      el.querySelectorAll('[data-option-index]').forEach((input) => {
        const i = Number(input.dataset.optionIndex);
        const test = opts.slice(); test[i] = input.value;
        const v = findVariant(test);
        input.classList.toggle('is-unavailable', !v || !v.available);
      });
      const variant = findVariant(opts);
      if (!variant) {
        addBtn.disabled = true; addLabel.textContent = 'Unavailable'; return;
      }
      idInput.value = variant.id;
      addBtn.disabled = !variant.available;
      addLabel.textContent = variant.available ? labels.add : labels.soldOut;
      priceEl.textContent = money(variant.price, moneyFormat);
      if (compareEl) {
        compareEl.hidden = !(variant.compare_at_price > variant.price);
        compareEl.textContent = variant.compare_at_price ? money(variant.compare_at_price, moneyFormat) : '';
      }
      if (variant.featured_media) showMedia(variant.featured_media.id);
      const url = new URL(location.href); url.searchParams.set('variant', variant.id);
      history.replaceState({}, '', url);
    }
    el.querySelectorAll('[data-option-index]').forEach((input) => on(input, 'change', update));

    // quantity
    const qty = el.querySelector('[data-qty-input]');
    on(el.querySelector('[data-qty-minus]'), 'click', () => { qty.value = Math.max(1, (parseInt(qty.value, 10) || 1) - 1); });
    on(el.querySelector('[data-qty-plus]'), 'click', () => { qty.value = (parseInt(qty.value, 10) || 1) + 1; });

    // AJAX add
    let toastTimer;
    on(form, 'submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;
      addBtn.classList.add('is-loading');
      try {
        await addToCart([{ id: Number(idInput.value), quantity: qty ? Math.max(1, parseInt(qty.value, 10) || 1) : 1 }]);
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4000);
      } catch (err) {
        errorEl.textContent = err.message; errorEl.hidden = false;
      } finally {
        addBtn.classList.remove('is-loading');
      }
    });

    // desktop: hover zoom that follows the cursor
    if (desktop && matchMedia('(hover: hover)').matches) {
      slides.forEach((slide) => {
        const img = slide.querySelector('.gapsy-product__img');
        if (!img || img.tagName !== 'IMG') return;
        on(slide, 'mouseenter', () => slide.classList.add('is-zoom'));
        on(slide, 'mouseleave', () => slide.classList.remove('is-zoom'));
        on(slide, 'mousemove', (e) => {
          const r = slide.getBoundingClientRect();
          img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        });
      });
    }

    // mobile gallery counter
    if (track && indexEl) {
      on(track, 'scroll', () => { indexEl.textContent = Math.round(track.scrollLeft / track.clientWidth) + 1; });
    }

    if (!reduce) {
      const title = el.querySelector('[data-product-title]');
      const chars = Gapsy.split(title, 'chars');
      const tl = gsap.timeline({ delay: 0.1 });
      tl.from(chars, { yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.02 })
        .from(el.querySelectorAll('[data-product-fade]'), { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07 }, 0.15)
        .from(slides.slice(0, desktop ? 2 : 1), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: 0.12, clearProps: 'clipPath' }, 0);
      slides.slice(desktop ? 2 : 1).forEach((s) => desktop && Gapsy.revealImage(s));
    }

    return () => { off.forEach((f) => f()); clearTimeout(toastTimer); };
  });

  /* ---------------- Collection ---------------- */
  Gapsy.register('collection', (el, { reduce }) => {
    const cleanup = Gapsy.initCards ? Gapsy.initCards(el) : () => {};
    const sort = el.querySelector('[data-collection-sort]');
    const onSort = () => { const url = new URL(location.href); url.searchParams.set('sort_by', sort.value); url.searchParams.delete('page'); location.href = url; };
    sort && sort.addEventListener('change', onSort);
    if (!reduce) {
      Gapsy.revealHeading(el.querySelector('[data-reveal-heading]'), { start: 'top 100%' });
      Gapsy.revealUp(el.querySelectorAll('[data-collection-fade]'), { start: 'top 100%', stagger: 0.06 });
      gsap.utils.toArray(el.querySelectorAll('[data-product-item]')).forEach((item, i) => {
        gsap.from(item, { y: Gapsy.rem(4), autoAlpha: 0, duration: 1, ease: 'expo.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: item, start: 'top 95%', once: true } });
      });
    }
    return () => { cleanup(); sort && sort.removeEventListener('change', onSort); };
  });

  /* ---------------- Cart ---------------- */
  Gapsy.register('cart', (el, { reduce }) => {
    const form = el.querySelector('[data-cart-form]');
    const off = [];
    let t;
    el.querySelectorAll('[data-qty]').forEach((box) => {
      const input = box.querySelector('[data-qty-input]');
      const submit = () => { clearTimeout(t); t = setTimeout(() => form.submit(), 500); };
      const minus = () => { input.value = Math.max(0, (parseInt(input.value, 10) || 0) - 1); submit(); };
      const plus = () => { input.value = (parseInt(input.value, 10) || 0) + 1; submit(); };
      box.querySelector('[data-qty-minus]').addEventListener('click', minus);
      box.querySelector('[data-qty-plus]').addEventListener('click', plus);
      input.addEventListener('change', submit);
      off.push(() => { box.querySelector('[data-qty-minus]').removeEventListener('click', minus); box.querySelector('[data-qty-plus]').removeEventListener('click', plus); input.removeEventListener('change', submit); });
    });
    if (!reduce) {
      Gapsy.revealHeading(el.querySelector('[data-reveal-heading]'), { start: 'top 100%' });
      Gapsy.revealUp(el.querySelectorAll('[data-cart-fade]'), { start: 'top 100%', stagger: 0.06 });
    }
    return () => { off.forEach((f) => f()); clearTimeout(t); };
  });
  /* ---------------- Simple pages: page, 404, all collections ---------------- */
  const revealPage = (el) => {
    el.querySelectorAll('[data-reveal-heading]').forEach((h) => Gapsy.revealHeading(h, { start: 'top 100%' }));
    Gapsy.revealUp(el.querySelectorAll('[data-page-fade]'), { start: 'top 95%', stagger: 0.07 });
  };
  Gapsy.register('page', (el, { reduce }) => { if (!reduce) revealPage(el); });

  /* ---------------- Contact: validation before the Shopify form submits ---------------- */
  Gapsy.register('contact', (el, { reduce }) => {
    if (!reduce) revealPage(el);
    const form = el.querySelector('form');
    if (!form) return;
    form.setAttribute('novalidate', '');
    const check = (input) => {
      const v = input.value.trim();
      let ok = true;
      if (input.required && !v) ok = false;
      else if (v && input.dataset.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      else if (v && input.dataset.type === 'phone') ok = v.replace(/\D/g, '').length >= 6;
      const field = input.closest('.gapsy-field');
      field.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    const inputs = [...form.querySelectorAll('[data-field]')];
    const onSubmit = (e) => {
      const bad = inputs.filter((i) => !check(i));
      if (bad.length) { e.preventDefault(); e.stopImmediatePropagation(); bad[0].focus(); }
    };
    const onInput = (e) => { if (e.target.closest('.gapsy-field.is-invalid')) check(e.target); };
    form.addEventListener('submit', onSubmit, true);
    form.addEventListener('input', onInput);
    const success = el.querySelector('.gapsy-contact__success');
    if (success) success.focus();
    return () => { form.removeEventListener('submit', onSubmit, true); form.removeEventListener('input', onInput); };
  });
})();
