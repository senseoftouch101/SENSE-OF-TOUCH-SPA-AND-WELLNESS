// Sense of Touch Institute of Beauty & Wellness — shared data, workflow and permission layer.
// Prototype: browser storage through window.SOT (sot-store.js). Production: Supabase tables with row-level
// security, server-side role checks, and payment verification from Paystack / Hubtel webhooks only.
(function () {
  if (window.ACAD) return;
  const S = window.SOT; if (!S) { console.warn('academy-core.js needs sot-store.js first'); return; }
  const kk = n => 'acad-' + n;
  const list = n => S.list(kk(n)), save = (n, a) => S.save(kk(n), a);
  const now = () => new Date().toISOString(), today = () => S.localDate();
  const AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rnd = (n = 5) => Array.from({ length: n }, () => AL[Math.floor(Math.random() * AL.length)]).join('');
  const add = (n, rec) => { const r = { created: now(), ...rec }; save(n, [r, ...list(n)]); return r; };
  const upd = (n, id, p) => save(n, list(n).map(r => r.id === id ? { ...r, ...p, updated: now() } : r));
  const get = (n, id) => list(n).find(r => r.id === id);

  const DEPTS = [
    ['massage', 'Massage Therapy', 'Swedish massage, relaxation techniques, body massage'],
    ['wood', 'Wood Therapy', 'Wood therapy techniques and practical training'],
    ['facial', 'Facial & Skincare', 'Facial treatments, skincare routines, skin analysis'],
    ['body', 'Body Therapy', 'Body treatments and wellness techniques'],
    ['scalp', 'Scalp & Hair Therapy', 'Scalp care and hair wellness'],
    ['waxing', 'Waxing', 'Professional waxing techniques'],
    ['lip', 'Lip Care & Beauty', 'Lip care and beauty treatments'],
    ['business', 'Spa Business Management', 'Spa operations, customer service, business development'],
    ['entre', 'Entrepreneurship', 'Starting and managing a beauty or wellness business'],
    ['product', 'Product Development', 'Beauty product business fundamentals and product knowledge']
  ].map(([id, name, areas]) => ({ id, name, areas }));
  const PRODUCTS = [['Short introductory course', ''], ['Professional certificate programme', 'Subject to appropriate recognition — currently an internal Institute certificate.'], ['Advanced specialist workshop', 'For practising professionals.'], ['Online self-paced course', ''], ['Corporate training', 'Delivered for organisations; booked through Corporate enquiries.'], ['Train-the-trainer programme', 'Subject to suitable qualifications and approval by the Institute Director.']].map(([name, note]) => ({ name, note }));
  const LEVELS = ['Beginner', 'Some experience', 'Experienced beauty professional'];
  const MODES = ['In-person', 'Live online', 'Self-paced online', 'Hybrid', 'Workshop', 'Intensive practical'];
  const APP_STATUSES = ['Draft', 'Submitted', 'Under review', 'Additional information required', 'Interview required', 'Accepted', 'Waitlisted', 'Declined', 'Offer accepted', 'Enrolled', 'Withdrawn'];
  const PIPELINE = ['New enquiry', 'Contacted', 'Interested', 'Application started', 'Application submitted', 'Under review', 'Accepted', 'Enrolled', 'Lost'];
  const LEAD_SOURCES = ['Website', 'Social media', 'Referrals', 'Walk-ins', 'Events', 'Advertising', 'Partnerships'];
  const ATT = ['Present', 'Absent', 'Late', 'Excused', 'Not recorded'];
  const PAY_METHODS = ['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money', 'Card (Paystack)', 'Card (Hubtel)', 'Bank transfer', 'Cash at reception'];
  const PERMS = {
    'courses.edit': 'Create, edit, publish and archive courses', 'apps.review': 'Review applications and admissions', 'students.view': 'View student records', 'students.export': 'Export student data',
    'cohorts.manage': 'Manage cohorts, classes and schedules', 'attendance.mark': 'Mark and correct attendance', 'grades.record': 'Grade assignments and quizzes', 'practical.record': 'Record practical competency',
    'certs.issue': 'Confirm completion and issue certificates', 'certs.revoke': 'Revoke or correct certificates', 'finance.view': 'View tuition and payments', 'finance.verify': 'Verify payments and refunds',
    'comms.send': 'Send student communications', 'support.manage': 'Handle student support requests', 'settings.manage': 'Institute settings and integrations', 'audit.view': 'View audit log'
  };
  const ALLP = Object.keys(PERMS);
  const ROLES = {
    'Founder / Super Administrator': ALLP,
    'Institute Director': ALLP.filter(p => p !== 'settings.manage'),
    'Admissions Officer': ['apps.review', 'students.view', 'comms.send'],
    'Academic Coordinator': ['courses.edit', 'cohorts.manage', 'students.view', 'attendance.mark', 'grades.record', 'certs.issue', 'comms.send'],
    'Instructor': ['attendance.mark', 'grades.record', 'practical.record'],
    'Finance Officer': ['finance.view', 'finance.verify', 'students.view'],
    'Student Support Officer': ['students.view', 'support.manage', 'comms.send'],
    'Registrar': ['apps.review', 'students.view', 'students.export', 'cohorts.manage', 'comms.send'],
    'Auditor (read-only)': ['students.view', 'finance.view', 'audit.view'],
    'Student': [], 'Alumni': []
  };
  const ROLE_NOTES = { 'Instructor': 'Own assigned courses and their enrolled students only.', 'Student': 'Own records in the student portal only.', 'Alumni': 'Own profile, certificates and alumni announcements.' };

  // ── Curriculum (proposed — content, trainer qualifications, safety requirements and any accreditation to be verified before publication)
  const Q_FOUND = [
    { q: 'When should a client consultation take place?', o: ['Before every treatment', 'Only on the first visit', 'Only if the client asks', 'After the treatment'], a: 0 },
    { q: 'A client mentions a condition you are unsure about. What do you do?', o: ['Proceed gently', 'Pause and ask for medical clearance before treating', 'Ignore it', 'Ask another client'], a: 1 },
    { q: 'Tools that touch the skin should be…', o: ['Cleaned, disinfected or disposed of after every client', 'Cleaned weekly', 'Reused if they look clean', 'Shared between clients'], a: 0 },
    { q: 'Client consent should be…', o: ['Recorded, and can be withdrawn at any time', 'Assumed once they book', 'Only needed for new clients', 'Not required for regulars'], a: 0 }
  ];
  const Q_BUS = [
    { q: 'Which records should a spa keep for each client?', o: ['Consultation notes, consent and treatment history', 'Only payment receipts', 'Social media handles', 'Nothing'], a: 0 },
    { q: 'A sound starting point for pricing a new service is…', o: ['Product cost, time and overheads plus margin', 'The cheapest competitor’s price', 'A round number', 'Whatever clients suggest'], a: 0 },
    { q: 'Client personal data in Ghana should be…', o: ['Collected with consent and kept secure (Data Protection Act, 2012)', 'Shared with partners freely', 'Posted publicly', 'Kept on paper only'], a: 0 }
  ];
  const M = (title, ...ls) => ({ title, lessons: ls.map(s => { const [t, type] = s.split('|'); return { title: t, type: type || 'text' }; }) });
  const FOUND = M('Professional foundations', 'Hygiene, sanitation and safe practice|text', 'Client consultation and consent|video', 'Contraindications and referral|pdf', 'Foundations knowledge check|quiz');
  const BUSF = M('Business foundations', 'The beauty and wellness market in Ghana|text', 'Customer experience standards|video', 'Records, consent and data protection|pdf', 'Business knowledge check|quiz');
  const C = (code, dept, title, modes, summary, objectives, mods, practical, extra = {}) => ({
    code, dept, title, modes, summary, objectives, practical, product: PROD[code] || 'Short introductory course', requiresId: false, level: /Advanced/.test(PROD[code] || '') ? 'Experienced beauty professional' : 'Beginner',
    modules: mods, theoryFirst: modes.includes('Hybrid'),
    assignment: extra.assignment || { title: 'Client consultation case study', brief: 'Write up a full consultation for a practice client: needs, contraindication screening, treatment plan and aftercare advice.', pass: 50 },
    checklist: practical ? (extra.checklist || []).map(([label, supervised], i) => ({ id: 'pr' + (i + 1), label, supervised })) : [],
    req: { lessons: true, quiz: 70, assignment: true, attendance: modes.some(m => /In-person|Hybrid|Live|Workshop|Intensive/.test(m)) ? 80 : null, practical: practical, balance: true },
    entry: 'Proposed: open to beginners aged 18 and over. Final entry requirements to be confirmed by the Institute Director.',
    location: modes.every(m => /online/i.test(m)) ? 'Online' : 'Sense of Touch, Community 25 Estate Junction, Tema',
    ...(({ checklist, assignment, ...rest }) => rest)(extra)
  });
  const PROD = {"MT-101":"Professional certificate programme","WT-110":"Advanced specialist workshop","FS-120":"Professional certificate programme","BT-130":"Professional certificate programme","SH-140":"Short introductory course","WX-150":"Advanced specialist workshop","LC-160":"Short introductory course","SB-200":"Online self-paced course","EN-210":"Online self-paced course","PD-220":"Short introductory course"};
  const COURSES = [
    C('MT-101', 'massage', 'Swedish Massage Foundations', ['Hybrid'], 'The core strokes, sequencing and client care of Swedish massage — online theory first, then supervised practice in the treatment room.', ['Carry out a safe, consented client consultation', 'Perform a full-body Swedish sequence', 'Adapt pressure and positioning to the client', 'Give clear aftercare advice'],
      [FOUND, M('The body for therapists', 'Muscles and movement basics|text', 'Posture, draping and positioning|video', 'Body systems knowledge check|quiz'), M('Swedish technique', 'Effleurage and petrissage|video', 'Friction, tapotement and vibration|video', 'Building a 60-minute sequence|practical'), M('Supervised practice', 'Practical session preparation|text', 'Self-care and body mechanics for therapists|video')], true,
      { checklist: [['Room, linen and hygiene set-up', true], ['Consultation and consent recorded', true], ['Effleurage and petrissage sequence (video may be submitted for feedback)', false], ['Full-body sequence on a client under supervision', true], ['Aftercare advice', true]] }),
    C('WT-110', 'wood', 'Wood Therapy Techniques', ['Intensive practical', 'In-person'], 'Hands-on training in wood therapy tools, body contouring sequences and safe pressure.', ['Identify and maintain wood therapy tools', 'Perform sequences safely on each body area', 'Recognise when wood therapy is not suitable'],
      [FOUND, M('Tools and technique', 'The tools and their uses|video', 'Pressure, direction and safety|text', 'Wood therapy knowledge check|quiz'), M('Practical sequences', 'Abdomen and waist sequence|practical', 'Legs and glutes sequence|practical')], true,
      { checklist: [['Tool cleaning and care', true], ['Abdomen sequence under supervision', true], ['Legs and glutes sequence under supervision', true]] }),
    C('FS-120', 'facial', 'Facial & Skincare Fundamentals', ['Hybrid'], 'Skin analysis, facial treatment steps and building a skincare routine for different skin types.', ['Analyse skin type and condition', 'Perform a classic facial', 'Recommend a home skincare routine'],
      [FOUND, M('Skin science', 'Skin structure and types|text', 'Skin analysis in practice|video', 'Skin knowledge check|quiz'), M('The facial', 'Cleanse, exfoliate and steam|video', 'Masks and massage|video', 'Classic facial demonstration|practical')], true,
      { checklist: [['Skin analysis record', true], ['Classic facial under supervision', true], ['Home-care recommendation', false]] }),
    C('BT-130', 'body', 'Body Therapy Essentials', ['In-person'], 'Body scrubs, wraps and wellness treatments delivered to a professional spa standard.', ['Prepare and deliver body scrubs and wraps', 'Manage client comfort and privacy', 'Recommend aftercare'],
      [FOUND, M('Body treatments', 'Scrubs and exfoliation|video', 'Wraps and masks|video', 'Body treatment knowledge check|quiz', 'Full body treatment|practical')], true,
      { checklist: [['Treatment room and privacy set-up', true], ['Scrub and wrap under supervision', true]] }),
    C('SH-140', 'scalp', 'Scalp Care & Hair Wellness', ['Workshop'], 'A focused workshop on scalp analysis, scalp massage and hair wellness routines.', ['Assess scalp condition', 'Deliver a relaxing scalp massage', 'Advise on scalp care routines'],
      [FOUND, M('Scalp care', 'Scalp analysis|text', 'Scalp massage technique|video', 'Scalp care knowledge check|quiz')], true,
      { checklist: [['Scalp massage under supervision', true]] }),
    C('WX-150', 'waxing', 'Professional Waxing', ['In-person', 'Intensive practical'], 'Safe, hygienic waxing technique with hard and soft wax across body areas.', ['Choose the right wax for the area', 'Wax safely and hygienically', 'Manage sensitivity and aftercare'],
      [FOUND, M('Waxing technique', 'Hard and soft wax|text', 'Temperature, application and removal|video', 'Waxing knowledge check|quiz', 'Waxing practice|practical')], true,
      { checklist: [['Patch test and consultation', true], ['Legs and underarm waxing under supervision', true]] }),
    C('LC-160', 'lip', 'Lip Care & Beauty', ['Workshop'], 'Lip care treatments in the style of The Lip Bar — exfoliation, hydration and treatment routines.', ['Assess lip condition', 'Deliver a lip care treatment', 'Recommend lip care products and routines'],
      [FOUND, M('Lip care', 'Lip anatomy and conditions|text', 'The lip care treatment|video', 'Lip care knowledge check|quiz')], true,
      { checklist: [['Lip care treatment under supervision', true]] }),
    C('SB-200', 'business', 'Spa Business & Customer Service', ['Self-paced online', 'Live online'], 'Spa operations, front-desk standards, customer service and growing repeat business.', ['Run a professional client journey', 'Handle bookings, complaints and feedback', 'Understand key spa business numbers'],
      [BUSF, M('Operations', 'Bookings, reception and scheduling|video', 'Handling complaints well|text', 'Operations knowledge check|quiz')], false,
      { assignment: { title: 'Client journey plan', brief: 'Map the client journey for a spa of your choice — from first enquiry to rebooking — and identify three improvements.', pass: 50 } }),
    C('EN-210', 'entre', 'Starting a Beauty & Wellness Business', ['Self-paced online'], 'From idea to opening: planning, pricing, registration and marketing a beauty or wellness business.', ['Write a simple business plan', 'Price services sustainably', 'Plan your first marketing'],
      [BUSF, M('Planning', 'Business models in beauty and wellness|text', 'Pricing and costs|pdf', 'Marketing your first 90 days|video')], false,
      { assignment: { title: 'One-page business plan', brief: 'Submit a one-page plan: services, target clients, pricing, start-up costs and first marketing steps.', pass: 50 } }),
    C('PD-220', 'product', 'Beauty Product Business Fundamentals', ['Live online'], 'Product knowledge and the business basics of a beauty product line, with reference to AFTERCARE.', ['Understand ingredients and product categories', 'Plan a small product range', 'Understand labelling and quality basics'],
      [BUSF, M('Product knowledge', 'Ingredients and categories|text', 'Labelling and quality basics|pdf', 'Product knowledge check|quiz')], false,
      { assignment: { title: 'Product range outline', brief: 'Outline a three-product range: purpose, target client, key ingredients and price point.', pass: 50 } })
  ];
  COURSES.push(
    C('CT-300', 'business', 'Corporate Wellness & Customer Care Training', ['Workshop', 'Live online'], 'Customised sessions for organisations: customer care standards, workplace wellbeing and stress-relief techniques for teams.', ['Apply service standards with customers', 'Practise simple workplace wellbeing techniques'], [BUSF, M('Customised content', 'Agreed with each organisation|text')], false, { product: 'Corporate training', assignment: { title: 'Team action plan', brief: 'Agree three service or wellbeing actions for your team.', pass: 50 } }),
    C('TT-400', 'business', 'Train-the-Trainer', ['Hybrid'], 'For experienced therapists preparing to teach: session planning, demonstration, supervision and fair assessment.', ['Plan and deliver a practical lesson', 'Supervise and assess safely and fairly'], [FOUND, M('Teaching practice', 'Planning a practical lesson|text', 'Demonstrating and supervising|video', 'Fair assessment|pdf', 'Teaching knowledge check|quiz')], true, { product: 'Train-the-trainer programme', requiresId: true, level: 'Experienced beauty professional', checklist: [['Deliver a supervised practical lesson', true], ['Assess a learner against a checklist', true]] })
  );
  const DRAFTS = ['CT-300', 'TT-400'];
  const buildCourse = c => {
    const id = 'crs-' + c.code.toLowerCase();
    return { id, ...c, modules: c.modules.map((m, i) => ({ id: `${id}-m${i + 1}`, title: m.title, lessons: m.lessons.map((l, j) => ({ id: `${id}-m${i + 1}-l${j + 1}`, ...l, ...(l.type === 'quiz' ? { questions: /business|entre|product/.test(c.dept) ? Q_BUS : Q_FOUND, pass: 70, attempts: 3 } : {}) })) })),
      fee: null, regFee: null, duration: '', classSize: null, instructorId: 'INS-WOSE', status: DRAFTS.includes(c.code) ? 'Draft' : 'Published', proposed: true, verified: false,
      certKind: c.practical ? 'Certificate of completion — theory and supervised practical' : 'Certificate of completion — theory' };
  };
  const INSTRUCTORS = [{ id: 'INS-WOSE', name: 'Woselande Carmelle Theus', email: 'senseoftouch101@gmail.com', title: 'Founder · Lead therapist', bio: 'Founder and lead therapist of Sense of Touch Spa & Wellness, The Lip Bar and AFTERCARE.', photo: 'assets/web/founder-web.jpg', active: true }];
  const SETTINGS = {
    org: 'Sense of Touch Institute of Beauty & Wellness', signatory: 'Woselande Carmelle Theus, Founder', certPrefix: 'SOT-AC', retention: { appMonths: 24 }, autoIssue: false, scholarships: false, accreditation: '', appFee: null, fx: { USD: null, GBP: null }, notice: '',
    integrations: { 'Paystack (cards, MoMo)': 'Not connected', 'Hubtel (MoMo, SMS)': 'Not connected', 'Zoom / Google Meet': 'Not connected', 'Email delivery': 'Not connected', 'WhatsApp Business': 'Not connected', 'SMS provider': 'Not connected', 'Secure cloud storage': 'Not connected', 'Video hosting (access-controlled)': 'Not connected', 'Calendar sync': 'Not connected', 'Analytics': 'Not connected', 'Certificate PDF generation': 'Built in (browser print)' }
  };
  function init() {
    if (S.list('acad-init') === '4') return;
    const fresh = COURSES.map(buildCourse), ids = fresh.map(c => c.id);
    save('courses', [...fresh, ...list('courses').filter(c => !ids.includes(c.id))]);
    if (!list('instructors').length) save('instructors', INSTRUCTORS);
    S.save('acad-init', '4');
  }
  const settings = () => ({ ...SETTINGS, ...(S.list('acad-settings-obj')[0] || {}) });
  const setSettings = p => S.save('acad-settings-obj', [{ ...settings(), ...p }]);

  const course = id => get('courses', id);
  const lessonsOf = c => (c ? c.modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id, moduleTitle: m.title }))) : []);
  const cohort = id => get('cohorts', id);
  const enrolments = (sid) => list('enrolments').filter(e => !sid || e.studentId === sid);
  const audit = (who, action, target) => add('audit', { id: 'AUD-' + rnd(6), who: who || 'System', action, target: target || '' });
  const TPL = {
    'Application received': 'Hello {first}, we have received your application to the Sense of Touch Institute of Beauty & Wellness ({course}). Your reference is {ref}.',
    'Application under review': 'Hello {first}, your application {ref} is now being reviewed by our admissions team.',
    'Additional documents requested': 'Hello {first}, we need a little more information to complete your application {ref}. Please reply or update it online.',
    'Interview required': 'Hello {first}, we would like to invite you for a short admissions conversation about {course}.',
    'Admission offer': 'Hello {first}, congratulations — you have been offered a place on {course} ({cohort}). Track your application with reference {ref} to accept and see payment instructions.',
    'Admission rejection': 'Hello {first}, thank you for applying to {course}. We are unable to offer you a place on this intake.',
    'Waitlisted': 'Hello {first}, you are on the waiting list for {course}. We will contact you if a place opens.',
    'Payment received': 'Hello {first}, we have received your payment notice {pref}. Our finance team will confirm it shortly.',
    'Payment confirmation': 'Hello {first}, your payment of GHS {amount} has been verified. Thank you.',
    'Payment reminder': 'Hello {first}, a reminder that GHS {amount} remains outstanding for {course}.',
    'Enrolment confirmation': 'Hello {first}, welcome to {course}! Your student ID is {sid}. Sign in to the student portal to begin.',
    'Class reminder': 'Hello {first}, a reminder of your class “{title}” on {date} at {time}.',
    'Assignment deadline reminder': 'Hello {first}, your assignment for {course} is due soon.',
    'Assessment result': 'Hello {first}, your result for {item} is now available in the student portal.',
    'Course completion': 'Hello {first}, congratulations on completing {course}.',
    'Admission letter': 'Hello {first}, your admission letter for {course} is ready. Open your application with reference {ref} to view and download it.',
    'Orientation reminder': 'Hello {first}, your orientation for {course} is on {date}. Please complete your onboarding in the student portal beforehand.',
    'Event registration': 'Hello {first}, you are registered for {title} on {date}. We look forward to seeing you.',
    'Certificate issued': 'Hello {first}, your certificate {cid} for {course} has been issued. Verify it at the academy certificate page.'
  };
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
  function notify(person, template, vars = {}) {
    const cons = person.consent || { email: 1 };
    const channel = cons.wa && person.phone ? 'WhatsApp' : cons.sms && person.phone ? 'SMS' : person.email ? 'Email' : 'None';
    const text = fill(TPL[template] || template, { first: String(person.name || '').split(' ')[0], ...vars });
    return add('comms', { id: 'MSG-' + rnd(6), to: person.name, address: channel === 'Email' ? person.email : person.phone, channel, template, text, status: channel === 'None' ? 'Not sent — no consented channel' : 'Queued — provider not connected' });
  }
  const internal = (text, role) => add('notices', { id: 'NOT-' + rnd(5), role: role || 'Admissions Officer', text, read: false });

  // ── Applications
  const REQ_FIELDS = [['name', 'Full name'], ['email', 'Email address'], ['phone', 'Phone number'], ['location', 'Residential location'], ['country', 'Country'], ['courseId', 'Preferred course'], ['education', 'Education background'], ['goals', 'Career objectives'], ['statement', 'Applicant statement']];
  function validateApp(d) {
    const e = {};
    REQ_FIELDS.forEach(([f, l]) => { if (!String(d[f] || '').trim()) e[f] = l + ' is required.'; });
    if (d.email && !S.email(d.email)) e.email = 'Enter a valid email address.';
    if (d.phone && !S.ghPhone(d.phone) && !/^\+\d{8,15}$/.test(String(d.phone).replace(/\s/g, ''))) e.phone = 'Enter a Ghana number (e.g. 024 123 4567) or an international number starting with +.';
    if (String(d.statement || '').trim().length > 0 && String(d.statement).trim().length < 40) e.statement = 'Please write at least a few sentences (40+ characters).';
    if (!d.privacy) e.privacy = 'Please acknowledge the privacy notice.';
    if (!d.declaration) e.declaration = 'Please confirm the declaration.';
    const c = course(d.courseId); if (c && c.status !== 'Published') e.courseId = 'This course is not open for applications.';
    if (c && c.requiresId && !d.idDoc) e.idDoc = 'This course requires an identification document.';
    if (d.idDoc && (d.idDoc.size > 5 * 1024 * 1024 || !/\.(pdf|jpe?g|png)$/i.test(d.idDoc.name))) e.idDoc = 'ID must be a PDF, JPG or PNG under 5 MB.';
    if (d.cohortId) { const h = cohort(d.cohortId); if (!h || h.status !== 'Open') e.cohortId = 'This intake is not open for applications.'; }
    (d.docs || []).forEach(f => { if (f.size > 5 * 1024 * 1024) e.docs = 'Each document must be under 5 MB.'; if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) e.docs = 'Documents must be PDF, JPG or PNG.'; });
    return e;
  }
  function submitApplication(d) {
    const errors = validateApp(d); if (Object.keys(errors).length) return { errors };
    const email = d.email.trim().toLowerCase();
    const dup = list('applications').find(a => a.email === email && a.courseId === d.courseId && !['Declined', 'Withdrawn', 'Draft'].includes(a.status));
    if (dup) return { errors: { email: `You already have an active application for this course (${dup.id}). Track it instead of applying again.` }, duplicate: dup.id };
    const c = course(d.courseId), h = d.cohortId ? cohort(d.cohortId) : null;
    const phone = S.ghPhone(d.phone) || String(d.phone).replace(/\s/g, '');
    const app = add('applications', { id: 'APP-' + rnd(6), ...d, email, phone, docs: (d.docs || []).map(f => ({ name: f.name, size: f.size, stored: 'Prototype — file not uploaded; production stores it in private, access-controlled storage' })), idDoc: d.idDoc ? { name: d.idDoc.name, size: d.idDoc.size, stored: 'Private, restricted storage (admissions only)' } : null, courseTitle: c.title, cohortName: h ? h.name : 'Next available intake', status: 'Submitted', history: [{ at: now(), status: 'Submitted', by: 'Applicant' }] });
    linkCrm(app, 'Application submitted');
    notify(app, 'Application received', { course: c.title, ref: app.id });
    internal(`New application ${app.id} · ${app.name} · ${c.title}`);
    return { app };
  }
  function linkCrm(p, stage) {
    // Link to an existing CRM lead/client by phone or email instead of creating a duplicate.
    const leads = S.list('leads');
    const ex = leads.find(l => (p.phone && l.phone === p.phone) || (p.email && l.email && l.email.toLowerCase() === p.email));
    const service = 'Institute · ' + (p.courseTitle || 'Course enquiry');
    if (ex) S.update('leads', ex.id, { academyStage: stage, service: ex.service && !/Institute/.test(ex.service) ? ex.service + ' · ' + service : service });
    else S.add('leads', { name: p.name, phone: p.phone || '', email: p.email || '', source: p.source || 'Website', service, status: 'Interested', assignee: 'Admissions Officer', academyStage: stage, notes: 'Created by the Institute', sample: !!p.sample }, 'LD');
  }
  function enquire(d) {
    if (!String(d.name || '').trim()) return { error: 'Add your name.' };
    const ph = d.phone ? S.ghPhone(d.phone) : '', em = String(d.email || '').trim().toLowerCase();
    if (!ph && !S.email(em)) return { error: 'Add a valid Ghana phone number or email so we can reply.' };
    const c = course(d.courseId);
    const e = add('enquiries', { id: 'ENQ-' + rnd(5), name: d.name.trim(), phone: ph || '', email: em, courseId: d.courseId || '', courseTitle: c ? c.title : 'General', message: d.message || '', source: d.source || 'Website', stage: 'New enquiry' });
    linkCrm(e, 'New enquiry'); internal(`New academy enquiry · ${e.name} · ${e.courseTitle}`);
    return { ok: true, enquiry: e };
  }
  function setAppStatus(id, status, by, note) {
    const a = get('applications', id); if (!a) return { error: 'Application not found.' };
    if (status === 'Enrolled') return { error: 'Enrolment is activated automatically once the required payment is verified.' };
    if (status === 'Offer accepted' && a.status !== 'Accepted') return { error: 'Only an accepted application can accept an offer.' };
    if (status === 'Accepted' && a.cohortId && seatsLeft(a.cohortId) <= 0) return { error: 'This intake is full. Waitlist the applicant or offer another intake.' };
    upd('applications', id, { status, history: [...(a.history || []), { at: now(), status, by, note: note || '' }] });
    audit(by, 'Application → ' + status, id);
    const c = course(a.courseId) || {}, v = { course: c.title, ref: a.id, cohort: a.cohortName };
    const map = { 'Under review': 'Application under review', 'Additional information required': 'Additional documents requested', 'Interview required': 'Interview required', 'Accepted': 'Admission offer', 'Declined': 'Admission rejection', 'Waitlisted': 'Waitlisted' };
    if (map[status]) notify(a, map[status], v);
    linkCrm(a, status === 'Declined' || status === 'Withdrawn' ? 'Lost' : status === 'Accepted' || status === 'Offer accepted' ? 'Accepted' : 'Under review');
    if (status === 'Offer accepted') tryEnrol(id);
    return { ok: true };
  }
  const track = (ref, email) => { const a = get('applications', String(ref || '').trim().toUpperCase()); return a && a.email === String(email || '').trim().toLowerCase() ? a : null; };
  const priceOf = (courseId, cohortId) => { const c = course(courseId) || {}, h = cohortId ? cohort(cohortId) : null; const fee = (h && h.fee != null ? h.fee : c.fee); const reg = (h && h.regFee != null ? h.regFee : c.regFee); const deposit = h && h.deposit != null ? h.deposit : (reg || 0); return { fee, reg, deposit, total: fee == null && reg == null ? null : (fee || 0) + (reg || 0), sample: !!(h && h.sample) }; };

  // ── Payments (prototype: finance verifies against the provider dashboard; production: provider webhook verifies on the server)
  function notifyPayment(d) {
    const amount = Number(d.amount);
    if (!(amount > 0)) return { error: 'Enter the amount you paid.' };
    if (!String(d.providerRef || '').trim()) return { error: 'Enter the transaction ID from your Mobile Money or card receipt.' };
    if (list('payments').some(p => p.providerRef === d.providerRef.trim() && p.status !== 'Failed')) return { error: 'This transaction ID has already been submitted.' };
    const p = add('payments', { id: 'PAY-' + rnd(6), appId: d.appId || '', studentId: d.studentId || '', courseId: d.courseId, cohortId: d.cohortId || '', payer: d.payer, kind: d.kind || 'Tuition', amount, method: d.method, providerRef: d.providerRef.trim(), status: 'Pending verification', sample: !!d.sample });
    internal(`Payment to verify · ${p.payer} · GHS ${amount} · ${p.method}`, 'Finance Officer');
    const who = d.appId ? get('applications', d.appId) : get('students', d.studentId); if (who) notify(who, 'Payment received', { pref: p.id });
    return { payment: p };
  }
  function setPayment(id, status, by, note) {
    const p = get('payments', id); if (!p) return { error: 'Not found.' };
    upd('payments', id, { status, verifiedBy: by, verifiedAt: now(), note: note || p.note || '' }); audit(by, 'Payment ' + id + ' → ' + status, p.payer);
    if (status === 'Verified') { const who = p.appId ? get('applications', p.appId) : get('students', p.studentId); if (who) notify(who, 'Payment confirmation', { amount: p.amount }); if (p.appId) tryEnrol(p.appId); }
    return { ok: true };
  }
  const paidFor = (key, val, courseId) => list('payments').filter(p => p[key] === val && p.courseId === courseId && p.status === 'Verified').reduce((n, p) => n + p.amount, 0);
  const seatsLeft = hid => { const h = cohort(hid); if (!h || !h.capacity) return Infinity; return h.capacity - list('enrolments').filter(e => e.cohortId === hid && e.status !== 'Withdrawn').length; };
  function tryEnrol(appId) {
    const a = get('applications', appId); if (!a || a.status !== 'Offer accepted') return { error: 'Waiting for the applicant to accept the offer.' };
    const pr = priceOf(a.courseId, a.cohortId), paid = paidFor('appId', a.id, a.courseId);
    if (a.cohortId && seatsLeft(a.cohortId) <= 0) { internal('Intake full — ' + a.name + ' has paid but no seat is free in ' + a.cohortName + '. Move them to another intake or raise capacity.', 'Institute Director'); return { error: 'This intake is now full. The Institute will contact you about the next intake.' }; }
    if (paid < (pr.deposit || 0)) return { error: `Waiting for verified payment of GHS ${pr.deposit}. Verified so far: GHS ${paid}.` };
    let st = list('students').find(s => s.email === a.email || (a.phone && s.phone === a.phone));
    if (!st) st = add('students', { id: 'STU-' + rnd(5), name: a.name, email: a.email, phone: a.phone, location: a.location, country: a.country, dob: a.dob || '', emergency: a.emergency || '', consent: a.consent || { email: 1 }, status: 'Active', sample: !!a.sample });
    if (!enrolments(st.id).some(e => e.courseId === a.courseId && e.cohortId === a.cohortId && e.status !== 'Withdrawn'))
      { const hh = a.cohortId ? cohort(a.cohortId) : null; add('enrolments', { id: 'ENR-' + rnd(5), studentId: st.id, courseId: a.courseId, cohortId: a.cohortId || '', appId: a.id, status: 'Active', lastLesson: '', onboarded: null, sample: !!a.sample, accessFrom: hh ? (hh.accessFrom || hh.start) : today(), accessTo: hh ? (hh.accessTo || '') : '' }); }
    save('payments', list('payments').map(p => p.appId === a.id ? { ...p, studentId: st.id } : p));
    upd('applications', a.id, { status: 'Enrolled', studentId: st.id, history: [...a.history, { at: now(), status: 'Enrolled', by: 'System (payment verified)' }] });
    notify(st, 'Enrolment confirmation', { course: a.courseTitle, sid: st.id }); linkCrm(a, 'Enrolled');
    return { ok: true, student: st };
  }
  function balance(studentId, courseId, cohortId) { const pr = priceOf(courseId, cohortId); if (pr.total == null) return null; const paid = paidFor('studentId', studentId, courseId); return Math.max(0, pr.total - paid); }

  // ── Learning
  const prog = (sid, cid) => list('progress').filter(p => p.studentId === sid && p.courseId === cid);
  const subs = (sid, cid, kind) => list('submissions').filter(s => s.studentId === sid && s.courseId === cid && (!kind || s.kind === kind));
  const bestQuiz = (sid, cid, lid) => subs(sid, cid, 'quiz').filter(s => s.itemId === lid).reduce((m, s) => Math.max(m, s.score), -1);
  function progress(sid, cid) {
    const c = course(cid); const ls = lessonsOf(c); const done = new Set(prog(sid, cid).map(p => p.lessonId));
    const quizzes = ls.filter(l => l.type === 'quiz'), plain = ls.filter(l => l.type !== 'quiz');
    const lessonsDone = plain.filter(l => done.has(l.id)).length, quizzesPassed = quizzes.filter(q => bestQuiz(sid, cid, q.id) >= (q.pass || 70)).length;
    const asg = subs(sid, cid, 'assignment'); const asgDone = asg.length ? 1 : 0;
    const total = plain.length + quizzes.length + (c && c.assignment ? 1 : 0), finished = lessonsDone + quizzesPassed + asgDone;
    return { lessonsDone, lessonsTotal: plain.length, quizzesPassed, quizzesTotal: quizzes.length, asgDone, total, finished, pct: total ? Math.round(finished / total * 100) : 0, done, theoryDone: lessonsDone === plain.length && quizzesPassed === quizzes.length };
  }
  function completeLesson(sid, cid, lid) {
    const l = lessonsOf(course(cid)).find(x => x.id === lid); if (!l || l.type === 'quiz') return { error: 'Quizzes are completed by passing them.' };
    if (!enrolments(sid).some(e => e.courseId === cid && e.status === 'Active')) return { error: 'You are not enrolled on this course.' };
    if (!prog(sid, cid).some(p => p.lessonId === lid)) add('progress', { id: 'PRG-' + rnd(6), studentId: sid, courseId: cid, lessonId: lid });
    return { ok: true };
  }
  const setResume = (sid, cid, lid) => save('enrolments', list('enrolments').map(e => e.studentId === sid && e.courseId === cid ? { ...e, lastLesson: lid } : e));
  const activeOn = (sid, cid) => enrolments(sid).some(e => e.courseId === cid && e.status === 'Active');
  function submitQuiz(sid, cid, lid, answers) {
    if (!activeOn(sid, cid)) return { error: 'You are not enrolled on this course.' };
    const l = lessonsOf(course(cid)).find(x => x.id === lid); if (!l || l.type !== 'quiz') return { error: 'Quiz not found.' };
    const prev = subs(sid, cid, 'quiz').filter(s => s.itemId === lid);
    if (prev.length >= l.attempts) return { error: `You have used all ${l.attempts} attempts. Ask your instructor about a retake.` };
    if (l.questions.some((_, i) => answers[i] == null)) return { error: 'Answer every question before submitting.' };
    const right = l.questions.filter((q, i) => answers[i] === q.a).length, score = Math.round(right / l.questions.length * 100);
    const s = add('submissions', { id: 'SUB-' + rnd(6), studentId: sid, courseId: cid, itemId: lid, itemTitle: l.title, kind: 'quiz', answers, score, status: 'Auto-graded', attempt: prev.length + 1 });
    return { ok: true, score, passed: score >= l.pass, attemptsLeft: l.attempts - prev.length - 1, sub: s };
  }
  function submitWork(sid, cid, kind, itemId, text, file) {
    if (!activeOn(sid, cid)) return { error: 'You are not enrolled on this course.' };
    if (!String(text || '').trim() && !file) return { error: 'Add your written answer or attach a file.' };
    if (file && file.size > 50 * 1024 * 1024) return { error: 'Files must be under 50 MB. For longer videos, share a private link instead.' };
    const c = course(cid), title = kind === 'assignment' ? c.assignment.title : (c.checklist.find(x => x.id === itemId) || {}).label;
    if (kind === 'video') { const it = c.checklist.find(x => x.id === itemId); if (!it || it.supervised) return { error: 'This activity must be assessed in person under supervision.' }; }
    return { ok: true, sub: add('submissions', { id: 'SUB-' + rnd(6), studentId: sid, courseId: cid, itemId, itemTitle: title, kind, text: text || '', file: file ? { name: file.name, size: file.size } : null, status: 'Submitted', score: null }) };
  }
  function grade(subId, score, feedback, by) {
    const s = get('submissions', subId); if (!s) return { error: 'Not found.' };
    if (s.kind !== 'video' && !(Number(score) >= 0 && Number(score) <= 100)) return { error: 'Enter a score from 0 to 100.' };
    upd('submissions', subId, { score: s.kind === 'video' ? null : Number(score), feedback, gradedBy: by, status: 'Graded', gradedAt: now() }); audit(by, 'Graded ' + s.itemTitle, s.studentId);
    const st = get('students', s.studentId); if (st) notify(st, 'Assessment result', { item: s.itemTitle }); return { ok: true };
  }
  function recordPractical(sid, cid, itemId, result, supervised, by, notes) {
    const it = (course(cid).checklist || []).find(x => x.id === itemId); if (!it) return { error: 'Not found.' };
    if (it.supervised && !supervised) return { error: 'This activity must be performed under direct supervision to be recorded as competent.' };
    add('practicals', { id: 'PRC-' + rnd(6), studentId: sid, courseId: cid, itemId, label: it.label, result, supervised: !!supervised, by, notes: notes || '' });
    audit(by, `Practical: ${it.label} → ${result}`, sid); return { ok: true };
  }
  const practicalState = (sid, cid) => { const c = course(cid); const recs = list('practicals').filter(p => p.studentId === sid && p.courseId === cid); return (c.checklist || []).map(it => { const r = recs.filter(x => x.itemId === it.id)[0]; return { ...it, rec: r || null, ok: !!r && r.result === 'Competent' && (!it.supervised || r.supervised) }; }); };

  // ── Classes and attendance
  const sessionsOf = hid => list('sessions').filter(s => s.cohortId === hid).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  function markAttendance(sessionId, studentId, status, by, reason) {
    const ses0 = get('sessions', sessionId); if (!ses0) return { error: 'Session not found.' };
    if (!enrolments(studentId).some(e => e.cohortId === ses0.cohortId && e.status !== 'Withdrawn')) return { error: 'Student is not in this cohort.' };
    if (ses0.date > today()) return { error: 'Attendance can only be recorded on or after the class date.' };
    const all = list('attendance'), ex = all.find(a => a.sessionId === sessionId && a.studentId === studentId);
    if (ex) { if (ex.status === status && (ex.reason || '') === (reason || '')) return { ok: true }; save('attendance', all.map(a => a === ex ? { ...a, status, reason: reason || '', by, at: now(), history: [...(a.history || []), { from: a.status, to: status, by, at: now() }] } : a)); audit(by, 'Attendance corrected → ' + status, studentId); }
    else add('attendance', { id: 'ATT-' + rnd(6), sessionId, studentId, status, reason: reason || '', by, at: now(), history: [] });
    return { ok: true };
  }
  function attendancePct(sid, hid) {
    const ss = sessionsOf(hid).filter(s => s.date <= today()); const att = list('attendance').filter(a => a.studentId === sid);
    const mk = list('sessions').filter(x => x.makeupFor && (x.forStudents || []).includes(sid) && x.date <= today());
    const madeUp = sId => mk.some(m => m.makeupFor.includes(sId) && att.some(a => a.sessionId === m.id && (a.status === 'Present' || a.status === 'Late')));
    let n = 0, d = 0; ss.filter(s => !s.makeupFor).forEach(s => { const r = att.find(a => a.sessionId === s.id); let st = r ? r.status : 'Not recorded'; if ((st === 'Absent' || st === 'Excused') && madeUp(s.id)) st = 'Present'; if (st === 'Excused' || st === 'Not recorded') return; d++; if (st === 'Present' || st === 'Late') n++; });
    return d ? Math.round(n / d * 100) : null;
  }

  // ── Fees, instalments, currency
  const fxLine = n => { const fx = settings().fx || {}; if (n == null || !(n > 0)) return ''; const parts = Object.entries(fx).filter(([, r]) => r > 0).map(([c, r]) => c + ' ' + (n / r).toLocaleString('en-GB', { maximumFractionDigits: 0 })); return parts.length ? '≈ ' + parts.join(' · ') + ' (indicative; charged in GHS)' : ''; };
  function schedule(courseId, cohortId) {
    const pr = priceOf(courseId, cohortId), h = cohortId ? cohort(cohortId) : null; if (pr.total == null) return [];
    const n = Math.max(1, Number(h && h.instalments) || 1), dep = Math.min(pr.deposit || 0, pr.total), rest = pr.total - dep, rows = [];
    if (dep) rows.push({ label: 'Deposit (to confirm your place)', due: 'On acceptance', amount: dep });
    if (rest > 0) { const each = Math.round(rest / n * 100) / 100; for (let i = 0; i < n; i++) { let due = 'Before the course starts'; if (h && h.start) { const d = new Date(h.start + 'T00:00'); d.setMonth(d.getMonth() + i - (n > 1 ? 0 : 0)); due = S.fmtDate(S.localDate(d)); } rows.push({ label: n > 1 ? 'Instalment ' + (i + 1) + ' of ' + n : 'Balance', due, amount: i === n - 1 ? Math.round((rest - each * (n - 1)) * 100) / 100 : each }); } }
    return rows;
  }
  function admissionLetter(appId) { const a = get('applications', appId); if (!a || !['Accepted', 'Offer accepted', 'Enrolled'].includes(a.status)) return null; const c = course(a.courseId) || {}, h = a.cohortId ? cohort(a.cohortId) : null, pr = priceOf(a.courseId, a.cohortId); const acc = (a.history || []).filter(x => x.status === 'Accepted').pop();
    return { ref: a.id, name: a.name, date: S.fmtDate((acc ? acc.at : a.updated || a.created).slice(0, 10)), course: c.title, code: c.code, product: c.product, cohort: h ? h.name : 'Next available intake', start: h ? S.fmtDate(h.start) : 'To be confirmed', venue: h ? h.venue : c.location, mode: h ? h.mode : (c.modes || []).join(', '), fee: pr.fee, reg: pr.reg, deposit: pr.deposit, schedule: schedule(a.courseId, a.cohortId), studentId: a.studentId || '', signatory: settings().signatory, org: settings().org, certKind: c.certKind }; }

  // ── Events, workshops, news, stories (content managed in Admin)
  const EVENT_TYPES = ['Workshop', 'Masterclass', 'Open day', 'Orientation', 'Graduation', 'Information session'];
  function registerEvent(eventId, d) {
    const ev = get('events', eventId); if (!ev || ev.status !== 'Published') return { error: 'This event is not open for registration.' };
    if (!String(d.name || '').trim()) return { error: 'Add your name.' }; const ph = d.phone ? S.ghPhone(d.phone) : '', em = String(d.email || '').trim().toLowerCase();
    if (!ph && !S.email(em)) return { error: 'Add a valid Ghana phone number or email.' };
    const regs = list('event-regs').filter(r => r.eventId === eventId && r.status !== 'Cancelled');
    if (regs.some(r => (ph && r.phone === ph) || (em && r.email === em))) return { error: 'You are already registered for this event.' };
    if (ev.capacity && regs.length >= ev.capacity) return { error: 'This event is full.' };
    const r = add('event-regs', { id: 'EVR-' + rnd(5), eventId, title: ev.title, name: d.name.trim(), phone: ph, email: em, status: 'Registered' });
    linkCrm({ name: r.name, phone: ph, email: em, courseTitle: ev.type + ' · ' + ev.title, source: 'Events' }, 'Interested'); notify({ name: r.name, phone: ph, email: em, consent: { email: 1 } }, 'Event registration', { title: ev.title, date: S.fmtDate(ev.date) });
    internal('Event registration · ' + r.name + ' · ' + ev.title); return { ok: true, reg: r };
  }

  // ── Practical evaluations (date, criteria, rating, feedback, outcome, sign-off)
  const RATINGS = ['1 · Not yet demonstrated', '2 · Developing', '3 · Competent', '4 · Excellent'];
  function recordEval(sid, cid, itemId, f, by) {
    if (!activeOn(sid, cid)) return { error: 'Student is not actively enrolled on this course.' };
    if (f.date && f.date > today()) return { error: 'The assessment date cannot be in the future.' };
    const it = (course(cid).checklist || []).find(x => x.id === itemId); if (!it) return { error: 'Not found.' };
    if (!f.date) return { error: 'Add the assessment date.' }; if (!f.rating) return { error: 'Choose a performance rating.' }; if (!String(f.feedback || '').trim()) return { error: 'Add feedback for the student.' };
    if (f.outcome === 'Pass' && it.supervised && !f.supervised) return { error: 'This activity must be performed under direct supervision to pass.' };
    if (f.outcome === 'Pass' && /^1|^2/.test(f.rating)) return { error: 'A pass needs a rating of Competent or Excellent.' };
    add('practicals', { id: 'PRC-' + rnd(6), studentId: sid, courseId: cid, itemId, label: it.label, result: f.outcome === 'Pass' ? 'Competent' : f.outcome === 'Resit' ? 'Resit required' : 'Pending', outcome: f.outcome, date: f.date, criteria: f.criteria || it.criteria || '', rating: f.rating, feedback: f.feedback.trim(), improve: (f.improve || '').trim(), supervised: !!f.supervised, by, signedOff: f.outcome !== 'Pending' ? by : '' });
    audit(by, `Practical evaluation: ${it.label} → ${f.outcome}`, sid); const st = get('students', sid); st && notify(st, 'Assessment result', { item: it.label }); return { ok: true };
  }
  const evalHistory = (sid, cid, itemId) => list('practicals').filter(p => p.studentId === sid && p.courseId === cid && p.itemId === itemId);

  // ── Instructor content builders
  function addQuiz(cid, moduleId, q, by) {
    const c = course(cid); if (!c) return { error: 'Course not found.' }; if (!String(q.title || '').trim()) return { error: 'Give the quiz a title.' };
    const qs = (q.questions || []).filter(x => String(x.q || '').trim()); if (!qs.length) return { error: 'Add at least one question.' };
    for (const x of qs) { if (x.o.filter(o => String(o).trim()).length < 2) return { error: 'Each question needs at least two answer options.' }; if (x.a == null || !String(x.o[x.a] || '').trim()) return { error: 'Mark the correct answer for every question.' }; }
    const lesson = { id: moduleId + '-q' + rnd(4), title: q.title.trim(), type: 'quiz', questions: qs.map(x => ({ q: x.q.trim(), o: x.o.map(o => String(o).trim()).filter(Boolean), a: x.a })), pass: Number(q.pass) || 70, attempts: Number(q.attempts) || 3, by };
    upd('courses', cid, { modules: c.modules.map(m => m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m) }); audit(by, 'Quiz created · ' + lesson.title, c.code); return { ok: true };
  }
  function setAssignment(cid, a, by) { const c = course(cid); if (!String(a.title || '').trim() || !String(a.brief || '').trim()) return { error: 'Add a title and brief.' }; upd('courses', cid, { assignment: { title: a.title.trim(), brief: a.brief.trim(), criteria: (a.criteria || '').trim(), pass: Number(a.pass) || 50, due: a.due || '' } }); audit(by, 'Assignment updated', c.code); return { ok: true }; }

  // ── Monthly series for dashboard charts (stored records only)
  function series(months = 6) {
    const out = [], now0 = new Date(); for (let i = months - 1; i >= 0; i--) { const d = new Date(now0.getFullYear(), now0.getMonth() - i, 1); out.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleDateString('en-GB', { month: 'short' }), apps: 0, revenue: 0, enrol: 0 }); }
    const at = k => out.find(o => o.key === String(k || '').slice(0, 7));
    list('applications').forEach(a => { const o = at(a.created); if (o) o.apps++; }); list('enrolments').forEach(e => { const o = at(e.created); if (o) o.enrol++; });
    list('payments').filter(p => p.status === 'Verified' && !/Discount/.test(p.kind)).forEach(p => { const o = at(p.verifiedAt || p.created); if (o) o.revenue += p.amount; });
    return out;
  }

  // ── Access window, practical booking, recordings, questions, onboarding
  function access(e) { if (!e) return { ok: false, msg: 'Not enrolled.' }; if (e.status !== 'Active' && e.status !== 'Completed') return { ok: false, msg: 'This enrolment is ' + e.status.toLowerCase() + '.' }; const h = cohort(e.cohortId) || {}; const from = e.accessFrom || h.accessFrom || '', to = e.accessTo || h.accessTo || ''; if (from && today() < from) return { ok: false, msg: 'Course content opens on ' + S.fmtDate(from) + '.' }; if (to && today() > to) return { ok: false, msg: 'Your access to this course ended on ' + S.fmtDate(to) + '. Contact the Institute to extend it.' }; return { ok: true, from, to }; }
  function practicalEligible(sid, cid) { const c = course(cid); if (!c.practical) return { ok: false, msg: 'No practical component.' }; if (!c.theoryFirst) return { ok: true }; const p = progress(sid, cid); return p.theoryDone ? { ok: true } : { ok: false, msg: 'Complete your online theory lessons and knowledge checks first.' }; }
  function bookPractical(sid, sessionId) {
    const s = get('sessions', sessionId); if (!s || !/Practical|Assessment/.test(s.kind)) return { error: 'Not a practical session.' };
    const e = enrolments(sid).find(x => x.cohortId === s.cohortId && x.status === 'Active'); if (!e) return { error: 'You are not enrolled in this cohort.' };
    const el = practicalEligible(sid, e.courseId); if (!el.ok) return { error: el.msg };
    if (s.date < today()) return { error: 'This session has already taken place.' };
    const bs = list('bookings').filter(b => b.sessionId === sessionId && b.status === 'Booked'); if (bs.some(b => b.studentId === sid)) return { error: 'Already booked.' };
    const cap = s.capacity || (cohort(s.cohortId) || {}).capacity; if (cap && bs.length >= cap) return { error: 'This session is full. Choose another or ask about a make-up session.' };
    add('bookings', { id: 'BKG-' + rnd(5), sessionId, studentId: sid, courseId: e.courseId, status: 'Booked' }); return { ok: true };
  }
  const cancelBooking = (sid, sessionId) => save('bookings', list('bookings').map(b => b.sessionId === sessionId && b.studentId === sid && b.status === 'Booked' ? { ...b, status: 'Cancelled', updated: now() } : b));
  const booked = (sid, sessionId) => list('bookings').some(b => b.sessionId === sessionId && b.studentId === sid && b.status === 'Booked');
  function sendReminder(sessionId, by) { const s = get('sessions', sessionId); if (!s) return { error: 'Not found.' }; const ens = list('enrolments').filter(e => e.cohortId === s.cohortId && e.status === 'Active'); ens.forEach(e => { const st = get('students', e.studentId); st && notify(st, 'Class reminder', { title: s.title, date: S.fmtDate(s.date), time: s.start }); }); audit(by, 'Class reminder sent', s.title); return { ok: true, n: ens.length }; }
  const HANDBOOK = [
    ['Welcome', 'Welcome to the Sense of Touch Institute of Beauty & Wellness. Your portal holds your lessons, timetable, results, payments and certificates.'],
    ['Attendance', 'Attend every scheduled class. Tell your instructor in advance if you cannot attend; absences may need a make-up session. Courses set a minimum attendance for completion.'],
    ['Hygiene and safety', 'Follow the Institute’s hygiene, sanitation and client-safety procedures in every practical session. Practical work on clients is always supervised.'],
    ['Assessment and certificates', 'Online lessons, knowledge checks, assignments and supervised practicals are recorded separately. A certificate is issued only when every course requirement is met. Institute certificates are internal certificates of completion, not accredited qualifications.'],
    ['Payments and refunds', 'Your place is confirmed once payment is verified. Instalment and refund arrangements follow the terms in your offer.'],
    ['Conduct, privacy and consent', 'Treat fellow students, clients and staff with respect. Recording other people requires their consent. Your personal data is used only to run your studies; request corrections at any time through Support.']
  ].map(([t, b]) => ({ t, b }));
  const onboard = (enrolmentId, p) => { const e = get('enrolments', enrolmentId); save('enrolments', list('enrolments').map(x => x.id === enrolmentId ? { ...x, onboarded: { ...(x.onboarded || {}), ...p, at: now() } } : x)); return e; };
  function journey(sid, cid) {
    const c = course(cid), e = enrolments(sid).find(x => x.courseId === cid && x.status !== 'Withdrawn'), p = progress(sid, cid), el = eligibility(sid, cid);
    const ck = k => (el.checks.find(x => x.key === k) || {}).ok;
    const ps = c.practical ? practicalState(sid, cid) : [], hasBooking = list('bookings').some(b => b.studentId === sid && b.courseId === cid && b.status === 'Booked');
    const att = e && e.cohortId ? attendancePct(sid, e.cohortId) : null, cert = list('certificates').find(x => x.studentId === sid && x.courseId === cid && x.status === 'Valid');
    const steps = [['Online theory enrolment', !!e], ['Lesson completion', p.lessonsDone === p.lessonsTotal], ['Knowledge assessment', p.quizzesPassed === p.quizzesTotal]];
    if (c.practical) steps.push(['Practical training eligibility', practicalEligible(sid, cid).ok], ['Practical session booked', hasBooking], ['Attendance', c.req.attendance == null || ck('attendance')], ['Practical assessment', ps.length > 0 && ps.every(x => x.ok)]);
    else if (c.req.attendance != null) steps.push(['Attendance', ck('attendance')]);
    steps.push(['Final course completion', !!e && e.status === 'Completed'], ['Certificate eligibility', el.eligible || !!cert]);
    return steps.map(([label, ok]) => ({ label, ok: !!ok }));
  }

  // ── Make-up sessions, refunds, data requests, instructor profiles, discussion
  function scheduleMakeup(sessionId, studentIds, f, by) {
    const s = get('sessions', sessionId); if (!s) return { error: 'Session not found.' }; if (!studentIds.length) return { error: 'No absent students to schedule.' }; if (!f.date) return { error: 'Choose a date.' };
    const m = add('sessions', { id: 'SES-MU' + rnd(4), cohortId: s.cohortId, date: f.date, start: f.start || s.start, end: f.end || s.end, kind: 'Make-up session', title: 'Make-up · ' + s.title, venue: s.venue, link: s.link || '', makeupFor: [s.id], forStudents: studentIds });
    studentIds.forEach(id => { const st = get('students', id); st && notify(st, 'Class reminder', { title: m.title, date: S.fmtDate(m.date), time: m.start }); }); audit(by, 'Make-up scheduled for ' + studentIds.length, s.title); return { ok: true, session: m };
  }
  const REFUND_STATUSES = ['Submitted', 'Under review', 'Approved', 'Declined', 'Refunded'];
  function requestRefund(sid, d) {
    const amount = Number(d.amount); if (!(amount > 0)) return { error: 'Enter the amount you are asking to be refunded.' }; if (String(d.reason || '').trim().length < 10) return { error: 'Please explain the reason (a sentence or two).' };
    if (d.paymentId) { const p = get('payments', d.paymentId); if (!p || p.studentId !== sid || p.status !== 'Verified') return { error: 'Choose one of your verified payments.' }; if (amount > p.amount) return { error: 'The amount is more than that payment.' }; }
    const r = add('refund-requests', { id: 'RFD-' + rnd(5), studentId: sid, paymentId: d.paymentId || '', courseId: d.courseId || '', amount, reason: d.reason.trim(), status: 'Submitted', history: [{ at: now(), status: 'Submitted', by: 'Student' }] });
    internal('Refund request · ' + (get('students', sid) || {}).name + ' · GHS ' + amount, 'Finance Officer'); return { ok: true, req: r };
  }
  function setRefund(id, status, by, note) {
    const r = get('refund-requests', id); if (!r) return { error: 'Not found.' };
    upd('refund-requests', id, { status, history: [...r.history, { at: now(), status, by, note: note || '' }] }); audit(by, 'Refund ' + id + ' → ' + status, r.studentId);
    if (status === 'Refunded' && r.paymentId) upd('payments', r.paymentId, { status: 'Refunded', note: 'Refund ' + id });
    const st = get('students', r.studentId); st && notify(st, 'Hello {first}, your refund request ' + id + ' is now: ' + status + (note ? ' — ' + note : '') + '.'); return { ok: true };
  }
  const DATA_TYPES = ['Correction', 'Copy of my data', 'Deletion'];
  function dataRequest(sid, type, details) { if (!DATA_TYPES.includes(type)) return { error: 'Choose a request type.' }; if (type === 'Correction' && String(details || '').trim().length < 5) return { error: 'Tell us what needs correcting.' }; const r = add('data-requests', { id: 'DRQ-' + rnd(5), studentId: sid, type, details: (details || '').trim(), status: 'Submitted', history: [{ at: now(), status: 'Submitted' }] }); internal('Data request · ' + type, 'Student Support Officer'); return { ok: true, req: r }; }
  function exportPerson(sid) {
    const st = get('students', sid); if (!st) return null; const own = n => list(n).filter(r => r.studentId === sid);
    return { exportedAt: now(), student: st, applications: list('applications').filter(a => a.email === st.email || a.studentId === sid), enrolments: own('enrolments'), progress: own('progress'), submissions: own('submissions'), attendance: own('attendance'), practicals: own('practicals'), payments: own('payments'), certificates: own('certificates'), support: own('support'), questions: own('questions'), refunds: own('refund-requests') };
  }
  function anonymise(sid, by) {
    const st = get('students', sid); if (!st) return { error: 'Not found.' }; const tag = 'Removed-' + sid;
    upd('students', sid, { name: tag, email: '', phone: '', location: '', dob: '', emergency: '', alumni: null, anonymised: now() });
    save('applications', list('applications').map(a => a.email === st.email || a.studentId === sid ? { ...a, name: tag, email: '', phone: '', location: '', dob: '', emergency: '', statement: '', goals: '', experience: '', docs: [], idDoc: null, anonymised: now() } : a));
    save('support', list('support').map(t => t.studentId === sid ? { ...t, body: '[removed]' } : t)); save('questions', list('questions').map(q => q.studentId === sid ? { ...q, text: '[removed]' } : q));
    audit(by, 'Personal data anonymised (financial and certificate records kept for legal retention)', sid); return { ok: true };
  }
  function retentionDue() { const cfg = settings().retention || { appMonths: 24 }; const cut = new Date(); cut.setMonth(cut.getMonth() - (cfg.appMonths || 24)); const c = cut.toISOString();
    return list('applications').filter(a => ['Declined', 'Withdrawn'].includes(a.status) && (a.updated || a.created) < c && !a.anonymised); }
  function anonymiseApplication(id, by) { save('applications', list('applications').map(a => a.id === id ? { ...a, name: 'Removed applicant', email: '', phone: '', location: '', dob: '', emergency: '', statement: '', goals: '', experience: '', docs: [], idDoc: null, anonymised: now() } : a)); audit(by, 'Application anonymised (retention)', id); }
  function proposeProfile(insId, p) { if (!String(p.bio || '').trim()) return { error: 'Add a short bio.' }; upd('instructors', insId, { pending: { title: (p.title || '').trim(), bio: p.bio.trim(), qualifications: (p.qualifications || '').trim(), photo: p.photo || '', at: now() } }); internal('Instructor profile awaiting approval · ' + (get('instructors', insId) || {}).name, 'Institute Director'); return { ok: true }; }
  function reviewProfile(insId, approve, by) { const i = get('instructors', insId); if (!i || !i.pending) return { error: 'Nothing pending.' }; const { at, ...p } = i.pending; upd('instructors', insId, approve ? { ...p, photo: p.photo && !/^Pending upload/.test(p.photo) ? p.photo : i.photo, pending: null, approvedBy: by } : { pending: null }); audit(by, 'Instructor profile ' + (approve ? 'approved' : 'returned'), insId); return { ok: true }; }

  // ── Completion and certificates
  function eligibility(sid, cid) {
    const c = course(cid), r = c.req, e = enrolments(sid).find(x => x.courseId === cid && x.status !== 'Withdrawn'), p = progress(sid, cid), checks = [];
    if (!e) return { eligible: false, checks: [{ label: 'Enrolment', ok: false, detail: 'Not enrolled' }] };
    if (r.lessons) checks.push({ key: 'lessons', label: 'Online lessons completed', ok: p.lessonsDone === p.lessonsTotal, detail: `${p.lessonsDone} of ${p.lessonsTotal}` });
    if (r.quiz != null) checks.push({ key: 'quiz', label: `Knowledge assessments passed (${r.quiz}%+)`, ok: p.quizzesPassed === p.quizzesTotal, detail: `${p.quizzesPassed} of ${p.quizzesTotal}` });
    if (r.assignment && c.assignment) { const g = subs(sid, cid, 'assignment').filter(s => s.status === 'Graded').sort((a, b) => b.score - a.score)[0]; checks.push({ key: 'assignment', label: 'Assignment graded at pass mark', ok: !!g && g.score >= c.assignment.pass, detail: g ? g.score + '%' : subs(sid, cid, 'assignment').length ? 'Awaiting grading' : 'Not submitted' }); }
    if (r.attendance != null && e.cohortId) { const a = attendancePct(sid, e.cohortId); const none = !sessionsOf(e.cohortId).length; checks.push({ key: 'attendance', label: `Attendance ${r.attendance}%+`, ok: a == null ? none : a >= r.attendance, detail: a == null ? (none ? 'No live sessions scheduled' : 'No sessions recorded yet') : a + '%' }); }
    if (r.practical) { const ps = practicalState(sid, cid); checks.push({ key: 'practical', label: 'Practical competency (supervised where required)', ok: ps.length > 0 && ps.every(x => x.ok), detail: `${ps.filter(x => x.ok).length} of ${ps.length}` }); }
    if (r.balance) { const b = balance(sid, cid, e.cohortId); checks.push({ key: 'balance', label: 'Tuition balance cleared', ok: b === 0 || b === null, detail: b == null ? 'No fee set' : b ? 'GHS ' + b + ' outstanding' : 'Cleared' }); }
    return { eligible: checks.every(x => x.ok), checks, enrolment: e, progress: p };
  }
  function confirmCompletion(sid, cid, by) {
    const el = eligibility(sid, cid); if (!el.eligible) return { error: 'Not all course requirements are met yet.' };
    save('enrolments', list('enrolments').map(e => e.id === el.enrolment.id ? { ...e, status: 'Completed', completedAt: now(), completedBy: by } : e));
    add('completions', { id: 'CMP-' + rnd(5), studentId: sid, courseId: cid, by, checks: el.checks });
    const st = get('students', sid); notify(st, 'Course completion', { course: course(cid).title }); audit(by, 'Completion confirmed · ' + course(cid).code, sid);
    if (settings().autoIssue) issueCertificate(sid, cid, 'System (auto-issue)');
    return { ok: true };
  }
  function issueCertificate(sid, cid, by) {
    const e = enrolments(sid).find(x => x.courseId === cid && x.status === 'Completed'); if (!e) return { error: 'Confirm course completion first.' };
    if (list('certificates').some(x => x.studentId === sid && x.courseId === cid && x.status !== 'Revoked')) return { error: 'A valid certificate already exists.' };
    const st = get('students', sid), c = course(cid), cfg = settings(), yr = new Date().getFullYear();
    const n = list('certificates').filter(x => x.id.includes('-' + yr + '-')).length + 1;
    const cert = add('certificates', { id: `${cfg.certPrefix}-${yr}-${String(n).padStart(4, '0')}${rnd(2)}`, studentId: sid, name: st.name, courseId: cid, courseTitle: c.title, code: c.code, kind: c.certKind, completed: (e.completedAt || now()).slice(0, 10), org: cfg.org, signatory: cfg.signatory, accreditation: cfg.accreditation || '', status: 'Valid', history: [{ at: now(), action: 'Issued', by }], sample: !!st.sample });
    notify(st, 'Certificate issued', { cid: cert.id, course: c.title }); audit(by, 'Certificate issued ' + cert.id, sid); return { ok: true, cert };
  }
  function setCertificate(id, patch, action, by) { const c = get('certificates', id); if (!c) return { error: 'Not found.' }; upd('certificates', id, { ...patch, history: [...c.history, { at: now(), action, by }] }); audit(by, `Certificate ${id} · ${action}`, c.studentId); return { ok: true }; }
  const verify = id => { const c = get('certificates', String(id || '').trim().toUpperCase()); return c ? { id: c.id, name: c.name, course: c.courseTitle, kind: c.kind, completed: c.completed, org: c.org, status: c.status, accreditation: c.accreditation } : null; };

  // ── Metrics from stored records only
  function metrics() {
    const apps = list('applications'), en = list('enrolments'), pays = list('payments'), att = list('attendance');
    const rec = att.filter(a => !['Excused', 'Not recorded'].includes(a.status));
    const outstanding = en.filter(e => e.status !== 'Withdrawn').reduce((n, e) => n + (balance(e.studentId, e.courseId, e.cohortId) || 0), 0);
    const finished = en.filter(e => e.status === 'Completed').length, counted = en.filter(e => e.status !== 'Withdrawn' && e.status !== 'Cancelled').length;
    return {
      applicants: apps.filter(a => a.status !== 'Draft').length, pending: apps.filter(a => ['Submitted', 'Under review', 'Additional information required', 'Interview required'].includes(a.status)).length,
      accepted: apps.filter(a => ['Accepted', 'Offer accepted'].includes(a.status)).length, activeStudents: new Set(en.filter(e => e.status === 'Active').map(e => e.studentId)).size,
      activeCourses: list('courses').filter(c => c.status === 'Published').length, activeCohorts: list('cohorts').filter(h => ['Open', 'Running'].includes(h.status)).length,
      attendance: rec.length ? Math.round(rec.filter(a => a.status === 'Present' || a.status === 'Late').length / rec.length * 100) : null,
      completion: counted ? Math.round(finished / counted * 100) : null,
      collected: pays.filter(p => p.status === 'Verified').reduce((n, p) => n + p.amount, 0), outstanding,
      toVerify: pays.filter(p => p.status === 'Pending verification').length, certs: list('certificates').filter(c => c.status === 'Valid').length
    };
  }

  // ── Portal sign-in (prototype). Production: Supabase Auth; the student/instructor role is read from the server.
  const PSK = 'acad-portal-session';
  const portal = {
    current: () => { try { return JSON.parse(sessionStorage.getItem(PSK)); } catch (e) { return null; } },
    login(email, id) {
      const em = String(email || '').trim().toLowerCase(), code = String(id || '').trim().toUpperCase();
      if (!S.email(em)) return { error: 'Enter the email you applied with.' }; if (!code) return { error: 'Enter your student or instructor ID.' };
      const st = list('students').find(s => s.email === em && s.id === code); if (st) { const s = { type: 'student', id: st.id, name: st.name }; sessionStorage.setItem(PSK, JSON.stringify(s)); return { ok: true, session: s }; }
      const ins = list('instructors').find(s => s.email === em && s.id === code && s.active); if (ins) { const s = { type: 'instructor', id: ins.id, name: ins.name }; sessionStorage.setItem(PSK, JSON.stringify(s)); return { ok: true, session: s }; }
      return { error: 'We couldn’t match that email and ID. Check your enrolment confirmation message.' };
    },
    logout: () => sessionStorage.removeItem(PSK)
  };

  // ── Sample data: clearly flagged, removable, used only to walk through the workflow
  function seedSample() { /* sample data removed: real records only */ }
  function clearSample() {
    ['applications', 'students', 'enrolments', 'payments', 'progress', 'submissions', 'attendance', 'practicals', 'certificates', 'completions', 'announcements', 'support', 'enquiries', 'cohorts', 'sessions', 'comms', 'bookings', 'questions', 'events', 'event-regs', 'articles', 'stories', 'refund-requests', 'data-requests', 'posts'].forEach(n => save(n, list(n).filter(r => !r.sample && !(n === 'comms' && /example\.com|\+23324111/.test(r.address || '')))));
    S.save('leads', S.list('leads').filter(l => !l.sample)); S.save('acad-sample', '');
  }
  const hasSample = () => S.list('acad-sample') === '1';

  init();
  window.ACAD = {
    seatsLeft, DEPTS, PRODUCTS, LEVELS, HANDBOOK, MODES, EVENT_TYPES, REFUND_STATUSES, DATA_TYPES, scheduleMakeup, requestRefund, setRefund, dataRequest, exportPerson, anonymise, retentionDue, anonymiseApplication, proposeProfile, reviewProfile, RATINGS, fxLine, schedule, admissionLetter, registerEvent, recordEval, evalHistory, addQuiz, setAssignment, series, APP_STATUSES, PIPELINE, LEAD_SOURCES, ATT, PAY_METHODS, PERMS, ROLES, ROLE_NOTES, TPL,
    list, save, add, upd, get, rnd, today, now, settings, setSettings, course, cohort, lessonsOf, enrolments, sessionsOf, priceOf,
    validateApp, submitApplication, enquire, setAppStatus, track, notifyPayment, setPayment, tryEnrol, balance,
    progress, completeLesson, setResume, submitQuiz, submitWork, grade, bestQuiz, recordPractical, practicalState, markAttendance, attendancePct,
    access, practicalEligible, bookPractical, cancelBooking, booked, sendReminder, onboard, journey, eligibility, confirmCompletion, issueCertificate, setCertificate, verify, metrics, notify, audit, internal, portal, seedSample, clearSample, hasSample,
    can: (role, perm) => (ROLES[role] || []).includes(perm),
    roleFor: staffRole => staffRole === 'Founder / Super Admin' ? 'Founder / Super Administrator' : staffRole === 'Academy Director' ? 'Institute Director' : ROLES[staffRole] ? staffRole : null,
    deptName: id => (DEPTS.find(x => x.id === id) || {}).name || id,
    instructor: id => get('instructors', id),
    money: n => n == null ? 'To be confirmed' : 'GHS ' + Number(n).toLocaleString('en-GH')
  };
})();
