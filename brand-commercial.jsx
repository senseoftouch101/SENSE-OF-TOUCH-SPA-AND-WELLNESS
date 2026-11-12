const C = { ivory: '#F8F4ED', sand: '#E9DDC9', choc: '#493126', green: '#536B4E', gold: '#C6A15B', ink: '#24221D', mute: '#8A877E' };
const SERIF = "'Cormorant Garamond', serif", SANS = 'Montserrat, sans-serif', SCRIPT = 'Allura, cursive';
const IMG = 'assets/web/';

const M = {
  enter: (s, e, f = 0, t = 1) => animate({ from: f, to: t, start: s, end: e, ease: Easing.easeOutCubic }),
  draw: (s, e, f = 0, t = 1) => animate({ from: f, to: t, start: s, end: e, ease: Easing.easeInOutCubic }),
  drift: (s, e, f = 0, t = 1) => animate({ from: f, to: t, start: s, end: e, ease: Easing.linear }),
};
const full = { position: 'absolute', inset: 0 };
const kicker = (color, size = 24) => ({ fontFamily: SANS, fontSize: size, letterSpacing: '0.34em', textTransform: 'uppercase', fontWeight: 600, color });
const vis = (o) => ({ opacity: o, visibility: o > 0.001 ? 'visible' : 'hidden' });

function Rise({ T, at, children, style, dist = 34 }) {
  const p = M.enter(at, at + 1.1)(T);
  return <div style={{ ...style, opacity: p, transform: `translateY(${(1 - p) * dist}px)` }}>{children}</div>;
}
function Mask({ T, at, children, style }) {
  const p = M.enter(at, at + 1.2)(T);
  return <div style={{ overflow: 'hidden', paddingBottom: 14 }}><div style={{ ...style, transform: `translateY(${(1 - p) * 110}%)` }}>{children}</div></div>;
}

// Supplied logo, cropped to the mark only — never redrawn or recoloured.
function Mark({ h, shine = -1 }) {
  const S = h / 0.36, w = S * 0.3, l = -S * 0.35, t = -S * 0.19;
  const mask = { WebkitMaskImage: 'url(assets/logo-transparent.png)', maskImage: 'url(assets/logo-transparent.png)', WebkitMaskSize: `${S}px ${S}px`, maskSize: `${S}px ${S}px`, WebkitMaskPosition: `${l}px ${t}px`, maskPosition: `${l}px ${t}px`, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' };
  return (
    <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden' }}>
      <img src="assets/logo-transparent.png" style={{ position: 'absolute', left: l, top: t, width: S, height: S }} />
      <div style={{ ...full, ...mask, background: `linear-gradient(105deg, transparent ${shine * 100 - 18}%, rgba(255,246,222,0.85) ${shine * 100}%, transparent ${shine * 100 + 18}%)`, mixBlendMode: 'screen' }}></div>
    </div>
  );
}

// A shot: full-bleed photo, or a framed portrait over its own blurred, darkened plate.
function Photo({ T, src, a, b, fade = 0.8, pos = 'center', zoom = [1.12, 1.02], card, grade = 1, z = 0, rot = 16 }) {
  const o = M.enter(a, a + fade)(T) * (1 - M.draw(b, b + fade)(T));
  const k = M.drift(a, b + fade, zoom[0], zoom[1])(T);
  const filt = `saturate(${grade}) brightness(${0.85 + 0.15 * grade}) drop-shadow(0 30px 60px rgba(0,0,0,0.45))`;
  const r = card || { x: 80, y: 50, w: 1760, h: 980 };
  const ci = M.enter(a, a + 1.4)(T);
  const ks = 1 + (k - 1) * 0.35;
  return (
    <div style={{ ...full, overflow: 'hidden', zIndex: z, background: C.ink, ...vis(o) }}>
      <img src={IMG + src} style={{ ...full, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.25 + (k - 1)})`, filter: `blur(34px) brightness(0.42) saturate(${0.8 * grade})` }} />
      <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1800 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', transform: `rotateY(${(1 - ci) * rot + M.drift(a, b + fade, rot * 0.12, -rot * 0.12)(T)}deg) rotateX(${(1 - ci) * 4}deg) translateZ(${(1 - ci) * -160}px) translateY(${(1 - ci) * 30}px)` }}>
        <img src={IMG + src} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', transform: `scale(${ks})`, filter: filt }} />
      </div></div>
    </div>
  );
}

function Mark3D({ h, rot = 0, tilt = 0, shine = -1, depth = 7 }) {
  return (
    <div style={{ perspective: 1600 }}>
      <div style={{ position: 'relative', transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg) rotateX(${tilt}deg)` }}>
        <div style={{ position: 'relative', filter: `drop-shadow(${-rot * 0.4}px 18px 22px rgba(0,0,0,0.45))` }}><Mark h={h} shine={shine} /></div>
      </div>
    </div>
  );
}

