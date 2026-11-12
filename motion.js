// Sense of Touch site-wide motion: scroll reveal, image mask reveal, parallax, nav state, page transitions, floating Book button.
(() => {
  if (window.__sotMotion) return; window.__sotMotion = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  // html,body{overflow-x:hidden} turns <body> into its own scroller, so window scroll never fires. clip keeps the no-sideways-scroll without that.
  const fixScroll = () => { if (document.getElementById('sot-scroll-fix')) return; const st = document.createElement('style'); st.id = 'sot-scroll-fix'; st.textContent = 'html,body{overflow-x:clip!important}'; document.head.appendChild(st); };
  if (document.head) fixScroll(); else addEventListener('DOMContentLoaded', fixScroll);
  const SY = () => window.scrollY || document.documentElement.scrollTop || (document.body && document.body.scrollTop) || 0;
  const HAS_GL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
  if (!HAS_GL) console.info('Sense of Touch: WebGL unavailable — using 2D live animations instead of 3D.');

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.tagName === 'IMAGE-SLOT') el.style.clipPath = 'inset(0% 0% 0% 0%)';
    else { el.style.opacity = '1'; el.style.transform = 'none'; }
    io.unobserve(el);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  const prep = (el, delay = 0) => {
    if (el.__sot || reduce) return; el.__sot = true;
    if (el.closest('header, footer, [data-no-reveal], [data-slides]')) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.9 && r.bottom > 0 && performance.now() < 1500) return; // already in first view on load
    if (el.tagName === 'IMAGE-SLOT') {
      el.style.clipPath = 'inset(100% 0% 0% 0%)';
      el.style.transition = `clip-path 1.2s ${EASE} ${delay}ms`;
    } else {
      el.style.opacity = '0'; el.style.transform = 'translateY(26px)';
      el.style.transition = `opacity .9s ${EASE} ${delay}ms, transform .9s ${EASE} ${delay}ms`;
    }
    io.observe(el);
  };

  // Eyebrow labels (small uppercase spans): fade in while letter-spacing settles. WAAPI only — no inline style changes.
  const eio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; eio.unobserve(el);
    const ls = getComputedStyle(el).letterSpacing; el.animate([{ opacity: 0, letterSpacing: 'calc(' + ls + ' + 0.18em)' }, { opacity: 1, letterSpacing: ls }], { duration: 1100, easing: EASE, fill: 'backwards' }); }), { threshold: 0.4 });
  const scanEyebrows = () => { if (reduce) return; document.querySelectorAll('section span').forEach(el => {
    if (el.__eb || el.closest('header, footer, button, a, label, [data-no-reveal], [data-slides]')) return; el.__eb = true;
    const cs = getComputedStyle(el); if (cs.textTransform !== 'uppercase' || parseFloat(cs.fontSize) > 13 || parseFloat(cs.letterSpacing) < 2 || el.children.length) return;
    const r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.9 && performance.now() < 1500) return; eio.observe(el); }); };
  // Count-up: any element with data-count="1250" (optional data-prefix / data-suffix)
  const cio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const el = e.target; cio.unobserve(el);
    const to = parseFloat(el.dataset.count) || 0, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', t0 = performance.now(), d = 1400;
    const f = t => { const k = Math.min(1, (t - t0) / d), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = pre + Math.round(v).toLocaleString() + suf; if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }), { threshold: 0.5 });
  const scanCount = () => { document.querySelectorAll('[data-count]').forEach(el => { if (el.__cnt) return; el.__cnt = true; if (reduce) return; cio.observe(el); }); };
  // Card hover lift: grid cards that are links/buttons get a gentle tilt on desktop
  const autoTilt = () => { if (reduce || !matchMedia('(hover: hover) and (pointer: fine)').matches) return; document.querySelectorAll('section div').forEach(g => {
    if (g.__at || getComputedStyle(g).display !== 'grid' || g.children.length < 3) return; g.__at = true;
    [...g.children].forEach(c => { if ((c.tagName === 'A' || c.tagName === 'BUTTON') && c.querySelector('img') && !c.hasAttribute('data-tilt')) c.setAttribute('data-tilt', ''); }); }); };

  const scan = () => {
    document.querySelectorAll('section h3, section > div > div > div > a[style*="min-height:4"], section > div > div > a[style*="min-height:4"], section > div > a[style*="min-height:4"]').forEach(el => prep(el, 120));
    document.querySelectorAll('section h1, section h2, section > div > p, section > div > div > p, section image-slot, [data-reveal]').forEach(el => prep(el));
    document.querySelectorAll('section div').forEach(g => {
      if (g.__sotGrid) return;
      const kids = g.children; if (kids.length < 3) return;
      const cs = getComputedStyle(g); if (cs.display !== 'grid') return;
      if (g.querySelector(':scope > button, :scope > label')) return;
      g.__sotGrid = true;
      [...kids].forEach((k, i) => prep(k, (i % 6) * 70));
    });
  };

  // Parallax
  const par = new Set();
  const updatePar = () => {
    par.forEach(el => {
      if (!el.isConnected) { par.delete(el); return; }
      const f = parseFloat(el.dataset.parallax) || 0.1;
      const r = el.getBoundingClientRect(); const d = (r.top + r.height / 2) - innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-d * f).toFixed(1)}px, 0)`;
    });
  };
  const scanPar = () => { if (reduce) return; document.querySelectorAll('[data-parallax]').forEach(el => { if (!par.has(el)) { par.add(el); el.style.willChange = 'transform'; } }); };

  // Nav state
  const updateNav = () => {
    const n = document.querySelector('[data-nav]'); if (!n) return;
    const s = SY() > 24;
    n.style.boxShadow = s ? '0 10px 30px -18px rgba(36,34,29,0.35)' : 'none';
    n.style.background = s ? 'rgba(248,244,237,0.97)' : 'rgba(248,244,237,0.72)';
    n.style.transition = 'box-shadow .4s ease, background .4s ease';
  };

  // Floating Book button
  let fab;
  const makeFab = () => {
    if (fab) return;
    fab = document.createElement('a'); if (/Book\.dc\.html/i.test(location.pathname)) fab.style.display = 'none'; fab.href = 'Book.dc.html'; fab.textContent = 'Book now';
    Object.assign(fab.style, { position: 'fixed', right: '20px', bottom: '20px', zIndex: '90', background: '#536B4E', color: '#F8F4ED', padding: '16px 26px', fontFamily: 'Montserrat, sans-serif', fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: '600', textDecoration: 'none', boxShadow: '0 14px 30px -12px rgba(36,34,29,0.5)', border: '1px solid #C6A15B', opacity: '0', transform: 'translateY(16px)', pointerEvents: 'none', transition: `opacity .5s ${EASE}, transform .5s ${EASE}, background .3s` });
    fab.onmouseenter = () => fab.style.background = '#493126'; fab.onmouseleave = () => fab.style.background = '#536B4E';
    document.body.appendChild(fab);
    const wa = document.createElement('a'); wa.href = 'https://wa.me/233597182026'; wa.target = '_blank'; wa.rel = 'noopener'; wa.setAttribute('aria-label', 'WhatsApp Sense of Touch');
    wa.innerHTML = '<svg viewBox="0 0 32 32" width="26" height="26" fill="#F8F4ED" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.2c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3zm0 23c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.3 1.3-4-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6C5.4 9.8 10.2 5.1 16 5.1s10.6 4.7 10.6 10.5S21.8 26 16 26zm5.8-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>';
    Object.assign(wa.style, { position: 'fixed', left: '20px', bottom: '20px', zIndex: '90', width: '56px', height: '56px', borderRadius: '50%', background: '#536B4E', border: '1px solid #C6A15B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px -12px rgba(36,34,29,0.5)', transition: 'background .3s, transform .3s' });
    wa.onmouseenter = () => { wa.style.background = '#493126'; wa.style.transform = 'translateY(-2px)'; }; wa.onmouseleave = () => { wa.style.background = '#536B4E'; wa.style.transform = 'none'; };
    document.body.appendChild(wa);
  };
  const updateFab = () => { if (!fab) return; const on = SY() > innerHeight * 0.7; fab.style.opacity = on ? '1' : '0'; fab.style.transform = on ? 'none' : 'translateY(16px)'; fab.style.pointerEvents = on ? 'auto' : 'none'; };

  // Page transitions
  const veil = () => { let v = document.getElementById('sot-veil'); if (!v) { v = document.createElement('div'); v.id = 'sot-veil'; Object.assign(v.style, { position: 'fixed', inset: '0', background: '#F8F4ED', zIndex: '200', pointerEvents: 'none', opacity: '0', transition: 'opacity .35s ease' }); document.body.appendChild(v); } return v; };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || reduce) return;
    const href = a.getAttribute('href'); if (!href || href.startsWith('#') || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (!/\.dc\.html(#.*)?$/i.test(href)) return;
    e.preventDefault(); const v = veil(); v.style.pointerEvents = 'auto'; requestAnimationFrame(() => v.style.opacity = '1');
    setTimeout(() => { location.href = a.href; }, 360);
  }, true);
  addEventListener('pageshow', () => { const v = document.getElementById('sot-veil'); if (v) { v.style.opacity = '0'; v.style.pointerEvents = 'none'; } });

  let ticking = false;
  const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { updatePar(); updateNav(); updateFab(); ticking = false; }); };
  document.addEventListener('scroll', onScroll, { passive: true, capture: true }); addEventListener('resize', onScroll);


  // 2D live fallback (no WebGL): drifting gold dust + leaves on a canvas
  const live2D = (el, dark) => {
    if (el.__live2d) return; el.__live2d = true;
    const cv = document.createElement('canvas'); Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' }); el.appendChild(cv);
    const x = cv.getContext('2d'); let W = 1, H = 1, raf = 0, vis = true;
    const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = el.clientWidth || 1; H = el.clientHeight || 1; cv.width = W * d; cv.height = H * d; x.setTransform(d, 0, 0, d, 0, 0); };
    fit(); new ResizeObserver(fit).observe(el);
    const P = Array.from({ length: Math.round(Math.min(90, (W * H) / 9000) + 24) }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, s: 0.02 + Math.random() * 0.05, p: Math.random() * 6.28 }));
    const L = Array.from({ length: 6 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 10 + Math.random() * 12, v: 0.008 + Math.random() * 0.012, a: Math.random() * 6.28, g: i % 2 }));
    const gold = dark ? '198,161,91' : '166,128,62';
    const frame = t => {
      t /= 1000; x.clearRect(0, 0, W, H);
      P.forEach(q => { const yy = ((q.y - t * q.s * 0.1) % 1 + 1) % 1, xx = q.x + Math.sin(t * 0.4 + q.p) * 0.01; x.beginPath(); x.arc(xx * W, yy * H, q.r, 0, 6.28); x.fillStyle = 'rgba(' + gold + ',' + (0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.3 + q.p))) + ')'; x.fill(); });
      L.forEach(l => { const yy = ((l.y + t * l.v) % 1.2) - 0.1, xx = l.x + Math.sin(t * 0.5 + l.a) * 0.03; x.save(); x.translate(xx * W, yy * H); x.rotate(l.a + t * 0.3); x.beginPath(); x.moveTo(0, -l.s); x.quadraticCurveTo(l.s * 0.6, 0, 0, l.s); x.quadraticCurveTo(-l.s * 0.6, 0, 0, -l.s); x.fillStyle = l.g ? 'rgba(' + gold + ',0.35)' : (dark ? 'rgba(107,132,98,0.45)' : 'rgba(83,107,78,0.28)'); x.fill(); x.restore(); });
      if (vis && el.isConnected) raf = requestAnimationFrame(frame);
    };
    if (reduce) { frame(0); return; }
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; cancelAnimationFrame(raf); if (vis) raf = requestAnimationFrame(frame); }).observe(el);
  };
  const isDark = el => { let n = el; while (n && n !== document.body) { const b = getComputedStyle(n).backgroundColor; const mm = b.match(/\d+/g); if (mm && (mm[3] === undefined || +mm[3] > 0)) return (+mm[0] * 0.3 + +mm[1] * 0.59 + +mm[2] * 0.11) < 128; n = n.parentElement; } return false; };

  // 3D accents: any [data-3d="variant"] mounts when within 250px of the viewport
  let s3d;
  const check3d = () => {
    document.querySelectorAll('[data-3d]').forEach(el => {
      if (el.__s3dBusy) return;
      const r = el.getBoundingClientRect();
      const far = r.bottom < -innerHeight * 1.5 || r.top > innerHeight * 2.5;
      if (el.__s3dMounted && far) { try { el.__s3dHandle?.dispose?.(); } catch (e) {} el.__s3dHandle = null; el.__s3dMounted = false; return; }
      if (el.__s3dMounted && el.querySelector('canvas')) return;
      if (r.width < 2 || r.height < 2 || r.bottom < -250 || r.top > innerHeight + 250) return;
      el.__s3dBusy = true;
      (async () => {
        try { if (!HAS_GL) throw new Error('WebGL disabled in this browser'); if (el.dataset['3d'] !== 'aftercare') s3d = s3d || import(new URL('scene3d.js', document.baseURI).href); el.__s3dHandle?.dispose?.();
          if (el.dataset['3d'] === 'aftercare') {
            const pm = await import(new URL('product3d.js', document.baseURI).href);
            const P = [{ name: 'Pure Radiance Cleanser', type: 'pump', body: 'green', label: '#E9DDC9', ink: '#493126' }, { name: 'Pure Radiance Face Mask', type: 'jar', body: 'choc', label: '#536B4E', ink: '#F8F4ED' }, { name: 'Cloud Silk Moisturizer', type: 'jar', body: 'ivory', label: '#F8F4ED', ink: '#493126', r: 0.85, h: 1.05 }, { name: 'Golden Radiance Clearing Oil', type: 'dropper', label: '#F8F4ED', ink: '#493126' }];
            const h = await pm.mount(el, P); let i = 0; const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); i = (i + 1) % P.length; h.show(i); }, 5000);
            el.__s3dHandle = { dispose() { clearInterval(iv); h.dispose(); } };
          } else { const m = await s3d; el.__s3dHandle = await m.mount(el, el.dataset['3d']); }
          el.__s3dMounted = true; }
        catch (err) {
          console.warn('3D accent unavailable', err); el.__s3dFailed = true;
          el.querySelectorAll('canvas').forEach(c => c.remove());
          const v = el.dataset['3d'];
          if (v === 'emblem' || v === 'gift') {
            const img = document.createElement('img'); img.src = 'assets/logo.png'; img.alt = '';
            Object.assign(img.style, { position: 'absolute', left: '50%', top: '50%', width: '72%', maxWidth: '360px', transform: 'translate(-50%,-50%)', mixBlendMode: 'multiply', pointerEvents: 'none' });
            el.appendChild(img); el.style.cursor = 'default'; el.style.perspective = '900px';
            if (!reduce && img.animate) img.animate([{ transform: 'translate(-50%,-50%) rotateY(-28deg)' }, { transform: 'translate(-50%,-50%) rotateY(28deg)' }], { duration: 5200, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
          } else if (v === 'voucher') {
            const c = document.createElement('div'); Object.assign(c.style, { position: 'absolute', left: '50%', top: '50%', width: '70%', maxWidth: '340px', aspectRatio: '1.6/1', transform: 'translate(-50%,-50%)', background: 'linear-gradient(120deg,#493126 0%,#5E4235 45%,#C6A15B 50%,#5E4235 55%,#493126 100%)', backgroundSize: '250% 100%', border: '1px solid #C6A15B', boxShadow: '0 30px 60px -30px rgba(36,34,29,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C6A15B', fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', letterSpacing: '0.08em', pointerEvents: 'none' });
            c.textContent = 'Sense of Touch'; el.style.perspective = '900px'; el.appendChild(c); el.style.cursor = 'default';
            if (!reduce && c.animate) { c.animate([{ transform: 'translate(-50%,-50%) rotateY(-22deg) rotateX(8deg)' }, { transform: 'translate(-50%,-50%) rotateY(22deg) rotateX(-6deg)' }], { duration: 6000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }); c.animate([{ backgroundPosition: '100% 0' }, { backgroundPosition: '-100% 0' }], { duration: 4500, iterations: Infinity }); }
          } else if (v === 'stones') { live2D(el, isDark(el)); el.__s3dMounted = true;
          } else if (v === 'dust' || v === 'pureleaves') { live2D(el, isDark(el)); el.__s3dMounted = true;
          } else if (v === 'lip' || v === 'aftercare') {
            const img = document.createElement('img'); img.src = v === 'lip' ? 'assets/web/lip-closeup.jpg' : 'assets/web/facial-treatment.jpg'; img.alt = ''; img.setAttribute('data-no-full', '');
            Object.assign(img.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }); el.prepend(img); el.style.cursor = 'default'; el.querySelectorAll('span').forEach(s => s.style.display = 'none');
            if (!reduce && img.animate) img.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }], { duration: 14000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
          } else if (el.hasAttribute('data-3d-opt') || ['stones'].includes(v)) {
            if (el.style.position === 'absolute') el.style.visibility = 'hidden'; else el.style.display = 'none';
          } else { el.style.cursor = 'default'; el.querySelectorAll('span').forEach(s => s.style.display = 'none'); }
        }
        finally { if (!el.__s3dFailed) el.__s3dBusy = false; }
      })();
    });
  };
  const scan3d = check3d;
  document.addEventListener('scroll', () => requestAnimationFrame(check3d), { passive: true, capture: true });
  addEventListener('resize', check3d);
  setInterval(check3d, 1500);


  // Full-frame photos: never crop — contain + blurred backdrop + slow drift
  const backdrop = (url) => { const b = document.createElement('div'); b.setAttribute('aria-hidden', 'true'); Object.assign(b.style, { position: 'absolute', inset: '-24px', backgroundImage: 'url("' + url + '")', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(22px) brightness(0.62) saturate(1.1)', transform: 'scale(1.08)', pointerEvents: 'none' }); return b; };
  const drift = (el, i = 0) => { if (reduce || !el.animate) return; const dir = i % 2 ? -1 : 1; el.animate([{ transform: 'scale(1) translate3d(0,0,0)' }, { transform: 'scale(1.06) translate3d(' + (dir * 1.2) + '%, -1%, 0)' }], { duration: 16000 + (i % 3) * 3000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }); };
  const scanPhotos = () => {
    document.querySelectorAll('section img[src*="assets/web/"]').forEach((img, i) => {
      if (img.__full || img.closest('[data-slides]') || img.hasAttribute('data-no-full')) return; img.__full = true;
      const box = img.parentElement; if (!box) return;
      if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
      box.style.overflow = 'hidden'; if (!box.style.background && !box.style.backgroundColor) box.style.backgroundColor = '#24221D';
      img.style.objectFit = 'contain'; img.style.objectPosition = 'center'; img.style.zIndex = '1';
      box.insertBefore(backdrop(img.currentSrc || img.src), img); drift(img, i);
    });
    document.querySelectorAll('[role="img"]').forEach((d, i) => {
      const bg = d.style.backgroundImage; if (d.__full || d.hasAttribute('data-no-full') || !bg || bg === 'none' || !/url\(/.test(bg) || /data:image\/svg/.test(bg)) return; d.__full = true;
      const url = bg.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      const box = d.parentElement; box.style.overflow = 'hidden'; box.style.backgroundColor = '#24221D';
      d.style.backgroundSize = 'contain'; d.style.backgroundRepeat = 'no-repeat'; d.style.backgroundPosition = 'center'; d.style.zIndex = '1'; d.style.backgroundColor = 'transparent';
      box.insertBefore(backdrop(url), d); drift(d, i);
    });
  };

  // Slideshows: <div data-slides="a.jpg|b.jpg" data-captions="A|B">
  const scanSlides = () => {
    document.querySelectorAll('[data-slides]').forEach(el => {
      if (el.__slides) return; el.__slides = true;
      const srcs = el.dataset.slides.split('|').map(s => s.trim()).filter(Boolean); if (!srcs.length) return;
      const caps = (el.dataset.captions || '').split('|');
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      Object.assign(el.style, { overflow: 'hidden', backgroundColor: '#24221D', touchAction: 'pan-y' });
      const slides = srcs.map((s, i) => {
        const sl = document.createElement('div'); Object.assign(sl.style, { position: 'absolute', inset: '0', opacity: i ? '0' : '1', transition: 'opacity 1.2s ease', overflow: 'hidden' });
        const url = 'assets/web/' + s; sl.appendChild(backdrop(url));
        const im = document.createElement('img'); im.src = url; im.alt = caps[i] || ''; im.loading = i ? 'lazy' : 'eager';
        Object.assign(im.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'contain', display: 'block' }); sl.appendChild(im); drift(im, i);
        el.appendChild(sl); return sl;
      });
      let cur = 0, timer;
      const capEl = document.createElement('div'); Object.assign(capEl.style, { position: 'absolute', left: '20px', bottom: '18px', zIndex: '3', color: '#F8F4ED', fontFamily: 'Montserrat, sans-serif', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: '600', textShadow: '0 1px 8px rgba(0,0,0,0.6)', maxWidth: '60%', pointerEvents: 'none' });
      const dots = document.createElement('div'); Object.assign(dots.style, { position: 'absolute', right: '18px', bottom: '18px', zIndex: '3', display: 'flex', gap: '6px' });
      const dotEls = srcs.map((_, i) => { const d = document.createElement('button'); d.setAttribute('aria-label', 'Show photo ' + (i + 1)); Object.assign(d.style, { all: 'unset', cursor: 'pointer', width: '22px', height: '3px', background: i ? 'rgba(248,244,237,0.45)' : '#C6A15B', transition: 'background .4s, width .4s' }); d.onclick = () => go(i, true); dots.appendChild(d); return d; });
      const arrow = (dir) => { const b = document.createElement('button'); b.setAttribute('aria-label', dir < 0 ? 'Previous photo' : 'Next photo'); b.textContent = dir < 0 ? '‹' : '›'; Object.assign(b.style, { all: 'unset', cursor: 'pointer', position: 'absolute', top: '50%', [dir < 0 ? 'left' : 'right']: '14px', transform: 'translateY(-50%)', zIndex: '3', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(248,244,237,0.85)', color: '#493126', fontSize: '26px', lineHeight: '42px', textAlign: 'center', fontFamily: 'Cormorant Garamond, serif', opacity: '0', transition: 'opacity .3s' }); b.onclick = () => go(cur + dir, true); return b; };
      const prev = arrow(-1), next = arrow(1);
      if (srcs.length > 1) { el.append(prev, next, dots); }
      el.appendChild(capEl);
      const go = (i, user) => {
        i = (i + srcs.length) % srcs.length; if (i === cur) return;
        slides[cur].style.opacity = '0'; slides[i].style.opacity = '1';
        dotEls[cur] && (dotEls[cur].style.background = 'rgba(248,244,237,0.45)', dotEls[cur].style.width = '22px'); dotEls[i] && (dotEls[i].style.background = '#C6A15B', dotEls[i].style.width = '34px');
        cur = i; capEl.textContent = caps[i] || ''; if (user) restart();
      };
      capEl.textContent = caps[0] || ''; if (dotEls[0]) dotEls[0].style.width = '34px';
      const restart = () => { clearInterval(timer); if (!reduce && srcs.length > 1) timer = setInterval(() => { if (el.isConnected) go(cur + 1); else clearInterval(timer); }, +(el.dataset.interval || 4800)); };
      el.addEventListener('mouseenter', () => { clearInterval(timer); prev.style.opacity = next.style.opacity = '1'; });
      el.addEventListener('mouseleave', () => { prev.style.opacity = next.style.opacity = '0'; restart(); });
      let sx = null; el.addEventListener('pointerdown', e => sx = e.clientX); el.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) go(cur + (e.clientX < sx ? 1 : -1), true); sx = null; });
      if (matchMedia('(hover: none)').matches) prev.style.opacity = next.style.opacity = '0.9';
      restart();
    });
  };

  // Autoplay videos: always muted-autoplay; pause only when far off screen; tap toggles sound
  const tryPlay = v => { v.defaultMuted = true; if (!v.__sound) v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const vio = new IntersectionObserver(es => es.forEach(e => { const v = e.target; if (e.isIntersecting) tryPlay(v); else v.pause(); }), { rootMargin: '300px 600px' });
  const scanVideos = () => document.querySelectorAll('video[data-autoplay]').forEach(v => {
    if (v.__auto) { if (v.paused && v.getBoundingClientRect().top < innerHeight + 300 && v.getBoundingClientRect().bottom > -300) tryPlay(v); return; }
    v.__auto = true; v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('autoplay', ''); v.autoplay = true; v.loop = true; v.preload = 'auto';
    tryPlay(v); vio.observe(v); v.style.cursor = 'pointer';
    v.addEventListener('click', () => { const turnOn = v.muted; document.querySelectorAll('video[data-autoplay]').forEach(o => { o.muted = true; o.__sound = false; }); v.muted = !turnOn; v.__sound = turnOn; tryPlay(v); });
  });
  ['pointerdown', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, () => scanVideos(), { passive: true, once: ev !== 'scroll' }));
  setInterval(() => scanVideos(), 2000);

  // Card tilt
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const scanTilt = () => {
    if (reduce || !fine) return;
    document.querySelectorAll('[data-tilt]').forEach(el => {
      if (el.__tilt) return; el.__tilt = true;
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transition = 'transform .12s ease-out, box-shadow .3s'; el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`; el.style.boxShadow = '0 30px 60px -30px rgba(36,34,29,0.45)'; });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .6s ' + EASE + ', box-shadow .6s'; el.style.transform = 'none'; el.style.boxShadow = 'none'; });
    });
  };

  const init = () => {
    makeFab();
    if (!reduce) { const v = veil(); v.style.opacity = '1'; v.style.transition = 'none'; requestAnimationFrame(() => { v.style.transition = 'opacity .6s ease'; v.style.opacity = '0'; }); }
    let pending = false;
    new MutationObserver(() => { if (pending) return; pending = true; setTimeout(() => { pending = false; scan(); scanEyebrows(); scanCount(); autoTilt(); scanPar(); scan3d(); scanTilt(); scanPhotos(); scanSlides(); scanVideos(); updateNav(); updatePar(); }, 120); }).observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { scan(); scanEyebrows(); scanCount(); autoTilt(); scanPar(); scan3d(); scanTilt(); scanPhotos(); scanSlides(); scanVideos(); onScroll(); }, 300);
  };
  if (document.body) init(); else addEventListener('DOMContentLoaded', init);
})();
