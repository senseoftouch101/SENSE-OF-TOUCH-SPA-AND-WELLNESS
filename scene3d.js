// Sense of Touch 3D accents. mount(el, variant) -> { dispose }
// variants: pureleaves · stones · lip · voucher
const T_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';
const C = { choc: 0x493126, green: 0x536B4E, gold: 0xC6A15B, beige: 0xE9DDC9, ivory: 0xF8F4ED, char: 0x24221D };

export async function mount(el, variant) {
  if (!window.__sotWebGL) { try { const cv = document.createElement('canvas'); window.__sotWebGL = (cv.getContext('webgl2') || cv.getContext('webgl')) ? 'yes' : 'no'; } catch (e) { window.__sotWebGL = 'no'; } }
  if (window.__sotWebGL === 'no') throw new Error('WebGL unavailable');
  const THREE = await import(T_URL);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60); camera.position.set(0, 0, 9);
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), new THREE.MeshBasicMaterial({ color: 0x3a3028, side: THREE.BackSide })));
  [[0, 7, 0, 10, 1, 10, 3.5], [8, 2, 3, 1, 5, 5, 2.5], [-8, 1, 4, 1, 4, 3, 1.6]].forEach(([x, y, z, a, b, c, k]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k * 0.95, k * 0.86) })); m.position.set(x, y, z); env.add(m);
  });
  scene.environment = pm.fromScene(env, 0.03).texture;
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0x493126, 0.6));
  const key = new THREE.DirectionalLight(0xfff3df, 1.5); key.position.set(3, 5, 7); scene.add(key);

  const root = new THREE.Group(); scene.add(root);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gold = new THREE.MeshStandardMaterial({ color: C.gold, metalness: 1, roughness: 0.22, side: THREE.DoubleSide });
  let update = () => {}, draggable = false, fitZ = 9;
  let ry = variant === 'voucher' ? -0.35 : 0, rx = 0.06, vy, drag, lastInput, mx, my, restX = 0.06;

  const leafGeo = () => {
    const s = new THREE.Shape(); s.moveTo(0, -1); s.bezierCurveTo(0.6, -0.55, 0.58, 0.45, 0, 1); s.bezierCurveTo(-0.58, 0.45, -0.6, -0.55, 0, -1);
    const g = new THREE.ShapeGeometry(s, 18), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, x * x * 0.9 - y * y * 0.12); }
    g.computeVertexNormals(); return g;
  };
  const dust = (n, color, size, spread) => {
    const pos = new Float32Array(n * 3), sp = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = rnd(-spread[0], spread[0]); pos[i * 3 + 1] = rnd(-spread[1], spread[1]); pos[i * 3 + 2] = rnd(-2, 2); sp[i] = rnd(0.1, 0.35); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.75, depthWrite: false }));
    pts.userData.tick = (dt) => { for (let i = 0; i < n; i++) { pos[i * 3 + 1] += sp[i] * dt; if (pos[i * 3 + 1] > spread[1]) pos[i * 3 + 1] = -spread[1]; } g.attributes.position.needsUpdate = true; };
    return pts;
  };

  if (variant === 'pureleaves') {
    const g = leafGeo();
    const mats = [0x536B4E, 0x6B8462, 0x3F5640].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, side: THREE.DoubleSide }));
    const leaves = Array.from({ length: 11 }, (_, i) => {
      const m = new THREE.Mesh(g, i % 4 === 0 ? gold : mats[i % 3]); m.scale.setScalar(rnd(0.35, 0.8));
      m.userData = { x: rnd(0.6, 2.6), y: rnd(-2.2, 2.2), z: rnd(-2, 0.5), r: [rnd(0, 6), rnd(0, 6), rnd(0, 6)], sp: rnd(0.15, 0.4), ph: rnd(0, 6) };
      root.add(m); return m;
    });
    const d = dust(50, 0xB8924A, 0.04, [1.4, 3]); d.position.x = 1.6; root.add(d);
    update = (t, dt) => {
      leaves.forEach(m => { const u = m.userData; m.position.set(u.x + Math.sin(t * u.sp + u.ph) * 0.25, u.y + Math.sin(t * u.sp * 0.8 + u.ph) * 0.3, u.z); m.rotation.set(u.r[0] + t * u.sp * 0.4, u.r[1] + Math.sin(t * u.sp) * 0.5, u.r[2] + t * u.sp * 0.2); });
      d.userData.tick(dt);
    };
    fitZ = 8;
  }

  if (variant === 'stones') {
    const basalt = new THREE.MeshPhysicalMaterial({ color: 0x2b2824, roughness: 0.38, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.35 });
    const stack = new THREE.Group(); root.add(stack);
    const sizes = [1.35, 1.12, 0.92, 0.72, 0.52]; let y = -1.4;
    sizes.forEach((r, i) => {
      const geo = new THREE.SphereGeometry(r, 48, 24); const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) { const v = new THREE.Vector3().fromBufferAttribute(p, k); const n = 1 + 0.04 * Math.sin(v.x * 3 + i) * Math.cos(v.z * 2.5); p.setXYZ(k, v.x * n, v.y * 0.42 * n, v.z * n * 0.92); }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, basalt); const h = r * 0.42;
      y += h; m.position.set(Math.sin(i * 1.7) * 0.06, y, Math.cos(i * 2.1) * 0.05); m.rotation.y = i * 0.9; m.rotation.z = (i % 2 ? 1 : -1) * 0.04;
      y += h * 0.92; stack.add(m);
    });
    const leaf = new THREE.Mesh(leafGeo(), gold); leaf.scale.setScalar(0.42); leaf.rotation.set(-1.25, 0.4, 0.5); leaf.position.set(0.12, y + 0.06, 0.05); stack.add(leaf);
    const sprig = new THREE.Mesh(leafGeo(), new THREE.MeshStandardMaterial({ color: C.green, roughness: 0.5, side: THREE.DoubleSide })); sprig.scale.setScalar(0.5); sprig.rotation.set(-1.4, -0.6, -0.8); sprig.position.set(-0.55, -1.0, 0.9); stack.add(sprig);
    const steam = dust(60, 0xffffff, 0.06, [1.2, 3]); steam.material.opacity = 0.35; steam.position.y = 1; root.add(steam);
    update = (t, dt) => { stack.rotation.y = t * 0.18; stack.position.y = Math.sin(t * 0.8) * 0.05; steam.userData.tick(dt * 0.6); };
    fitZ = 9.5;
  }

  if (variant === 'lip') {
    draggable = true;
    const nude = new THREE.MeshPhysicalMaterial({ color: 0xB06A55, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
    const ivory = new THREE.MeshPhysicalMaterial({ color: 0xF3ECE0, roughness: 0.3, clearcoat: 0.8 });
    const green = new THREE.MeshPhysicalMaterial({ color: C.green, roughness: 0.3, clearcoat: 1 });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xD9A79A, roughness: 0.05, transmission: 0.6, thickness: 0.5, clearcoat: 1, transparent: true, opacity: 0.85 });
    const lathe = (pts, mat) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 64), mat);
    // gloss tube
    const tube = new THREE.Group();
    tube.add(lathe([[0, 0], [0.3, 0], [0.32, 0.05], [0.32, 1.9], [0.3, 1.95], [0, 1.95]], glass));
    tube.add(lathe([[0, 0.12], [0.24, 0.12], [0.24, 1.8], [0, 1.8]], nude));
    const cap = lathe([[0, 1.95], [0.33, 1.95], [0.34, 2.0], [0.34, 3.05], [0.31, 3.12], [0, 3.12]], gold); tube.add(cap);
    tube.position.set(-0.95, -1.55, 0); tube.rotation.z = 0.12;
    // lipstick
    const stick = new THREE.Group();
    stick.add(lathe([[0, 0], [0.36, 0], [0.37, 0.05], [0.37, 1.15], [0, 1.15]], gold));
    stick.add(lathe([[0, 1.15], [0.3, 1.15], [0.3, 1.55], [0, 1.55]], ivory));
    const bullet = lathe([[0, 1.5], [0.24, 1.5], [0.24, 2.05], [0.2, 2.22], [0.05, 2.4], [0, 2.42]], nude); bullet.rotation.y = 0.4; stick.add(bullet);
    stick.position.set(0.55, -1.55, -0.4); stick.rotation.z = -0.08;
    // balm pot
    const pot = new THREE.Group();
    pot.add(lathe([[0, 0], [0.6, 0], [0.62, 0.04], [0.62, 0.42], [0, 0.42]], green));
    pot.add(lathe([[0, 0.42], [0.63, 0.42], [0.64, 0.46], [0.64, 0.66], [0.6, 0.7], [0, 0.7]], gold));
    pot.position.set(0.15, -1.55, 0.95);
    const group = new THREE.Group(); group.add(tube, stick, pot); root.add(group);
    const drops = Array.from({ length: 9 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.05, 0.13), 24, 16), glass); m.userData = { x: rnd(-2, 2), y: rnd(-1, 2), z: rnd(-1, 1.5), sp: rnd(0.3, 0.7), ph: rnd(0, 6) }; m.scale.y = 1.15; root.add(m); return m; });
    update = (t) => { drops.forEach(d => { const u = d.userData; d.position.set(u.x, u.y + Math.sin(t * u.sp + u.ph) * 0.2, u.z); }); group.position.y = Math.sin(t * 0.9) * 0.04 + 0.2; };
    fitZ = 8.2;
  }

  if (variant === 'voucher') {
    draggable = true;
    try { await Promise.all(['500 80px "Cormorant Garamond"', '80px Allura', '600 20px Montserrat'].map(f => document.fonts.load(f))); } catch (e) {}
    const W = 4, H = 2, R = 0.16, D = 0.06;
    const s = new THREE.Shape(), x0 = -W / 2, y0 = -H / 2;
    s.moveTo(x0 + R, y0); s.lineTo(x0 + W - R, y0); s.quadraticCurveTo(x0 + W, y0, x0 + W, y0 + R); s.lineTo(x0 + W, y0 + H - R); s.quadraticCurveTo(x0 + W, y0 + H, x0 + W - R, y0 + H);
    s.lineTo(x0 + R, y0 + H); s.quadraticCurveTo(x0, y0 + H, x0, y0 + H - R); s.lineTo(x0, y0 + R); s.quadraticCurveTo(x0, y0, x0 + R, y0);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 }), gold); body.geometry.translate(0, 0, -D / 2);
    const face = (draw, z, flip) => {
      const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const x = c.getContext('2d'); draw(x, c.width, c.height);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      const m = new THREE.Mesh(new THREE.ShapeGeometry(s, 16), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.35, clearcoat: 0.6 }));
      const uv = m.geometry.attributes.uv, p = m.geometry.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - x0) / W, (p.getY(i) - y0) / H);
      m.position.z = z; if (flip) m.rotation.y = Math.PI; return m;
    };
    const frame = (x, w, h, bg) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = '#C6A15B'; x.lineWidth = 4; x.strokeRect(48, 48, w - 96, h - 96); };
    const front = face((x, w, h) => {
      frame(x, w, h, '#536B4E');
      x.fillStyle = '#F8F4ED'; x.font = '600 34px Montserrat'; x.textBaseline = 'top'; x.fillText('S E N S E   O F   T O U C H', 110, 110);
      x.fillStyle = '#C6A15B'; x.textAlign = 'right'; x.fillText('G I F T   V O U C H E R', w - 110, 110);
      x.textAlign = 'left'; x.font = '230px Allura'; x.textBaseline = 'alphabetic'; x.fillText('A moment, for you', 100, 640);
      x.fillStyle = '#F8F4ED'; x.font = '600 30px Montserrat'; x.fillText('S P A   &   W E L L N E S S   ·   T E M A', 110, 880);
    }, D / 2 + 0.016);
    const back = face((x, w, h) => {
      frame(x, w, h, '#493126');
      x.textAlign = 'center'; x.fillStyle = '#C6A15B'; x.font = '500 120px "Cormorant Garamond"'; x.fillText('Sense of Touch', w / 2, 420);
      x.fillStyle = '#E9DDC9'; x.font = '600 30px Montserrat'; x.fillText('T O        ·        F R O M        ·        T R E A T M E N T', w / 2, 600);
      x.strokeStyle = 'rgba(198,161,91,0.6)'; x.lineWidth = 2; [700, 790].forEach(y => { x.beginPath(); x.moveTo(300, y); x.lineTo(w - 300, y); x.stroke(); });
      x.fillStyle = '#E9DDC9'; x.font = '500 28px Montserrat'; x.fillText('Community 25 Estate Junction, Tema  ·  +233 59 718 2026  ·  senseoftouch.co', w / 2, 900);
    }, -D / 2 - 0.016, true);
    const card = new THREE.Group(); card.add(body, front, back); root.add(card);
    update = (t) => { card.position.y = Math.sin(t * 1.1) * 0.05; };
    fitZ = 7.4;
  }

  if (variant === 'emblem') {
    draggable = true;
    const tex = await new THREE.TextureLoader().loadAsync('assets/logo.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const disc = new THREE.Group();
    disc.add(new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.09, 24, 96), gold));
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.025, 12, 96), gold); rim2.position.z = 0.09; disc.add(rim2);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.16, 96), new THREE.MeshPhysicalMaterial({ color: C.green, roughness: 0.35, clearcoat: 1 })); body.rotation.x = Math.PI / 2; disc.add(body);
    const face = new THREE.Mesh(new THREE.CircleGeometry(1.06, 96), new THREE.MeshBasicMaterial({ map: tex, color: 0xFBF6EE }));
    const uv = face.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * 0.78, 0.6 + (uv.getY(i) - 0.5) * 0.62);
    face.position.z = 0.085; disc.add(face);
    const back = new THREE.Mesh(new THREE.CircleGeometry(1.06, 96), gold); back.position.z = -0.085; back.rotation.y = Math.PI; disc.add(back);
    root.add(disc);
    const lg = leafGeo();
    const greens = [0x536B4E, 0x6B8462, 0x3F5640].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, side: THREE.DoubleSide }));
    const orbit = new THREE.Group(); root.add(orbit); orbit.rotation.x = 0.35;
    const leaves = Array.from({ length: 16 }, (_, i) => {
      const m = new THREE.Mesh(lg, i % 3 === 0 ? gold : greens[i % 3]); m.scale.setScalar(rnd(0.22, 0.42));
      m.userData = { a: (i / 16) * Math.PI * 2, r: rnd(1.75, 2.35), y: rnd(-0.5, 0.5), sp: rnd(0.12, 0.22), ph: rnd(0, 6), tilt: rnd(-0.5, 0.5) };
      orbit.add(m); return m;
    });
    const d = dust(90, 0xC6A15B, 0.04, [3, 2.6]); root.add(d);
    update = (t, dt) => {
      disc.position.y = Math.sin(t * 1.1) * 0.06;
      leaves.forEach(m => { const u = m.userData; const a = u.a + t * u.sp; m.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 0.8 + u.ph) * 0.15, Math.sin(a) * u.r); m.rotation.set(u.tilt + t * 0.3, -a, Math.sin(t + u.ph) * 0.4); });
      d.userData.tick(dt);
    };
    fitZ = 8.6;
  }

  if (variant === 'dust') {
    const d = dust(160, 0xC6A15B, 0.05, [7, 3.5]); root.add(d);
    const lg = leafGeo();
    const leaves = Array.from({ length: 6 }, (_, i) => { const m = new THREE.Mesh(lg, i % 2 ? gold : new THREE.MeshStandardMaterial({ color: 0x6B8462, roughness: 0.5, side: THREE.DoubleSide })); m.scale.setScalar(rnd(0.25, 0.45)); m.userData = { x: (i % 2 ? 1 : -1) * rnd(3.2, 5.5), y: rnd(-2.5, 2.5), z: rnd(-2, 0), sp: rnd(0.15, 0.3), ph: rnd(0, 6) }; root.add(m); return m; });
    update = (t, dt) => { d.userData.tick(dt); leaves.forEach(m => { const u = m.userData; m.position.set(u.x + Math.sin(t * u.sp + u.ph) * 0.3, u.y + Math.sin(t * u.sp * 0.7 + u.ph) * 0.4, u.z); m.rotation.set(t * u.sp, Math.sin(t * u.sp + u.ph), t * u.sp * 0.5); }); };
    fitZ = 9;
  }

  if (variant === 'gift') {
    draggable = true;
    const box = new THREE.Group();
    const green = new THREE.MeshPhysicalMaterial({ color: C.green, roughness: 0.4, clearcoat: 0.7 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), green); base.position.y = -0.55; box.add(base);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.38, 2.14), green); lid.position.y = 0.39; box.add(lid);
    [[0.26, 1.52, 2.03, 0, -0.55], [2.03, 1.52, 0.26, 0, -0.55], [0.27, 0.4, 2.17, 0, 0.39], [2.17, 0.4, 0.27, 0, 0.39]].forEach(([a, b, c, x, y]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), gold); m.position.set(x, y, 0); box.add(m); });
    const loop = (rz) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 16, 48), gold); m.scale.set(1, 0.65, 1); m.position.set(Math.cos(rz) * 0.32, 0.72, 0); m.rotation.set(Math.PI / 2 - 0.5, 0, rz); return m; };
    const bow = new THREE.Group(); bow.add(loop(0), loop(Math.PI)); const knot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), gold); knot.position.y = 0.66; bow.add(knot); bow.rotation.y = 0.7; box.add(bow);
    root.add(box);
    const d = dust(70, 0xC6A15B, 0.045, [2.6, 2.4]); root.add(d);
    update = (t, dt) => { box.position.y = Math.sin(t * 1.1) * 0.06 + 0.1; d.userData.tick(dt); };
    ry = 0.6; rx = 0.32; restX = 0.32;
    fitZ = 8.4;
  }

  // sizing, interaction, loop
  let W = 1, H = 1;
  const resize = () => { W = el.clientWidth || 1; H = el.clientHeight || 1; renderer.setSize(W, H, false); camera.aspect = W / H; camera.position.z = fitZ * Math.max(1, 1.1 / camera.aspect); camera.updateProjectionMatrix(); };
  resize(); const ro = new ResizeObserver(resize); ro.observe(el);

  vy = 0; drag = null; lastInput = -10; mx = 0; my = 0;
  const clock = new THREE.Clock();
  const down = e => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture?.(e.pointerId); el.style.cursor = 'grabbing'; };
  const move = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; vy = dx * 0.006; ry += dx * 0.01; rx = Math.max(-0.5, Math.min(0.5, rx + dy * 0.005)); lastInput = clock.getElapsedTime(); };
  const up = () => { drag = null; el.style.cursor = 'grab'; };
  const hover = e => { const r = el.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; };
  if (draggable) { el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); }
  addEventListener('pointermove', hover);

  const frameFn = () => {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (draggable) {
      if (!drag) { ry += vy; vy *= 0.94; if (t - lastInput > 2.5 && !reduce) { if (variant === 'voucher') ry += Math.sin(t * 0.5) * 0.004; else if (variant === 'emblem') { const a = Math.atan2(Math.sin(ry), Math.cos(ry)); ry += ((Math.sin(t * 0.6) * 0.45) - a) * 0.03; } else ry += 0.004; } rx += (restX - rx) * 0.03; }
      root.rotation.set(rx, ry, 0);
    } else { root.rotation.y += ((mx * 0.35) - root.rotation.y) * 0.04; root.rotation.x += ((my * 0.2) - root.rotation.x) * 0.04; }
    update(reduce ? 0 : t, reduce ? 0 : dt);
    renderer.render(scene, camera);
  };
  let raf = 0;
  const loop = () => { frameFn(); raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) { if (reduce) frameFn(); else loop(); } });
  io.observe(el); frameFn();

  return { dispose() { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); removeEventListener('pointermove', hover); scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } }); pm.dispose(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove(); } };
}
