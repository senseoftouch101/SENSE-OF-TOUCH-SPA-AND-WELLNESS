const C = { ivory: '#F8F4ED', sand: '#E9DDC9', choc: '#493126', green: '#536B4E', gold: '#C6A15B', ink: '#24221D' };
const SERIF = "'Cormorant Garamond', serif", SANS = 'Montserrat, sans-serif', SCRIPT = 'Allura, cursive';

const M = {
  enter: (s, e, f = 0, t = 1) => animate({ from: f, to: t, start: s, end: e, ease: Easing.easeOutCubic }),
  draw: (s, e, f = 0, t = 1) => animate({ from: f, to: t, start: s, end: e, ease: Easing.easeInOutCubic }),
  pop: (s, e, f = 0, t = 1) => animate({ from: f, to: t, start: s, end: e, ease: Easing.easeOutBack }),
};
const life = (T, a, b, c, d) => M.enter(a, b)(T) * (1 - M.draw(c, d)(T));
const full = { position: 'absolute', inset: 0 };
const kicker = (color) => ({ fontFamily: SANS, fontSize: 24, letterSpacing: '0.32em', textTransform: 'uppercase', fontWeight: 600, color });

function Curtain({ T, at, color, z }) {
  const y = M.draw(at - 0.6, at + 0.35, 100, 0)(T);
  return <div style={{ ...full, background: color, zIndex: z, transform: `translateY(${y}%)` }}></div>;
}

function Rise({ T, at, children, style, dist = 40 }) {
  const p = M.enter(at, at + 1.1)(T);
  return <div style={{ ...style, opacity: p, transform: `translateY(${(1 - p) * dist}px)` }}>{children}</div>;
}

function Mask({ T, at, children, style }) {
  const p = M.enter(at, at + 1.2)(T);
  return <div style={{ overflow: 'hidden', paddingBottom: 12 }}><div style={{ ...style, transform: `translateY(${(1 - p) * 110}%)` }}>{children}</div></div>;
}

function Hush({ T, CUES }) {
  const s = CUES.Hush, end = CUES.Breathe;
  const out = 1 - M.draw(end - 0.7, end - 0.1)(T);
  const line = M.draw(s + 0.3, s + 1.6)(T);
  return (
    <div style={{ ...full, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 44, opacity: out, transform: `scale(${1 + T * 0.012})` }}>
      <div style={{ width: 280 * line, height: 1.5, background: C.gold }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: SERIF, fontSize: 124, lineHeight: 1.05, color: C.choc }}>
        <Rise T={T} at={s + 0.7}>Some things</Rise>
        <Rise T={T} at={s + 1.3} style={{ fontStyle: 'italic', color: C.green }}>can’t be rushed.</Rise>
      </div>
    </div>
  );
}

function Breathe({ T, CUES }) {
  const s = CUES.Breathe, end = CUES.Rooted;
  const inP = M.enter(s - 0.2, s + 1.2)(T);
  const exitP = M.draw(end - 0.9, end + 0.2)(T);
  const breath = 0.88 + 0.12 * Math.sin((T - s) * 1.15 - Math.PI / 2);
  const ring = (0.6 + 0.4 * inP) * breath * (1 + exitP * 4);
  const words = [['Pause.', s + 0.4, C.choc], ['Breathe.', s + 2.1, C.choc], ['Be held.', s + 3.8, C.green]];
  return (
    <div style={{ ...full, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - exitP }}>
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: '50%', background: C.sand, opacity: 0.7 * inP, transform: `scale(${ring * 0.92})` }}></div>
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: '50%', border: `1.5px solid ${C.gold}`, opacity: inP, transform: `scale(${ring * 1.08})` }}></div>
      {words.map(([w, at, col], i) => {
        const last = i === words.length - 1;
        const o = M.enter(at, at + 0.8)(T) * (last ? 1 : 1 - M.draw(at + 1.3, at + 1.7)(T));
        const y = (1 - M.enter(at, at + 1)(T)) * 30;
        return <div key={w} style={{ position: 'absolute', fontFamily: SERIF, fontStyle: 'italic', fontSize: 136, color: col, opacity: o, transform: `translateY(${y}px)` }}>{w}</div>;
      })}
    </div>
  );
}

function Motif({ T, color, opacity }) {
  const items = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 34, opacity, transform: `translateX(${-T * 22}px)` }}>
      {items.map(i => i % 3 === 2
        ? <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}></div>
        : <div key={i} style={{ width: 22, height: 22, border: `1.5px solid ${color}`, transform: 'rotate(45deg)', flexShrink: 0 }}></div>)}
    </div>
  );
}

