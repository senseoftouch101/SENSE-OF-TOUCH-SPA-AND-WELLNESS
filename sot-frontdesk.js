// Sense of Touch — Front desk engine (prototype on localStorage via window.SOT).
// Production: appointments / treatment_records / audit_log tables with RLS; treatment notes readable only by therapist + manager roles.
(function () {
  const S = () => window.SOT, A = () => window.SOTAuth;
  const OPEN = 9 * 60, CLOSE = 20 * 60, STEP = 30; // Tue–Sat 9:00–20:00 · Sun 12:00–18:00 · Mon closed
  const ROOMS = ['Treatment room 1', 'Treatment room 2', 'Facial suite', 'Lip Bar station'];
  // Spa menu: [name, category, minutes, price GH₵]. Same list as the booking page. Back office → Services overrides it.
  const BASE_SERVICES = [
    ['Essential Facial', 'Facial & Skin', 60, 300], ['Signature Glow Facial', 'Facial & Skin', 75, 450], ['Dermaplaning Facial', 'Facial & Skin', 60, 500], ['Back Facial', 'Facial & Skin', 60, 450], ['Chemical Peel', 'Facial & Skin', 45, 600],
    ['Swedish Massage · 60 min', 'Massage', 60, 350], ['Swedish Massage · 90 min', 'Massage', 90, 500], ['Deep Tissue Massage · 60 min', 'Massage', 60, 400], ['Deep Tissue Massage · 90 min', 'Massage', 90, 550],
    ['Prenatal Massage · 60 min', 'Massage', 60, 400], ['Prenatal Massage · 90 min', 'Massage', 90, 550], ['Foot Therapy · 30 min', 'Massage', 30, 200], ['Foot Therapy · 60 min', 'Massage', 60, 300],
    ['Wood Therapy', 'Wood Therapy', 90, 500], ['Scalp & Hair Wash Therapy + Steam', 'Scalp & Hair', 60, 300],
    ['Brows', 'Waxing', 15, 70], ['Upper Lip', 'Waxing', 15, 50], ['Chin', 'Waxing', 15, 70], ['Underarms', 'Waxing', 15, 100], ['Bikini Line', 'Waxing', 30, 150], ['Brazilian', 'Waxing', 45, 250], ['Half Leg', 'Waxing', 30, 200], ['Full Leg', 'Waxing', 45, 300],
    ['Lip Hydration Treatment', 'The Lip Bar', 30, 300], ['Lip Plumping · Subtle', 'The Lip Bar', 45, 2000], ['Lip Plumping · Defined', 'The Lip Bar', 45, 2800], ['Lip Plumping · Full', 'The Lip Bar', 45, 4800],
    ['AFTERCARE signature ritual', 'AFTERCARE', 75, null]
  ].map(([name, cat, mins, price]) => ({ name, cat, mins, buffer: 15, price, deposit: 50 }));
  // Editable catalogue (Back office → Services) overrides the base list. Prices stay blank until the founder confirms them.
  const catalogue = () => { const c = (window.SOT ? window.SOT.list('bo-services') : []).filter(x => x.active !== false); return c.length ? c.map(x => ({ name: x.name, cat: x.cat, mins: Number(x.mins) || 60, buffer: Number(x.buffer) || 0, price: x.price === '' || x.price == null ? null : Number(x.price), deposit: Number(x.deposit) || 0 })) : BASE_SERVICES; };
  const PRODUCTS = [
    ['ac-cleanser', 'AFTERCARE Pure Radiance Cleanser', 'AFTERCARE', 180, ['dull', 'sensitive', 'daily']], ['ac-cleanser2', 'AFTERCARE Pure Balance Cleanser', 'AFTERCARE', 180, ['oily', 'daily']],
    ['ac-toner', 'AFTERCARE Radiance Prep Toner', 'AFTERCARE', 160, ['dull', 'daily']], ['ac-toner2', 'AFTERCARE Pure Hydration Toner', 'AFTERCARE', 160, ['dry', 'daily']],
    ['ac-serum', 'AFTERCARE Golden Revival Serum', 'AFTERCARE', 320, ['dull', 'daily']], ['ac-serum-c', 'AFTERCARE Vitamin C Serum', 'AFTERCARE', 320, ['dull', 'uneven']],
    ['ac-mask', 'AFTERCARE Pure Radiance Face Mask', 'AFTERCARE', 220, ['dull', 'weekly']],
    ['ac-cream', 'AFTERCARE Cloud Silk Moisturizer', 'AFTERCARE', 250, ['dry', 'sensitive', 'daily']], ['ac-cream2', 'AFTERCARE Silk Hydration Moisturizer', 'AFTERCARE', 250, ['dry']],
    ['ac-oil', 'AFTERCARE Golden Radiance Clearing Oil', 'AFTERCARE', 280, ['dull', 'oily']], ['ac-oil2', 'AFTERCARE Golden Touch Clearing Oil', 'AFTERCARE', 280, ['dull']],
    ['ac-butter', 'AFTERCARE Whipped Shea Body Butter', 'AFTERCARE', 160, ['body', 'dry']], ['ac-butter2', 'AFTERCARE Pure Shea Body Butter', 'AFTERCARE', 160, ['body', 'dry']],
    ['lb-wose', 'Wosè Lip Gloss', 'The Lip Bar', 120, ['lips', 'daily']], ['lb-kit', 'Lip Aftercare Kit', 'The Lip Bar', 150, ['lips']]
  ].map(([id, name, brand, price, tags]) => ({ id, name, brand, price, tags }));
  const CONCERNS = [['dry', 'Dry or tight skin'], ['dull', 'Dullness'], ['sensitive', 'Sensitive skin'], ['lips', 'Dry lips'], ['body', 'Body care'], ['stress', 'Stress & sleep']];
  const AFTERCARE = {
    Massage: 'Drink plenty of water today and avoid a hot bath for a few hours. Some tenderness is normal for a day or two.',
    'Wood Therapy': 'Drink water, keep moving gently and skip strenuous exercise for 24 hours. Mild tenderness can last a day.',
    'Facial & Skin': 'Skip makeup for 6 hours and exfoliants for 48 hours. Use SPF every morning and keep skin hydrated.',
    AFTERCARE: 'Skip makeup for 6 hours and exfoliants for 48 hours. Follow the routine your therapist shared and wear SPF daily.',
    'The Lip Bar': 'Keep lips moisturised with balm through the day and avoid long-wear lipstick for 24 hours.'
  };
  const REBOOK_DAYS = { Massage: 28, 'Wood Therapy': 14, 'Facial & Skin': 28, AFTERCARE: 28, 'The Lip Bar': 21 };
  const STAGES = ['Booked', 'Arrived', 'Consultation', 'In treatment', 'Ready to pay', 'Completed'];
  const NOTE_ROLES = ['super_admin', 'director', 'general_admin', 'dept_manager', 'therapist'];
  const toMin = t => { const m = String(t || '').match(/(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : OPEN; };
  const toTime = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const svc = name => catalogue().find(s => s.name === name) || BASE_SERVICES.find(s => s.name === name) || { name, cat: /lip/i.test(name || '') ? 'The Lip Bar' : /facial/i.test(name || '') ? 'Facial & Skin' : /wood/i.test(name || '') ? 'Wood Therapy' : 'Massage', mins: 60 };
  const me = () => { const c = A() && A().current && A().current(); return { by: (c && (c.name || c.email)) || 'staff', role: (A() && A().roleKey && A().roleKey()) || 'staff' }; };
  const live = b => !['Cancelled', 'No-show'].includes(b.status);
  // Staff email for a therapist name: lets the server's RLS match a therapist to their own visits (sot_assigned).
  const thEmail = name => { const t = (A() ? A().staffList() : []).find(x => x.name === name); return t ? t.email : ''; };

  const FD = {
    OPEN, CLOSE, STEP, ROOMS, BASE_SERVICES, get SERVICES() { return catalogue(); }, PRODUCTS, CONCERNS, STAGES, AFTERCARE, REBOOK_DAYS, toMin, toTime, svc,
    therapists() {
      const st = S().list('staff').filter(x => x.active).map(x => x.name);
      const acc = (A() ? A().staffList() : []).filter(t => t.active && t.staffRole === 'Therapist').map(t => t.name);
      const all = [...new Set([...st, ...acc, ...S().list('fd-therapists').map(t => t.name)])];
      return all.length ? all : ['Woselande Carmelle Theus'];
    },
    stage(b) { return b.status === 'Completed' ? 'Completed' : b.stage || 'Booked'; },
    mins(b) { return (Number(b.mins) || svc(b.service).mins) + (svc(b.service).buffer || 0); },
    day(date) { return S().list('bookings').filter(b => b.date === date && live(b)); },
    canNotes() { return NOTE_ROLES.includes(me().role); },
    audit(action, ref, detail) { const u = me(); S().add('fd-audit', { action, ref: ref || '', detail: detail || '', by: u.by, role: u.role }, 'AU'); },
    clash({ id, date, time, mins, therapist, room }) {
      const a = toMin(time), z = a + (Number(mins) || 60);
      if (a < OPEN || z > CLOSE) return 'Outside opening hours (' + toTime(OPEN) + '–' + toTime(CLOSE) + ').';
      if (therapist && window.SOTBO && window.SOTBO.onLeave(therapist, date)) return therapist.split(' ')[0] + ' is on approved leave that day.';
      const hit = FD.day(date).filter(b => b.id !== id).find(b => { const s = toMin(b.time), e = s + FD.mins(b); return s < z && a < e && ((therapist && b.therapist === therapist) || (room && b.room === room)); });
      return hit ? (hit.therapist === therapist ? therapist.split(' ')[0] : hit.room) + ' is busy with ' + hit.name + ' at ' + hit.time + '.' : '';
    },
    book(f) {
      const p = S().ghPhone(f.phone); if (!String(f.name || '').trim()) return { error: 'Add the client’s name.' }; if (!p) return { error: 'Enter a Ghana phone number.' };
      if (!f.service) return { error: 'Choose a service.' }; const mins = Number(f.mins) || svc(f.service).mins;
      const c = FD.clash({ date: f.date, time: f.time, mins, therapist: f.therapist, room: f.room }); if (c) return { error: c };
      const b = S().add('bookings', { service: f.service, mins, therapist: f.therapist, therapistEmail: thEmail(f.therapist), room: f.room, date: f.date, time: f.time, name: f.name.trim(), phone: p, status: 'Confirmed', source: f.walkIn ? 'Walk-in' : 'Front desk', stage: f.walkIn ? 'Arrived' : 'Booked', arrivedAt: f.walkIn ? new Date().toISOString() : '' }, 'BK');
      FD.audit(f.walkIn ? 'Walk-in registered' : 'Booking created', b.id, b.name + ' · ' + b.service + ' · ' + b.date + ' ' + b.time + ' · ' + b.therapist + ' · ' + b.room); return { ok: true, booking: b };
    },
    firstFree(date, service, therapist) {
      const mins = svc(service).mins, now = new Date(), today = S().localDate(), start = date === today ? Math.ceil((now.getHours() * 60 + now.getMinutes()) / STEP) * STEP : OPEN;
      for (let t = Math.max(OPEN, start); t + mins <= CLOSE; t += STEP) for (const th of (therapist ? [therapist] : FD.therapists())) for (const r of ROOMS) if (!FD.clash({ date, time: toTime(t), mins, therapist: th, room: r })) return { time: toTime(t), therapist: th, room: r };
      return null;
    },
    move(id, f) {
      const b = S().list('bookings').find(x => x.id === id); if (!b) return { error: 'Booking not found.' };
      const n = { date: f.date || b.date, time: f.time || b.time, therapist: f.therapist || b.therapist, room: f.room || b.room };
      const c = FD.clash({ id, ...n, mins: FD.mins(b) }); if (c) return { error: c };
      S().update('bookings', id, { ...n, therapistEmail: thEmail(n.therapist), rescheduled: (b.rescheduled || 0) + 1 });
      FD.audit('Rescheduled', id, b.date + ' ' + b.time + ' → ' + n.date + ' ' + n.time + (n.therapist !== b.therapist ? ' · ' + n.therapist : '') + (n.room !== b.room ? ' · ' + n.room : ''));
      FD.notify(b.phone, 'Hello ' + b.name.split(' ')[0] + ', your ' + b.service + ' at Sense of Touch is now on ' + S().fmtDate(n.date) + ' at ' + n.time + '. Reply here if that doesn’t suit.', 'reschedule', id); return { ok: true };
    },
    lateCancel(b) { const at = new Date(b.date + 'T' + toTime(toMin(b.time))); return at - Date.now() < 24 * 36e5; },
    cancel(id, reason) {
      const b = S().list('bookings').find(x => x.id === id); if (!b) return { error: 'Booking not found.' }; if (!String(reason || '').trim()) return { error: 'Add a reason for the cancellation.' };
      const late = FD.lateCancel(b), dep = Number(b.depositPaid) || 0;
      S().update('bookings', id, { status: 'Cancelled', cancelReason: reason, lateCancel: late, depositOutcome: dep ? (late ? 'Kept (late cancellation)' : 'Refund due') : '' });
      FD.audit('Cancelled', id, reason + (late ? ' · late, inside 24h' : '') + (dep ? ' · deposit ' + (late ? 'kept' : 'refund due') : '')); FD.offerWaitlist(b); return { ok: true, late };
    },
    noShow(id) { const b = S().list('bookings').find(x => x.id === id); if (!b) return; S().update('bookings', id, { status: 'No-show', depositOutcome: b.depositPaid ? 'Kept (no-show)' : '' }); FD.audit('Marked no-show', id, b.name); FD.offerWaitlist(b); },
    deposit(id, { amount, method, ref }) {
      const n = Number(amount); if (!(n > 0)) return { error: 'Enter the deposit amount.' }; if (!method) return { error: 'Choose MoMo, card or cash.' }; if (method !== 'Cash' && !String(ref || '').trim()) return { error: 'Add the MoMo or card reference.' };
      S().update('bookings', id, { depositPaid: n, depositMethod: method, depositRef: ref || '' }); S().add('fd-payments', { bookingId: id, kind: 'Deposit', amount: n, method, ref: ref || '', by: me().by }, 'PY');
      FD.audit('Deposit taken', id, S().gcMoney(n) + ' · ' + method + (ref ? ' · ' + ref : '')); return { ok: true };
    },
    refund(id) { const b = S().list('bookings').find(x => x.id === id); if (!b || !b.depositPaid) return; S().add('fd-payments', { bookingId: id, kind: 'Refund', amount: -b.depositPaid, method: b.depositMethod, ref: b.depositRef, by: me().by }, 'PY'); S().update('bookings', id, { depositOutcome: 'Refunded' }); FD.audit('Deposit refunded', id, S().gcMoney(b.depositPaid) + ' · ' + b.depositMethod); },
    setStage(id, stage, extra) { const b = S().list('bookings').find(x => x.id === id); if (!b) return; const st = { Arrived: 'arrivedAt', 'In treatment': 'startedAt', 'Ready to pay': 'finishedAt' }[stage]; S().update('bookings', id, { stage, ...(st ? { [st]: new Date().toISOString() } : {}), ...(extra || {}) }); FD.audit(stage === 'Arrived' ? 'Checked in' : 'Stage → ' + stage, id, b.name); },
    consultFor(phone) { const p = S().ghPhone(phone); return S().list('consultations').filter(c => S().ghPhone(c.phone || c.reach) === p).sort((a, b) => String(b.created).localeCompare(String(a.created)))[0] || null; },
    record(bookingId) { return S().list('fd-treatments').find(t => t.bookingId === bookingId) || null; },
    saveRecord(bookingId, r) {
      if (!FD.canNotes()) return { error: 'Only therapists and managers can write treatment records.' };
      const b = S().list('bookings').find(x => x.id === bookingId), ex = FD.record(bookingId), u = me();
      if (ex) S().update('fd-treatments', ex.id, { ...r, editedBy: u.by }); else S().add('fd-treatments', { bookingId, phone: b && b.phone, service: b && b.service, therapist: b && b.therapist, therapistEmail: b && (b.therapistEmail || thEmail(b.therapist)), date: b && b.date, ...r, by: u.by }, 'TR');
      FD.audit(ex ? 'Treatment record edited' : 'Treatment record created', bookingId, 'Notes are private · ' + (b ? b.service : '')); return { ok: true };
    },
    routine(concerns) { const c = concerns || []; return PRODUCTS.map(p => ({ ...p, score: p.tags.filter(t => c.includes(t)).length })).filter(p => p.score).sort((a, b) => b.score - a.score).slice(0, 4); },
    notify(to, text, kind, ref, deliverOn) { return S().add('notifications', { to, channel: 'whatsapp', kind, ref: ref || '', text, status: deliverOn ? 'Queued' : 'Due', deliverOn: deliverOn || '' }, 'NT'); },
    aftercare(id, picks) {
      const b = S().list('bookings').find(x => x.id === id); if (!b) return { error: 'Booking not found.' }; if (b.aftercareSent) return { error: 'Aftercare already queued for this visit.' };
      const cat = svc(b.service).cat, first = b.name.split(' ')[0], add = n => { const d = new Date(); d.setDate(d.getDate() + n); return S().localDate(d); };
      const prod = (picks || []).length ? ' Your routine: ' + picks.join(', ') + '.' : '';
      FD.notify(b.phone, 'Thank you for visiting today, ' + first + '. Aftercare for your ' + b.service + ': ' + (AFTERCARE[cat] || AFTERCARE.Massage) + prod, 'aftercare', id);
      FD.notify(b.phone, 'Hello ' + first + ', how are you feeling after your ' + b.service + '? Reply with a number from 1 to 5 and anything we could do better.', 'feedback', id, add(2));
      FD.notify(b.phone, 'Hello ' + first + ', it’s about time for your next ' + b.service + '. Reply here or book at senseoftouch.co.', 'rebook', id, add(REBOOK_DAYS[cat] || 28));
      S().update('bookings', id, { aftercareSent: true }); FD.audit('Aftercare queued', id, 'Today + feedback in 2 days + rebook in ' + (REBOOK_DAYS[cat] || 28) + ' days'); return { ok: true };
    },
    waitAdd(f) { const p = S().ghPhone(f.phone); if (!String(f.name || '').trim() || !p) return { error: 'Add a name and Ghana phone number.' }; if (!f.service) return { error: 'Choose a service.' }; const w = S().add('fd-waitlist', { name: f.name.trim(), phone: p, service: f.service, date: f.date, window: f.window || 'Any time', therapist: f.therapist || 'Any', status: 'Waiting' }, 'WL'); FD.audit('Added to waitlist', w.id, w.name + ' · ' + w.service + ' · ' + w.date); return { ok: true }; },
    offerWaitlist(b) { const w = S().list('fd-waitlist').find(x => x.status === 'Waiting' && x.date === b.date); if (w) S().update('fd-waitlist', w.id, { status: 'Slot opened', slot: b.time + ' · ' + b.therapist }); },
    waitBook(id) { const w = S().list('fd-waitlist').find(x => x.id === id); if (!w) return { error: 'Not found.' }; const f = FD.firstFree(w.date, w.service, w.therapist === 'Any' ? '' : w.therapist); if (!f) return { error: 'No free slot on ' + S().fmtDate(w.date) + ' yet.' }; const r = FD.book({ ...w, ...f }); if (r.error) return r; S().update('fd-waitlist', id, { status: 'Booked', bookingId: r.booking.id }); FD.notify(w.phone, 'Good news, ' + w.name.split(' ')[0] + ': a ' + w.service + ' slot opened on ' + S().fmtDate(w.date) + ' at ' + f.time + '. It’s yours — reply to confirm.', 'waitlist', r.booking.id); return { ok: true, booking: r.booking }; },
    takings(date) {
      const sales = S().list('sales').filter(s => S().localDate(new Date(s.created)) === date), pays = S().list('fd-payments').filter(p => S().localDate(new Date(p.created)) === date);
      const by = { MoMo: 0, Card: 0, Cash: 0 }; sales.forEach(s => { const m = /momo|mobile/i.test(s.method) ? 'MoMo' : /card/i.test(s.method) ? 'Card' : /cash/i.test(s.method) ? 'Cash' : null; if (m) by[m] += Number(s.paid) || 0; });
      pays.forEach(p => { const m = /momo|mobile/i.test(p.method) ? 'MoMo' : /card/i.test(p.method) ? 'Card' : 'Cash'; by[m] += Number(p.amount) || 0; });
      const retail = sales.reduce((n, s) => n + (s.items || []).filter(i => i.kind === 'retail').reduce((m, i) => m + i.price, 0), 0);
      return { by, sales, pays, retail, gc: sales.reduce((n, s) => n + (s.giftCardUsed || 0), 0), total: by.MoMo + by.Card + by.Cash };
    },
    closeDay(date, counted, note) { const t = FD.takings(date), c = { MoMo: Number(counted.MoMo) || 0, Card: Number(counted.Card) || 0, Cash: Number(counted.Cash) || 0 }; const diff = c.MoMo + c.Card + c.Cash - t.total; const r = S().add('fd-cashups', { date, expected: t.by, counted: c, diff, note: note || '', by: me().by }, 'CU'); FD.audit('Day closed', r.id, date + ' · expected ' + S().gcMoney(t.total) + ' · variance ' + S().gcMoney(diff)); return { ok: true, diff }; },
    passport(phone) {
      const p = S().ghPhone(phone); if (!p) return null; const bk = S().list('bookings').filter(b => b.phone === p).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
      const done = bk.filter(b => b.status === 'Completed'), cats = {}; done.forEach(b => { const c = svc(b.service).cat; cats[c] = (cats[c] || 0) + 1; });
      const pts = S().pointsSummary ? S().pointsSummary(p) : null, gc = S().list('giftcards').filter(g => g.recipientPhone === p || g.buyerPhone === p).map(g => S().gcGet(g.id) || g).filter(g => ['Active', 'Partly used'].includes(g.status));
      return { phone: p, name: (bk[0] && bk[0].name) || '', visits: done.length, first: done.length ? done[done.length - 1].date : '', cats, bk, points: pts ? pts.balance : 0, gc, feedback: S().list('fd-feedback').filter(f => f.phone === p), next: bk.find(b => live(b) && b.status !== 'Completed' && b.date >= S().localDate()), noShows: bk.filter(b => b.status === 'No-show').length, consult: FD.consultFor(p), records: FD.canNotes() ? S().list('fd-treatments').filter(t => t.phone === p) : null };
    },
    feedbackAdd(f) { const p = S().ghPhone(f.phone); if (!p) return { error: 'Enter the client’s Ghana phone number.' }; const r = Number(f.rating); if (!(r >= 1 && r <= 5)) return { error: 'Choose a rating from 1 to 5.' }; const x = S().add('fd-feedback', { phone: p, name: f.name || '', rating: r, kind: f.kind || 'Review', comment: f.comment || '', status: r <= 3 || f.kind === 'Complaint' ? 'Needs recovery' : 'Logged' }, 'FB'); FD.audit('Feedback logged', x.id, r + '/5 · ' + x.kind); return { ok: true }; },
    recover(id, action) { if (!String(action || '').trim()) return { error: 'Describe what was done.' }; S().update('fd-feedback', id, { status: 'Resolved', recovery: action, resolvedBy: me().by }); FD.audit('Service recovery', id, action); return { ok: true }; },
    integrations() {
      const C = window.SOTCloud, cc = C && C.config && C.config(), wa = S().list('wa-settings')[0] || {}, fd = S().list('foundation-settings')[0] || {}, notes = S().list('notifications');
      const due = notes.filter(n => n.status === 'Due').length, old = notes.filter(n => n.status === 'Due' && Date.now() - new Date(n.created) > 864e5).length;
      const run = S().list('daily-run')[0], bk = S().list('fd-backups')[0];
      return [
        { name: 'Database (Supabase)', ok: !!(cc && cc.url), detail: cc && cc.url ? 'Connected · records sync to the cloud' : 'Not connected · data lives on this device only', fix: 'Connect%20Supabase.dc.html' },
        { name: 'WhatsApp messages', ok: !!wa.number && old === 0, warn: !!wa.number && old > 0, detail: !wa.number ? 'Business number not set' : old ? old + ' messages waiting over 24 hours' : due + ' due · sending normally' },
        { name: 'Mobile Money & card (Paystack)', ok: !!fd.paystack, detail: fd.paystack ? 'Key saved · confirm live mode before launch' : 'No payment key · payments are recorded by hand' },
        { name: 'Google reviews link', ok: !!S().googleReviewUrl(), detail: S().googleReviewUrl() ? 'Set · review requests go out after checkout' : 'Not set · no review requests sent' },
        { name: 'Daily automations', ok: !!run && run.day === S().localDate(), warn: !!run, detail: run ? 'Last run ' + S().fmtDate(run.day) + ' · ' + (run.delivered || 0) + ' messages released' : 'Has not run yet' },
        { name: 'Backup', ok: !!bk && Date.now() - new Date(bk.created) < 7 * 864e5, warn: !!bk, detail: bk ? 'Last export ' + S().fmtDate(bk.created) + (bk.restored ? ' · restore tested' : ' · restore not tested') : 'No backup taken' }
      ];
    },
    backup() { const keys = Object.keys(localStorage).filter(k => /^sot/i.test(k)), data = {}; keys.forEach(k => data[k] = localStorage.getItem(k)); const blob = new Blob([JSON.stringify({ at: new Date().toISOString(), data })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sense-of-touch-backup-' + S().localDate() + '.json'; a.click(); S().add('fd-backups', { keys: keys.length, by: me().by }, 'BU'); FD.audit('Backup exported', '', keys.length + ' data sets'); }
  };
  window.SOTFD = FD;
})();
