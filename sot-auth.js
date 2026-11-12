// Sense of Touch member + admin sign-in (prototype: stored in this browser). Production: Supabase Auth + admin role checked server-side.
(() => {
  if (window.SOTAuth) return;
  // ── Email delivery for sign-in and reset codes ──
  // Paste your Supabase project URL and anon (public) key here. Supabase generates the 6-digit code, emails it,
  // and checks it on its server. Supabase → Authentication → Email Templates → "Magic Link": include {{ .Token }}
  // so the email shows the code. Leave blank to keep the on-screen prototype code.
  const CFG = Object.assign({ supabaseUrl: '', supabaseAnonKey: '' }, window.SOT_CONFIG || {});
  const MAIL = () => !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const sbPost = async (path, body) => { const r = await fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/auth/v1/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey }, body: JSON.stringify(body) }); let j = {}; try { j = await r.json(); } catch (e) {} return { ok: r.ok, status: r.status, msg: j.msg || j.error_description || j.message || '' }; };
  const sendCode = email => sbPost('otp', { email, create_user: true });
  const checkCode = (email, token) => sbPost('verify', { type: 'email', email, token });
  const sha256 = s => { s = unescape(encodeURIComponent(s)); const K = [], H = []; let p = 2; const isP = n => { for (let f = 2; f * f <= n; f++) if (n % f === 0) return false; return true; };
    for (let i = 0; i < 64; p++) if (isP(p)) { if (i < 8) H[i] = (Math.pow(p, 1 / 2) * 4294967296) | 0; K[i++] = (Math.pow(p, 1 / 3) * 4294967296) | 0; }
    const r = (v, n) => (v >>> n) | (v << (32 - n)); const bl = s.length * 8; s += '\x80'; while (s.length % 64 - 56) s += '\x00';
    const w = []; for (let i = 0; i < s.length; i++) w[i >> 2] |= s.charCodeAt(i) << ((3 - i) % 4) * 8; w.push((bl / 4294967296) | 0, bl | 0);
    const h = H.slice(); for (let j = 0; j < w.length; j += 16) { const W = w.slice(j, j + 16), o = h.slice(); for (let i = 0; i < 64; i++) { const a = h[0], e = h[4];
      if (i >= 16) { const x = W[i - 15], y = W[i - 2]; W[i] = (W[i - 16] + (r(x, 7) ^ r(x, 18) ^ (x >>> 3)) + W[i - 7] + (r(y, 17) ^ r(y, 19) ^ (y >>> 10))) | 0; }
      const t1 = (h[7] + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & h[5]) ^ (~e & h[6])) + K[i] + W[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]))) | 0;
      h.unshift((t1 + t2) | 0); h[4] = (h[4] + t1) | 0; h.pop(); } for (let i = 0; i < 8; i++) h[i] = (h[i] + o[i]) | 0; }
    return h.map(v => (v >>> 0).toString(16).padStart(8, '0')).join(''); };
  const hash = pw => sha256('sot:' + pw);
  // Founder / Owner / Super Admin (owner strategy, 11 Nov 2026). Hard-coded so no other admin can remove or demote it. Production: no password material ships to the browser.
  const ADMIN = { email: 'senseoftouch101@gmail.com', hash: 'c7b94e7edeb2335d8c0e7f45d16730ac085d297f0a9c60b36b3dd2dca696f76f', name: 'Founder' };
  const MK = 'sot-members-v1', SK = 'sot-auth-session-v1', TK = 'sot-staff-accounts-v1', XK = 'sot-admin-accounts-v1';
  // admin@ = Administration Manager (General Administrator, no ownership controls). info@, bookings@, reception@ = shared mailboxes: never logins, never granted permissions.
  // customer@ = test customer account. Every employee gets a named individual account.
  const OFFICIAL = { admin: 'admin@senseoftouch.co', info: 'info@senseoftouch.co', customer: 'customer@senseoftouch.co', bookings: 'bookings@senseoftouch.co', reception: 'reception@senseoftouch.co', bookingsCopy: 'senseoftouch101@gmail.com' };
  const MAILBOXES = [OFFICIAL.info, OFFICIAL.bookings, OFFICIAL.reception];
  // One role list for the whole platform (brief part 5.3). dash = where sign-in lands; areas = what each console admits;
  // compat = the matching role name inside older modules (CRM, Institute, Shop); tabs = Admin Console tabs allowed (null = all).
  const RD = [
    ['super_admin', 'Super Administrator', 'Admin.dc.html', 'Admin Console', ['*'], { crm: 'Founder / Super Admin', acad: 'Founder / Super Administrator', shop: 'General Manager' }, null],
    ['director', 'Director / Founder', 'Executive%20Dashboard.dc.html', 'Executive Dashboard', ['exec', 'finance', 'marketing', 'admin', 'crm', 'institute', 'policies', 'shop'], { crm: 'General Manager', acad: 'Institute Director', shop: 'General Manager' }, null],
    ['general_admin', 'General Administrator', 'Admin.dc.html', 'Admin Console', ['admin', 'crm', 'institute', 'exec', 'policies', 'shop'], { crm: 'General Manager', acad: 'Institute Director', shop: 'General Manager' }, null],
    ['dept_manager', 'Department Manager', 'Admin.dc.html', 'Department dashboard', ['admin', 'crm'], { crm: 'Spa Manager' }, ['Overview', 'Front desk', 'Bookings', 'Customers', 'Inventory', 'Inbox', 'Reports', 'Reviews', 'Checkout', 'Back office']],
    ['admissions', 'Admissions Officer', 'Institute%20Admin.dc.html', 'Admissions Dashboard', ['institute'], { acad: 'Admissions Officer' }, []],
    ['registrar', 'Registrar', 'Institute%20Admin.dc.html', 'Student records', ['institute'], { acad: 'Registrar' }, []],
    ['academic_director', 'Academic Director', 'Institute%20Admin.dc.html', 'Academic dashboard', ['institute'], { acad: 'Academic Coordinator' }, []],
    ['instructor', 'Instructor', 'Institute%20Portal.dc.html', 'Instructor Portal', ['instructor'], { acad: 'Instructor' }, []],
    ['finance', 'Finance Officer', 'Executive%20Dashboard.dc.html#finance', 'Finance Dashboard', ['finance', 'institute', 'crm'], { crm: 'Finance Officer', acad: 'Finance Officer' }, []],
    ['receptionist', 'Receptionist', 'Admin.dc.html', 'Bookings', ['admin', 'crm'], { crm: 'Receptionist' }, ['Overview', 'Front desk', 'Bookings', 'Customers', 'Inbox', 'Checkout']],
    ['therapist', 'Therapist', 'Admin.dc.html', 'Front desk', ['admin'], { crm: 'Receptionist' }, ['Front desk']],
    ['customer_service', 'Customer Service', 'Admin.dc.html#inbox', 'Customer Support Dashboard', ['admin', 'crm', 'institute'], { crm: 'Receptionist', acad: 'Student Support Officer' }, ['Inbox']],
    ['crm_manager', 'CRM Manager', 'CRM.dc.html', 'CRM', ['crm', 'marketing'], { crm: 'General Manager' }, []],
    ['marketing', 'Marketing Manager', 'Executive%20Dashboard.dc.html#marketing', 'Marketing Dashboard', ['marketing', 'crm', 'admin'], { crm: 'Marketing Manager' }, ['Social', 'Reviews', 'Podcast']],
    ['content', 'Website Content Manager', 'Admin.dc.html', 'Content tools', ['admin', 'policies'], { crm: 'Content Editor' }, ['Reviews', 'Social', 'Podcast', 'Careers', 'Foundation']],
    ['inventory', 'Inventory Manager', 'Shop.dc.html#/admin', 'Store admin', ['admin', 'shop'], { crm: 'Store Manager', shop: 'Store Manager' }, ['Inventory']],
    ['student', 'Student', 'Institute%20Portal.dc.html', 'Student Portal', ['student'], {}, []],
    ['customer', 'Customer', 'Account.dc.html', 'Customer Portal', ['customer'], {}, []],
    ['guest', 'Guest', 'Sense%20of%20Touch%20Homepage.dc.html', 'Website', [], {}, []],
    ['partner', 'External Partner', 'Investor%20Room.dc.html', 'Partner room', ['partner'], {}, []],
    ['auditor', 'Auditor / Read-only', 'Executive%20Dashboard.dc.html', 'Read-only reports', ['exec', 'finance'], { acad: 'Auditor (read-only)' }, []]
  ].map(([key, label, dash, dashLabel, areas, compat, tabs]) => ({ key, label, dash, dashLabel, areas, compat, tabs }));
  const RK = Object.fromEntries(RD.map(r => [r.key, r]));
  // Older role names stay valid (existing staff accounts keep working) and map onto the new list.
  const LEGACY = { 'Founder / Super Admin': 'super_admin', 'General Manager': 'general_admin', 'Spa Manager': 'dept_manager', 'Therapist': 'receptionist', 'Store Manager': 'inventory', 'Marketing Manager': 'marketing', 'Finance Officer': 'finance', 'Content Editor': 'content', 'Institute Director': 'academic_director', 'Academic Coordinator': 'academic_director', 'Admissions Officer': 'admissions', 'Instructor': 'instructor', 'Student Support Officer': 'customer_service', 'Enquiries Officer': 'customer_service' };
  const NOT_STAFF = ['super_admin', 'student', 'customer', 'guest'];
  const defFor = str => RD.find(r => r.label === str) || RK[LEGACY[str]] || null;
  const isLegacy = str => !!LEGACY[str] && !RD.some(r => r.label === str);
  // Sessions: idle timeout for staff, absolute limit for members, per-device list with revoke.
  const SSK = 'sot-auth-sessions-v1', IDLE = 30 * 60e3, MEMBER_MAX = 30 * 864e5;
  const device = () => { const u = navigator.userAgent || ''; const os = /iPhone|iPad/.test(u) ? 'iPhone / iPad' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /Linux/.test(u) ? 'Linux' : 'Device'; const br = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Browser'; return br + ' on ' + os; };
  let rememberNext = true;
  const ld = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch (e) { return f; } };
  const sv = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const subs = new Set(); const emit = () => subs.forEach(f => { try { f(); } catch (e) {} });
  addEventListener('storage', e => { if (e.key === MK || e.key === SK || e.key === TK) emit(); });
  const norm = e => String(e || '').trim().toLowerCase();
  const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  try { if (localStorage.getItem('sot-auth-temp') && !sessionStorage.getItem('sot-auth-temp')) { localStorage.removeItem(SK); localStorage.removeItem('sot-auth-temp'); } } catch (e) {}
  // One-time migration to the 11 Nov 2026 access model.
  (() => { const xa = ld(XK, []), mv = xa.find(x => x.email === OFFICIAL.admin && !x.cloud); if (mv) { sv(XK, xa.filter(x => x !== mv)); const tl = ld(TK, []).filter(t => t.email !== OFFICIAL.admin); tl.push({ email: OFFICIAL.admin, name: 'Administration Manager', staffRole: 'General Administrator', pass: mv.hash, active: true, created: mv.created || new Date().toISOString() }); sv(TK, tl); }
    const tl = ld(TK, []); let ch = false; tl.forEach(t => { if (MAILBOXES.includes(t.email) && t.active) { t.active = false; t.mailbox = true; ch = true; } }); if (ch) sv(TK, tl); })();
  const isAdminEmail = em => em === ADMIN.email || ld(XK, []).some(a => a.email === em && a.active !== false);
  const endRec = (sid, why) => { if (!sid) return; const l = ld(SSK, []); const r = l.find(x => x.sid === sid); if (r && !r.ended) { r.ended = new Date().toISOString(); r.why = why; sv(SSK, l.slice(0, 40)); } };
  const setSession = s => { const prev = ld(SK, null); if (!s && prev) endRec(prev.sid, 'Signed out'); if (s && !s.sid) { s = { ...s, sid: 'S' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), last: Date.now(), device: device() }; sv(SSK, [{ sid: s.sid, email: s.email, device: s.device, at: new Date().toISOString() }, ...ld(SSK, [])].slice(0, 40)); } try { if (s && !rememberNext) { localStorage.setItem('sot-auth-temp', '1'); sessionStorage.setItem('sot-auth-temp', '1'); } else if (s) localStorage.removeItem('sot-auth-temp'); else { localStorage.removeItem('sot-auth-temp'); sessionStorage.removeItem('sot-auth-temp'); } } catch (e) {} sv(SK, s); try { s && (s.role === 'admin' || s.role === 'staff') ? sessionStorage.setItem('sot-admin', '1') : sessionStorage.removeItem('sot-admin'); } catch (e) {} emit(); return s; };
  const expire = why => { const s = ld(SK, null); if (!s) return; endRec(s.sid, why); try { sessionStorage.setItem('sot-auth-expired', why); } catch (e) {} sv(SK, null); try { sessionStorage.removeItem('sot-admin'); } catch (e) {} emit(); };
  const checkSession = () => { const s = ld(SK, null); if (!s) return; if (!s.sid || !s.last) { const sid = s.sid || 'S' + Date.now().toString(36), dev = s.device || device(); sv(SK, { ...s, sid, last: Date.now(), device: dev }); if (!ld(SSK, []).some(x => x.sid === sid)) sv(SSK, [{ sid, email: s.email, device: dev, at: s.at || new Date().toISOString() }, ...ld(SSK, [])].slice(0, 40)); return; }
    if (!ld(SSK, []).some(x => x.sid === s.sid)) sv(SSK, [{ sid: s.sid, email: s.email, device: s.device || device(), at: s.at || new Date().toISOString() }, ...ld(SSK, [])].slice(0, 40));
    const rec = ld(SSK, []).find(x => x.sid === s.sid); if (rec && rec.ended) return expire('This device was signed out from another session.');
    if (s.role !== 'member' && Date.now() - s.last > IDLE) return expire('You were signed out after 30 minutes without activity.');
    if (s.role === 'member' && Date.now() - new Date(s.at).getTime() > MEMBER_MAX) expire('Your session ended after 30 days. Please sign in again.'); };
  let lastTouch = 0; const touch = () => { if (Date.now() - lastTouch < 30e3) return; lastTouch = Date.now(); const s = ld(SK, null); if (s && s.sid) { s.last = Date.now(); try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {} } };
  checkSession(); setInterval(checkSession, 30e3); ['pointerdown', 'keydown', 'scroll'].forEach(ev => addEventListener(ev, touch, { passive: true }));
  // One-time code step. Prototype: no email/SMS provider is connected, so the code is shown on screen.
  // Production: Supabase Auth OTP (email) / Hubtel or Twilio SMS, generated and checked on the server.
  const mask = em => { const [u, d] = em.split('@'); return u.slice(0, 2) + '•••@' + d; };
  const maskPhone = p => p ? p.slice(0, 3) + ' ••• ' + p.slice(-3) : '';
  let modal = null; const resets = {};
  const challenge = (ses) => {
    if (modal) modal.close(null);
    return new Promise(resolve => {
      const st = { code: '', exp: 0, tries: 0, channel: 'email', last: 0 };
      const issue = ch => { st.channel = ch; st.exp = Date.now() + 10 * 60e3; st.tries = 0; st.last = Date.now();
        if (MAIL() && ch === 'email') { st.code = null; st.send = 'sending'; render(); sendCode(ses.email).then(r => { st.send = r.ok ? 'sent' : 'failed'; st.sendErr = r.status === 429 ? 'Too many codes requested. Wait a minute, then tap Resend code.' : r.msg || 'We couldn’t send the email.'; render(); }).catch(() => { st.send = 'failed'; st.sendErr = 'No connection. Check your internet and tap Resend code.'; render(); }); return; }
        st.send = 'demo'; st.code = String(Math.floor(100000 + Math.random() * 900000)); render(); };
      const F = 'Montserrat, sans-serif';
      const wrap = document.createElement('div'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Verification code');
      Object.assign(wrap.style, { position: 'fixed', inset: '0', zIndex: '300', background: 'rgba(36,34,29,0.6)', display: 'flex', padding: '16px', fontFamily: F, overflowY: 'auto', overscrollBehavior: 'contain' });
      const box = document.createElement('div'); Object.assign(box.style, { background: '#F8F4ED', border: '1px solid #C6A15B', width: '100%', maxWidth: '440px', margin: 'auto', boxSizing: 'border-box', padding: innerHeight < 600 ? '20px 18px' : '32px 28px', display: 'flex', flexDirection: 'column', gap: innerHeight < 600 ? '10px' : '14px', color: '#24221D', boxShadow: '0 30px 60px -30px rgba(36,34,29,0.7)' });
      wrap.appendChild(box); document.body.appendChild(wrap);
      const el = (tag, css, txt) => { const e = document.createElement(tag); Object.assign(e.style, css || {}); if (txt != null) e.textContent = txt; return e; };
      const btn = (txt, primary) => { const b = el('button', { all: 'unset', cursor: 'pointer', boxSizing: 'border-box', minHeight: '48px', padding: '0 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: '12px', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: '600', background: primary ? '#493126' : 'transparent', color: primary ? '#F8F4ED' : '#493126', border: primary ? '0' : '1px solid #493126' }, txt); b.type = 'button'; return b; };
      let input, err, timerEl, iv;
      const render = () => {
        box.innerHTML = '';
        box.appendChild(el('span', { fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: '600', color: '#536B4E' }, 'Two-step sign-in'));
        box.appendChild(el('h2', { margin: '0', fontFamily: "'Cormorant Garamond', serif", fontWeight: '400', fontSize: '34px', lineHeight: '1.05', color: '#493126' }, 'Enter your verification code'));
        const to = st.channel === 'sms' ? 'by SMS to ' + maskPhone(ses.phone) : 'by email to ' + mask(ses.email);
        const lead = st.send === 'sending' ? 'Sending a 6-digit code ' + to + '…' : st.send === 'failed' ? 'The code could not be sent ' + to + '.' : 'We sent a 6-digit code ' + to + '. Check your inbox and spam folder. It expires in 10 minutes.';
        box.appendChild(el('p', { margin: '0', fontSize: '14px', lineHeight: '1.6' }, lead));
        if (st.send === 'failed') box.appendChild(el('div', { background: '#F6E7E1', borderLeft: '3px solid #9A3B2A', padding: '12px 14px', fontSize: '13px', lineHeight: '1.55', color: '#6B2A1E' }, st.sendErr));
        if (st.send === 'demo') { const demo = el('div', { background: '#E9DDC9', borderLeft: '3px solid #C6A15B', padding: '12px 14px', fontSize: '13px', lineHeight: '1.55' });
        demo.append(el('span', null, 'Email delivery isn’t connected yet (add the Supabase keys in sot-auth.js), so the code is shown here: '), el('strong', { fontSize: '18px', letterSpacing: '0.2em', color: '#493126' }, st.code));
        box.appendChild(demo); }
        input = el('input', { fontFamily: F, fontSize: '26px', letterSpacing: '0.5em', textAlign: 'center', padding: '14px 10px', border: '1px solid #493126', background: '#FFFDF9', color: '#24221D', width: '100%', boxSizing: 'border-box' });
        Object.assign(input, { inputMode: 'numeric', autocomplete: 'one-time-code', maxLength: 6, placeholder: '••••••' }); input.setAttribute('aria-label', '6-digit code');
        input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); err.textContent = ''; if (input.value.length === 6) verify(); });
        input.addEventListener('keydown', e => { if (e.key === 'Enter') verify(); if (e.key === 'Escape') close(null); });
        box.appendChild(input);
        err = el('div', { fontSize: '13px', color: '#9A3B2A', fontWeight: '600', minHeight: '18px' }); err.setAttribute('role', 'alert'); box.appendChild(err);
        const v = btn('Verify and sign in', true); v.onclick = verify; box.appendChild(v);
        const row = el('div', { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' });
        const WAIT = MAIL() ? 60e3 : 30e3; const rs = btn('Resend code'); rs.onclick = () => { if (Date.now() - st.last < WAIT) return; issue(st.channel); };
        timerEl = el('span', { fontSize: '12px', color: '#6B665C' });
        row.append(rs);
        if (ses.phone && !MAIL()) { const sw = btn(st.channel === 'sms' ? 'Send by email instead' : 'Send by SMS instead'); sw.onclick = () => issue(st.channel === 'sms' ? 'email' : 'sms'); row.append(sw); }
        box.appendChild(row); box.appendChild(timerEl);
        const c = el('button', { all: 'unset', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: '600', color: '#6B665C', alignSelf: 'flex-start', padding: '6px 0' }, 'Cancel'); c.type = 'button'; c.onclick = () => close(null); box.appendChild(c);
        const tick = () => { const left = Math.max(0, Math.ceil((WAIT - (Date.now() - st.last)) / 1000)); rs.style.opacity = left ? '0.45' : '1'; timerEl.textContent = left ? 'You can resend in ' + left + 's' : ''; };
        clearInterval(iv); iv = setInterval(tick, 500); tick(); setTimeout(() => input.focus(), 30);
      };
      const verify = () => {
        const v = input.value.trim(); if (v.length !== 6) { err.textContent = 'Enter all 6 digits.'; return; }
        if (Date.now() > st.exp) { err.textContent = 'That code has expired. Tap Resend code.'; return; }
        if (++st.tries > 5) { err.textContent = 'Too many attempts. Tap Resend code for a new one.'; return; }
        if (st.send === 'demo') { if (v !== st.code) { err.textContent = 'That code isn’t right. ' + (5 - st.tries) + ' attempts left.'; input.select(); return; } return close(setSession(ses)); }
        if (st.send !== 'sent') { err.textContent = 'Wait for the email, or tap Resend code.'; return; }
        err.textContent = 'Checking…'; checkCode(ses.email, v).then(r => { if (r.ok) return close(setSession(ses)); err.textContent = 'That code isn’t right or has expired. ' + (5 - st.tries) + ' attempts left.'; input.select(); }).catch(() => { err.textContent = 'No connection. Try again.'; });
      };
      const close = res => { clearInterval(iv); wrap.remove(); modal = null; resolve(res); };
      modal = { close };
      issue('email');
    });
  };
  const pending = ses => ({ pending: true, done: challenge(ses) });
  window.SOTAuth = {
    emailConnected: MAIL,
    ADMIN_EMAIL: ADMIN.email, FOUNDER_EMAIL: ADMIN.email, MANAGER_EMAIL: OFFICIAL.admin, MAILBOXES, ROLES: RD,
    isFounder: () => { const s = ld(SK, null); return !!s && s.role === 'admin' && s.email === ADMIN.email; },
    canManageStaff: () => window.SOTAuth.isAdmin() || window.SOTAuth.roleKey() === 'general_admin',
    assignableRoles: () => RD.filter(r => !NOT_STAFF.includes(r.key)),
    roleDef: () => { const s = ld(SK, null); if (!s) return null; if (s.role === 'admin') return isAdminEmail(s.email) ? RK.super_admin : null; if (s.role === 'staff') { const t = ld(TK, []).find(x => x.email === s.email); return t && t.active ? defFor(t.staffRole) : null; } return RK.customer; },
    roleKey: () => { const d = window.SOTAuth.roleDef(); return d ? d.key : 'guest'; },
    canArea: area => { const d = window.SOTAuth.roleDef(); return !!d && (d.areas.includes('*') || d.areas.includes(area)); },
    adminTabs: () => { const d = window.SOTAuth.roleDef(); return !d ? [] : d.tabs; },
    moduleRole: mod => { const s = ld(SK, null); if (!s) return null; if (s.role === 'admin') return isAdminEmail(s.email) ? RK.super_admin.compat[mod] || null : null; if (s.role !== 'staff') return null; const t = ld(TK, []).find(x => x.email === s.email); if (!t || !t.active) return null; if (isLegacy(t.staffRole)) return t.staffRole; const d = defFor(t.staffRole); return d ? d.compat[mod] || null : null; },
    destinationLabel: () => { const d = window.SOTAuth.roleDef(); return d ? d.dashLabel : 'Continue'; },
    sessions: () => { const s = ld(SK, null); if (!s) return []; return ld(SSK, []).filter(x => x.email === s.email && !x.ended).map(x => ({ ...x, current: x.sid === s.sid })); },
    revoke: sid => { const s = ld(SK, null); endRec(sid, 'Signed out remotely'); if (s && s.sid === sid) setSession(null); else emit(); },
    revokeOthers: () => { const s = ld(SK, null); if (!s) return; ld(SSK, []).filter(x => x.email === s.email && !x.ended && x.sid !== s.sid).forEach(x => endRec(x.sid, 'Signed out remotely')); emit(); },
    expiredReason: () => { try { const r = sessionStorage.getItem('sot-auth-expired'); sessionStorage.removeItem('sot-auth-expired'); return r; } catch (e) { return null; } },
    members: () => ld(MK, []),
    current: () => ld(SK, null),
    isAdmin: () => { const s = ld(SK, null); return !!s && s.role === 'admin' && isAdminEmail(s.email); },
    OFFICIAL,
    officialStatus: () => ({ admin: ld(TK, []).some(t => t.email === OFFICIAL.admin && t.active), info: ld(TK, []).some(t => t.email === OFFICIAL.info), customer: ld(MK, []).some(m => m.email === OFFICIAL.customer) }),
    setupOfficial: (kind, pass) => {
      if (!window.SOTAuth.isAdmin()) return { error: 'Only the founder can set up official accounts.' };
      const em = OFFICIAL[kind]; if (!em) return { error: 'Unknown account.' }; if (MAILBOXES.includes(em)) return { error: em + ' is a shared mailbox, not a login. Create a named account for the person who reads it.' };
      if (String(pass || '').length < 12 || !/[A-Z]/.test(pass) || !/[a-z]/.test(pass) || !/\d/.test(pass)) return { error: 'Use at least 12 characters with upper- and lower-case letters and a number.' };
      if (kind === 'admin') { sv(XK, ld(XK, []).filter(a => a.email !== em)); const l = ld(TK, []).filter(t => t.email !== em); l.push({ email: em, name: 'Administration Manager', staffRole: 'General Administrator', pass: hash(pass), active: true, created: new Date().toISOString() }); sv(TK, l); }
      if (kind === 'info') { const l = ld(TK, []).filter(t => t.email !== em); l.push({ email: em, name: 'General Enquiries', staffRole: 'Enquiries Officer', pass: hash(pass), active: true, created: new Date().toISOString() }); sv(TK, l); }
      if (kind === 'customer') { const l = ld(MK, []).filter(m => m.email !== em); l.push({ email: em, name: 'Customer Account', phone: '', pass: hash(pass), created: new Date().toISOString() }); sv(MK, l); }
      emit(); return { ok: true };
    },
    destination: () => { const d = window.SOTAuth.roleDef(); return d ? d.dash : null; },
    isMember: () => !!ld(SK, null),
    isStaff: () => { const s = ld(SK, null); if (!s || s.role !== 'staff') return false; const t = ld(TK, []).find(x => x.email === s.email); return !!t && t.active; },
    canStaff: () => window.SOTAuth.isAdmin() || window.SOTAuth.isStaff(),
    staffRole: () => { const s = ld(SK, null); if (!s) return null; if (s.role === 'admin') return 'Super Administrator'; if (s.role !== 'staff') return null; const t = ld(TK, []).find(x => x.email === s.email); if (!t) return null; const d = defFor(t.staffRole); return d ? d.label : t.staffRole; },
    staffList: () => ld(TK, []).map(({ pass, ...t }) => t),
    addStaff: ({ name, email, staffRole, pass }) => {
      if (!window.SOTAuth.canManageStaff()) return { error: 'Only the founder or the Administration Manager can add staff accounts.' };
      const em = norm(email); if (!String(name || '').trim()) return { error: 'Add the staff member’s name.' };
      if (!okEmail(em)) return { error: 'Enter a valid work email.' }; if (String(pass || '').length < 8) return { error: 'Temporary password must be at least 8 characters.' };
      if (isAdminEmail(em) || em === OFFICIAL.admin) return { error: 'That email is an administrator account.' };
      if (MAILBOXES.includes(em)) return { error: 'That is a shared mailbox. Use the person’s own work email so every action is traceable to them.' };
      if (staffRole && !defFor(staffRole)) return { error: 'Choose a role from the list.' };
      if (staffRole && NOT_STAFF.includes(defFor(staffRole).key)) return { error: 'Super Administrator access is set up only under Official accounts, with a verified mailbox.' };
      const list = ld(TK, []); if (list.some(t => t.email === em)) return { error: 'A staff account with this email already exists.' };
      list.push({ email: em, name: String(name).trim(), staffRole: staffRole || 'Receptionist', pass: hash(pass), active: true, created: new Date().toISOString() }); sv(TK, list); emit(); return { ok: true };
    },
    updateStaff: (email, patch) => { if (!window.SOTAuth.canManageStaff()) return { error: 'Only the founder or the Administration Manager can change staff accounts.' }; if (email === OFFICIAL.admin && !window.SOTAuth.isAdmin()) return { error: 'Only the founder can change the Administration Manager account.' }; if (MAILBOXES.includes(email) && patch.active) return { error: 'Shared mailboxes cannot be activated as logins.' }; const list = ld(TK, []); const t = list.find(x => x.email === email); if (!t) return { error: 'Not found.' }; const p = { ...patch }; if (p.pass != null) { if (String(p.pass).length < 8) return { error: 'Password must be at least 8 characters.' }; p.pass = hash(p.pass); } Object.assign(t, p); sv(TK, list); emit(); return { ok: true }; },
    removeStaff: email => { if (!window.SOTAuth.canManageStaff() || (email === OFFICIAL.admin && !window.SOTAuth.isAdmin())) return; sv(TK, ld(TK, []).filter(t => t.email !== email)); emit(); },
    on: f => { subs.add(f); return () => subs.delete(f); },
    register: ({ name, email, phone, pass }) => {
      const em = norm(email); if (!String(name || '').trim()) return { error: 'Add your full name.' };
      if (!okEmail(em)) return { error: 'Enter a valid email address.' };
      if (String(pass || '').length < 8) return { error: 'Choose a password of at least 8 characters.' };
      if (isAdminEmail(em) || em === OFFICIAL.admin || MAILBOXES.includes(em) || ld(TK, []).some(t => t.email === em)) return { error: 'This email is used for a staff account or shared mailbox. Sign in instead.' };
      const list = ld(MK, []); if (list.some(m => m.email === em)) return { error: 'An account with this email already exists. Sign in instead.' };
      const m = { email: em, name: String(name).trim(), phone: phone || '', pass: hash(pass), created: new Date().toISOString() };
      list.push(m); sv(MK, list); return pending({ email: em, name: m.name, phone: m.phone, role: 'member', at: m.created });
    },
    login: (email, pass, remember) => {
      const r = localLogin(email, pass, remember), em = norm(email), C = window.SOTCloud;
      if (!C || r.error && (!okEmail(em) || !pass)) return r;
      // Supabase is the shared sign-in: local success also signs in to the cloud; local failure tries the cloud staff account.
      if (r.pending) { const d = r.done; return { pending: true, done: d.then(ses => { if (ses && ses.role !== 'member') C.ready().then(() => C.signIn(em, pass)).catch(() => {}); return ses; }) }; }
      return { pending: true, done: cloudLogin(em, pass, r.error) };
    },
    loginLocal: (email, pass, remember) => localLogin(email, pass, remember),
    // Password reset (members). Prototype returns the code so the page can show it; production emails it from the server.
    resetRequest: email => {
      const em = norm(email); if (!okEmail(em)) return { error: 'Enter a valid email address.' };
      if (isAdminEmail(em)) return { error: 'Administrator passwords are reset by the main administrator in Admin → Staff, or by your developer.' };
      if (ld(TK, []).some(t => t.email === em)) return { error: 'Staff passwords are reset by the admin in the Admin dashboard.' };
      const m = ld(MK, []).find(x => x.email === em);
      const code = String(Math.floor(100000 + Math.random() * 900000));
      if (MAIL()) { resets[em] = { mail: !!m, exp: Date.now() + 15 * 60e3, tries: 0 }; if (m) sendCode(em).catch(() => {}); return { ok: true, sentTo: mask(em), demoCode: null }; }
      resets[em] = { code: m ? code : null, exp: Date.now() + 15 * 60e3, tries: 0 };
      return { ok: true, sentTo: mask(em), demoCode: m ? code : null };
    },
    resetConfirm: (email, code, pass) => {
      const em = norm(email), r = resets[em];
      if (!r || Date.now() > r.exp) return { error: 'That code has expired. Request a new one.' };
      if (++r.tries > 5) return { error: 'Too many attempts. Request a new code.' };
      if (String(pass || '').length < 8) return { error: 'Choose a password of at least 8 characters.' };
      if (r.mail !== undefined) { if (!r.mail) return { error: 'That code isn’t right.' }; return checkCode(em, String(code).trim()).then(v => { if (!v.ok) return { error: 'That code isn’t right or has expired.' }; const list = ld(MK, []); const m = list.find(x => x.email === em); if (!m) return { error: 'That code isn’t right.' }; m.pass = hash(pass); sv(MK, list); delete resets[em]; return { ok: true }; }).catch(() => ({ error: 'No connection. Try again.' })); }
      if (!r.code || String(code).trim() !== r.code) return { error: 'That code isn’t right.' };
      const list = ld(MK, []); const m = list.find(x => x.email === em); if (!m) return { error: 'That code isn’t right.' };
      m.pass = hash(pass); sv(MK, list); delete resets[em]; return { ok: true };
    },
    update: patch => { const s = ld(SK, null); if (!s || s.role === 'admin') return; const list = ld(MK, []); const m = list.find(x => x.email === s.email); if (m) Object.assign(m, patch); sv(MK, list); setSession({ ...s, ...patch }); },
    logout: () => { setSession(null); try { window.SOTCloud && window.SOTCloud.signOut(); } catch (e) {} },
    // Already signed in to Supabase (e.g. on Access Control)? Open staff pages without asking again.
    resumeFromCloud: () => { const C = window.SOTCloud; if (!C || ld(SK, null)) return Promise.resolve(ld(SK, null)); return C.ready().then(() => { const u = C.state().user; if (!u || !u.email) return null; return C.staffRole().then(role => role ? cloudSession(norm(u.email), role, null) : null); }).catch(() => null); }
  };
  function cloudLogin(em, pass, fallbackErr) {
    const C = window.SOTCloud;
    return C.ready().then(() => C.signIn(em, pass)).then(() => C.staffRole()).then(role => {
      if (!role) { C.signOut(); toast(fallbackErr || 'Email or password is incorrect.'); return null; }
      return cloudSession(em, role, pass);
    }).catch(e => { toast(/Invalid login|invalid_credentials/i.test(e && e.message) ? (fallbackErr || 'Email or password is incorrect.') : (fallbackErr || ('Sign-in failed: ' + (e && e.message)))); return null; });
  }
  // Turn a verified Supabase staff login into the page session. pass is optional (absent when resuming an existing Supabase session).
  function cloudSession(em, role, pass) {
    {
      const now = new Date().toISOString();
      if ((role === 'owner' || role === 'admin') && em !== OFFICIAL.admin) { const l = ld(XK, []).filter(a => a.email !== em); l.push({ email: em, name: em === OFFICIAL.admin ? 'Administrator' : em.split('@')[0], hash: pass ? hash(pass) : ((ld(XK, []).find(x => x.email === em) || {}).hash || ''), active: true, created: now, cloud: true }); sv(XK, l); return setSession({ email: em, name: em.split('@')[0], phone: '', role: 'admin', at: now, cloud: true }); }
      const l = ld(TK, []).filter(t => t.email !== em); const prev = ld(TK, []).find(t => t.email === em) || {}; l.push({ ...prev, email: em, name: prev.name || em.split('@')[0], staffRole: em === OFFICIAL.admin ? 'General Administrator' : (prev.staffRole || 'Receptionist'), pass: pass ? hash(pass) : (prev.pass || ''), active: true, created: prev.created || now, cloud: true }); sv(TK, l);
      return setSession({ email: em, name: prev.name || em.split('@')[0], phone: '', role: 'staff', staffRole: em === OFFICIAL.admin ? 'General Administrator' : (prev.staffRole || 'Receptionist'), at: now, cloud: true });
    }
  }
  function toast(msg) { try { const t = document.createElement('div'); t.setAttribute('role', 'alert'); t.textContent = msg; Object.assign(t.style, { position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', zIndex: '10000', background: '#6B2A1E', color: '#F8F4ED', padding: '14px 20px', fontFamily: 'Montserrat, sans-serif', fontSize: '14px', maxWidth: 'calc(100vw - 32px)', boxShadow: '0 8px 24px rgba(36,34,29,.25)' }); document.body.appendChild(t); setTimeout(() => t.remove(), 5000); } catch (e) {} }
  function localLogin(email, pass, remember) {
      rememberNext = remember !== false;
      const em = norm(email); if (!okEmail(em)) return { error: 'Enter a valid email address.' }; if (!pass) return { error: 'Enter your password.' };
      const xa = ld(XK, []).find(a => a.email === em); if (xa) return xa.active !== false && xa.hash === hash(pass) ? pending({ email: em, name: xa.name, phone: '', role: 'admin', at: new Date().toISOString() }) : { error: 'Email or password is incorrect.' };
      if (em === ADMIN.email) return hash(pass) === ADMIN.hash ? pending({ email: em, name: ADMIN.name, phone: '', role: 'admin', at: new Date().toISOString() }) : { error: 'Email or password is incorrect.' };
      const st = ld(TK, []).find(x => x.email === em);
      if (st) { if (st.mailbox) return { error: 'This is a shared mailbox, not a login. Sign in with your own staff account.' }; if (st.pass !== hash(pass)) return { error: 'Email or password is incorrect.' }; if (!st.active) return { error: 'This staff account is paused. Please contact the admin.' }; return pending({ email: em, name: st.name, phone: '', role: 'staff', staffRole: st.staffRole, at: new Date().toISOString() }); }
      const m = ld(MK, []).find(x => x.email === em);
      if (!m || m.pass !== hash(pass)) return { error: 'Email or password is incorrect.' };
      return pending({ email: em, name: m.name, phone: m.phone, role: 'member', at: new Date().toISOString() });
  }
})();