function Rooted({ T, CUES }) {
  const s = CUES.Rooted, end = CUES.Rituals;
  const out = 1 - M.draw(end - 0.6, end)(T);
  return (
    <div style={{ ...full, zIndex: 3, opacity: out }}>
      <div style={{ position: 'absolute', left: 160, top: 210, display: 'flex', flexDirection: 'column', gap: 40, transform: `scale(${1 + (T - s) * 0.008})`, transformOrigin: 'left center' }}>
        <Rise T={T} at={s + 0.4} style={kicker(C.gold)}>Rooted in Ghana</Rise>
        <div style={{ fontFamily: SERIF, fontSize: 140, lineHeight: 1, color: C.ivory }}>
          <Mask T={T} at={s + 0.8}>African-inspired.</Mask>
          <Mask T={T} at={s + 1.5} style={{ fontStyle: 'italic', color: C.gold }}>Internationally</Mask>
          <Mask T={T} at={s + 1.9} style={{ fontStyle: 'italic', color: C.gold }}>relevant.</Mask>
        </div>
        <Rise T={T} at={s + 3} style={{ fontFamily: SANS, fontSize: 28, lineHeight: 1.6, color: C.sand, maxWidth: 820 }}>Spa therapy, skincare and body wellness — at Community 25 Estate Junction, Tema.</Rise>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 120, width: 1920, overflow: 'hidden' }}>
        <Motif T={T - s} color={C.gold} opacity={0.35 * M.enter(s + 0.3, s + 1.5)(T)} />
      </div>
    </div>
  );
}

const RITUALS = ['Facials', 'Massage', 'Body therapy', 'The Lip Bar', 'AFTERCARE'];
function Rituals({ T, CUES }) {
  const s = CUES.Rituals, end = CUES.Founder;
  const out = 1 - M.draw(end - 0.6, end)(T);
  const step = 1.35, t0 = s + 1.9;
  let pos = 0;
  for (let k = 0; k < RITUALS.length - 1; k++) pos += M.draw(t0 + k * step, t0 + k * step + 0.65)(T);
  const listIn = M.enter(s + 0.6, s + 1.8)(T);
  const idx = Math.min(RITUALS.length - 1, Math.round(pos));
  return (
    <div style={{ ...full, zIndex: 4, opacity: out }}>
      <div style={{ position: 'absolute', left: 160, top: 470, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Rise T={T} at={s + 0.4} style={kicker(C.sand)}>The rituals</Rise>
        <Rise T={T} at={s + 0.7} style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: C.ivory }}>{String(idx + 1).padStart(2, '0')} <span style={{ color: C.gold }}>/ 05</span></Rise>
      </div>
      <div style={{ position: 'absolute', left: 760, top: 540 - 95, transform: `translateY(${-pos * 190 + (1 - listIn) * 120}px)`, opacity: listIn }}>
        {RITUALS.map((r, i) => {
          const d = Math.abs(i - pos);
          return <div key={r} style={{ height: 190, display: 'flex', alignItems: 'center', fontFamily: SERIF, fontSize: 156, color: C.ivory, opacity: 0.22 + 0.78 * Math.max(0, 1 - d), fontStyle: d < 0.5 ? 'italic' : 'normal', transform: `translateX(${Math.max(0, 1 - d) * 24}px)` }}>{r}</div>;
        })}
      </div>
      <div style={{ position: 'absolute', left: 690, top: 540 - 60, width: 1.5, height: 120, background: C.gold, opacity: listIn }}></div>
    </div>
  );
}

