// Sense of Touch CRM — shared business logic (identity, engine, analytics). Browser-only prototype data via window.SOT.
(function () {
  const ROLE_LIST = ['Founder / Super Admin', 'General Manager', 'Spa Manager', 'Receptionist', 'Therapist', 'Store Manager', 'Marketing Manager', 'Finance Officer', 'Content Editor'];
  const SOURCES = ['Website', 'WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Phone call', 'Walk-in', 'Referral', 'Corporate', 'Events & promotions', 'Other'];
  const LEAD_STATUSES = ['New', 'Contacted', 'Interested', 'Consultation Requested', 'Booking Pending', 'Converted', 'Lost', 'Archived'];
  const PREFS = [['wa', 'WhatsApp', 'Service messages'], ['sms', 'SMS', 'Service messages'], ['em', 'Email', 'Service messages'], ['mkt', 'Marketing', 'Offers & campaigns'], ['bd', 'Birthday messages', 'Greeting on their birthday']];
  const TEMPLATES = [
    { id: 'confirm', label: 'Booking confirmation', need: 'wa', text: 'Hello {first}, your {service} at Sense of Touch is confirmed for {date} at {time}. Reply here if you need to change it.' },
    { id: 'reminder', label: 'Appointment reminder', need: 'wa', text: 'Hello {first}, a reminder of your {service} at Sense of Touch on {date} at {time}. Reply to confirm.' },
    { id: 'aftercare', label: 'Aftercare check-in', need: 'wa', text: 'Hello {first}, thank you for visiting Sense of Touch. How are you feeling after your {service}?' },
    { id: 'feedback', label: 'Feedback invitation', need: 'wa', text: 'Hello {first}, we would love to hear how your {service} went. A few words help us care for you better.' },
    { id: 'reengage', label: 'We miss you', need: 'mkt', text: 'Hello {first}, it has been a while since your last visit to Sense of Touch. Would you like us to find you a time?' },
    { id: 'birthday', label: 'Birthday greeting', need: 'bd', text: 'Happy birthday, {first}! Warm wishes from all of us at Sense of Touch.' }
  ];
  const RULES = [
    { id: 'welcome', trigger: 'New client registered', cond: 'First seen in the last 14 days', action: 'Create welcome follow-up task (Receptionist)', param: 'Due after (days)', days: 1 },
    { id: 'confirm', trigger: 'Booking confirmed', cond: 'Appointment ahead · client has a contact channel', action: 'Create “send confirmation” task with template', param: 'Due after (days)', days: 0 },
    { id: 'aftercare', trigger: 'Appointment completed', cond: 'Completed in the last 14 days', action: 'Create aftercare follow-up task (Therapist)', param: 'Days after visit', days: 2 },
    { id: 'feedback', trigger: 'Feedback recorded', cond: 'Any rating', action: 'Notify General Manager (task)', param: 'Due after (days)', days: 0 },
    { id: 'enquiry', trigger: 'Enquiry unanswered', cond: 'Lead still “New” after N days', action: 'Create reply task for assigned staff', param: 'Days unanswered', days: 1 },
    { id: 'reengage', trigger: 'Inactivity threshold', cond: 'No visit in N days, nothing booked, marketing consent', action: 'Create re-engagement task (Marketing)', param: 'Inactive after (days)', days: 90 },
    { id: 'birthday', trigger: 'Birthday approaching', cond: 'Birthday supplied + birthday-message consent', action: 'Create birthday greeting task', param: 'Days ahead', days: 7 }
  ];
  const DAY = 864e5;
  const nameKey = n => String(n || '').toLowerCase().replace(/[^a-z]/g, '');

  function model() {
    const S = window.SOT;
    const amap = {}; S.list('client-aliases').forEach(a => { amap[a.from] = a.to; });
    const norm = p => { let k = S.ghPhone(p) || String(p || '').trim(), g = 0; while (amap[k] && g++ < 5) k = amap[k]; return k; };
    const shop = S.shopDb(), orders = Array.isArray(shop.orders) ? shop.orders : [], products = Array.isArray(shop.products) ? shop.products : [];
    const pcat = {}; products.forEach(p => { pcat[p.id] = p.cat; });
    const consents = S.list('consents'), bk = S.list('bookings'), cn = S.list('consultations'), gc = S.list('giftcards'), recs = S.list('clients'), refs = S.list('referrals'), rw = S.list('rewards'), leads = S.list('leads');
    const today = S.localDate();
    const byTime = (a, b) => (a.date + String(a.time).padStart(5, '0')).localeCompare(b.date + String(b.time).padStart(5, '0'));
    const M = {};
    const touch = (p, name, email, created, src, act) => { const k = norm(p); if (!k) return null; const c = M[k] || (M[k] = { phone: k, name: '', email: '', created: '', act: '', src: [], aliases: [] }); if (!c.name && name) c.name = name; if (!c.email && email) c.email = email; if (created && (!c.created || created < c.created)) c.created = created; if (act && act > c.act) c.act = act; if (src && !c.src.includes(src)) c.src.push(src); return c; };
    bk.forEach(b => touch(b.phone, b.name, b.email, b.created, 'Bookings', b.date));
    cn.forEach(c => touch(c.phone, c.name, c.email, c.created, 'Consultation', (c.created || '').slice(0, 10)));
    orders.forEach(o => o.customer && touch(o.customer.phone, o.customer.name, o.customer.email, o.created, 'Shop', (o.created || '').slice(0, 10)));
    gc.forEach(g => touch(g.buyerPhone, g.from, '', g.created, 'Gift cards', (g.created || '').slice(0, 10)));
    leads.filter(l => l.clientPhone).forEach(l => touch(l.clientPhone, l.name, l.email, l.created, 'Lead', ''));
    recs.forEach(r => { const c = touch(r.phone, r.name, r.email, r.created, 'CRM', ''); if (!c) return; if (r.phone === c.phone) { c.rec = r; c.name = r.name || c.name; c.email = r.email || c.email; } else if (!c.aliases.includes(r.phone)) c.aliases.push(r.phone); });
    Object.keys(amap).forEach(from => { const c = M[norm(from)]; if (c && !c.aliases.includes(from)) c.aliases.push(from); });
    const firstDone = {};
    const all = Object.values(M).map(c => {
      const k = c.phone, rec = c.rec || {};
      const mine = bk.filter(b => norm(b.phone) === k).sort(byTime);
      const done = mine.filter(b => b.status === 'Completed'), up = mine.filter(b => b.date >= today && ['Requested', 'Confirmed', 'Change requested'].includes(b.status));
      if (done[0]) firstDone[k] = done[0].id;
      const myOrders = orders.filter(o => o.customer && norm(o.customer.phone) === k).sort((a, b) => (b.created || '').localeCompare(a.created || ''));
      const verified = myOrders.filter(o => o.payment === 'Verified' && !/Cancel|Refund/.test(o.status));
      const myGc = gc.filter(g => norm(g.buyerPhone) === k), paidGc = myGc.filter(g => /Paid|Redeemed/.test(g.status));
      const brands = new Set(); verified.forEach(o => (o.items || []).forEach(i => brands.add(pcat[i.pid] || 'other')));
      const rws = rw.filter(r => norm(r.phone) === k);
      const points = done.length * 10 + rws.reduce((n, r) => n + (r.points || 0), 0);
      const lastCons = {}; consents.filter(x => norm(x.phone) === k).slice().reverse().forEach(x => { lastCons[x.key] = x.granted ? 1 : 0; });
      const derived = rec.prefs ? {} : { wa: mine.length || myOrders.length ? 1 : 0, ...lastCons };
      return { ...c, rec, name: c.name || 'Unnamed client', source: rec.source || (c.src.includes('Shop') ? 'Website' : c.src.includes('Bookings') ? 'Website' : ''), status: rec.status || 'Active', prefs: { wa: 0, sms: 0, em: 0, mkt: 0, bd: 0, ...derived, ...(rec.prefs || {}) }, tags: rec.tags || [], mine, done, up, last: done.length ? done[done.length - 1].date : '', orders: myOrders, verified, gifts: myGc, spend: verified.reduce((n, o) => n + (o.total || 0), 0) + paidGc.reduce((n, g) => n + (g.amount || 0), 0), purchasers: verified.length + paidGc.length, brands, rewards: rws, points, referred: refs.filter(r => norm(r.referrer) === k) };
    });
    return { S, norm, bk, cn, gc, recs, orders, refs, leads, pcat, M, all, today, firstDone, byTime };
  }

  const fill = (t, c, b) => { const S = window.SOT; return t.replace(/\{first\}/g, (c.name || '').split(' ')[0]).replace(/\{service\}/g, b ? b.service : 'treatment').replace(/\{date\}/g, b ? S.fmtDate(b.date) : '').replace(/\{time\}/g, b ? b.time : ''); };
  const templates = () => { const saved = window.SOT.list('crm-templates'); return TEMPLATES.map(t => ({ ...t, ...(saved.find(x => x.id === t.id) || {}) })); };
  const rules = () => { const saved = window.SOT.list('crm-rules'); return RULES.map(r => ({ ...r, on: true, ...(saved.find(x => x.id === r.id) || {}) })); };
  const nextBirthday = (bd, today) => { const m = /^(\d{1,2})\/(\d{1,2})$/.exec(bd || ''); if (!m) return ''; const t = new Date(today + 'T00:00'); let d = new Date(t.getFullYear(), +m[2] - 1, +m[1]); if (d < t) d = new Date(t.getFullYear() + 1, +m[2] - 1, +m[1]); return window.SOT.localDate(d); };

  // Automation engine: idempotent — every event has a unique key recorded in crm-runs, so re-processing never duplicates.
  function runEngine() {
    const S = window.SOT; if (!S) return 0;
    const m = model(), { all, leads, today, bk } = m;
    const plus = (d, n) => S.localDate(new Date(new Date(d + 'T00:00').getTime() + n * DAY));
    const minus = n => S.localDate(new Date(Date.now() - n * DAY));
    let made = 0;
    S.list('enquiries').forEach(e => {
      if (leads.some(l => l.enquiryId === e.id)) return;
      const ph = S.ghPhone(e.reach) || '', em = S.email(e.reach) ? e.reach : '';
      S.add('leads', { enquiryId: e.id, demo: !!e.demo, name: e.name, org: e.org || '', phone: ph, email: em, source: /Corporate/.test(e.type) ? 'Corporate' : 'Website', service: e.type, status: 'New', assignee: 'Receptionist', next: today, notes: [e.message, e.date ? 'Date: ' + e.date : '', e.guests ? e.guests + ' guests' : ''].filter(Boolean).join(' · '), history: [{ s: 'New', at: e.created || new Date().toISOString(), by: 'Website form' }] }, 'LD');
      made++;
    });
    const runs = S.list('crm-runs'), seen = new Set(runs.map(r => r.key));
    const fire = (rule, key, demo, task, skip) => {
      if (seen.has(key)) return; seen.add(key); made++;
      if (skip) { S.add('crm-runs', { rule, key, demo, result: 'Skipped — ' + skip }, 'RN'); return; }
      S.add('tasks', { ...task, auto: rule, key, demo, status: 'Open' }, 'TK');
      S.add('crm-runs', { rule, key, demo, result: 'Task created — ' + task.title }, 'RN');
    };
    const live = all.filter(c => c.status !== 'Archived');
    const isDemo = c => !!(c.rec.demo || c.mine.some(b => b.demo));
    rules().filter(r => r.on).forEach(r => {
      const d = Number(r.days) || 0;
      if (r.id === 'welcome') live.filter(c => c.created && c.created.slice(0, 10) >= minus(14)).forEach(c => fire(r.id, 'welcome:' + c.phone, isDemo(c), { title: 'Welcome ' + c.name + ' — check their first visit is booked', kind: 'Welcome', phone: c.phone, due: plus(today, d), assignee: 'Receptionist' }));
      if (r.id === 'confirm') bk.filter(b => b.status === 'Confirmed' && b.date >= today).forEach(b => { const c = m.M[m.norm(b.phone)]; const cc = c && all.find(x => x.phone === c.phone); const ok = cc && (cc.prefs.wa || cc.prefs.sms || cc.prefs.em); fire(r.id, 'confirm:' + b.id, !!b.demo, { title: 'Send booking confirmation — ' + b.service, kind: 'Confirmation', phone: cc ? cc.phone : '', bookingId: b.id, tpl: 'confirm', due: plus(today, d), assignee: 'Receptionist' }, ok ? '' : 'no contact channel consent for ' + b.name); });
      if (r.id === 'aftercare') bk.filter(b => b.status === 'Completed' && b.date >= minus(14) && b.date <= today).forEach(b => fire(r.id, 'after:' + b.id, !!b.demo, { title: 'Aftercare check-in after ' + b.service, kind: 'Aftercare', phone: m.norm(b.phone), bookingId: b.id, tpl: 'aftercare', due: plus(b.date, d), assignee: 'Therapist' }));
      if (r.id === 'feedback') S.list('feedback').forEach(f => fire(r.id, 'fb:' + f.id, !!f.demo, { title: 'Review new feedback (' + f.rating + '★)', kind: 'Feedback', phone: f.phone, due: plus(today, d), assignee: 'General Manager' }));
      if (r.id === 'enquiry') leads.filter(l => l.status === 'New' && (l.created || '').slice(0, 10) <= minus(d)).forEach(l => fire(r.id, 'lead:' + l.id, !!l.demo, { title: 'Reply to enquiry — ' + l.name, kind: 'Enquiry', leadId: l.id, phone: l.phone, due: today, assignee: l.assignee || 'Receptionist' }));
      if (r.id === 'reengage') live.filter(c => c.last && c.last < minus(d) && !c.up.length).forEach(c => fire(r.id, 'reengage:' + c.phone + ':' + c.last, isDemo(c), { title: 'Re-engage ' + c.name + ' (last visit ' + S.fmtDate(c.last) + ')', kind: 'Re-engagement', phone: c.phone, tpl: 'reengage', due: today, assignee: 'Marketing Manager' }, c.prefs.mkt ? '' : 'no marketing consent from ' + c.name));
      if (r.id === 'birthday') live.forEach(c => { const nb = nextBirthday(c.rec.birthday, today); if (!nb || nb > plus(today, d)) return; fire(r.id, 'bday:' + c.phone + ':' + nb.slice(0, 4), isDemo(c), { title: 'Birthday greeting — ' + c.name + ' (' + S.fmtDate(nb) + ')', kind: 'Birthday', phone: c.phone, tpl: 'birthday', due: nb, assignee: 'Receptionist' }, c.prefs.bd ? '' : 'no birthday-message consent from ' + c.name); });
    });
    return made;
  }

  window.SOTCRM = { ROLE_LIST, SOURCES, LEAD_STATUSES, PREFS, TEMPLATES, RULES, model, runEngine, fill, templates, rules, nextBirthday, nameKey, DAY };
})();
