// 3D logo plaque splash for Sense of Touch. mount(el) -> { dispose }
export async function mount(el, { logo = 'assets/logo.png', duration = 4.4 } = {}) {
  if (!window.__sotWebGL) { try { const cv = document.createElement('canvas'); window.__sotWebGL = (cv.getContext('webgl2') || cv.getContext('webgl')) ? 'yes' : 'no'; } catch (e) { window.__sotWebGL = 'no'; } }
  if (window.__sotWebGL === 'no') throw new Error('WebGL unavailable');
  const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
  const w = () => el.clientWidth, h = () => el.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w(), h());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, w() / h(), 0.1, 100);
  const fit = () => { camera.aspect = w() / h(); camera.position.z = camera.aspect < 0.8 ? 11 : 8.2; camera.updateProjectionMatrix(); renderer.setSize(w(), h()); };
  fit();

  scene.add(new THREE.HemisphereLight(0xfff6e6, 0x493126, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xC6A15B, 2.0); rim.position.set(-5, -2, -3); scene.add(rim);
  const glint = new THREE.PointLight(0xfff1cf, 40, 20); glint.position.set(-6, 2, 3); scene.add(glint);

  // Rounded-square gold plaque
  const S = 3.2, R = 0.42, D = 0.22;
  const shape = new THREE.Shape();
  const x = -S / 2, y = -S / 2;
  shape.moveTo(x + R, y); shape.lineTo(x + S - R, y); shape.quadraticCurveTo(x + S, y, x + S, y + R);
  shape.lineTo(x + S, y + S - R); shape.quadraticCurveTo(x + S, y + S, x + S - R, y + S);
  shape.lineTo(x + R, y + S); shape.quadraticCurveTo(x, y + S, x, y + S - R);
  shape.lineTo(x, y + R); shape.quadraticCurveTo(x, y, x + R, y);
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 6, curveSegments: 24 }),
    new THREE.MeshStandardMaterial({ color: 0xC6A15B, metalness: 0.85, roughness: 0.28 })
  );
  body.geometry.translate(0, 0, -D / 2);

  const back = new THREE.Mesh(new THREE.ShapeGeometry(shape, 24), new THREE.MeshStandardMaterial({ color: 0x536B4E, roughness: 0.6, metalness: 0.2 }));
  back.position.z = -D / 2 - 0.061; back.rotation.y = Math.PI;

  const tex = await new THREE.TextureLoader().loadAsync(logo);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const inner = S - 0.36;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(inner, inner), new THREE.MeshBasicMaterial({ map: tex, color: 0xFBF6EE }));
  face.position.z = D / 2 + 0.065;

  const plaque = new THREE.Group();
  plaque.add(body, back, face);
  scene.add(plaque);

  // Gold dust
  const N = 160, pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 12; pos[i * 3 + 1] = (Math.random() - 0.5) * 8; pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1; spd[i] = 0.15 + Math.random() * 0.35; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xC6A15B, size: 0.045, transparent: true, opacity: 0 }));
  scene.add(dust);

  const ease = t => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
  const t0 = performance.now(); let raf, last = t0;
  const loop = (now) => {
    const t = (now - t0) / 1000, dt = (now - last) / 1000; last = now;
    const a = ease(t / 2.4);
    plaque.position.z = -7 * (1 - a);
    plaque.position.y = Math.sin(t * 1.3) * 0.06;
    plaque.rotation.y = -Math.PI * 2.5 * (1 - a) + Math.sin(t * 0.9) * 0.12 * a;
    plaque.rotation.x = 0.35 * (1 - a) + Math.sin(t * 0.7) * 0.05 * a;
    const s = 0.6 + 0.4 * a; plaque.scale.set(s, s, s);
    glint.position.x = -6 + 12 * ease((t - 1.6) / 1.6);
    dust.material.opacity = 0.75 * ease(t / 1.5);
    for (let i = 0; i < N; i++) { pos[i * 3 + 1] += spd[i] * dt; if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4; }
    dustGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  window.addEventListener('resize', fit);

  return {
    dispose() {
      cancelAnimationFrame(raf); window.removeEventListener('resize', fit);
      scene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
      tex.dispose(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
    }
  };
}
