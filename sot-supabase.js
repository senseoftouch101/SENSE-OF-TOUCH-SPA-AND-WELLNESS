// Sense of Touch — Supabase sync. Off until a project URL + anon key are saved on the Connect Supabase page
// (or set in window.SOT_SUPABASE before this file loads). Browser data stays the instant local copy;
// every change is pushed to public.sot_records and other devices' changes are pulled in live.
(function () {
  if (window.SOTCloud) return;
  const CFG_KEY = 'sot-supabase-config-v1', P = 'sot-v1-', LOG = [];
  // Built-in public settings for senseoftouch.co. Publishable key only — safe to ship. Never put a secret key here.
  const BUILT_IN = { url: 'https://pajmcpunkvdclwajgikv.supabase.co', key: 'sb_publishable_YCe3Z9nh6M8uw_RTPc0JHw_8trZoePN' };
  const cfg = () => { try { return window.SOT_SUPABASE || JSON.parse(localStorage.getItem(CFG_KEY)) || BUILT_IN; } catch (e) { return BUILT_IN; } };
  // Only publishable / anon keys may ever be used in a browser.
  const keyKind = k => { k = String(k || '').trim(); if (/^sb_secret_/i.test(k)) return 'secret'; if (/^sb_publishable_/i.test(k)) return 'public'; const p = k.split('.'); if (p.length === 3) { try { const r = JSON.parse(atob(p[1].replace(/-/g, '+').replace(/_/g, '/'))).role; return r === 'anon' ? 'public' : r === 'service_role' ? 'secret' : 'unknown'; } catch (e) {} } return 'unknown'; };
  const SECRET_MSG = 'That’s your SECRET key — never put it in the website. Use the Publishable key (sb_publishable_…) or the legacy anon public key.';
  let removedSecret = false;
  try { const c0 = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); if (c0 && keyKind(c0.key) === 'secret') { localStorage.removeItem(CFG_KEY); removedSecret = true; } } catch (e) {}
  const state = { status: 'off', error: '', lastSync: '', pushed: 0, pulled: 0, user: null };
  const emit = () => window.dispatchEvent(new CustomEvent('sot-cloud', { detail: { ...state } }));
  const set = p => { Object.assign(state, p); emit(); };
  const log = m => { LOG.unshift(new Date().toLocaleTimeString() + ' ' + m); LOG.length = Math.min(LOG.length, 40); };
  let sb = null, pulling = false, timer = null;
  const dirty = new Set();
  const SKIP = /^(error-log|daily-run)$/;
  // Must match the anon insert policy in handoff/schema-003-sync.sql.
  const PUBLIC = new Set(['bookings', 'giftcards', 'enquiries', 'consultations', 'referrals', 'reviews', 'orders', 'registrations', 'subscribers', 'applications', 'partners', 'investors']);
  const canWrite = k => !!state.user || PUBLIC.has(k);
  const sent = new Set();
  const readLocal = k => { try { return JSON.parse(localStorage.getItem(P + k)) || []; } catch (e) { return []; } };
  const keys = () => Object.keys(localStorage).filter(k => k.startsWith(P)).map(k => k.slice(P.length)).filter(k => !SKIP.test(k));

  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'; s.onload = res; s.onerror = () => rej(new Error('Could not load the Supabase library')); document.head.appendChild(s); });
  }

  async function pull() {
    if (!sb) return;
    const { data, error } = await sb.from('sot_records').select('collection,id,data,deleted').limit(20000);
    if (error) { if (/permission|RLS|401|JWT/i.test(error.message) && !state.user) { log('Read skipped: visitors can only add records'); return; } throw error; }
    const by = {};
    data.forEach(r => { (by[r.collection] = by[r.collection] || []); if (!r.deleted) by[r.collection].push(r.data); });
    pulling = true;
    try {
      Object.keys(by).forEach(k => {
        const remote = by[k], ids = new Set(remote.map(x => x.id));
        const localOnly = readLocal(k).filter(x => x && x.id && !ids.has(x.id) && x.local);
        const merged = [...localOnly, ...remote].sort((a, b) => String(b.created || '').localeCompare(String(a.created || '')));
        localStorage.setItem(P + k, JSON.stringify(merged));
        if (localOnly.length) dirty.add(k);
        window.dispatchEvent(new CustomEvent('sot-change', { detail: k }));
      });
    } finally { pulling = false; }
    set({ pulled: data.length, lastSync: new Date().toISOString() });
    log('Pulled ' + data.length + ' records');
  }

  async function push(k) {
    if (!sb) return;
    if (!canWrite(k)) return;
    // Deletions made in this browser: mark them deleted in the cloud (update only — never inserts, so no emails fire).
    if (state.user) { let tomb = []; try { tomb = JSON.parse(localStorage.getItem('sot-tomb') || '[]'); } catch (e) {} const mine = tomb.filter(t => t.k === k).map(t => String(t.id));
      if (mine.length) { const { error } = await sb.from('sot_records').update({ deleted: true }).eq('collection', k).in('id', mine); if (!error) { localStorage.setItem('sot-tomb', JSON.stringify(tomb.filter(t => t.k !== k))); log('Deleted ' + mine.length + ' ' + k); } } }
    let recs = readLocal(k).filter(r => r && r.id);
    // Visitors: only brand-new records, and only gift cards still awaiting payment.
    if (!state.user) recs = recs.filter(r => r.local && !sent.has(k + ':' + r.id) && (k === 'giftcards' ? (r.status === 'Awaiting payment' && r.balance == null && !r.expires && !r.activated) : ['Requested', 'New', 'Pending', 'Submitted', 'Invited', undefined].includes(r.status)) && JSON.stringify(r).length < 19000);
    const rows = recs.map(r => ({ collection: k, id: String(r.id), data: { ...r, local: false }, deleted: false }));
    if (!rows.length) return;
    const q = sb.from('sot_records');
    if (state.user) { const { error } = await q.upsert(rows, { onConflict: 'collection,id' }); if (error) throw error; }
    else {
      // Visitors can't read, so upsert is refused by the database — insert one at a time and treat duplicates as already saved.
      for (const row of rows) { const { error } = await sb.from('sot_records').insert(row); if (error && error.code !== '23505' && !/duplicate key/i.test(error.message)) throw error; }
    }
    if (!state.user) rows.forEach(r => sent.add(k + ':' + r.id));
    set({ pushed: state.pushed + rows.length, lastSync: new Date().toISOString() });
    log('Saved ' + rows.length + ' ' + k);
  }

  async function flush() {
    timer = null;
    const ks = [...dirty]; dirty.clear();
    for (const k of ks) { try { await push(k); } catch (e) { const denied = /permission|row-level|RLS|401|403/i.test(e.message); if (!denied) dirty.add(k); set({ status: 'error', error: denied ? 'Not allowed to save ' + k + ' — sign in as staff.' : e.message }); log('Save failed (' + k + '): ' + e.message); } }
    if (!dirty.size && state.status === 'error') set({ status: 'on', error: '' });
  }
  const queue = k => { if (!k || SKIP.test(k) || pulling || !canWrite(k)) return; dirty.add(k); if (!timer) timer = setTimeout(flush, state.user ? 800 : 50); };
  // Don't lose a booking if the visitor closes the page straight away.
  addEventListener('pagehide', () => { if (dirty.size) flush(); });
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dirty.size) flush(); });

  async function start() {
    const c = cfg();
    if (!c || !c.url || !c.key) { set({ status: 'off' }); return; }
    if (keyKind(c.key) === 'secret') { set({ status: 'error', error: SECRET_MSG }); return; }
    set({ status: 'connecting', error: '' });
    try {
      await loadLib();
      sb = window.supabase.createClient(c.url, c.key, { auth: { persistSession: true, storageKey: 'sot-supabase-auth' } });
      const { data: s } = await sb.auth.getSession(); state.user = s && s.session ? s.session.user : null;
      sb.auth.onAuthStateChange((_e, sess) => { state.user = sess ? sess.user : null; emit(); if (state.user) pull().catch(() => {}); });
      await pull();
      set({ status: 'on' });
      window.addEventListener('sot-change', e => queue(e.detail));
      if (state.user) sb.channel('sot-records').on('postgres_changes', { event: '*', schema: 'public', table: 'sot_records' }, () => { clearTimeout(state._pt); state._pt = setTimeout(() => pull().catch(() => {}), 400); }).subscribe();
      window.addEventListener('online', () => { keys().filter(canWrite).forEach(k => dirty.add(k)); flush(); });
    } catch (e) { set({ status: 'error', error: e.message }); log('Connect failed: ' + e.message); }
  }

  window.SOTCloud = {
    state: () => ({ ...state }), log: () => LOG.slice(), config: cfg, keyKind, removedSecret: () => removedSecret,
    saveConfig(url, key) { const kk = keyKind(key); if (kk === 'secret') throw new Error(SECRET_MSG); if (kk !== 'public') throw new Error('That doesn’t look like a Publishable key. Copy the key starting sb_publishable_ from Project Settings → API Keys.'); localStorage.setItem(CFG_KEY, JSON.stringify({ url: String(url).trim().replace(/\/$/, ''), key: String(key).trim() })); return start(); },
    clearConfig() { localStorage.removeItem(CFG_KEY); sb = null; set({ status: 'off', user: null }); },
    async test() { if (!sb) await start(); if (!sb) throw new Error('Add the project URL and key first.'); const { error } = await sb.from('sot_records').select('id', { count: 'exact', head: true }); if (error && !/permission|RLS/i.test(error.message)) throw new Error(/relation .* does not exist/i.test(error.message) ? 'Table missing — run handoff/schema-003-sync.sql in the SQL Editor first.' : error.message); return true; },
    async uploadAll() { if (!sb) throw new Error('Not connected.'); const ks = keys(); let n = 0; for (const k of ks) { await push(k); n += readLocal(k).length; } return { collections: ks.length, records: n }; },
    async signIn(email, password) { if (!sb) throw new Error('Not connected.'); const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; await pull(); },
    async signOut() { if (sb) await sb.auth.signOut(); },
    async staffRole() { if (!sb || !state.user) return null; const { data } = await sb.from('sot_staff').select('role').eq('email', String(state.user.email).toLowerCase()).maybeSingle(); return data ? data.role : null; },
    ready() { return new Promise(r => { if (state.status !== 'connecting' && (sb || state.status === 'off' || state.status === 'error')) return r(); const off = this.on(() => { if (state.status !== 'connecting') { off(); r(); } }); setTimeout(r, 6000); }); },
    async email(action, extra) { if (!sb) throw new Error('Connect Supabase first.'); if (!state.user) throw new Error('Sign in as staff first.');
      const fn = action === 'test' ? 'sot_email_test' : action === 'outbox' ? 'sot_email_outbox' : 'sot_email_recent';
      const { data, error } = await sb.rpc(fn, action === 'test' ? { to_addr: (extra && extra.to) || null } : {});
      if (error) throw new Error(/does not exist|Could not find the function/i.test(error.message) ? 'Email isn’t set up yet — run handoff/schema-004-email.sql in the SQL Editor.' : /Resend key missing/i.test(error.message) ? 'Add your Resend key to the Vault first (step 1 in schema-004-email.sql).' : error.message);
      if (action !== 'test') return data;
      await new Promise(r => setTimeout(r, 2500)); const { data: log } = await sb.rpc('sot_email_recent'); const last = log && log[0];
      if (last && last.status_code && last.status_code !== 200) throw new Error('Resend refused it (' + last.status_code + '): ' + last.response);
      return { id: data, status: last ? (last.status_code || 'sending') : 'sending' }; },
    async emailLog() { if (!sb || !state.user) return []; const { data } = await sb.rpc('sot_email_recent'); return data || []; },
    async emailStatus() { if (!sb || !state.user) throw new Error('Sign in as staff first.'); const { data, error } = await sb.rpc('sot_email_status'); if (error) throw new Error(/Could not find the function|does not exist/i.test(error.message) ? 'Run handoff/schema-005-email-key.sql in the SQL Editor first.' : error.message); return data; },
    async setResendKey(k) { if (!sb || !state.user) throw new Error('Sign in as staff first.'); if (/^sb_/.test(String(k).trim())) throw new Error('That’s a Supabase key. Paste the Resend key — it starts with re_.'); const { data, error } = await sb.rpc('sot_set_resend_key', { k: String(k).trim() }); if (error) throw new Error(/Could not find the function|does not exist/i.test(error.message) ? 'Run handoff/schema-005-email-key.sql in the SQL Editor first.' : error.message); return data; },
    pull: () => pull(), on(fn) { const h = e => fn(e.detail); window.addEventListener('sot-cloud', h); return () => window.removeEventListener('sot-cloud', h); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
