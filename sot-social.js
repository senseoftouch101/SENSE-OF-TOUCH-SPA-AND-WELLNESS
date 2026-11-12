// Sense of Touch — social media feed: pinned posts (managed in Admin → Social) + optional automatic feed.
// Automatic feed options: Behold (Instagram → public JSON feed URL, fetched here) or Elfsight (multi-platform widget script).
// Third-party embeds only load when a visitor taps a post, so no social cookies are set on page load.
(function () {
  if (window.SOTSocial) return;
  const S = window.SOT; if (!S) { console.warn('sot-social.js needs sot-store.js first'); return; }
  const PLATFORMS = ['Instagram', 'YouTube', 'Threads', 'TikTok', 'Facebook'];
  const PLACEMENTS = [['home', 'Homepage'], ['institute', 'Institute'], ['gallery', 'Gallery'], ['journal', 'Journal'], ['footer', 'Footer']];
  const DEF_ACC = [
    { platform: 'Instagram', handle: '@senseoftouchgh', url: 'https://www.instagram.com/senseoftouchgh/' },
    { platform: 'YouTube', handle: '@Lifewithwose', url: 'https://www.youtube.com/@Lifewithwose' },
    { platform: 'Threads', handle: '@senseoftouchgh', url: 'https://www.threads.com/@senseoftouchgh' },
    { platform: 'TikTok', handle: '', url: '' },
    { platform: 'Facebook', handle: '', url: '' }
  ];
  const cfg = () => { const c = S.list('social-settings')[0] || {}; const acc = DEF_ACC.map(d => ({ ...d, ...((c.accounts || []).find(a => a.platform === d.platform) || {}) })); return { provider: 'none', beholdUrl: '', elfsightId: '', ...c, accounts: acc }; };
  const setCfg = p => S.save('social-settings', [{ ...cfg(), ...p }]);
  function parse(url) {
    const u = String(url || '').trim(); let m;
    if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/))) return { platform: 'YouTube', id: m[1], embed: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0', thumb: 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg', ratio: '16/9' };
    if ((m = u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/))) return { platform: 'Instagram', id: m[2], embed: 'https://www.instagram.com/' + m[1] + '/' + m[2] + '/embed', ratio: '4/5' };
    if ((m = u.match(/threads\.(?:net|com)\/(@[\w.]+)\/post\/([\w-]+)/))) return { platform: 'Threads', id: m[2], embed: 'https://www.threads.com/' + m[1] + '/post/' + m[2] + '/embed', ratio: '4/5' };
    if ((m = u.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/))) return { platform: 'TikTok', id: m[1], embed: 'https://www.tiktok.com/embed/v2/' + m[1], ratio: '9/16' };
    if (/facebook\.com|fb\.watch/.test(u)) { const vid = /\/videos\/|fb\.watch|\/reel\//.test(u); return { platform: 'Facebook', id: u, embed: 'https://www.facebook.com/plugins/' + (vid ? 'video' : 'post') + '.php?show_text=true&href=' + encodeURIComponent(u), ratio: vid ? '16/9' : '4/5' }; }
    return null;
  }
  const pinned = () => S.list('social-posts').slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  function addPost(d, by) {
    const p = parse(d.url); if (!p) return { error: 'Paste a link to a single Instagram, YouTube, Threads, TikTok or Facebook post.' };
    if (S.list('social-posts').some(x => x.url.trim() === d.url.trim())) return { error: 'That post is already added.' };
    const pl = (d.placements && d.placements.length) ? d.placements : PLACEMENTS.map(x => x[0]);
    return { ok: true, post: S.add('social-posts', { url: d.url.trim(), platform: p.platform, caption: (d.caption || '').trim(), image: d.image || p.thumb || '', placements: pl, active: true, order: -Date.now(), by: by || 'Staff' }, 'SP') };
  }
  const FKEY = 'sot-social-feed-cache';
  async function feed() { // automatic posts (Behold JSON); cached for 30 minutes
    const c = cfg(); if (c.provider !== 'behold' || !/^https:\/\/feeds\.behold\.so\//.test(c.beholdUrl)) return [];
    try { const k = JSON.parse(sessionStorage.getItem(FKEY) || 'null'); if (k && k.src === c.beholdUrl && Date.now() - k.at < 18e5) return k.items; } catch (e) {}
    try {
      const r = await fetch(c.beholdUrl); if (!r.ok) return []; const j = await r.json(); const arr = Array.isArray(j) ? j : (j.posts || []);
      const items = arr.slice(0, 12).map(p => ({ id: 'B-' + p.id, url: p.permalink, platform: 'Instagram', caption: String(p.prunedCaption || p.caption || '').slice(0, 220), image: (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl || '', auto: true }));
      try { sessionStorage.setItem(FKEY, JSON.stringify({ src: c.beholdUrl, at: Date.now(), items })); } catch (e) {}
      return items;
    } catch (e) { return []; }
  }
  function forPlacement(placement, autoItems, n) {
    const pins = pinned().filter(p => p.active && (p.placements || []).includes(placement));
    const seen = new Set(pins.map(p => p.url)); const out = [...pins, ...(autoItems || []).filter(a => !seen.has(a.url))];
    return out.slice(0, n || 6).map(p => ({ ...p, meta: parse(p.url) || { platform: p.platform, embed: '', ratio: '4/5' } }));
  }
  function resizeImage(file, max) { // staff upload → compressed data URL (prototype storage; production uses cloud storage)
    return new Promise((res, rej) => { if (!/^image\//.test(file.type)) return rej(new Error('Choose an image file.')); const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, (max || 640) / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.78)); }; im.onerror = () => rej(new Error('Could not read that image.')); im.src = fr.result; }; fr.readAsDataURL(file); });
  }
  // Social sites refuse to load inside frames (site previews, in-app browsers). Open them in a new tab;
  // if the browser blocks that, show a fallback with the link to copy or open directly.
  const SOCIAL = /(^|\.)(instagram\.com|youtube\.com|youtu\.be|threads\.(net|com)|tiktok\.com|facebook\.com|fb\.watch)$/i;
  function fallback(url) {
    let el = document.getElementById('sot-social-fallback'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'sot-social-fallback'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Open social link');
    el.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:200;width:min(440px,calc(100vw - 32px));background:#FFFDF9;border:1px solid #C6A15B;box-shadow:0 24px 48px -24px rgba(36,34,29,.6);padding:18px;font-family:Montserrat,sans-serif;color:#24221D;display:flex;flex-direction:column;gap:10px';
    const t = document.createElement('span'); t.textContent = 'This page is shown inside a preview, so the link couldn’t open here. Open it directly or copy it:'; t.style.cssText = 'font-size:14px;line-height:1.5';
    const u = document.createElement('span'); u.textContent = url; u.style.cssText = 'font-size:13px;color:#536B4E;word-break:break-all';
    const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
    const btn = (label, dark, fn) => { const b = document.createElement(fn ? 'button' : 'a'); b.textContent = label; b.style.cssText = 'all:unset;cursor:pointer;min-height:44px;padding:0 16px;display:inline-flex;align-items:center;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;' + (dark ? 'background:#493126;color:#F8F4ED' : 'border:1px solid #493126;color:#493126'); if (fn) b.onclick = fn; else { b.href = url; b.target = '_top'; b.rel = 'noopener'; b.dataset.sotDirect = '1'; } return b; };
    const copy = btn('Copy link', true, () => { (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { copy.textContent = 'Copied'; }).catch(() => { const r = document.createRange(); r.selectNodeContents(u); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected — press copy'; }); });
    row.append(copy, btn('Open here', false), btn('Close', false, () => el.remove()));
    el.append(t, u, row); document.body.appendChild(el);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.dataset.sotDirect || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    let host; try { host = new URL(a.href).hostname; } catch (x) { return; } if (!SOCIAL.test(host)) return;
    e.preventDefault(); let w = null; try { w = window.open(a.href, '_blank'); if (w) w.opener = null; } catch (x) {}
    if (!w) fallback(a.href);
  }, true);

  window.SOTSocial = { openLink: url => { let w = null; try { w = window.open(url, '_blank'); if (w) w.opener = null; } catch (x) {} if (!w) fallback(url); }, PLATFORMS, PLACEMENTS, cfg, setCfg, parse, pinned, addPost, feed, forPlacement, resizeImage, clearCache: () => { try { sessionStorage.removeItem(FKEY); } catch (e) {} } };
})();
