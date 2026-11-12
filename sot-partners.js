// Sense of Touch — sponsor, organisation and institution partnership enquiries.
(function () {
  if (window.SOTPartners) return;
  const S = window.SOT; if (!S) { console.warn('sot-partners.js needs sot-store.js first'); return; }
  const AUDIENCES = ['Sponsor', 'Organisation', 'Institution'];
  const INTERESTS = {
    Sponsor: ['Institute scholarship fund', 'Events & workshops', 'Graduation & awards', 'Product collaboration', 'Community wellness days', 'Content & media'],
    Organisation: ['Staff wellness programme', 'Wellness days on site', 'Team training', 'Client & staff gifting', 'Membership for staff', 'Event pampering'],
    Institution: ['Training partnership', 'Student placements & internships', 'Skills programmes for women & youth', 'Curriculum & accreditation', 'Health & safety research', 'Hospitality & tourism partnership']
  };
  const TIERS = ['Founding partner', 'Gold', 'Silver', 'Community', 'Not sure yet'];
  const BUDGETS = ['Under GHS 10,000', 'GHS 10,000 – 50,000', 'GHS 50,000 – 150,000', 'Over GHS 150,000', 'In-kind', 'To discuss'];
  const STATUSES = ['New', 'In discussion', 'Proposal sent', 'Agreed', 'Declined'];
  const list = () => S.list('partner-requests');
  function validate(d) {
    const e = {};
    if (!AUDIENCES.includes(d.audience)) e.audience = 'Choose who you are.';
    if (String(d.org || '').trim().length < 2) e.org = 'Enter your organisation’s name.';
    if (String(d.name || '').trim().length < 2) e.name = 'Enter your full name.';
    if (!S.email(d.email)) e.email = 'Enter a valid email address.';
    if (d.phone && !S.ghPhone(d.phone) && !/^\+\d{8,15}$/.test(String(d.phone).replace(/[\s\-()]/g, ''))) e.phone = 'Enter a valid phone number, with country code if outside Ghana.';
    if (!(d.interests || []).length) e.interests = 'Choose at least one area.';
    if (String(d.message || '').trim().length < 20) e.message = 'Tell us a little about what you have in mind (a sentence or two).';
    if (!d.consent) e.consent = 'Please agree so we can respond.';
    return e;
  }
  function submit(d) {
    const e = validate(d); if (Object.keys(e).length) return { errors: e };
    const email = d.email.trim().toLowerCase();
    if (list().some(r => r.email === email && r.audience === d.audience && ['New', 'In discussion'].includes(r.status))) return { errors: { email: 'We already have an open enquiry from this email. We’ll be in touch soon.' } };
    const r = S.add('partner-requests', { audience: d.audience, org: d.org.trim(), name: d.name.trim(), role: (d.role || '').trim(), email, phone: d.phone ? (S.ghPhone(d.phone) || d.phone.trim()) : '', sector: (d.sector || '').trim(), interests: d.interests, tier: d.tier || '', budget: d.budget || '', timing: (d.timing || '').trim(), message: d.message.trim(), prospectus: !!d.prospectus, status: 'New', notes: [], history: [{ at: new Date().toISOString(), status: 'New' }] }, 'PTR');
    S.add('inbox', { kind: d.audience + ' enquiry', name: r.name, email: r.email, phone: r.phone, message: r.org + ' — ' + r.interests.join(', ') + ' — ' + r.message, status: 'New' }, 'IN');
    return { ok: true, req: r };
  }
  function setStatus(id, status, by) { const r = list().find(x => x.id === id); if (!r) return; S.update('partner-requests', id, { status, history: [...(r.history || []), { at: new Date().toISOString(), status, by }] }); }
  function addNote(id, text, by) { const r = list().find(x => x.id === id); if (!r || !String(text || '').trim()) return; S.update('partner-requests', id, { notes: [...(r.notes || []), { at: new Date().toISOString(), by, text: text.trim() }] }); }
  window.SOTPartners = { AUDIENCES, INTERESTS, TIERS, BUDGETS, STATUSES, list, validate, submit, setStatus, addNote };
})();
