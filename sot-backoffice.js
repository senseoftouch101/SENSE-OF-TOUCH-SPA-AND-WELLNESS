// Sense of Touch — Back office (prototype on localStorage via window.SOT).
// Leave & training, expenses, stock batches & expiry, permission-based campaigns. Every action writes the front-desk audit trail.
// Production: tables leave_requests, training_records, policy_acknowledgements, expenses, product_batches, campaigns + RLS (see Ecosystem Roadmap master prompt).
(function () {
  const S = () => window.SOT, A = () => window.SOTAuth, FD = () => window.SOTFD;
  const me = () => { const c = A() && A().current && A().current(); return { by: (c && (c.name || c.email)) || 'staff', email: (c && c.email) || '', role: (A() && A().roleKey && A().roleKey()) || 'staff' }; };
  const audit = (a, ref, d) => FD() ? FD().audit(a, ref, d) : S().add('fd-audit', { action: a, ref, detail: d, by: me().by, role: me().role }, 'AU');
  const APPROVERS = ['super_admin', 'director', 'general_admin', 'dept_manager'];
  const canApprove = () => APPROVERS.includes(me().role);
  const DIVISIONS = ['Spa & Wellness', 'THE LIP BAR', 'AFTERCARE', 'Institute', 'Commerce', 'Corporate wellness', 'Central'];
  const EXP_CATS = ['Products & consumables', 'Rent & utilities', 'Salaries & wages', 'Marketing', 'Equipment', 'Laundry & cleaning', 'Transport & delivery', 'Professional fees', 'Other'];
  const LEAVE = ['Annual leave', 'Sick leave', 'Training day', 'Unpaid leave', 'Other'];
  const TRAININGS = ['Hygiene & infection control', 'Client consultation & contraindications', 'Data protection & client privacy', 'Health & safety / first aid', 'Front desk & checkout', 'Product knowledge: THE LIP BAR & AFTERCARE'];
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5) + 1;
  const BO = {
    DIVISIONS, EXP_CATS, LEAVE, TRAININGS, canApprove,
    staffNames() { const a = (A() ? A().staffList() : []).filter(t => t.active && !t.mailbox).map(t => t.name); const s = S().list('staff').filter(x => x.active).map(x => x.name); return [...new Set([...s, ...a])]; },
    leaveAdd(f) {
      if (!f.who) return { error: 'Choose the staff member.' }; if (!f.from || !f.to) return { error: 'Add the first and last day.' }; if (f.to < f.from) return { error: 'The last day is before the first day.' };
      const clash = S().list('bookings').filter(b => b.therapist === f.who && b.date >= f.from && b.date <= f.to && !['Cancelled', 'No-show', 'Completed'].includes(b.status));
      const r = S().add('bo-leave', { who: f.who, type: f.type || 'Annual leave', from: f.from, to: f.to, days: daysBetween(f.from, f.to), note: f.note || '', status: 'Pending', clashes: clash.length, requestedBy: me().by }, 'LV');
      audit('Leave requested', r.id, f.who + ' · ' + r.type + ' · ' + f.from + '→' + f.to + (clash.length ? ' · ' + clash.length + ' bookings affected' : '')); return { ok: true, clashes: clash.length };
    },
    leaveDecide(id, ok) { if (!canApprove()) return { error: 'Only a manager can approve leave.' }; const l = S().list('bo-leave').find(x => x.id === id); if (!l) return { error: 'Not found.' }; if (l.requestedBy === me().by && me().role !== 'super_admin') return { error: 'Someone else must approve your own request.' };
      S().update('bo-leave', id, { status: ok ? 'Approved' : 'Declined', decidedBy: me().by });
      if (ok) S().add('schedule-blocks', { who: l.who, from: l.from, to: l.to, reason: l.type, leaveId: id }, 'BL');
      audit(ok ? 'Leave approved' : 'Leave declined', id, l.who + ' · ' + l.from + '→' + l.to); return { ok: true }; },
    onLeave(name, date) { return S().list('bo-leave').some(l => l.status === 'Approved' && l.who === name && date >= l.from && date <= l.to); },
    trainingSet(who, course, done) { const ex = S().list('bo-training').find(t => t.who === who && t.course === course); if (ex) S().update('bo-training', ex.id, { done, on: done ? S().localDate() : '' }); else S().add('bo-training', { who, course, done, on: done ? S().localDate() : '' }, 'TN'); audit(done ? 'Training recorded' : 'Training cleared', who, course); },
    trainingDone(who, course) { const t = S().list('bo-training').find(x => x.who === who && x.course === course); return t && t.done ? t.on : ''; },
    policyAck(who, policy) { S().add('bo-policy-acks', { who, policy, version: 'current' }, 'PA'); audit('Policy acknowledged', who, policy); },
    policyAcked(who, policy) { return S().list('bo-policy-acks').find(x => x.who === who && x.policy === policy); },
    expenseAdd(f) {
      const n = Number(f.amount); if (!(n > 0)) return { error: 'Enter the amount.' }; if (!f.division) return { error: 'Choose the division.' }; if (!f.category) return { error: 'Choose a category.' }; if (!String(f.payee || '').trim()) return { error: 'Add who was paid.' };
      const r = S().add('bo-expenses', { date: f.date || S().localDate(), division: f.division, category: f.category, payee: f.payee.trim(), amount: n, method: f.method || 'Cash', ref: f.ref || '', note: f.note || '', status: n >= 1000 ? 'Awaiting approval' : 'Recorded', by: me().by }, 'EX');
      audit('Expense recorded', r.id, S().gcMoney(n) + ' · ' + f.division + ' · ' + f.category + ' · ' + f.payee); return { ok: true, needsApproval: r.status === 'Awaiting approval' };
    },
    expenseApprove(id) { if (!canApprove()) return { error: 'Only a manager can approve expenses.' }; const e = S().list('bo-expenses').find(x => x.id === id); if (!e) return { error: 'Not found.' }; if (e.by === me().by) return { error: 'Someone else must approve an expense you recorded.' }; S().update('bo-expenses', id, { status: 'Approved', approvedBy: me().by }); audit('Expense approved', id, S().gcMoney(e.amount)); return { ok: true }; },
    expenseCorrect(id, reason) { if (!String(reason || '').trim()) return { error: 'Give a reason for the correction.' }; const e = S().list('bo-expenses').find(x => x.id === id); if (!e) return { error: 'Not found.' }; S().update('bo-expenses', id, { status: 'Reversed', reversal: reason }); S().add('bo-expenses', { ...e, id: undefined, amount: -e.amount, status: 'Reversal', note: 'Reverses ' + id + ': ' + reason, by: me().by }, 'EX'); audit('Expense reversed', id, reason); return { ok: true }; },
    pnl(month) {
      const inM = d => String(d || '').slice(0, 7) === month, by = {};
      DIVISIONS.forEach(d => by[d] = { rev: 0, exp: 0 });
      S().list('sales').filter(s => inM(S().localDate(new Date(s.created)))).forEach(s => (s.items || []).forEach(i => { const d = i.kind === 'retail' ? (/lip/i.test(i.name) ? 'THE LIP BAR' : /aftercare|aftercare/i.test(i.name) ? 'AFTERCARE' : 'Commerce') : 'Spa & Wellness'; by[d].rev += Number(i.price) || 0; }));
      S().list('bo-expenses').filter(e => inM(e.date) && e.status !== 'Reversed' && e.status !== 'Awaiting approval').forEach(e => { (by[e.division] || by.Central).exp += e.amount; });
      return DIVISIONS.map(d => ({ d, ...by[d], net: by[d].rev - by[d].exp }));
    },
    batchAdd(f) {
      if (!f.product) return { error: 'Choose the product.' }; if (!String(f.batch || '').trim()) return { error: 'Add the batch or lot number.' }; const q = Math.floor(Number(f.qty)); if (!(q > 0)) return { error: 'Enter the quantity received.' }; if (!f.expiry) return { error: 'Add the expiry date.' };
      if (S().list('bo-batches').some(b => b.product === f.product && b.batch === f.batch.trim())) return { error: 'That batch is already recorded for this product.' };
      const r = S().add('bo-batches', { product: f.product, batch: f.batch.trim(), qty: q, left: q, expiry: f.expiry, supplier: f.supplier || '', received: S().localDate(), by: me().by }, 'BT');
      S().add('stock-movements', { product: f.product, batch: r.batch, qty: q, kind: 'Received' }, 'SM'); audit('Batch received', r.id, f.product + ' · ' + r.batch + ' · ' + q + ' · exp ' + f.expiry); return { ok: true };
    },
    batchMove(id, qty, kind) { const b = S().list('bo-batches').find(x => x.id === id); const q = Math.floor(Number(qty)); if (!b || !(q > 0)) return { error: 'Enter a quantity.' }; if (q > b.left) return { error: 'Only ' + b.left + ' left in this batch.' }; S().update('bo-batches', id, { left: b.left - q }); S().add('stock-movements', { product: b.product, batch: b.batch, qty: -q, kind }, 'SM'); audit('Stock ' + kind.toLowerCase(), id, b.product + ' · ' + b.batch + ' · −' + q); return { ok: true }; },
    batchState(b) { const d = Math.round((new Date(b.expiry + 'T00:00') - new Date(S().localDate() + 'T00:00')) / 864e5); return b.left <= 0 ? ['Empty', '#6B665C'] : d < 0 ? ['Expired', '#9A3B2A'] : d <= 60 ? ['Expires in ' + d + ' d', '#9A6B12'] : ['OK', '#536B4E']; },
    audience(seg) {
      const cons = {}; S().list('consents').slice().reverse().forEach(c => { if (c.key === 'mkt') cons[c.phone] = !!c.granted; }); S().list('clients').forEach(c => { if (c.phone && c.prefs && c.prefs.mkt != null) cons[c.phone] = !!c.prefs.mkt; });
      const book = S().list('bookings'), byPhone = {}; book.forEach(b => { if (!b.phone) return; (byPhone[b.phone] = byPhone[b.phone] || { name: b.name, done: 0, last: '', cats: new Set() }); const p = byPhone[b.phone]; if (b.status === 'Completed') { p.done++; if (b.date > p.last) p.last = b.date; if (FD()) p.cats.add(FD().svc(b.service).cat); } });
      const d90 = (() => { const d = new Date(); d.setDate(d.getDate() - 90); return S().localDate(d); })();
      const test = { 'All with consent': () => true, 'Returning clients': p => p.done >= 2, 'Lapsed 90+ days': p => p.done && p.last < d90, 'Facial & AFTERCARE clients': p => p.cats.has('Facial & Skin') || p.cats.has('AFTERCARE'), 'Lip Bar clients': p => p.cats.has('The Lip Bar') }[seg] || (() => true);
      const all = Object.entries(byPhone).filter(([, p]) => test(p));
      return { yes: all.filter(([ph]) => cons[ph]).map(([phone, p]) => ({ phone, name: p.name })), excluded: all.filter(([ph]) => !cons[ph]).length };
    },
    SEGMENTS: ['All with consent', 'Returning clients', 'Lapsed 90+ days', 'Facial & AFTERCARE clients', 'Lip Bar clients'],
    campaignAdd(f) { if (!String(f.name || '').trim()) return { error: 'Name the campaign.' }; if (String(f.text || '').trim().length < 20) return { error: 'Write the message (at least 20 characters).' }; if (!/stop/i.test(f.text)) return { error: 'Include how to opt out, e.g. “Reply STOP to opt out.”' };
      const r = S().add('bo-campaigns', { name: f.name.trim(), segment: f.segment || 'All with consent', text: f.text.trim(), sendOn: f.sendOn || '', status: 'Draft', by: me().by }, 'CP'); audit('Campaign drafted', r.id, r.name); return { ok: true }; },
    campaignSend(id) { if (!canApprove()) return { error: 'A manager must approve and send campaigns.' }; const c = S().list('bo-campaigns').find(x => x.id === id); if (!c) return { error: 'Not found.' }; const a = BO.audience(c.segment); if (!a.yes.length) return { error: 'No one in this audience has agreed to offers and news.' };
      a.yes.forEach(p => S().add('notifications', { to: p.phone, channel: 'whatsapp', kind: 'campaign', ref: id, text: c.text.replace(/\{name\}/g, (p.name || '').split(' ')[0] || 'there'), status: c.sendOn ? 'Queued' : 'Due', deliverOn: c.sendOn || '' }, 'NT'));
      S().update('bo-campaigns', id, { status: 'Sent', sent: a.yes.length, excluded: a.excluded, approvedBy: me().by }); audit('Campaign sent', id, a.yes.length + ' messages · ' + a.excluded + ' excluded (no consent)'); return { ok: true, n: a.yes.length };
    },
    journey(phone) {
      const p = S().ghPhone(phone); if (!p || !FD()) return []; const F = FD();
      const sales = S().list('sales');
      return S().list('bookings').filter(b => b.phone === p && b.status === 'Completed').sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map(b => {
        const cat = F.svc(b.service).cat, sale = sales.find(s => s.bookingId === b.id), next = (() => { const d = new Date(b.date + 'T00:00'); d.setDate(d.getDate() + (F.REBOOK_DAYS[cat] || 28)); return S().localDate(d); })();
        return { id: b.id, date: b.date, service: b.service, therapist: b.therapist && b.therapist !== 'No preference' ? b.therapist.split(' ')[0] : '', aftercare: F.AFTERCARE[cat] || '', products: sale ? (sale.items || []).filter(i => i.kind === 'retail').map(i => i.name) : [], paid: sale ? sale.paid : null, method: sale ? sale.method : '', receipt: sale ? sale.id : '', nextBy: next };
      });
    }
  };
  Object.assign(BO, {
    CATS: ['Massage', 'Wood Therapy', 'Facial & Skin', 'AFTERCARE', 'The Lip Bar', 'Body Therapy', 'Scalp & Hair', 'Waxing'],
    services() { const l = S().list('bo-services'); return l.length ? l : (FD() ? FD().BASE_SERVICES.map(s => ({ id: '', name: s.name, cat: s.cat, mins: s.mins, buffer: 15, price: s.price == null ? '' : s.price, deposit: s.deposit == null ? '' : s.deposit, rebook: (FD().REBOOK_DAYS[s.cat] || 28), active: true, published: true, seed: true })) : []); },
    serviceSave(f) {
      if (!canApprove()) return { error: 'Only a manager can change the service catalogue.' }; if (!String(f.name || '').trim()) return { error: 'Name the service.' }; if (!f.cat) return { error: 'Choose a category.' };
      const m = Math.floor(Number(f.mins)); if (!(m >= 15 && m <= 240)) return { error: 'Duration must be 15–240 minutes.' }; if (f.price !== '' && f.price != null && !(Number(f.price) > 0)) return { error: 'Leave the price blank until confirmed, or enter an amount.' };
      if (!S().list('bo-services').length) BO.services().forEach(s => S().add('bo-services', { ...s, id: undefined, seed: undefined }, 'SV'));
      const rec = { name: f.name.trim(), cat: f.cat, mins: m, buffer: Number(f.buffer) || 0, price: f.price === '' ? '' : Number(f.price), deposit: f.deposit === '' ? '' : Number(f.deposit) || 0, rebook: Number(f.rebook) || 28, active: f.active !== false, published: !!f.published };
      const ex = S().list('bo-services').find(x => x.id === f.id || x.name === f.name.trim());
      if (ex) { S().update('bo-services', ex.id, rec); audit('Service updated', ex.id, rec.name + ' · ' + m + ' min' + (rec.price !== '' ? ' · ' + S().gcMoney(rec.price) : ' · price to be confirmed')); } else { const r = S().add('bo-services', rec, 'SV'); audit('Service added', r.id, rec.name); }
      return { ok: true };
    },
    CORP_STAGES: ['Lead', 'Contacted', 'Proposal sent', 'Negotiating', 'Won', 'Lost'],
    corpSync() { const have = new Set(S().list('bo-corporate').map(c => c.enquiryId)); S().list('enquiries').filter(e => /^Corporate/.test(e.type || '') && !have.has(e.id)).forEach(e => S().add('bo-corporate', { enquiryId: e.id, org: e.org || e.name, contact: e.name, reach: e.reach || '', type: String(e.type).replace('Corporate · ', ''), guests: e.guests || '', stage: 'Lead', value: '', next: '', notes: e.message || '' }, 'CO')); },
    corpAdd(f) { if (!String(f.org || '').trim() || !String(f.contact || '').trim()) return { error: 'Add the organisation and contact.' }; const r = S().add('bo-corporate', { org: f.org.trim(), contact: f.contact.trim(), reach: f.reach || '', type: f.type || 'Corporate wellness day', guests: f.guests || '', stage: 'Lead', value: '', next: '', notes: '' }, 'CO'); audit('Corporate lead added', r.id, r.org); return { ok: true }; },
    corpUpdate(id, patch) { const c = S().list('bo-corporate').find(x => x.id === id); if (!c) return; if (patch.stage === 'Won' && !(Number(patch.value ?? c.value) > 0)) return { error: 'Add the agreed contract value before marking it won.' }; S().update('bo-corporate', id, patch); if (patch.stage && patch.stage !== c.stage) audit('Corporate → ' + patch.stage, id, c.org + (patch.value || c.value ? ' · ' + S().gcMoney(patch.value || c.value) : '')); return { ok: true }; },
    postSave(f) {
      if (!String(f.title || '').trim()) return { error: 'Add a title.' }; if (String(f.body || '').trim().length < 80) return { error: 'Write the article (at least a short paragraph).' };
      const slug = (f.slug || f.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
      const rec = { title: f.title.trim(), slug, cat: f.cat || 'Wellness', dek: f.dek || '', body: f.body.trim(), img: f.img || '', alt: f.alt || '', mins: Math.max(1, Math.round(f.body.trim().split(/\s+/).length / 200)), status: f.status || 'Draft', claimsChecked: !!f.claimsChecked };
      if (rec.status === 'Published' && !rec.claimsChecked) return { error: 'Confirm the article makes no medical or product claims that aren’t approved.' };
      if (rec.status === 'Published' && !canApprove()) return { error: 'A manager publishes articles. Save it as a draft for review.' };
      const ex = f.id && S().list('cms-posts').find(x => x.id === f.id);
      if (ex) S().update('cms-posts', ex.id, rec); else S().add('cms-posts', rec, 'PO'); audit(rec.status === 'Published' ? 'Article published' : 'Article saved', slug, rec.title); return { ok: true };
    }
  });
  // Audit every Admin write, not only front-desk actions. Production: database trigger on every table (schema-012 covers sot_records).
  const SKIP = /^(fd-audit|notifications|daily-run|wa-|sot-|session|cache)/;
  if (/Admin/.test(location.pathname) && window.SOT && !window.SOT.__audited) {
    const X = window.SOT, add = X.add.bind(X), upd = X.update.bind(X), rem = X.remove && X.remove.bind(X);
    X.__audited = true;
    X.add = (k, item, pre) => { const r = add(k, item, pre); if (!SKIP.test(k) && !/^fd-|^bo-/.test(k)) add('fd-audit', { action: 'Created ' + k, ref: r.id, detail: Object.keys(item || {}).slice(0, 6).join(', '), by: me().by, role: me().role }, 'AU'); return r; };
    X.update = (k, id, patch) => { upd(k, id, patch); if (!SKIP.test(k) && !/^fd-|^bo-/.test(k)) add('fd-audit', { action: 'Updated ' + k, ref: id, detail: Object.entries(patch || {}).slice(0, 4).map(([a, v]) => a + '=' + (typeof v === 'object' ? '…' : String(v).slice(0, 30))).join(' · '), by: me().by, role: me().role }, 'AU'); };
    if (rem) X.remove = (k, id) => { rem(k, id); if (!SKIP.test(k)) add('fd-audit', { action: 'Deleted ' + k, ref: id, detail: '', by: me().by, role: me().role }, 'AU'); };
  }
  window.SOTBO = BO;
})();
