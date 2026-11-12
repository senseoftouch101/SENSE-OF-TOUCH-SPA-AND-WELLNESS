// Sense of Touch — gift card QR helpers. QR drawing: qrcode-generator (loaded from CDN in <helmet>).
// Scanning: native BarcodeDetector (Chrome/Edge on Android, desktop Chrome). USB/Bluetooth scanners work anywhere — they type into the focused code field.
(function () {
  if (window.SOTScan) return;
  const codeFrom = raw => { const s = String(raw || '').trim(); try { const u = new URL(s); const c = u.searchParams.get('code'); if (c) return c.toUpperCase(); } catch (e) {} const m = s.toUpperCase().match(/\b(GC|RD)-[A-Z0-9]+\b/); return m ? m[0] : s.toUpperCase(); };
  const checkUrl = code => { try { return new URL('GiftCards.dc.html?code=' + encodeURIComponent(code), location.href).href; } catch (e) { return 'GiftCards.dc.html?code=' + code; } };
  const qrSvg = (text, size) => { const Q = window.qrcode; if (!Q) return ''; const q = Q(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), c = size / (n + 8); let d = ''; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) d += 'M' + ((k + 4) * c).toFixed(2) + ' ' + ((r + 4) * c).toFixed(2) + 'h' + c.toFixed(2) + 'v' + c.toFixed(2) + 'h-' + c.toFixed(2) + 'z'; return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#24221D"/></svg>'); };
  const supported = () => 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  // Code 128-B barcode as an SVG data URL (readable by USB/handheld scanners and BarcodeDetector).
  const C128 = '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112'.split(' ');
  const barcodeSvg = (text, h) => { const t = String(text || '').replace(/[^\x20-\x7E]/g, ''); if (!t) return ''; const codes = [104]; for (const ch of t) codes.push(ch.charCodeAt(0) - 32); let sum = 104; codes.slice(1).forEach((c, i) => { sum += c * (i + 1); }); codes.push(sum % 103, 106); const pat = codes.map(c => C128[c]).join(''); const quiet = 10; let x = quiet, d = ''; for (let i = 0; i < pat.length; i++) { const w = +pat[i]; if (i % 2 === 0) d += 'M' + x + ' 0h' + w + 'v' + h + 'h-' + w + 'z'; x += w; } const W = x + quiet; return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + h + '" preserveAspectRatio="none"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#24221D"/></svg>'); };
  function open(onCode) {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { position: 'fixed', inset: '0', zIndex: '9999', background: 'rgba(36,34,29,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px', fontFamily: 'Montserrat, sans-serif', color: '#F8F4ED' });
    const title = document.createElement('div'); title.textContent = 'Point the camera at the code on the gift card'; Object.assign(title.style, { fontSize: '15px', textAlign: 'center' });
    const box = document.createElement('div'); Object.assign(box.style, { position: 'relative', width: 'min(86vw, 420px)', aspectRatio: '1', background: '#000', overflow: 'hidden', border: '2px solid #C6A15B' });
    const video = document.createElement('video'); video.setAttribute('playsinline', ''); video.muted = true; Object.assign(video.style, { width: '100%', height: '100%', objectFit: 'cover' }); box.appendChild(video);
    const msg = document.createElement('div'); Object.assign(msg.style, { fontSize: '13px', color: '#E9DDC9', textAlign: 'center', maxWidth: '420px', lineHeight: '1.5' });
    const close = document.createElement('button'); close.textContent = 'Close'; Object.assign(close.style, { all: 'unset', cursor: 'pointer', minHeight: '48px', padding: '0 28px', background: '#F8F4ED', color: '#493126', fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: '600', display: 'inline-flex', alignItems: 'center' });
    wrap.append(title, box, msg, close); document.body.appendChild(wrap);
    let stream = null, alive = true;
    const stop = () => { alive = false; if (stream) stream.getTracks().forEach(t => t.stop()); wrap.remove(); };
    close.onclick = stop; wrap.addEventListener('keydown', e => { if (e.key === 'Escape') stop(); });
    if (!supported()) { box.style.display = 'none'; title.textContent = 'Camera scanning isn’t available in this browser'; msg.textContent = 'Use Chrome on Android, or a USB barcode scanner — click the code field and scan; it types the code for you. You can also type the code printed on the card.'; return { stop }; }
    msg.textContent = 'Works with the QR code on printed and digital Sense of Touch gift cards.';
    const det = new window.BarcodeDetector({ formats: ['qr_code', 'code_128'] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => { stream = s; video.srcObject = s; return video.play(); }).then(() => {
      const tick = () => { if (!alive) return; det.detect(video).then(r => { if (r && r[0]) { const c = codeFrom(r[0].rawValue); stop(); onCode && onCode(c); } else requestAnimationFrame(tick); }).catch(() => requestAnimationFrame(tick)); };
      tick();
    }).catch(() => { box.style.display = 'none'; title.textContent = 'Camera access was blocked'; msg.textContent = 'Allow camera access in your browser settings, or type the code printed on the card.'; });
    return { stop };
  }
  window.SOTScan = { open, codeFrom, checkUrl, qrSvg, barcodeSvg, supported };
})();