function Dust3D({ T, opacity, color = C.gold, n = 46 }) {
  const pts = Array.from({ length: n }, (_, i) => ({ x: (i * 431) % 1920, y: (i * 277) % 1080, z: -900 + ((i * 613) % 1300), r: 4 + (i % 4) * 2, v: 14 + (i * 7) % 26, ph: i * 1.7 }));
  return (
    <div style={{ ...full, zIndex: 14, pointerEvents: 'none', perspective: 1200, opacity, visibility: opacity > 0.001 ? 'visible' : 'hidden' }}>
      <div style={{ ...full, transformStyle: 'preserve-3d', transform: `rotateY(${Math.sin(T * 0.12) * 6}deg)` }}>
        {pts.map((p, i) => {
          const y = ((p.y - T * p.v) % 1180 + 1180) % 1180 - 50;
          const x = p.x + Math.sin(T * 0.4 + p.ph) * 40;
          const near = (p.z + 900) / 1300;
          return <div key={i} style={{ position: 'absolute', left: x, top: y, width: p.r, height: p.r, borderRadius: '50%', background: color, boxShadow: `0 0 ${8 + near * 14}px ${color}`, opacity: 0.25 + 0.55 * near * (0.6 + 0.4 * Math.sin(T * 1.3 + p.ph)), transform: `translateZ(${p.z}px)` }}></div>;
        })}
      </div>
    </div>
  );
}

