// Sense of Touch — shared planning model (same logic as the Business Plan, extended for investors).
// All figures are planning assumptions, not forecasts. Replace inputs with confirmed quotes and actuals.
(function () {
  if (window.SOTFin) return;
  const SCEN = { Conservative: { clients: 0.75, ticket: 0.95, retail: 0.85 }, Base: { clients: 1, ticket: 1, retail: 1 }, Ambitious: { clients: 1.25, ticket: 1.05, retail: 1.15 } };
  const DEF = { ticket: 450, clients: 6, rent: 8000, salary: 3500, scenario: 'Base' };
  const days = 300, growth = [1, 1.5, 2], priceUp = [1, 1.08, 1.16], retailPct = [0.2, 0.25, 0.3], otherPct = [0.04, 0.06, 0.08], staff = [8, 10, 12];
  function run(inp) {
    const p = { ...DEF, ...(inp || {}) }, sc = SCEN[p.scenario] || SCEN.Base;
    const ticket = p.ticket * sc.ticket, c1 = p.clients * sc.clients;
    const yrs = [0, 1, 2].map(i => {
      const clients = c1 * growth[i], tk = ticket * priceUp[i];
      const svc = tk * clients * days, ret = svc * retailPct[i] * sc.retail, other = otherPct[i] * svc;
      const rev = svc + ret + other, cSvc = svc * 0.12, cRet = ret * 0.5, gross = rev - cSvc - cRet;
      const wages = staff[i] * p.salary * 12 * priceUp[i], rnt = p.rent * 12 * priceUp[i], util = 48000 * priceUp[i];
      const mkt = rev * 0.07, admin = 36000 * priceUp[i], maint = 24000 * priceUp[i];
      const opex = wages + rnt + util + mkt + admin + maint, ebitda = gross - opex, dep = 60000, ebt = ebitda - dep, tax = Math.max(0, ebt * 0.25);
      return { clients, tk, svc, ret, other, rev, cSvc, cRet, gross, wages, rnt, util, mkt, admin, maint, opex, ebitda, dep, ebt, tax, net: ebt - tax, staff: staff[i] };
    });
    const y = yrs[0], fixed = y.wages + y.rnt + y.util + y.admin + y.maint;
    const startup = [['Lease deposit & advance (12 months)', p.rent * 12, 'Premises'], ['Fit-out: plumbing, electrics, finishes, lighting', 180000, 'Premises'], ['Treatment equipment & furniture', 120000, 'Equipment'], ['Backup power & water storage', 45000, 'Equipment'], ['Opening retail & consumables inventory', 60000, 'Inventory'], ['Branding, signage, uniforms & print', 40000, 'Brand & systems'], ['Website, booking & POS systems', 25000, 'Brand & systems'], ['Registration, permits, legal & trademarks', 30000, 'Legal & people'], ['Staff recruitment & training', 20000, 'Legal & people']];
    const work = fixed / 4; startup.push(['Working capital (3 months fixed costs)', work, 'Working capital']);
    const sub = startup.reduce((a, r) => a + r[1], 0); startup.push(['Contingency (10%)', sub * 0.1, 'Contingency']);
    const total = sub * 1.1;
    const perRev = y.rev / (y.clients * days), perVar = (y.cSvc + y.cRet + y.mkt) / (y.clients * days), contrib = perRev - perVar, be = fixed / days / contrib;
    let cum = -total, payback = null; for (let i = 0; i < 3; i++) { const prev = cum, cf = yrs[i].net + yrs[i].dep; cum += cf; if (cum >= 0 && prev < 0 && payback === null) payback = i + (-prev / cf); }
    // Year 1 monthly cash flow with opening ramp (60% → 100% of plan over 6 months), 25 operating days a month
    const ramp = [0.6, 0.7, 0.8, 0.9, 0.95, 1, 1, 1, 1, 1, 1, 1]; let cash = work + sub * 0.1; // opening cash = working capital + contingency
    const months = ramp.map((r, m) => { const rev = y.rev / 12 * r / (ramp.reduce((a, b) => a + b, 0) / 12), varc = rev * (perVar / perRev), fx = fixed / 12, net = rev - varc - fx; cash += net; return { m: m + 1, rev, cost: varc + fx, net, cash }; });
    const lowCash = Math.min(...months.map(x => x.cash));
    return { p, yrs, fixed, startup, total, perRev, perVar, contrib, be, payback, months, lowCash, days };
  }
  function sensitivity(inp, tks, cls) { return cls.map(c => tks.map(t => run({ ...inp, ticket: t, clients: c }).yrs[2].ebitda)); }
  const f = n => Math.round(n).toLocaleString('en-GB');
  const g = n => 'GH₵ ' + (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(2) + 'm' : Math.round(n / 1000) + 'k');
  const neg = n => n < 0 ? '(' + f(-n) + ')' : f(n);
  window.SOTFin = { DEF, SCEN, run, sensitivity, f, g, neg };
})();
