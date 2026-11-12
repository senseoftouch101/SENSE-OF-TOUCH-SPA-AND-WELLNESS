// Sense of Touch Institute — 3D scenes. mount(el, variant, opts) -> { focus(key), dispose() }
// variants: hero (floating beauty & wellness objects) · face · back · wood (stylised, illustrative learning models)
const T_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';
const C = { choc: 0x493126, green: 0x536B4E, gold: 0xC6A15B, beige: 0xE9DDC9, ivory: 0xF8F4ED, char: 0x24221D, wood: 0xA8784C, skin: 0xC99A78 };

export async function mount(el, variant = 'hero', opts = {}) {
  if (!window.__sotWebGL) { try { const cv = document.createElement('canvas'); window.__sotWebGL = (cv.getContext('webgl2') || cv.getContext('webgl')) ? 'yes' : 'no'; } catch (e) { window.__sotWebGL = 'no'; } }
  if (window.__sotWebGL === 'no') throw new Error('WebGL unavailable');
  const THREE = await import(T_URL);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || matchMedia('(max-width: 720px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
  renderer.domElement.setAttribute('aria-hidden', 'true');
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(variant === 'hero' ? 35 : 32, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xFFF6E8, 0x493126, 1.1));
  const key = new THREE.DirectionalLight(0xFFF1DC, 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xC6A15B, 1.2); rim.position.set(-4, 2, -3); scene.add(rim);
  const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
  const gold = M(C.gold, { metalness: 0.85, roughness: 0.28 });
  const root = new THREE.Group(); scene.add(root);
  const disposables = [];
  const keep = o => { o.traverse?.(n => { if (n.geometry) disposables.push(n.geometry); if (n.material) disposables.push(n.material); }); return o; };
  let tick = () => {}, focus = () => {};
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let drag = null, rotY = 0, rotX = 0, velY = reduce ? 0 : 0.0025;

  if (variant === 'hero') {
    camera.position.set(0, 0, 9);
    const objs = [];
    const place = (o, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(s); o.userData.base = o.position.clone(); o.userData.ph = Math.random() * Math.PI * 2; o.userData.spin = (Math.random() - 0.5) * 0.4; root.add(keep(o)); objs.push(o); return o; };
    // Massage stones (stack)
    const stones = new THREE.Group(); [[1, 0], [0.82, 0.34], [0.62, 0.62]].forEach(([r, y], i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 24), M(i === 1 ? C.choc : C.char, { roughness: 0.32 })); m.scale.y = 0.38; m.position.y = y; m.rotation.z = (i - 1) * 0.08; stones.add(m); });
    place(stones, -3.1, -0.9, 0, 0.9);
    // Oil dropper bottle
    const bottle = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 1.25, 40), new THREE.MeshPhysicalMaterial({ color: C.green, roughness: 0.18, transmission: lowPower ? 0 : 0.35, thickness: 0.6, clearcoat: 1 })); bottle.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.22, 32), gold); neck.position.y = 0.73; bottle.add(neck);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), M(C.char, { roughness: 0.4 })); bulb.scale.y = 1.5; bulb.position.y = 1.02; bottle.add(bulb);
    place(bottle, 2.9, 0.9, -0.6, 0.95); bottle.rotation.z = -0.25;
    // Cream jar
    const jar = new THREE.Group(); const jb = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.62, 48), M(C.beige, { roughness: 0.35 })); jar.add(jb);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.22, 48), gold); lid.position.y = 0.42; jar.add(lid);
    place(jar, 1.6, -1.55, 0.6, 0.8); jar.rotation.x = 0.35;
    // Wood therapy roller (lathe with ridges)
    const prof = []; for (let i = 0; i <= 40; i++) { const t = i / 40; prof.push(new THREE.Vector2(0.32 + 0.06 * Math.cos(t * Math.PI * 14), (t - 0.5) * 1.5)); }
    const roller = new THREE.Group(); roller.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 36), M(C.wood, { roughness: 0.7 })));
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 12), M(C.choc)); roller.add(axle);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 16), M(C.wood, { roughness: 0.7 })); handle.position.set(0, 0, 0); handle.rotation.z = Math.PI / 2; handle.position.x = 0.75; handle.position.y = 1.05; roller.add(handle);
    roller.rotation.z = Math.PI / 2.4; place(roller, -1.5, 1.55, -1.2, 0.85);
    // Lip balm
    const lip = new THREE.Group(); const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 32), gold); lip.add(tube);
    const bullet = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.25, 8, 20), M(0x8C3B2E, { roughness: 0.3 })); bullet.position.y = 0.62; lip.add(bullet);
    place(lip, 0.3, 1.9, 0.4, 0.8); lip.rotation.z = 0.5;
    // Leaves
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(0.45, 0.55, 0, 1.3); leafShape.quadraticCurveTo(-0.45, 0.55, 0, 0);
    const leafG = new THREE.ShapeGeometry(leafShape, 16), leafM = M(C.green, { side: THREE.DoubleSide, roughness: 0.6 });
    for (let i = 0; i < (lowPower ? 4 : 7); i++) { const l = new THREE.Mesh(leafG, leafM); l.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); place(l, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 4.5, -2 - Math.random() * 2, 0.6 + Math.random() * 0.5); }
    // Gold dust
    const n = lowPower ? 140 : 320, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 14; pos[i * 3 + 1] = (Math.random() - 0.5) * 8; pos[i * 3 + 2] = -1 - Math.random() * 5; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: C.gold, size: 0.035, transparent: true, opacity: 0.8 })); scene.add(keep(dust));
    const onScroll = () => { const r = el.getBoundingClientRect(); root.userData.scroll = Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height))); };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    tick = (t) => {
      const sc = root.userData.scroll || 0;
      objs.forEach(o => { const b = o.userData.base; o.position.y = b.y + Math.sin(t * 0.6 + o.userData.ph) * 0.18 + sc * (b.z + 2) * 0.6; o.position.x = b.x + Math.cos(t * 0.4 + o.userData.ph) * 0.06; o.rotation.y += o.userData.spin * 0.01; });
      dust.rotation.y = t * 0.01; dust.position.y = Math.sin(t * 0.2) * 0.1;
      camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.04; camera.position.y += (-pointer.y * 0.45 - camera.position.y) * 0.04; camera.lookAt(0, 0, 0);
    };
    disposables.push({ dispose: () => removeEventListener('scroll', onScroll) });
  } else {
    // Learning models: drag to rotate, zones/strokes highlight via focus(key)
    camera.position.set(0, variant === 'back' ? 5.2 : 0.2, variant === 'back' ? 3.4 : 6.2); camera.lookAt(0, 0, 0);
    const skin = M(C.skin, { roughness: 0.75 }), hi = k => new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.0, depthWrite: false });
    const zones = {};
    const addZone = (k, mesh) => { mesh.material = hi(); mesh.renderOrder = 2; zones[k] = zones[k] || []; zones[k].push(mesh); return mesh; };
    if (variant === 'face') {
      const head = new THREE.Group(); root.add(head);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), skin); head.add(skull); head.scale.set(0.86, 1.08, 0.94);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 24), skin); nose.position.set(0, -0.05, 0.98); nose.rotation.x = Math.PI / 2.2; head.add(nose);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.9, 32), skin); neck.position.y = -1.25; root.add(neck);
      const seg = (ca, L, thS, thL) => new THREE.Mesh(new THREE.SphereGeometry(1.012, 48, 32, Math.PI / 2 + ca - L / 2, L, thS, thL));
      head.add(addZone('forehead', seg(0, 1.5, 0.35, 0.45)));
      head.add(addZone('tzone', seg(0, 0.32, 0.8, 0.75)));
      head.add(addZone('cheeks', seg(-0.62, 0.55, 1.25, 0.55)));
      head.add(addZone('cheeks', seg(0.62, 0.55, 1.25, 0.55)));
      head.add(addZone('jaw', seg(0, 1.9, 2.05, 0.5)));
      head.add(addZone('eyes', seg(-0.33, 0.32, 1.05, 0.18)));
      head.add(addZone('eyes', seg(0.33, 0.32, 1.05, 0.18)));
      root.position.y = 0.25;
    } else if (variant === 'back') {
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 1.9, 12, 32), skin); torso.scale.set(1.15, 1, 0.45); torso.rotation.x = -Math.PI / 2; root.add(torso);
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), skin); sh.scale.set(1.6, 0.55, 0.6); sh.position.set(0, 0.1, -1.55); root.add(sh);
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 2.6), M(C.choc)); spine.position.y = 0.43; root.add(spine);
      const curve = pts => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0.47, z)));
      const strokes = {
        effleurage: [curve([[0.35, 1.4], [0.4, 0], [0.45, -1.3], [1.0, -1.55], [1.1, -0.4], [1.0, 1.2]]), curve([[-0.35, 1.4], [-0.4, 0], [-0.45, -1.3], [-1.0, -1.55], [-1.1, -0.4], [-1.0, 1.2]])],
        petrissage: [0, 1, 2].map(i => { const cx = 0.65, cz = -0.9 + i * 0.7; const p = []; for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI * 2; p.push([cx + Math.cos(t) * 0.22, cz + Math.sin(t) * 0.22]); } return curve(p); }).concat([0, 1, 2].map(i => { const cx = -0.65, cz = -0.9 + i * 0.7; const p = []; for (let a = 0; a <= 24; a++) { const t = a / 24 * Math.PI * 2; p.push([cx + Math.cos(t) * 0.22, cz + Math.sin(t) * 0.22]); } return curve(p); })),
        friction: [curve([[0.18, 1.2], [0.22, 0.6], [0.18, 0], [0.22, -0.6], [0.18, -1.2]]), curve([[-0.18, 1.2], [-0.22, 0.6], [-0.18, 0], [-0.22, -0.6], [-0.18, -1.2]])]
      };
      const runners = [];
      Object.entries(strokes).forEach(([k, cs]) => cs.forEach(c => { const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.025, 8, false)); root.add(addZone(k, tube)); const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: C.green, transparent: true, opacity: 0 })); root.add(dot); runners.push({ k, c, dot, off: Math.random() }); }));
      root.userData.runners = runners;
      root.rotation.y = 0; velY = 0;
    } else if (variant === 'wood') {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.55, 3.2, 48, 1, false, 0, Math.PI), skin); leg.rotation.z = Math.PI / 2; leg.rotation.y = Math.PI / 2; leg.rotation.x = Math.PI / 2; root.add(leg);
      const prof = []; for (let i = 0; i <= 40; i++) { const t = i / 40; prof.push(new THREE.Vector2(0.22 + 0.04 * Math.cos(t * Math.PI * 12), (t - 0.5) * 0.9)); }
      const roller = new THREE.Group(); const drum = new THREE.Mesh(new THREE.LatheGeometry(prof, 32), M(C.wood, { roughness: 0.7 })); drum.rotation.z = Math.PI / 2; roller.add(drum);
      const hnd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 12), M(C.choc)); hnd.position.set(0, 0.55, 0.45); hnd.rotation.x = -0.9; roller.add(hnd); root.add(roller);
      const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.4, 0.0, 0.66), new THREE.Vector3(0, 0, 0.72), new THREE.Vector3(1.4, 0, 0.62)]);
      const arrow = new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.02, 8, false)); arrow.position.y = 0.5; root.add(addZone('direction', arrow));
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 16)); tip.position.set(1.45, 0.5, 0.62); tip.rotation.z = -Math.PI / 2; root.add(addZone('direction', tip));
      root.userData.roller = { roller, drum, path };
      root.rotation.x = 0.35; velY = 0;
    }
    keep(root);
    let focused = opts.focus || null;
    focus = k => { focused = k; Object.entries(zones).forEach(([z, ms]) => ms.forEach(m => { m.material.opacity = !focused ? 0.12 : z === focused ? 0.75 : 0.06; })); };
    focus(focused);
    const down = e => { drag = { x: e.clientX, y: e.clientY, ry: rotY, rx: rotX }; el.setPointerCapture?.(e.pointerId); };
    const move = e => { if (!drag) return; rotY = drag.ry + (e.clientX - drag.x) * 0.01; rotX = Math.max(-0.6, Math.min(0.6, drag.rx + (e.clientY - drag.y) * 0.006)); };
    const up = () => { drag = null; };
    el.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', up);
    disposables.push({ dispose: () => { el.removeEventListener('pointerdown', down); removeEventListener('pointermove', move); removeEventListener('pointerup', up); } });
    tick = (t) => {
      if (!drag && variant === 'face') rotY += velY;
      root.rotation.y += (rotY - root.rotation.y) * 0.12; root.rotation.x += ((variant === 'wood' ? 0.35 : 0) + rotX - root.rotation.x) * 0.12;
      const rn = root.userData.runners; if (rn) rn.forEach(r => { const p = r.c.getPointAt(((t * 0.18 + r.off) % 1)); r.dot.position.copy(p); r.dot.material.opacity = !focused || focused === r.k ? 0.9 : 0; });
      const rl = root.userData.roller; if (rl) { const u = reduce ? 0.5 : (Math.sin(t * 0.7) * 0.5 + 0.5); const p = rl.path.getPointAt(u); rl.roller.position.set(p.x, p.y + 0.22, p.z - 0.1); rl.drum.rotation.x = u * 12; }
    };
  }

  const resize = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (variant === 'hero') camera.position.z = w < 640 ? 12 : 9; };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();
  const onPtr = e => { const r = el.getBoundingClientRect(); pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2; pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  if (variant === 'hero' && !reduce) addEventListener('pointermove', onPtr, { passive: true });
  let visible = true; const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }); io.observe(el);
  let raf, t0 = performance.now(), alive = true;
  const loop = () => { if (!alive) return; raf = requestAnimationFrame(loop); if (!visible || document.hidden) return; const t = reduce ? 0 : (performance.now() - t0) / 1000; tick(t); renderer.render(scene, camera); };
  if (reduce) { tick(0); renderer.render(scene, camera); if (variant !== 'hero') loop(); } else loop();
  return {
    focus: k => focus(k),
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onPtr); disposables.forEach(d => d.dispose && d.dispose()); renderer.dispose(); renderer.domElement.remove(); }
  };
}
