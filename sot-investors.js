// Sense of Touch — investor relations: access requests, approval, NDA, gated materials, view log.
// Prototype: records live in this browser. Production: store in the backend, serve documents from private storage via short-lived signed links.
(function () {
  if (window.SOTInv) return;
  const S = window.SOT; if (!S) { console.warn('sot-investors.js needs sot-store.js first'); return; }
  const enc = f => f.split('/').map(encodeURIComponent).join('/');
  const MATERIALS = [
    { key: 'onepager', title: 'One-page summary', desc: 'The business, model, headline plan numbers and partnership options on one page.', file: 'Investor One-Pager.dc.html', tier: 'Overview' },
    { key: 'brochure', title: 'Corporate brand brochure', desc: 'Who we are, our founder, service divisions and brand.', file: 'Brochure 01 - Corporate Brand Brochure.dc.html', tier: 'Overview' },
    { key: 'deck', title: 'Pitch deck', desc: 'Problem, solution, services, brand architecture, market and positioning.', file: 'Pitch Deck.dc.html', tier: 'Overview' },
    { key: 'sponsor', title: 'Investor & sponsor presentation', desc: 'Partnership and sponsorship opportunities across the group.', file: 'Investor & Sponsor Presentation.dc.html', tier: 'Overview' },
    { key: 'narrative', title: 'Investment narrative', desc: 'Why now, why it wins, and how the business makes money.', file: 'VC Pitch Narrative.dc.html', tier: 'Confidential' },
    { key: 'plan', title: 'Business plan', desc: 'Operations, growth plan, financial assumptions and risks.', file: 'Business Plan.dc.html', tier: 'Confidential' },
    { key: 'growth', title: 'Growth & use of funds deck', desc: 'Four growth engines, unit economics, three-year plan, use of funds, milestones and risks.', file: 'Growth Deck.dc.html', tier: 'Confidential' },
    { key: 'model', title: 'Financial model', desc: 'Interactive three-year P&L, monthly cash flow, scenarios, sensitivity and start-up budget.', file: 'Financial Model.dc.html', tier: 'Confidential' },
    { key: 'dd', title: 'Due diligence pack', desc: 'Structure and ownership, team, operations, legal and IP register, risk register, ESG, reporting and document checklist.', file: 'Due Diligence Pack.dc.html', tier: 'Confidential' },
    { key: 'institute', title: 'Institute implementation plan', desc: 'How the Sense of Touch Institute is set up, run and grown.', file: 'Institute Implementation Plan.dc.html', tier: 'Confidential' },
    { key: 'launch', title: 'Business & launch master plan', desc: 'Divisions, roll-out sequence and launch timeline.', file: 'Business & Launch Master Plan.dc.html', tier: 'Confidential' }
  ].map(m => ({ ...m, href: enc(m.file) }));
  const TYPES = ['Angel investor', 'Venture capital', 'Private equity', 'Family office', 'Corporate / strategic', 'Development finance', 'Sponsor / brand partner', 'Bank / lender', 'Other'];
  const TICKETS = ['Under GHS 100,000', 'GHS 100,000 – 500,000', 'GHS 500,000 – 2 million', 'Over GHS 2 million', 'Sponsorship / in-kind', 'Prefer to discuss'];
  const INTERESTS = ['Spa & wellness', 'The Lip Bar', 'AFTERCARE skincare', 'Institute of Beauty & Wellness', 'Whole group'];
  const STATUSES = ['Submitted', 'Under review', 'Approved', 'Declined', 'Revoked', 'Expired'];
  const today = () => new Date().toISOString().slice(0, 10);
  const code = () => { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; const r = crypto.getRandomValues(new Uint32Array(8)); r.forEach(x => s += a[x % a.length]); return s.slice(0, 4) + '-' + s.slice(4); };
  const list = () => S.list('inv-requests');
  const get = id => list().find(r => r.id === id);
  const hist = (r, status, by, note) => [...(r.history || []), { at: new Date().toISOString(), status, by, note: note || '' }];
  const statusOf = r => r.status === 'Approved' && r.expires && r.expires < today() ? 'Expired' : r.status;

  function validate(d) {
    const e = {};
    if (String(d.name || '').trim().length < 2) e.name = 'Enter your full name.';
    if (!S.email(d.email)) e.email = 'Enter a valid email address.';
    if (d.phone && !S.ghPhone(d.phone) && !/^\+\d{8,15}$/.test(String(d.phone).replace(/[\s\-()]/g, ''))) e.phone = 'Enter a valid phone number, with country code if outside Ghana.';
    if (!String(d.org || '').trim()) e.org = 'Enter your firm or organisation (or “Individual”).';
    if (!d.type) e.type = 'Choose an investor type.';
    if (!(d.interests || []).length) e.interests = 'Choose at least one area of interest.';
    if (!(d.materials || []).length) e.materials = 'Choose at least one document.';
    if (String(d.message || '').trim().length < 20) e.message = 'Tell us a little about your interest (a sentence or two).';
    if (!d.consent) e.consent = 'Please agree so we can review your request.';
    return e;
  }
  function submit(d) {
    const e = validate(d); if (Object.keys(e).length) return { errors: e };
    const email = d.email.trim().toLowerCase();
    const open = list().find(r => r.email === email && ['Submitted', 'Under review'].includes(r.status));
    if (open) return { errors: { email: 'You already have a request under review (' + open.id + '). We’ll be in touch soon.' } };
    const r = S.add('inv-requests', { name: d.name.trim(), email, phone: d.phone ? (S.ghPhone(d.phone) || d.phone.trim()) : '', org: d.org.trim(), role: (d.role || '').trim(), country: (d.country || 'Ghana').trim(), type: d.type, ticket: d.ticket || '', interests: d.interests, materials: d.materials, message: d.message.trim(), linkedin: (d.linkedin || '').trim(), meeting: !!d.meeting, status: 'Submitted', history: [{ at: new Date().toISOString(), status: 'Submitted', by: 'Investor' }], views: [] }, 'INV');
    S.add('inbox', { kind: 'Investor request', name: r.name, email: r.email, phone: r.phone, message: r.org + ' · ' + r.type + ' — ' + r.message, status: 'New' }, 'IN');
    return { ok: true, req: r };
  }
  function setStatus(id, status, by, note) { const r = get(id); if (!r) return { error: 'Not found.' }; S.update('inv-requests', id, { status, history: hist(r, status, by, note) }); return { ok: true }; }
  function approve(id, f, by) {
    const r = get(id); if (!r) return { error: 'Not found.' };
    const mats = (f.materials || []).filter(k => MATERIALS.some(m => m.key === k)); if (!mats.length) return { error: 'Choose at least one document to share.' };
    const needsNda = mats.some(k => MATERIALS.find(m => m.key === k).tier === 'Confidential');
    const days = Math.max(1, Math.min(365, Number(f.days) || 30)); const ex = new Date(); ex.setDate(ex.getDate() + days);
    const c = r.code && r.status === 'Approved' ? r.code : code();
    S.update('inv-requests', id, { status: 'Approved', granted: mats, nda: needsNda, ndaAccepted: needsNda ? r.ndaAccepted || null : null, expires: ex.toISOString().slice(0, 10), code: c, history: hist(r, 'Approved', by, mats.length + ' document(s), ' + days + ' days') });
    return { ok: true, code: c };
  }
  function signIn(email, c) {
    const em = String(email || '').trim().toLowerCase(), cc = String(c || '').trim().toUpperCase().replace(/\s/g, '');
    const r = list().find(x => x.email === em && x.code && x.code.replace('-', '') === cc.replace('-', ''));
    if (!r) return { error: 'That email and access code don’t match. Check the code in your approval email.' };
    const st = statusOf(r);
    if (st === 'Expired') return { error: 'Your access expired on ' + r.expires + '. Contact us to extend it.' };
    if (st !== 'Approved') return { error: 'This access is no longer active. Contact us if you think this is a mistake.' };
    try { sessionStorage.setItem('sot-inv-session', JSON.stringify({ id: r.id, at: Date.now() })); } catch (e) {}
    return { ok: true, req: r };
  }
  function session() {
    try { const s = JSON.parse(sessionStorage.getItem('sot-inv-session') || 'null'); if (!s || Date.now() - s.at > 4 * 3600e3) return null; const r = get(s.id); return r && statusOf(r) === 'Approved' ? r : null; } catch (e) { return null; }
  }
  const signOut = () => { try { sessionStorage.removeItem('sot-inv-session'); } catch (e) {} };
  function acceptNda(id, name) { const r = get(id); if (!r) return { error: 'Not found.' }; if (String(name || '').trim().toLowerCase() !== r.name.toLowerCase()) return { error: 'Type your full name exactly as on your request: ' + r.name + '.' }; S.update('inv-requests', id, { ndaAccepted: { at: new Date().toISOString(), name: r.name }, history: hist(r, 'NDA accepted', r.name) }); return { ok: true }; }
  function logView(id, key) { const r = get(id); if (!r) return; S.update('inv-requests', id, { views: [...(r.views || []), { key, at: new Date().toISOString() }] }); }
  function requestMeeting(id, note) { const r = get(id); if (!r) return { error: 'Not found.' }; S.update('inv-requests', id, { meeting: true, meetingNote: (note || '').trim(), history: hist(r, 'Meeting requested', r.name, note) }); S.add('inbox', { kind: 'Investor meeting', name: r.name, email: r.email, phone: r.phone, message: 'Meeting request · ' + r.org + (note ? ' — ' + note : ''), status: 'New' }, 'IN'); return { ok: true }; }
  const material = k => MATERIALS.find(m => m.key === k);
  window.SOTInv = { MATERIALS, TYPES, TICKETS, INTERESTS, STATUSES, list, get, statusOf, validate, submit, setStatus, approve, signIn, session, signOut, acceptNda, logView, requestMeeting, material };
})();