function Founder({ T, CUES }) {
  const s = CUES.Founder, end = CUES.Values;
  const out = 1 - M.draw(end - 0.6, end)(T);
  const reveal = M.draw(s + 0.1, s + 1.4)(T);
  const zoom = 1.1 - 0.08 * M.draw(s, end)(T);
  const lines = ['“Every client deserves', 'to feel cared for, relaxed,', 'refreshed and confident.”'];
  return (
    <div style={{ ...full, zIndex: 5, opacity: out }}>
      <div style={{ position: 'absolute', right: 0, top: 0, width: 780, height: 1080, overflow: 'hidden', clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)` }}>
        <img src="assets/web/founder-web.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', transform: `scale(${zoom})` }} />
      </div>
      <div style={{ position: 'absolute', left: 160, top: 0, bottom: 0, width: 900, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 48 }}>
        <div style={{ fontFamily: SERIF, fontSize: 72, lineHeight: 1.18, color: C.choc }}>
          {lines.map((l, i) => <Mask key={i} T={T} at={s + 0.9 + i * 0.45}>{l}</Mask>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Rise T={T} at={s + 3.2} style={{ fontFamily: SCRIPT, fontSize: 110, lineHeight: 1, color: C.green }}>Woselande</Rise>
          <Rise T={T} at={s + 3.6} style={kicker(C.choc)}>Founder</Rise>
        </div>
      </div>
    </div>
  );
}

const VALUES = ['Excellence', 'Care', 'Integrity', 'Confidence', 'Natural beauty'];
function Values({ T, CUES }) {
  const s = CUES.Values, end = CUES.Close;
  const out = 1 - M.draw(end - 0.6, end)(T);
  return (
    <div style={{ ...full, zIndex: 6, opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 56, transform: `scale(${1 + (T - s) * 0.01})` }}>
      <Rise T={T} at={s + 0.4} style={kicker(C.green)}>What we stand for</Rise>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '20px 44px', maxWidth: 1500 }}>
        {VALUES.map((v, i) => {
          const at = s + 0.8 + i * 0.38;
          const p = M.pop(at, at + 0.8)(T);
          const o = M.enter(at, at + 0.5)(T);
          return (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 44, opacity: o }}>
              {i > 0 && i !== 3 ? <div style={{ width: 14, height: 14, background: C.gold, transform: `rotate(45deg) scale(${p})` }}></div> : null}
              <span style={{ fontFamily: SERIF, fontSize: 112, color: C.choc, fontStyle: i % 2 ? 'italic' : 'normal', display: 'inline-block', transform: `translateY(${(1 - p) * 40}px)` }}>{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Close({ T, CUES, total, cta }) {
  const s = CUES.Close;
  const out = 1 - M.draw(total - 1.1, total - 0.2)(T);
  const p = M.enter(s + 0.3, s + 1.8)(T);
  return (
    <div style={{ ...full, zIndex: 7, opacity: out, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <img src="assets/logo-transparent.png" style={{ width: 640, height: 640, opacity: p, transform: `scale(${0.94 + 0.06 * p + (T - s) * 0.006})`, marginTop: -120, marginBottom: -150 }} />
      <Rise T={T} at={s + 1.6} style={kicker(C.choc)}>Spa &amp; Wellness · Tema, Ghana</Rise>
      <Rise T={T} at={s + 2.4} style={{ marginTop: 20, fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: C.green }}>{cta}</Rise>
    </div>
  );
}

function Chrome({ T, CUES, total }) {
  const dark = T >= CUES.Rooted && T < CUES.Founder - 0.2;
  const onPhoto = T >= CUES.Founder && T < CUES.Values - 0.2;
  const o = M.enter(0.5, 1.5)(T) * (1 - M.draw(CUES.Close - 0.6, CUES.Close)(T));
  const thread = Math.min(1, T / total) * (1 - M.draw(total - 1.1, total - 0.2)(T));
  return (
    <div style={{ ...full, zIndex: 20, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 160, right: 160, bottom: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: o }}>
        <span style={{ ...kicker(dark ? C.sand : C.choc), fontSize: 18 }}>Sense of Touch</span>
        <span style={{ fontFamily: SCRIPT, fontSize: 40, color: dark ? C.gold : onPhoto ? C.sand : C.green }}>Spa &amp; Wellness</span>
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 4, width: `${thread * 100}%`, background: C.gold }}></div>
    </div>
  );
}

function Piece({ cta }) {
  const { T, CUES, authoredTotal } = useComposition();
  const props = { T, CUES };
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ ...full, background: C.ivory, overflow: 'hidden', fontFamily: SANS }}>
      <Curtain T={T} at={CUES.Rooted} color={C.choc} z={3} />
      <Curtain T={T} at={CUES.Rituals} color={C.green} z={4} />
      <Curtain T={T} at={CUES.Founder} color={C.ivory} z={5} />
      <Curtain T={T} at={CUES.Values} color={C.sand} z={6} />
      <Curtain T={T} at={CUES.Close} color={C.ivory} z={7} />
      <Hush {...props} />
      <Breathe {...props} />
      <Rooted {...props} />
      <Rituals {...props} />
      <Founder {...props} />
      <Values {...props} />
      <Close {...props} total={authoredTotal} cta={cta} />
      <Chrome {...props} total={authoredTotal} />
    </div>
  );
}

function BrandFilm() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true, cta: 'Book your ritual' });
  return (
    <React.Fragment>
      <CompositionStage width={1920} height={1080} bg={C.ivory} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
        <Piece cta={t.cta} />
      </CompositionStage>
      <TweaksPanel title="Brand film">
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
        <TweakText label="Closing line" value={t.cta} onChange={v => setTweak('cta', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.BrandFilm = BrandFilm;
