// Sense of Touch — WhatsApp booking messaging.
// Manual mode (default): staff tap a button, WhatsApp opens with the message ready, staff press send.
// API mode: messages are queued in 'wa-outbox' for a server using the WhatsApp Business Platform
// (Meta Cloud API or a provider such as Twilio / Hubtel). Server contract:
//   - poll or subscribe to wa-outbox items with status 'Queued', send using the Meta-approved template
//     named in item.template, then set status to 'Sent' / 'Delivered' / 'Read' / 'Failed' from webhooks.
//   - inbound webhook → call SOTWA.inbound(phone, text) so replies update bookings and the CRM.
//   - access tokens live on the server only — never in this file or the browser.
(function () {
  if (window.SOTWA) return;
  const S = window.SOT; if (!S) { console.warn('sot-whatsapp.js needs sot-store.js first'); return; }
  const now = () => new Date().toISOString();
  const TEMPLATES = {
    received: { label: 'Booking received', kind: 'service', text: 'Hello {first}, thank you for booking {service} with Sense of Touch for {date} at {time} (ref {ref}). We’ll confirm your time shortly.' },
    confirmed: { label: 'Booking confirmed', kind: 'service', text: 'Hello {first}, your {service} is confirmed for {date} at {time} (ref {ref}). Please arrive 10 minutes early. Reply CONFIRM to confirm, CHANGE to reschedule or CANCEL to cancel.' },
    deposit: { label: 'Deposit request', kind: 'service', text: 'Hello {first}, to secure your {service} on {date} at {time}, please pay the deposit{deposit}. Reply once paid and we’ll confirm. Ref {ref}.' },
    reminder: { label: 'Reminder (day before)', kind: 'service', text: 'Hello {first}, a reminder of your {service} tomorrow, {date} at {time}. Reply CONFIRM to confirm or CHANGE if you need another time. Please give 24 hours’ notice to reschedule.' },
    reschedule: { label: 'Reschedule', kind: 'service', text: 'Hello {first}, we received your request to change your {service} (ref {ref}). Which day and time would suit you?' },
    cancelled: { label: 'Cancellation', kind: 'service', text: 'Hello {first}, your {service} on {date} at {time} (ref {ref}) has been cancelled. We hope to welcome you another time.' },
    feedback: { label: 'Feedback request', kind: 'service', text: 'Hello {first}, thank you for visiting Sense of Touch. How was your {service}? A short reply helps us care for you better.' },
    offer: { label: 'Offer (marketing)', kind: 'marketing', text: 'Hello {first}, a seasonal treat from Sense of Touch: … Reply STOP to stop offers.' }
  };
  const DEF = { number: S.WA, mode: 'manual', depositLink: '', auto: { received: true, confirmed: true, reminder: true, cancelled: true, feedback: true }, templates: {} };
  const cfg = () => { const c = S.list('wa-settings')[0] || {}; return { ...DEF, ...c, auto: { ...DEF.auto, ...(c.auto || {}) }, templates: { ...(c.templates || {}) } }; };
  const setCfg = p => S.save('wa-settings', [{ ...cfg(), ...p }]);
  const tpl = k => cfg().templates[k] || (TEMPLATES[k] || {}).text || '';
  const norm = p => S.ghPhone(p) || (String(p || '').replace(/[^\d+]/g, '').replace(/^(?!\+)/, '+'));
  const fmtD = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  function compose(key, b) {
    const c = cfg(), dep = c.depositLink ? ' here: ' + c.depositLink : '';
    return tpl(key).replace(/\{(\w+)\}/g, (_, v) => ({ first: String(b.name || '').split(' ')[0], service: b.service || 'appointment', date: fmtD(b.date), time: b.time || '', ref: b.id || '', deposit: dep }[v] ?? ''));
  }
  const link = (phone, text) => 'https://wa.me/' + norm(phone).replace('+', '') + '?text=' + encodeURIComponent(text);
  function consent(phone) {
    const k = norm(phone), cs = S.list('consents').filter(x => norm(x.phone) === k);
    const last = key => { const r = cs.filter(x => x.key === key); return r.length ? r[0].granted : null; }; // list is newest-first
    return { service: last('wa') !== false, marketing: last('mkt') === true };
  }
  function send(key, b, by) {
    const t = TEMPLATES[key]; if (!t) return { error: 'Unknown message.' };
    const ok = consent(b.phone); if (t.kind === 'marketing' ? !ok.marketing : !ok.service) return { error: t.kind === 'marketing' ? 'No marketing consent — offers can’t be sent to this client.' : 'This client has withdrawn WhatsApp consent.' };
    const c = cfg(), text = compose(key, b);
    S.add('comm-log', { phone: norm(b.phone), channel: 'WhatsApp', label: t.label, template: key, bookingId: b.id || '', text, status: c.mode === 'api' ? 'Queued — waiting for WhatsApp API server' : 'Opened in WhatsApp — delivery not confirmed', by: by || 'Staff' }, 'CM');
    if (c.mode === 'api') { S.add('wa-outbox', { to: norm(b.phone), template: key, bookingId: b.id || '', text, status: 'Queued', at: now() }, 'WO'); return { ok: true, queued: true }; }
    return { ok: true, url: link(b.phone, text) };
  }
  const STATUS_TPL = { Confirmed: 'confirmed', Cancelled: 'cancelled', 'Change requested': 'reschedule', Completed: 'feedback' };
  function onStatusChange(b, status, by) {
    const key = STATUS_TPL[status], c = cfg();
    if (!key || c.mode !== 'api' || !c.auto[key === 'reschedule' ? 'confirmed' : key]) return null;
    return send(key, { ...b, status }, by || 'System (automatic)');
  }
  const sentFor = (bid, key) => S.list('comm-log').some(m => m.bookingId === bid && m.template === key);
  const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return S.localDate(d); };
  const due = () => {
    const bk = S.list('bookings'), today = S.localDate(), tm = tomorrow();
    return {
      unconfirmed: bk.filter(b => b.status === 'Requested' && b.date >= today && !sentFor(b.id, 'confirmed')),
      reminders: bk.filter(b => b.status === 'Confirmed' && b.date === tm && !sentFor(b.id, 'reminder')),
      feedback: bk.filter(b => b.status === 'Completed' && b.date <= today && b.date >= S.localDate(new Date(Date.now() - 7 * 864e5)) && !sentFor(b.id, 'feedback'))
    };
  };
  function runAutomations() { // API mode: queue automatic reminders and feedback (server would run this on a schedule)
    const c = cfg(); if (c.mode !== 'api') return 0; const d = due(); let n = 0;
    if (c.auto.reminder) d.reminders.forEach(b => { if (send('reminder', b, 'System (automatic)').ok) n++; });
    if (c.auto.feedback) d.feedback.forEach(b => { if (send('feedback', b, 'System (automatic)').ok) n++; });
    return n;
  }
  function inbound(phone, text) {
    const k = norm(phone), t = String(text || '').trim(), w = t.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/)[0] || '';
    const today = S.localDate(), b = S.list('bookings').filter(x => norm(x.phone) === k && x.date >= today && !['Cancelled', 'Completed', 'No-show'].includes(x.status)).sort((a, z) => (a.date + a.time).localeCompare(z.date + z.time))[0];
    let action = 'Logged for staff to reply';
    if (['STOP', 'UNSUBSCRIBE'].includes(w)) { S.add('consents', { phone: k, key: 'mkt', channel: 'Marketing', granted: false, method: 'WhatsApp reply STOP', by: 'Client (WhatsApp)' }, 'CS'); action = 'Marketing consent withdrawn'; }
    else if (b && ['CONFIRM', 'YES', '1', 'OK'].includes(w)) { S.update('bookings', b.id, { status: 'Confirmed', clientConfirmedAt: now() }); action = 'Booking ' + b.id + ' confirmed by client'; }
    else if (b && ['CANCEL', '2'].includes(w)) { S.update('bookings', b.id, { status: 'Cancellation requested' }); action = 'Cancellation requested for ' + b.id; }
    else if (b && ['CHANGE', 'RESCHEDULE', '3'].includes(w)) { S.update('bookings', b.id, { status: 'Change requested' }); action = 'Change requested for ' + b.id; }
    const r = S.add('wa-inbox', { phone: k, text: t, bookingId: b ? b.id : '', action, read: false, at: now() }, 'WI');
    S.add('comm-log', { phone: k, channel: 'WhatsApp', label: 'Client reply', template: 'inbound', bookingId: b ? b.id : '', text: t, status: 'Received · ' + action, by: 'Client' }, 'CM');
    return { ok: true, action, reply: r };
  }
  window.SOTWA = { TEMPLATES, cfg, setCfg, tpl, compose, link, consent, send, onStatusChange, due, runAutomations, inbound, norm };
})();
