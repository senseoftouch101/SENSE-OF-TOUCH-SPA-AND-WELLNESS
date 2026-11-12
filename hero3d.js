// Homepage hero: water-ripple backdrop + floating pure leaves + gold particles.
export async function mount(el) {
  if (!window.__sotWebGL) { try { const cv = document.createElement('canvas'); window.__sotWebGL = (cv.getContext('webgl2') || cv.getContext('webgl')) ? 'yes' : 'no'; } catch (e) { window.__sotWebGL = 'no'; } }
  if (window.__sotWebGL === 'no') throw new Error('WebGL unavailable');
  const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const section = el.parentElement;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
  el.appendChild(renderer.domElement);

  // Ripple backdrop
  const drops = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 0));
  const rippleMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAspect: { value: 1 }, uDrops: { value: drops } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform float uTime; uniform float uAspect; uniform vec4 uDrops[6]; varying vec2 vUv;
      void main(){
        vec2 p = vUv;
        float h = sin(p.x*uAspect*5.0 + p.y*2.5 + uTime*0.5)*0.05 + sin(p.y*6.0 - p.x*uAspect*1.7 - uTime*0.38)*0.04;
        for(int i=0;i<6;i++){
          vec4 d = uDrops[i]; float age = uTime - d.z;
          if(age < 0.0 || age > 7.0) continue;
          vec2 q = p - d.xy; q.x *= uAspect;
          float r = length(q); float front = age*0.16;
          h += sin((r-front)*70.0) * exp(-abs(r-front)*14.0) * exp(-age*0.55) * d.w;
        }
        vec3 ivory = vec3(0.973,0.957,0.929), beige = vec3(0.914,0.867,0.788), gold = vec3(0.776,0.631,0.357);
        vec3 col = mix(ivory, beige, smoothstep(0.2, 1.3, length((vUv-vec2(0.62,0.5))*vec2(uAspect,1.0))*0.9));
        col = mix(col, beige*0.97, clamp(-h,0.0,1.0)*0.9);
        col = mix(col, gold, clamp(h,0.0,1.0)*0.35);
        col = mix(col, vec3(1.0), clamp(h,0.0,1.0)*0.25);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const bgScene = new THREE.Scene(), bgCam = new THREE.Camera();
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rippleMat));

  // 3D layer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60); camera.position.z = 10;
  const pm = new THREE.PMREMGenerator(renderer);
  const envS = new THREE.Scene();
  envS.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), new THREE.MeshBasicMaterial({ color: 0xE9DDC9, side: THREE.BackSide })));
  [[0, 6, 0, 8, 1, 8], [7, 2, 4, 1, 4, 4], [-6, 1, 5, 1, 3, 3]].forEach(([x, y, z, a, b, c]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.5) })); m.position.set(x, y, z); envS.add(m); });
  scene.environment = pm.fromScene(envS, 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xfff8ee, 0x536B4E, 0.8));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -1); leafShape.bezierCurveTo(0.6, -0.55, 0.58, 0.45, 0, 1); leafShape.bezierCurveTo(-0.58, 0.45, -0.6, -0.55, 0, -1);
  const leafGeo = new THREE.ShapeGeometry(leafShape, 20);
  const lp = leafGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i); lp.setZ(i, x * x * 0.9 - (y * y) * 0.12); }
  leafGeo.computeVertexNormals();
  const veinGeo = new THREE.CylinderGeometry(0.012, 0.02, 2.1, 5); veinGeo.translate(0, -0.05, 0.01);

  const greens = [0x536B4E, 0x6B8462, 0x3F5640, 0x7C9270].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }));
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xC6A15B, roughness: 0.25, metalness: 1, side: THREE.DoubleSide });
  const veinMat = new THREE.MeshStandardMaterial({ color: 0xC6A15B, roughness: 0.4, metalness: 0.8 });

  const group = new THREE.Group(); scene.add(group);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const leaves = Array.from({ length: 17 }, (_, i) => {
    const gold = i % 4 === 0;
    const m = new THREE.Group();
    m.add(new THREE.Mesh(leafGeo, gold ? goldMat : greens[i % greens.length]));
    if (!gold) m.add(new THREE.Mesh(veinGeo, veinMat));
    const s = rnd(0.35, 0.85); m.scale.setScalar(s);
    const right = Math.random() < 0.72;
    m.userData = { bx: right ? rnd(0.05, 1.15) : rnd(-1.15, -0.55), by: rnd(-1, 1), z: rnd(-4, 1.2), rx: rnd(0, 6), ry: rnd(0, 6), rz: rnd(0, 6), sp: rnd(0.15, 0.4), ph: rnd(0, 6), spin: rnd(-1, 1) };
    group.add(m); return m;
  });

  const N = 140, pos = new Float32Array(N * 3), sp = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = rnd(-9, 9); pos[i * 3 + 1] = rnd(-5, 5); pos[i * 3 + 2] = rnd(-4, 2); sp[i] = rnd(0.08, 0.3); }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xB8924A, size: 0.05, transparent: true, opacity: 0.8 }));
  scene.add(dust);

  let W = 1, H = 1, halfW = 1, halfH = 1;
  const resize = () => {
    W = el.clientWidth || 1; H = el.clientHeight || 1;
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    rippleMat.uniforms.uAspect.value = W / H;
    halfH = Math.tan(THREE.MathUtils.degToRad(17.5)) * 10; halfW = halfH * camera.aspect;
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(el);

  const clock = new THREE.Clock(); let di = 0, lastDrop = 0;
  const addDrop = (x, y, s = 0.9) => { const t = clock.getElapsedTime(); drops[di].set(x, y, t, s); di = (di + 1) % drops.length; lastDrop = t; };
  let lastMove = 0;
  const onMove = e => {
    const t = clock.getElapsedTime(); if (t - lastMove < 0.45) return; lastMove = t;
    const r = el.getBoundingClientRect(); addDrop((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, 0.55);
  };
  section.addEventListener('pointermove', onMove);
  addDrop(0.7, 0.55, 1);

  let mx = 0, my = 0;
  const onMouse = e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener('pointermove', onMouse);

  const frame = () => {
    const t = clock.getElapsedTime();
    if (t - lastDrop > 2.8) addDrop(rnd(0.45, 0.95), rnd(0.2, 0.85), 0.8);
    rippleMat.uniforms.uTime.value = t;
    const p = Math.min(Math.max(scrollY / Math.max(H, 1), 0), 1.2);
    group.position.y = p * 2.6; group.rotation.y = mx * 0.12; group.rotation.x = my * 0.08;
    leaves.forEach(m => {
      const u = m.userData;
      m.position.set(u.bx * halfW + Math.sin(t * u.sp + u.ph) * 0.3, u.by * halfH * 0.95 + Math.sin(t * u.sp * 0.8 + u.ph) * 0.35, u.z);
      m.rotation.set(u.rx + t * u.sp * 0.4 + p * u.spin * 2, u.ry + Math.sin(t * u.sp + u.ph) * 0.5, u.rz + t * u.sp * 0.25 + p * u.spin);
    });
    for (let i = 0; i < N; i++) { pos[i * 3 + 1] += sp[i] * 0.016; if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -5; }
    pGeo.attributes.position.needsUpdate = true;
    dust.position.y = p * 1.5;
    renderer.clear(); renderer.render(bgScene, bgCam); renderer.render(scene, camera);
  };

  let raf = 0, visible = true;
  const loop = () => { frame(); raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible && !reduce) loop(); });
  io.observe(el);
  frame();
  if (reduce) addEventListener('scroll', frame, { passive: true });

  return {
    dispose() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      section.removeEventListener('pointermove', onMove); removeEventListener('pointermove', onMouse); removeEventListener('scroll', frame);
      scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); rippleMat.dispose(); pm.dispose();
      renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
    }
  };
}