function FullLogo({ w, shine = -1 }) {
  const mask = { WebkitMaskImage: 'url(assets/logo-transparent.png)', maskImage: 'url(assets/logo-transparent.png)', WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' };
  return (
    <div style={{ position: 'relative', width: w, height: w }}>
      <img src="assets/logo-transparent.png" style={{ ...full, width: '100%', height: '100%' }} />
      <div style={{ ...full, ...mask, background: `linear-gradient(105deg, transparent ${shine * 100 - 16}%, rgba(255,246,222,0.9) ${shine * 100}%, transparent ${shine * 100 + 16}%)`, mixBlendMode: 'screen' }}></div>
    </div>
  );
}

function Opening({ T, CUES }) {
  const s = CUES.Logo, e = CUES.World;
  const m = M.enter(s + 0.2, s + 1.8)(T);
  const out = 1 - M.draw(e - 0.7, e + 0.2)(T);
  return (
    <div style={{ ...full, zIndex: 13, background: 'radial-gradient(ellipse at 50% 45%, #FFFDF9 0%, #F8F4ED 55%, #E9DDC9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...vis(out) }}>
      <div style={{ perspective: 1800, marginTop: -40 }}><div style={{ opacity: m, filter: `blur(${(1 - m) * 14}px)`, transformStyle: 'preserve-3d', transform: `rotateY(${(1 - m) * -38 + Math.sin((T - s) * 0.9) * 4}deg) rotateX(${(1 - m) * 10}deg) translateZ(${(1 - m) * -300}px) scale(${0.96 + (T - s) * 0.008})` }}><FullLogo w={860} shine={M.draw(s + 1.6, s + 3.2, -0.3, 1.3)(T)} /></div></div>
      <Rise T={T} at={s + 2.0} style={{ position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', ...kicker(C.choc, 24) }}>Feel the Touch. Experience the Transformation.</Rise>
    </div>
  );
}

function World({ T, CUES }) {
  const s = CUES.World, e = CUES.Pause;
  const inP = M.enter(s, s + 1.2)(T);
  const haze = M.draw(e - 2.6, e - 0.8)(T);
  const dots = Array.from({ length: 16 }, (_, i) => ({ x0: (i * 397) % 2200, y: 90 + ((i * 173) % 900), r: 40 + ((i * 53) % 130), v: 120 + ((i * 37) % 160) }));
  const NOTES = ['Time for you is overdue.', 'Your sanctuary is waiting.', 'Pause. Breathe. Be held.', 'Self-care is not an extravagance.', 'Feel the Touch.', 'You deserve this moment.', 'Experience the Transformation.', 'Tema Community 25 · Book today'];
  const cards = NOTES.map((_, i) => s + 2.2 + i * 0.55);
  const ph = M.enter(s + 0.3, s + 1.8)(T);
  const lines = [['Our time.', s + 4.0], ['Our energy.', s + 5.0], ['Our attention.', s + 6.0]];
  const flare = M.enter(e - 3.2, e - 0.6)(T);
  return (
    <div style={{ ...full, zIndex: 1, background: C.ink, overflow: 'hidden' }}>
      <div style={{ ...full, opacity: inP * (1 - 0.6 * haze), filter: `blur(${haze * 10}px)` }}>
        {dots.map((d, i) => <div key={i} style={{ position: 'absolute', left: ((d.x0 - (T - s) * d.v) % 2200 + 2200) % 2200 - 140, top: d.y, width: d.r, height: d.r, borderRadius: '50%', background: C.mute, opacity: 0.14, filter: 'blur(6px)' }}></div>)}
        <div style={{ position: 'absolute', left: 1230, top: 120, perspective: 1400 }}><div style={{ position: 'relative', width: 420, height: 840, borderRadius: 56, border: `2px solid ${C.mute}`, background: 'linear-gradient(160deg, #2E2C26 0%, #1C1A16 100%)', boxShadow: '30px 50px 90px rgba(0,0,0,0.55), inset 0 0 0 8px #24221D', overflow: 'hidden', transform: `rotateY(${-24 + 10 * ph + Math.sin((T - s) * 0.7) * 3}deg) rotateX(${8 - 4 * ph}deg) rotateZ(-3deg) translateY(${(1 - ph) * 80 + Math.sin((T - s) * 1.1) * 8}px)` }}>
          <div style={{ position: 'absolute', left: '50%', top: 18, width: 110, height: 28, borderRadius: 14, background: '#0E0D0B', transform: 'translateX(-50%)' }}></div>
          {cards.map((at, i) => {
            const k = cards.reduce((n, aj, j) => n + (j > i ? M.enter(aj, aj + 0.35)(T) : 0), 0);
            const o = M.enter(at, at + 0.3)(T);
            return (
              <div key={i} style={{ position: 'absolute', left: 20, right: 20, top: 66 + k * 106, height: 94, borderRadius: 22, background: 'rgba(248,244,237,0.1)', border: '1px solid rgba(198,161,91,0.28)', opacity: o, transform: `translateY(${(1 - o) * -40}px) scale(${0.96 + 0.04 * o})`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, background: C.ivory, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><Mark h={42} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', color: C.gold }}><span>Sense of Touch</span><span style={{ color: C.mute, fontWeight: 500 }}>now</span></div>
                  <div style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.25, color: C.ivory, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{NOTES[i]}</div>
                </div>
              </div>
            );
          })}
        </div></div>
        <div style={{ position: 'absolute', left: 160, top: 250, display: 'flex', flexDirection: 'column', gap: 30, color: C.sand }}>
          <div style={{ fontFamily: SERIF, fontSize: 76, lineHeight: 1.1 }}>
            <Mask T={T} at={s + 0.8}>Every day,</Mask>
            <Mask T={T} at={s + 1.5}>life asks something of us.</Mask>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, lineHeight: 1.08 }}>
            {lines.map(([l, at], i) => {
              const on = M.enter(at, at + 0.5)(T), dim = i < 2 ? M.draw(at + 0.9, at + 1.3)(T) : 0;
              return <div key={l} style={{ opacity: on * (1 - 0.6 * dim), transform: `translateX(${(1 - on) * -30}px)`, color: dim > 0.5 ? C.mute : C.ivory }}>{l}</div>;
            })}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1500 - 700 * flare, top: 540 - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,161,91,0.55) 0%, rgba(198,161,91,0.12) 40%, transparent 70%)', opacity: flare }}></div>
    </div>
  );
}

function Doors({ T, CUES }) {
  const s = CUES.Pause;
  const close = M.draw(s - 1.4, s - 0.3)(T), open = M.draw(s + 0.5, s + 2.4)(T);
  const seam = M.enter(s - 0.6, s + 0.2)(T) * (1 - M.draw(s + 1.4, s + 2.4)(T));
  const off = (1 - close) * 1000;
  const ang = open * 105;
  const panel = { position: 'absolute', top: 0, bottom: 0, width: 960, background: `linear-gradient(90deg, #3E2920, ${C.choc} 50%, #3E2920)`, boxShadow: 'inset 0 0 0 40px rgba(0,0,0,0.12), inset 0 0 0 42px rgba(198,161,91,0.55)' };
  return (
    <div style={{ ...full, zIndex: 3, pointerEvents: 'none', perspective: 1500, ...vis(close * (1 - M.draw(s + 2.2, s + 2.5)(T))) }}>
      <div style={{ ...panel, left: -off, borderRight: `2px solid ${C.gold}`, transformOrigin: 'left center', transform: `rotateY(${ang}deg)`, filter: `brightness(${1 - open * 0.5})` }}><div style={{ position: 'absolute', right: 70, top: 470, width: 14, height: 140, borderRadius: 7, background: C.gold }}></div></div>
      <div style={{ ...panel, right: -off, borderLeft: `2px solid ${C.gold}`, transformOrigin: 'right center', transform: `rotateY(${-ang}deg)`, filter: `brightness(${1 - open * 0.5})` }}><div style={{ position: 'absolute', left: 70, top: 470, width: 14, height: 140, borderRadius: 7, background: C.gold }}></div></div>
      <div style={{ position: 'absolute', left: 960 - 40 - open * 300, width: 80 + open * 600, top: 0, bottom: 0, background: 'radial-gradient(ellipse at center, rgba(248,226,170,0.95) 0%, rgba(198,161,91,0.5) 30%, transparent 70%)', opacity: seam }}></div>
    </div>
  );
}

function Pause({ T, CUES }) {
  const s = CUES.Pause, e = CUES.Sanctuary;
  const warm = M.draw(s + 1, s + 4, 0.45, 1)(T);
  return (
    <div style={{ ...full, zIndex: 2, ...vis(M.enter(s - 0.4, s)(T) * (1 - M.draw(e + 0.6, e + 0.8)(T))) }}>
      <Photo T={T} src="lounge-group.jpg" a={s - 0.4} b={s + 5} pos="center 62%" zoom={[1.18, 1.04]} grade={warm} />
      <Photo T={T} src="robe-green-lounge.jpg" a={s + 5} b={e} pos="center 40%" zoom={[1.1, 1.0]} card={{ x: 1000, y: 90, w: 620, h: 860 }} z={1} />
    </div>
  );
}

function Sanctuary({ T, CUES }) {
  const s = CUES.Sanctuary, e = CUES.Founder;
  const bg = M.draw(s - 0.8, s + 0.2)(T) * (1 - M.draw(e - 0.2, e + 0.6)(T));
  const sweep = M.draw(s + 0.3, s + 3.4, -900, 2600)(T);
  const m = M.enter(s + 1.4, s + 3.6)(T);
  const out = 1 - M.draw(e - 0.8, e)(T);
  return (
    <div style={{ ...full, zIndex: 4, background: C.choc, ...vis(bg) }}>
      <div style={{ position: 'absolute', top: -300, left: sweep, width: 520, height: 1700, transform: 'rotate(18deg)', background: 'linear-gradient(90deg, transparent, rgba(198,161,91,0.22), transparent)' }}></div>
      <div style={{ ...full, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34, opacity: out, transform: `scale(${1 + (T - s) * 0.006})` }}>
        <div style={{ opacity: m, filter: `blur(${(1 - m) * 18}px)`, transform: `scale(${1.06 - 0.06 * m})` }}><Mark3D h={360} rot={(1 - m) * 50 + Math.sin((T - s) * 0.6) * 6} tilt={(1 - m) * -8} shine={M.draw(s + 3.2, s + 5.2, -0.3, 1.3)(T)} /></div>
        <Rise T={T} at={s + 4.0} style={{ fontFamily: SERIF, fontSize: 64, letterSpacing: '0.16em', color: C.ivory }}>SENSE OF TOUCH</Rise>
        <Rise T={T} at={s + 4.5} style={{ ...kicker(C.gold, 24), letterSpacing: '0.42em', marginTop: -18 }}>Spa &amp; Wellness</Rise>
        <Rise T={T} at={s + 5.6} style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: C.sand, marginTop: 14 }}>A sanctuary for beauty, care &amp; wellness.</Rise>
      </div>
    </div>
  );
}

function Founder({ T, CUES }) {
  const s = CUES.Founder, e = CUES.Care;
  const bg = M.enter(s - 0.6, s + 0.2)(T) * (1 - M.draw(e + 0.4, e + 0.6)(T));
  const reveal = M.draw(s + 0.2, s + 1.6)(T);
  const k = M.drift(s, e + 0.5, 1.06, 1.0)(T);
  const out = 1 - M.draw(e - 0.5, e + 0.3)(T);
  const lines = ['“Every client deserves', 'to feel cared for, relaxed,', 'refreshed and confident.”'];
  return (
    <div style={{ ...full, zIndex: 5, background: C.ivory, ...vis(bg) }}>
      <div style={{ ...full, opacity: out }}>
        <div style={{ position: 'absolute', right: 140, top: 90, width: 700, height: 900, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)` }}>
          <img src={IMG + 'founder-web.jpg'} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', transform: `scale(${k})`, transformOrigin: 'center right', boxShadow: '0 30px 70px rgba(36,34,29,0.25)' }} />
        </div>
        <div style={{ position: 'absolute', left: 160, top: 0, bottom: 0, width: 900, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 44 }}>
          <Rise T={T} at={s + 0.6} style={kicker(C.green)}>Meet the founder</Rise>
          <div style={{ fontFamily: SERIF, fontSize: 72, lineHeight: 1.16, color: C.choc }}>
            {lines.map((l, i) => <Mask key={i} T={T} at={s + 1.0 + i * 0.45}>{l}</Mask>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Rise T={T} at={s + 3.0} style={{ fontFamily: SCRIPT, fontSize: 96, lineHeight: 1, color: C.green }}>Woselande Carmelle Theus</Rise>
            <Rise T={T} at={s + 3.5} style={kicker(C.choc)}>Founder · Sense of Touch</Rise>
          </div>
        </div>
      </div>
    </div>
  );
}

const CARE = [
  { src: 'body-massage.jpg', n: '01', t: 'Massage therapy', side: 'R', pos: 'center 40%' },
  { src: 'wood-therapy.jpg', n: '02', t: 'Wood therapy', side: 'L', pos: 'center 45%' },
  { src: 'facial-treatment.jpg', n: '03', t: 'Facials', side: 'R', pos: 'center 40%' },
  { src: 'robe-black-relax.jpg', n: '04', t: 'Time to reconnect', side: 'L', pos: 'center 45%' },
];
function Care({ T, CUES }) {
  const s = CUES.Care, e = CUES.LipBar, step = (e - s) / CARE.length;
  return (
    <div style={{ ...full, zIndex: 5, ...vis(M.enter(s - 0.2, s + 0.6)(T) * (1 - M.draw(e + 0.4, e + 0.6)(T))) }}>
      {CARE.map((c, i) => {
        const a = s + i * step - (i ? 0 : 0.2), b = s + (i + 1) * step;
        const lx = c.side === 'R' ? 180 : 980;
        const o = M.enter(a + 0.5, a + 1.4)(T) * (1 - M.draw(b - 0.2, b + 0.4)(T));
        return (
          <React.Fragment key={c.n}>
            <Photo T={T} src={c.src} a={a} b={b} pos={c.pos} card={{ x: c.side === 'R' ? 1100 : 180, y: 90, w: 640, h: 820 }} z={i} rot={c.side === 'R' ? -18 : 18} />
            <div style={{ position: 'absolute', left: lx, top: 360, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 18, ...vis(o), transform: `translateY(${(1 - o) * 24}px)` }}>
              <span style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, color: C.gold, lineHeight: 1 }}>{c.n}</span>
              <span style={{ fontFamily: SERIF, fontSize: 104, color: C.ivory, lineHeight: 1 }}>{c.t}</span>
              <div style={{ width: 160 * o, height: 2, background: C.gold }}></div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Curtain({ T, at, color, z, children, until }) {
  const y = M.draw(at - 0.6, at + 0.35, 100, 0)(T);
  const out = until == null ? 1 : 1 - M.draw(until + 0.3, until + 0.4)(T);
  return <div style={{ ...full, background: color, zIndex: z, transform: `translateY(${y}%)`, overflow: 'hidden', ...vis(out * (y < 100 ? 1 : 0)) }}>{children}</div>;
}

function Motif({ T, color, opacity }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 34, opacity, transform: `translateX(${-T * 22}px)` }}>
      {Array.from({ length: 30 }, (_, i) => i % 3 === 2
        ? <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}></div>
        : <div key={i} style={{ width: 22, height: 22, border: `1.5px solid ${color}`, transform: 'rotate(45deg)', flexShrink: 0 }}></div>)}
    </div>
  );
}

function LipBar({ T, CUES }) {
  const s = CUES.LipBar, e = CUES.Aftercare;
  const k = M.drift(s, e + 0.5, 1.12, 1.0)(T), fr = M.enter(s + 0.2, s + 1.4)(T);
  const gloss = M.draw(s + 2.2, s + 4.4, -0.3, 1.3)(T);
  return (
    <Curtain T={T} at={s} color={C.ivory} z={6} until={e + 0.4}>
      <div style={{ position: 'absolute', left: 140, top: 160, width: 900, height: 760, display: 'flex', alignItems: 'center', transform: `perspective(1800px) rotateY(${(1 - fr) * 24 + M.drift(s, e, 3, -3)(T)}deg)`, transformOrigin: 'left center', opacity: fr }}>
        <img src={IMG + 'lip-closeup.jpg'} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', transform: `scale(${1 + (k - 1) * 0.3})` }} />
      </div>
      <div style={{ position: 'absolute', left: 1140, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 }}>
        <Rise T={T} at={s + 0.7} style={kicker(C.green)}>Introducing</Rise>
        <div style={{ fontFamily: SERIF, fontSize: 150, lineHeight: 0.95, color: C.choc }}><Mask T={T} at={s + 1.0}>The Lip Bar</Mask></div>
        <Rise T={T} at={s + 1.8} style={kicker(C.choc, 24)}>By Sense of Touch</Rise>
        <div style={{ width: 200 * M.draw(s + 2.2, s + 3.2)(T), height: 2, background: C.gold }}></div>
        <Rise T={T} at={s + 2.8} style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: C.green }}>Beauty begins with the details.</Rise>
      </div>
    </Curtain>
  );
}

function Aftercare({ T, CUES }) {
  const s = CUES.Aftercare, e = CUES.Renewal;
  const k = M.drift(s, e + 0.5, 1.1, 1.0)(T), fr = M.enter(s + 0.3, s + 1.5)(T), inset = M.enter(s + 1.6, s + 2.8)(T);
  return (
    <Curtain T={T} at={s} color={C.green} z={7} until={e + 0.4}>
      <div style={{ position: 'absolute', left: 0, top: 96, width: 1920, overflow: 'hidden' }}><Motif T={T - s} color={C.gold} opacity={0.4 * M.enter(s + 0.4, s + 1.6)(T)} /></div>
      <div style={{ position: 'absolute', left: 160, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26 }}>
        <Rise T={T} at={s + 0.7} style={kicker(C.sand)}>Introducing</Rise>
        <div style={{ fontFamily: SERIF, fontSize: 160, lineHeight: 0.95, color: C.ivory }}><Mask T={T} at={s + 1.0}>AFTERCARE</Mask></div>
        <Rise T={T} at={s + 1.8} style={kicker(C.sand, 24)}>By Sense of Touch</Rise>
        <div style={{ width: 200 * M.draw(s + 2.2, s + 3.2)(T), height: 2, background: C.gold }}></div>
        <Rise T={T} at={s + 2.8} style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: C.gold }}>African-inspired skincare.</Rise>
        <Rise T={T} at={s + 4.2} style={{ fontFamily: SANS, fontSize: 24, letterSpacing: '0.12em', color: C.sand, marginTop: 20 }}>Concept collection · in development</Rise>
      </div>
      <div style={{ position: 'absolute', left: 1160, top: 150, width: 600, height: 800, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', transform: `perspective(1800px) rotateY(${(1 - fr) * -24 + M.drift(s, e, -3, 3)(T)}deg)`, transformOrigin: 'right center', opacity: fr }}>
        <img src={IMG + 'facial-greenwall.jpg'} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', transform: `scale(${1 + (k - 1) * 0.3})`, transformOrigin: 'top right' }} />
      </div>
      <img src={IMG + 'poster-0874.jpg'} style={{ position: 'absolute', left: 1000, top: 540, maxWidth: 270, maxHeight: 470, display: 'block', border: `10px solid ${C.ivory}`, boxShadow: '0 30px 70px rgba(0,0,0,0.35)', opacity: inset, transform: `translateY(${(1 - inset) * 50}px)` }} />
    </Curtain>
  );
}

function Renewal({ T, CUES }) {
  const s = CUES.Renewal, e = CUES.Reveal;
  return (
    <div style={{ ...full, zIndex: 8, ...vis(M.enter(s - 0.4, s + 0.2)(T) * (1 - M.draw(e + 0.6, e + 0.8)(T))) }}>
      <Photo T={T} src="robe-red-portrait.jpg" a={s - 0.4} b={s + 4.6} pos="center 30%" zoom={[1.14, 1.02]} card={{ x: 640, y: 70, w: 640, h: 860 }} />
      <Photo T={T} src="robe-white-sofa.jpg" a={s + 4.6} b={s + 8.6} pos="center 40%" zoom={[1.1, 1.0]} card={{ x: 460, y: 90, w: 1000, h: 820 }} z={1} />
      <Photo T={T} src="lounge-group.jpg" a={s + 8.6} b={e} pos="center 60%" zoom={[1.3, 1.08]} z={2} />
    </div>
  );
}

function Reveal({ T, CUES, total, cta, handle }) {
  const s = CUES.Reveal;
  const bg = M.enter(s - 0.8, s + 0.4)(T);
  const line = M.draw(s + 0.5, s + 2.4, 0, 900)(T) - M.draw(s + 4.6, s + 6, 0, 740)(T);
  const m = M.enter(s + 2.0, s + 3.8)(T);
  const fade = M.draw(total - 1.2, total - 0.1)(T);
  return (
    <div style={{ ...full, zIndex: 9, background: C.choc, ...vis(bg) }}>
      <div style={{ ...full, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, transform: `scale(${1 + (T - s) * 0.003})` }}>
        <div style={{ opacity: m, filter: `blur(${(1 - m) * 16}px)`, transform: `translateY(${(1 - m) * 30}px)` }}><Mark3D h={300} rot={(1 - m) * -60 + Math.sin((T - s) * 0.5) * 5} tilt={(1 - m) * 10} shine={M.draw(s + 3.6, s + 5.6, -0.3, 1.3)(T)} /></div>
        <Rise T={T} at={s + 3.8} style={{ fontFamily: SERIF, fontSize: 80, letterSpacing: '0.16em', color: C.ivory, lineHeight: 1 }}>SENSE OF TOUCH</Rise>
        <Rise T={T} at={s + 4.3} style={{ ...kicker(C.sand, 24), letterSpacing: '0.44em' }}>Spa &amp; Wellness</Rise>
        <Rise T={T} at={s + 5.4} style={{ fontFamily: SCRIPT, fontSize: 76, color: C.gold, lineHeight: 1.1, marginTop: 10 }}>Feel the Touch. Experience the Transformation.</Rise>
        <div style={{ width: Math.max(0, line), height: 2, background: C.gold, margin: '8px 0' }}></div>
        <Rise T={T} at={s + 6.8} style={{ display: 'flex', gap: 34, ...kicker(C.sand, 24) }}><span>The Lip Bar</span><span style={{ color: C.gold }}>·</span><span>AFTERCARE</span></Rise>
        <Rise T={T} at={s + 7.8} style={{ ...kicker(C.ivory, 24), letterSpacing: '0.24em', marginTop: 18 }}>Tema Community 25, Ghana</Rise>
        <Rise T={T} at={s + 8.6} style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: C.gold }}>{cta}</Rise>
        <Rise T={T} at={s + 9.2} style={{ fontFamily: SANS, fontSize: 26, letterSpacing: '0.14em', color: C.sand }}>{handle}</Rise>
      </div>
      <div style={{ ...full, background: C.ivory, opacity: fade }}></div>
    </div>
  );
}

function Narration({ CUES, on }) {
  const P = CUES.Pause, Ca = CUES.Care, R = CUES.Renewal;
  const items = on ? [
    { at: P + 1.2, until: P + 4.9, text: 'But somewhere between everything we do for others,' },
    { at: P + 5.1, until: P + 9.4, text: 'we must remember to care for ourselves.' },
    { at: Ca + 0.6, until: Ca + 3.6, text: 'At Sense of Touch, wellness is more than a service.' },
    { at: Ca + 3.8, until: Ca + 8.2, text: 'It is an experience shaped by care, professionalism and attention to every detail.' },
    { at: Ca + 8.4, until: Ca + 12.6, text: 'From massage and body therapy to facials, scalp care and beauty treatments,' },
    { at: Ca + 12.8, until: Ca + 16.6, text: 'every moment is an invitation to reconnect with yourself.' },
    { at: R + 1.0, until: R + 4.4, text: 'Because when you make time for yourself,' },
    { at: R + 4.8, until: R + 8.2, text: 'you don’t just feel different.' },
    { at: R + 8.6, until: R + 12.4, text: 'You carry that feeling with you.' },
  ] : [];
  return <div style={{ ...full, zIndex: 20, pointerEvents: 'none' }}><Captions items={items} style={{ bottom: 64, font: `italic 400 48px ${SERIF}`, color: C.ivory, textShadow: '0 2px 18px rgba(0,0,0,0.6)' }} /></div>;
}

function Piece({ cta, handle, captions }) {
  const { T, CUES, authoredTotal } = useComposition();
  const p = { T, CUES };
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ ...full, background: C.ink, overflow: 'hidden', fontFamily: SANS }}>
      <Opening {...p} />
      <World {...p} />
      <Pause {...p} />
      <Doors {...p} />
      <Sanctuary {...p} />
      <Founder {...p} />
      <Care {...p} />
      <LipBar {...p} />
      <Aftercare {...p} />
      <Renewal {...p} />
      <Reveal {...p} total={authoredTotal} cta={cta} handle={handle} />
      <Dust3D T={T} opacity={
        M.enter(CUES.Logo, CUES.Logo + 1)(T) * (1 - M.draw(CUES.World - 0.8, CUES.World)(T)) * 0.7 +
        M.enter(CUES.Pause + 0.6, CUES.Pause + 2)(T) * (1 - M.draw(CUES.Care - 0.6, CUES.Care)(T)) +
        M.enter(CUES.Aftercare + 0.4, CUES.Aftercare + 1.4)(T) * (1 - M.draw(CUES.Renewal - 0.4, CUES.Renewal)(T)) * 0.7 +
        M.enter(CUES.Reveal, CUES.Reveal + 1.5)(T) * (1 - M.draw(authoredTotal - 1.2, authoredTotal)(T))
      } />
      <Narration CUES={CUES} on={captions} />
    </div>
  );
}

function BrandCommercial() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true, captions: true, cta: 'Book your experience today', handle: '@_senseoftouch' });
  return (
    <React.Fragment>
      <CompositionStage width={1920} height={1080} bg={C.ink} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
        <Piece cta={t.cta} handle={t.handle} captions={t.captions} />
      </CompositionStage>
      <TweaksPanel title="Brand commercial">
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
        <TweakToggle label="Narration subtitles" value={t.captions} onChange={v => setTweak('captions', v)} />
        <TweakText label="Call to action" value={t.cta} onChange={v => setTweak('cta', v)} />
        <TweakText label="Contact line" value={t.handle} onChange={v => setTweak('handle', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.BrandCommercial = BrandCommercial;
