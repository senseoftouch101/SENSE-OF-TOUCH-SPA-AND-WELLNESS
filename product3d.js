// Interactive 3D AFTERCARE product viewer. mount(el, products) -> { show(i), dispose() }
export async function mount(el, products) {
  if (!window.__sotWebGL) { try { const cv = document.createElement('canvas'); window.__sotWebGL = (cv.getContext('webgl2') || cv.getContext('webgl')) ? 'yes' : 'no'; } catch (e) { window.__sotWebGL = 'no'; } }
  if (window.__sotWebGL === 'no') throw new Error('WebGL unavailable');
  const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
  try { await document.fonts?.ready; } catch (e) {}
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50); camera.position.set(0, 0.5, 7.6); camera.lookAt(0, -0.05, 0);
  const pm = new THREE.PMREMGenerator(renderer);
  const envS = new THREE.Scene();
  envS.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), new THREE.MeshBasicMaterial({ color: 0x2a251f, side: THREE.BackSide })));
  [[0, 7, 0, 10, 1, 10, 4], [8, 2, 3, 1, 5, 5, 3], [-8, 1, 4, 1, 4, 3, 2], [0, 1, -8, 6, 3, 1, 1.5]].forEach(([x, y, z, a, b, c, k]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k * 0.95, k * 0.85) })); m.position.set(x, y, z); envS.add(m); });
  scene.environment = pm.fromScene(envS, 0.03).texture;
  const key = new THREE.DirectionalLight(0xfff3df, 1.6); key.position.set(3, 5, 6); scene.add(key);

  // contact shadow
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  const sx = sc.getContext('2d'); const g = sx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.32; scene.add(shadow);

  const M = {
    gold: new THREE.MeshStandardMaterial({ color: 0xC6A15B, metalness: 1, roughness: 0.22 }),
    green: new THREE.MeshPhysicalMaterial({ color: 0x536B4E, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
    ivory: new THREE.MeshPhysicalMaterial({ color: 0xF3ECE0, roughness: 0.35, clearcoat: 0.8 }),
    choc: new THREE.MeshPhysicalMaterial({ color: 0x493126, roughness: 0.35, clearcoat: 0.8 }),
    amber: new THREE.MeshPhysicalMaterial({ color: 0x6E3B1C, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.93 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x24221D, roughness: 0.75 })
  };

  const labelTex = (name, r, h, bg, fg) => {
    const W = 2048, H = Math.round(W * h / (2 * Math.PI * r));
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const cx = W / 2;
    x.strokeStyle = '#C6A15B'; x.lineWidth = Math.max(2, H * 0.008);
    x.beginPath(); x.moveTo(cx - W * 0.14, H * 0.1); x.lineTo(cx + W * 0.14, H * 0.1); x.moveTo(cx - W * 0.14, H * 0.9); x.lineTo(cx + W * 0.14, H * 0.9); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#C6A15B';
    const sp = (t, k) => t.split('').join(String.fromCharCode(8202).repeat(k));
    x.font = `600 ${Math.round(H * 0.06)}px Montserrat, sans-serif`; x.fillText(sp('SENSE OF TOUCH', 2), cx, H * 0.22);
    x.fillStyle = fg; x.font = `500 ${Math.round(H * 0.2)}px "Cormorant Garamond", serif`; x.fillText(sp('AFTERCARE', 3), cx, H * 0.45);
    x.fillStyle = '#C6A15B'; x.font = `${Math.round(H * 0.11)}px Allura, cursive`; x.fillText('African Beauty. Inspired Care.', cx, H * 0.62);
    x.fillStyle = fg; x.font = `600 ${Math.round(H * 0.055)}px Montserrat, sans-serif`; x.fillText(sp(name.toUpperCase(), 2), cx, H * 0.78);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  const band = (name, r, h, y, bg, fg) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 96, 1, true), new THREE.MeshPhysicalMaterial({ map: labelTex(name, r, h, bg, fg), roughness: 0.45, clearcoat: 0.4 }));
    m.position.y = y; m.rotation.y = Math.PI; return m;
  };
  const lathe = (pts, mat, seg = 72) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), mat);
  const cyl = (rt, rb, h, y, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 64), mat); m.position.y = y; return m; };

  const build = {
    pump: (p) => { const g = new THREE.Group();
      g.add(lathe([[0, 0], [0.56, 0], [0.6, 0.04], [0.6, 1.7], [0.56, 1.86], [0.4, 1.98], [0.2, 2.04], [0.2, 2.1], [0, 2.1]], M[p.body]));
      g.add(band(p.name, 0.603, 1.15, 0.85, p.label, p.ink));
      g.add(cyl(0.24, 0.24, 0.22, 2.18, M.gold)); g.add(cyl(0.07, 0.07, 0.35, 2.45, M.gold)); g.add(cyl(0.2, 0.22, 0.16, 2.66, M.gold));
      const n = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.1), M.gold); n.position.set(0.3, 2.68, 0); g.add(n); return g; },
    jar: (p) => { const g = new THREE.Group(); const r = p.r || 0.95, h = p.h || 0.95;
      g.add(lathe([[0, 0], [r - 0.05, 0], [r, 0.05], [r, h], [r - 0.06, h + 0.04], [0, h + 0.04]], M[p.body]));
      g.add(band(p.name, r + 0.003, h * 0.7, h * 0.48, p.label, p.ink));
      g.add(lathe([[0, h + 0.02], [r + 0.03, h + 0.02], [r + 0.05, h + 0.06], [r + 0.05, h + 0.36], [r - 0.02, h + 0.42], [0, h + 0.42]], M.gold)); return g; },
    dropper: (p) => { const g = new THREE.Group();
      g.add(lathe([[0, 0], [0.46, 0], [0.5, 0.05], [0.5, 1.25], [0.42, 1.45], [0.2, 1.55], [0.2, 1.65], [0, 1.65]], M.amber));
      g.add(band(p.name, 0.503, 0.85, 0.6, p.label, p.ink));
      g.add(cyl(0.26, 0.26, 0.36, 1.78, M.gold));
      g.add(lathe([[0, 1.95], [0.17, 1.95], [0.19, 2.1], [0.17, 2.4], [0.1, 2.55], [0, 2.58]], M.rubber, 48)); return g; }
  };

  const holder = new THREE.Group(); scene.add(holder);
  let current = null, appear = 1;
  const show = (i) => {
    const p = products[i]; if (!p) return;
    if (current) { holder.remove(current); current.traverse(o => { if (o.material?.map) { o.material.map.dispose(); o.material.dispose(); } o.geometry?.dispose(); }); }
    current = build[p.type](p);
    const box = new THREE.Box3().setFromObject(current); const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3());
    const k = 2.6 / Math.max(s.y, s.x * 1.3); current.scale.setScalar(k); current.position.set(-c.x * k, -c.y * k, -c.z * k);
    shadow.position.y = -s.y * k / 2 - 0.01; shadow.scale.setScalar(Math.max(s.x * k, 1.2) / 1.6);
    holder.add(current); appear = 0; vy += 0.25;
  };

  let W = 1, H = 1;
  const resize = () => { W = el.clientWidth || 1; H = el.clientHeight || 1; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); };
  resize(); const ro = new ResizeObserver(resize); ro.observe(el);

  let ry = -0.5, rx = 0.08, vy = 0, drag = null, lastInput = -10;
  const clock = new THREE.Clock();
  const down = e => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture?.(e.pointerId); el.style.cursor = 'grabbing'; };
  const move = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; vy = dx * 0.006; ry += dx * 0.01; rx = Math.max(-0.4, Math.min(0.5, rx + dy * 0.005)); lastInput = clock.getElapsedTime(); };
  const up = () => { drag = null; el.style.cursor = 'grab'; };
  el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

  const frame = () => {
    const t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(), 0.05);
    if (!drag) { ry += vy; vy *= 0.94; if (t - lastInput > 2 && !reduce) ry += 0.004; rx += (0.08 - rx) * 0.03; }
    appear = Math.min(1, appear + 0.035); const e = 1 - Math.pow(1 - appear, 3);
    holder.rotation.set(rx, ry - (1 - e) * 1.2, 0); holder.scale.setScalar(0.85 + 0.15 * e);
    holder.position.y = reduce ? 0 : Math.sin(t * 1.2) * 0.04;
    renderer.render(scene, camera);
  };
  let raf = 0;
  const loop = () => { frame(); raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([en]) => { cancelAnimationFrame(raf); if (en.isIntersecting) loop(); });
  io.observe(el);
  show(0); frame();

  return {
    show,
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      pm.dispose(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
    }
  };
}
