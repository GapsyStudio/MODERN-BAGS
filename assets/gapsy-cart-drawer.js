// @ts-nocheck
/*
  Gapsy · Cart drawer. Markup: snippets/gapsy-cart-drawer.liquid.
  - Gapsy.cart.open() / close() / refresh(cart?)
  - Opens on: any [data-cart-open] link (header "Cart (n)"), and on 'gapsy:cart-updated' with
    detail.open !== false (fired by the product page and product cards after an AJAX add).
  - Quantity / remove → /cart/change.js, then re-render. Esc / overlay closes, focus is trapped.
*/
(() => {
  const drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer || !window.gsap) return;
  const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
  const panel = drawer.querySelector('[data-drawer-panel]');
  const overlay = drawer.querySelector('.gapsy-drawer__overlay');
  const list = drawer.querySelector('[data-drawer-items]');
  const empty = drawer.querySelector('[data-drawer-empty]');
  const foot = drawer.querySelector('[data-drawer-foot]');
  const totalEl = drawer.querySelector('[data-drawer-total]');
  const countEl = drawer.querySelector('[data-drawer-count]');
  const shipText = drawer.querySelector('[data-ship-text]');
  const shipBar = drawer.querySelector('[data-ship-bar]');
  const stripes = drawer.querySelectorAll('.gapsy-drawer__stripes span');
  const threshold = Number(drawer.dataset.threshold || 0);
  const fmt = JSON.parse(drawer.querySelector('[data-drawer-money]').textContent || '"${{amount}}"');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastFocus = null;
  let isOpen = false;

  const money = (cents) => {
    const n = cents / 100;
    const g = (d, t, s) => { const [a, b] = n.toFixed(d).split('.'); return a.replace(/\B(?=(\d{3})+(?!\d))/g, t) + (b ? s + b : ''); };
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (m, k) => ({
      amount: g(2, ',', '.'), amount_no_decimals: g(0, ',', '.'), amount_with_comma_separator: g(2, '.', ','),
      amount_no_decimals_with_comma_separator: g(0, '.', ','), amount_with_apostrophe_separator: g(2, "'", '.'), amount_with_space_separator: g(2, ' ', ','),
    }[k] || g(2, ',', '.')));
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sized = (url, w) => (url ? url + (url.includes('?') ? '&' : '?') + 'width=' + w : '');

  function render(cart) {
    countEl.textContent = cart.item_count;
    document.querySelectorAll('[data-cart-count]').forEach((n) => (n.textContent = cart.item_count));
    totalEl.textContent = money(cart.total_price);
    empty.hidden = cart.item_count > 0;
    foot.hidden = cart.item_count === 0;
    list.innerHTML = cart.items.map((item, i) => `
      <li class="gapsy-drawer__item" data-key="${esc(item.key)}">
        <a href="${esc(item.url)}" class="gapsy-drawer__media">${item.image ? `<img src="${esc(sized(item.image, 240))}" alt="${esc(item.product_title)}" loading="lazy" width="120" height="120">` : ''}</a>
        <div class="gapsy-drawer__info">
          <a href="${esc(item.url)}" class="gapsy-drawer__name">${esc(item.product_title)}</a>
          ${item.product_has_only_default_variant ? '' : `<p class="gapsy-drawer__variant">${esc(item.variant_title)}</p>`}
          <div class="gapsy-drawer__row">
            <div class="gapsy-qty gapsy-qty--sm">
              <button type="button" class="gapsy-qty__btn" data-change="${i + 1}" data-qty="${item.quantity - 1}" aria-label="Decrease quantity of ${esc(item.product_title)}">−</button>
              <span class="gapsy-qty__value" aria-live="polite">${item.quantity}</span>
              <button type="button" class="gapsy-qty__btn" data-change="${i + 1}" data-qty="${item.quantity + 1}" aria-label="Increase quantity of ${esc(item.product_title)}">+</button>
            </div>
            <button type="button" class="gapsy-drawer__remove" data-change="${i + 1}" data-qty="0">${esc(drawer.dataset.removeLabel)}</button>
          </div>
        </div>
        <p class="gapsy-drawer__price">${money(item.final_line_price)}</p>
      </li>`).join('');
    if (shipText && threshold > 0) {
      const left = threshold - cart.total_price;
      shipText.innerHTML = left <= 0 ? esc(drawer.dataset.fsDone) : esc(drawer.dataset.fsText).replace('[amount]', `<strong>${money(left)}</strong>`);
      gsap.to(shipBar, { scaleX: Math.min(1, cart.total_price / threshold), duration: reduce ? 0 : 0.8, ease: 'power3.out' });
    }
  }

  async function refresh(cart) {
    const data = cart && cart.items ? cart : await (await fetch(`${root}cart.js`)).json();
    render(data);
    return data;
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.documentElement.classList.add('gapsy-drawer-open');
    window.Gapsy && Gapsy.lenis && Gapsy.lenis.stop();
    const items = list.querySelectorAll('.gapsy-drawer__item');
    if (reduce) { gsap.set([overlay, panel], { clearProps: 'all' }); }
    else {
      gsap.timeline()
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 })
        .fromTo(stripes, { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power3.inOut', stagger: 0.04, transformOrigin: 'right' }, 0)
        .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: 'expo.out' }, 0.2)
        .to(stripes, { scaleX: 0, duration: 0.5, ease: 'power3.inOut', stagger: 0.04, transformOrigin: 'left' }, 0.45)
        .from(items, { x: 40, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, 0.45);
    }
    setTimeout(() => drawer.querySelector('.gapsy-drawer__close').focus(), 50);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    const done = () => {
      drawer.hidden = true;
      document.documentElement.classList.remove('gapsy-drawer-open');
      window.Gapsy && Gapsy.lenis && Gapsy.lenis.start();
      lastFocus && lastFocus.focus && lastFocus.focus();
    };
    if (reduce) return done();
    gsap.timeline({ onComplete: done })
      .to(panel, { xPercent: 100, duration: 0.5, ease: 'power3.in' })
      .to(overlay, { autoAlpha: 0, duration: 0.3 }, 0.2);
  }

  async function change(line, quantity, btn) {
    drawer.classList.add('is-busy');
    try {
      const res = await fetch(`${root}cart/change.js`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line: Number(line), quantity: Math.max(0, Number(quantity)) }),
      });
      const cart = await res.json();
      if (!res.ok) throw new Error(cart.description || 'Error');
      render(cart);
      window.dispatchEvent(new CustomEvent('gapsy:cart-updated', { detail: { ...cart, open: false } }));
    } catch (e) {
      btn && btn.closest('.gapsy-drawer__item') && btn.closest('.gapsy-drawer__item').classList.add('has-error');
    } finally {
      drawer.classList.remove('is-busy');
    }
  }

  drawer.addEventListener('click', (e) => {
    const t = e.target.closest('[data-change]');
    if (t) { change(t.dataset.change, t.dataset.qty, t); return; }
    if (e.target.closest('[data-drawer-close]')) { close(); return; }
    if (e.target.closest('[data-drawer-close-link]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('a[href], button:not([disabled]), input, textarea, select')].filter((n) => n.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-cart-open]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    refresh().then(open);
  });
  window.addEventListener('gapsy:cart-updated', (e) => {
    if (!e.detail || e.detail.open === false) return;
    refresh(e.detail.items ? e.detail : null).then(open);
  });

  window.Gapsy = window.Gapsy || {};
  Gapsy.cart = { open, close, refresh };
  refresh();
})();
