// @ts-nocheck
/*
  Gapsy · liquid hover on product photos (WebGL, no libraries).
  On hover a canvas takes the place of the card photo and draws it with a ripple around the cursor,
  an RGB split that follows the mouse speed and a soft zoom. The canvas is made on first hover and
  destroyed after the mouse leaves, so only one WebGL context lives at a time.
  Desktop with a mouse only; off for reduced motion, in the editor, or via
  Theme settings → Modern Bags · Motion → "Liquid hover". If WebGL or the image fails, the normal
  CSS zoom stays.
*/
(() => {
  const html = document.documentElement;
  if (html.dataset.gapsyWebgl === 'false') return;
  if (!matchMedia('(hover: hover) and (pointer: fine) and (min-width: 992px)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.Shopify && Shopify.designMode) return;

  const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
  const FRAG = `
    precision mediump float;
    uniform sampler2D t; uniform vec2 res; uniform vec4 rect; uniform vec2 m; uniform vec2 vel; uniform float hov; uniform float time;
    varying vec2 v;
    vec4 s(vec2 px){ vec2 uv = (px - rect.xy) / rect.zw; if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) return vec4(0.); return texture2D(t, uv); }
    void main(){
      vec2 px = v * res;
      vec2 c = res * .5;
      px = c + (px - c) / (1. + .05 * hov);
      vec2 d = px - m;
      float dist = length(d) / max(res.x, res.y);
      float f = smoothstep(.45, 0., dist) * hov;
      vec2 off = -d * f * .06;
      off += vec2(sin(px.y * .025 + time * 2.4), cos(px.x * .025 + time * 2.1)) * 7. * f;
      off += vel * f * .8;
      vec2 sh = vel * f * .35 + vec2(1.5, 0.) * f;
      vec4 col = s(px + off);
      col.r = s(px + off + sh).r;
      col.b = s(px + off - sh).b;
      gl_FragColor = col;
    }`;

  function make(media, img) {
    const canvas = document.createElement('canvas');
    canvas.className = 'gapsy-card__gl';
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {}; ['t', 'res', 'rect', 'm', 'vel', 'hov', 'time'].forEach((n) => (u[n] = gl.getUniformLocation(prog, n)));
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    ['TEXTURE_WRAP_S', 'TEXTURE_WRAP_T'].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, gl[k], gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return { canvas, gl, u, tex };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.decoding = 'async';
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
  }

  // Draw area of an <img> with object-fit: contain, object-position: center bottom, plus padding.
  function containRect(img, dpr, natW, natH) {
    const cs = getComputedStyle(img);
    const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
    const cw = img.clientWidth - pl - pr, ch = img.clientHeight - pt - pb;
    const r = natW / natH;
    let w, h;
    if (cw / ch > r) { h = ch; w = ch * r; } else { w = cw; h = cw / r; }
    const pos = cs.objectPosition.split(' ');
    const fx = pos[0] && pos[0].endsWith('%') ? parseFloat(pos[0]) / 100 : 0.5;
    const fy = pos[1] && pos[1].endsWith('%') ? parseFloat(pos[1]) / 100 : 0.5;
    return [(pl + (cw - w) * fx) * dpr, (pt + (ch - h) * fy) * dpr, w * dpr, h * dpr];
  }

  function attach(media) {
    if (media.dataset.gl) return;
    media.dataset.gl = '1';
    let state = null, target = 0, hov = 0, raf = 0, failed = false, busy = false;
    const mouse = { x: 0, y: 0, vx: 0, vy: 0, lx: null, ly: null };

    const start = async () => {
      const img = media.querySelector('.gapsy-card__image');
      if (!img || img.tagName !== 'IMG' || failed || busy) return;
      const src = img.currentSrc || img.src;
      if (state && state.src === src) { loop(); return; }
      busy = true;
      try {
        const bitmap = await loadImage(src);
        if (!state) {
          state = make(media, img);
          if (!state) { failed = true; return; }
          media.appendChild(state.canvas);
        }
        state.gl.bindTexture(state.gl.TEXTURE_2D, state.tex);
        state.gl.texImage2D(state.gl.TEXTURE_2D, 0, state.gl.RGBA, state.gl.RGBA, state.gl.UNSIGNED_BYTE, bitmap);
        state.src = src;
        state.nat = [bitmap.naturalWidth, bitmap.naturalHeight];
        media.classList.add('has-gl');
        loop();
      } catch (e) {
        failed = true; // CORS or decode error → keep the CSS hover
      } finally {
        busy = false;
      }
    };

    const destroy = () => {
      if (!state) return;
      media.classList.remove('has-gl');
      const ext = state.gl.getExtension('WEBGL_lose_context');
      state.canvas.remove();
      ext && ext.loseContext();
      state = null;
    };

    const frame = (time) => {
      raf = 0;
      if (!state) return;
      const img = media.querySelector('.gapsy-card__image');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(img.clientWidth * dpr), h = Math.round(img.clientHeight * dpr);
      const { canvas, gl, u } = state;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      canvas.style.width = img.clientWidth + 'px';
      canvas.style.height = img.clientHeight + 'px';
      gl.viewport(0, 0, w, h);
      hov += (target - hov) * 0.08;
      mouse.vx *= 0.9; mouse.vy *= 0.9;
      gl.uniform2f(u.res, w, h);
      gl.uniform4f(u.rect, ...containRect(img, dpr, state.nat[0], state.nat[1]));
      gl.uniform2f(u.m, mouse.x * dpr, mouse.y * dpr);
      gl.uniform2f(u.vel, Math.max(-40, Math.min(40, mouse.vx * dpr)), Math.max(-40, Math.min(40, mouse.vy * dpr)));
      gl.uniform1f(u.hov, hov);
      gl.uniform1f(u.time, time / 1000);
      gl.uniform1i(u.t, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (target === 0 && hov < 0.01) { destroy(); return; }
      loop();
    };
    const loop = () => { if (!raf) raf = requestAnimationFrame(frame); };

    media.addEventListener('pointerenter', (e) => { target = 1; move(e); mouse.vx = mouse.vy = 0; start(); });
    media.addEventListener('pointerleave', () => { target = 0; mouse.lx = mouse.ly = null; loop(); });
    const move = (e) => {
      const r = media.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (mouse.lx !== null) { mouse.vx += (x - mouse.lx) * 0.5; mouse.vy += (y - mouse.ly) * 0.5; }
      mouse.lx = x; mouse.ly = y; mouse.x = x; mouse.y = y;
    };
    media.addEventListener('pointermove', move);
    // a colour swatch swaps the photo → reload the texture on the next hover frame
    media.addEventListener('click', () => { if (state) setTimeout(start, 600); });
  }

  const scan = () => document.querySelectorAll('.gapsy-card__media').forEach(attach);
  scan();
  document.addEventListener('shopify:section:load', scan);
  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 200); }).observe(document.body, { childList: true, subtree: true });
})();
