// SOT Podcast — episodes (managed in Admin → Podcast), listen links, guest/topic suggestions.
(function () {
  if (window.SOTPod) return;
  const S = window.SOT; if (!S) { console.warn('sot-podcast.js needs sot-store.js first'); return; }
  const TOPICS = ['Wellness', 'Skincare', 'Beauty business', 'Founder stories', 'Mind & body', 'Institute'];
  const DEF_LINKS = { youtube: 'https://www.youtube.com/@Lifewithwose', spotify: '', apple: '', instagram: 'https://www.instagram.com/senseoftouchgh/' };
  const cfg = () => ({ ...DEF_LINKS, ...((S.list('podcast-settings')[0]) || {}) });
  const setCfg = p => S.save('podcast-settings', [{ ...cfg(), ...p }]);
  function media(url) {
    const u = String(url || '').trim(); let m;
    if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/))) return { kind: 'YouTube', embed: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0', thumb: 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg', ratio: '16/9' };
    if ((m = u.match(/open\.spotify\.com\/(episode|show)\/([A-Za-z0-9]+)/))) return { kind: 'Spotify', embed: 'https://open.spotify.com/embed/' + m[1] + '/' + m[2], thumb: '', ratio: '' };
    if (/podcasts\.apple\.com\//.test(u)) return { kind: 'Apple Podcasts', embed: u.replace('podcasts.apple.com', 'embed.podcasts.apple.com'), thumb: '', ratio: '' };
    return null;
  }
  const episodes = () => S.list('podcast-episodes').filter(e => !e.draft).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const all = () => S.list('podcast-episodes').sort((a, b) => String(b.date).localeCompare(String(a.date)));
  function addEpisode(d) {
    if (String(d.title || '').trim().length < 3) return { error: 'Add an episode title.' };
    const md = media(d.url); if (!md) return { error: 'Paste a YouTube, Spotify or Apple Podcasts episode link.' };
    if (!d.date) return { error: 'Choose the release date.' };
    const n = all().reduce((x, e) => Math.max(x, e.number || 0), 0) + 1;
    return { ok: true, ep: S.add('podcast-episodes', { title: d.title.trim(), url: d.url.trim(), kind: md.kind, image: d.image || md.thumb || '', guest: (d.guest || '').trim(), topic: d.topic || TOPICS[0], summary: (d.summary || '').trim(), duration: (d.duration || '').trim(), date: d.date, number: Number(d.number) || n, draft: !!d.draft }, 'EP') };
  }
  function suggest(d) {
    const e = {};
    if (String(d.name || '').trim().length < 2) e.name = 'Enter your name.';
    if (!S.email(d.email)) e.email = 'Enter a valid email address.';
    if (String(d.idea || '').trim().length < 15) e.idea = 'Tell us a little more (a sentence or two).';
    if (!d.consent) e.consent = 'Please agree so we can reply.';
    if (Object.keys(e).length) return { errors: e };
    const r = S.add('podcast-suggestions', { kind: d.kind || 'Topic', name: d.name.trim(), email: d.email.trim().toLowerCase(), link: (d.link || '').trim(), idea: d.idea.trim(), status: 'New' }, 'PS');
    S.add('inbox', { kind: 'Podcast ' + (d.kind === 'Guest' ? 'guest request' : 'topic idea'), name: r.name, email: r.email, message: r.idea + (r.link ? ' — ' + r.link : ''), status: 'New' }, 'IN');
    return { ok: true, req: r };
  }
  window.SOTPod = { TOPICS, cfg, setCfg, media, episodes, all, addEpisode, suggest };
})();
