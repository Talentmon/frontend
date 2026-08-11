import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import AdminUserMenu from './components/AdminUserMenu';
import {
  getOverview,
  getPurchases,
  getBurn,
  getSupplyDemand,
  getCompanies,
  getMe,
  eur,
  eurCents2,
  monthLabel,
  barHeight,
  companyVisual,
  ROLE_LABEL,
} from './adminApi';
import './styles.scss';

const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4h6v3h-6zM4 17h6v3H4z" /></svg>
    ),
  },
  {
    id: 'purchases',
    label: 'Purchases',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /><path d="M3 4h2l2 12h11l2-8H6" /></svg>
    ),
  },
  {
    id: 'burn',
    label: 'Credit burn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 3 2c0-3-2-5 1-9z" strokeLinejoin="round" /></svg>
    ),
  },
  {
    id: 'supply',
    label: 'Supply & demand',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.5" /><path d="M3 21a6 6 0 0 1 12 0M16 3.5a3.5 3.5 0 0 1 0 7" /></svg>
    ),
  },
  {
    id: 'companies',
    label: 'Companies',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>
    ),
  },
  {
    id: 'forecast',
    label: 'Forecast',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7M14 8h7v7" /></svg>
    ),
  },
];

const StarIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={style}><path d="M12 2l3 6 6 .8-4.5 4.2 1.2 6L12 16l-5.7 3 1.2-6L3 8.8 9 8z" /></svg>
);

const PACKAGE_COLORS = ['var(--adp-slate)', 'var(--adp-slate-2)', 'var(--adp-gold)', 'var(--adp-blue)', 'var(--adp-purple)'];

const RUNWAY_LABEL = (months) => {
  if (months === null || months === undefined) return '—';
  if (months < 1) return '< 1 mo';
  if (months < 3) return `~${months} mo`;
  return `~${months} mo`;
};

const STATUS_LABEL = { active: 'Active', low: 'Low', dormant: 'Dormant' };

const timeAgo = (date) => {
  if (!date) return '—';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} wk ago`;
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('all');

  const [overview, setOverview] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [burn, setBurn] = useState(null);
  const [supplyDemand, setSupplyDemand] = useState(null);

  const [companiesData, setCompaniesData] = useState(null);
  const [companySearch, setCompanySearch] = useState('');
  const [companySearchDebounced, setCompanySearchDebounced] = useState('');
  const [me, setMe] = useState(null);

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([getOverview(period), getPurchases(period), getBurn(period), getSupplyDemand(period)])
      .then(([o, p, b, sd]) => {
        setOverview(o);
        setPurchases(p);
        setBurn(b);
        setSupplyDemand(sd);
      })
      .catch(() => {});
  }, [period]);

  useEffect(() => {
    const timer = setTimeout(() => setCompanySearchDebounced(companySearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [companySearch]);

  useEffect(() => {
    getCompanies({ search: companySearchDebounced || undefined, limit: 50 })
      .then(setCompaniesData)
      .catch(() => {});
  }, [companySearchDebounced]);

  const salesByMonth = overview?.salesByMonth || [];
  const maxSales = Math.max(...salesByMonth.map((m) => m.totalCents), 1);

  const burnByMonth = burn?.burnByMonth || [];
  const maxBurn = Math.max(...burnByMonth.map((m) => m.credits), 1);

  const salesByPackage = purchases?.salesByPackage || [];
  const maxPackageRevenue = Math.max(...salesByPackage.map((p) => p.revenueCents), 1);
  const topPackage = salesByPackage[0];
  const topPackageSharePercent = topPackage && purchases
    ? Math.round((topPackage.revenueCents / salesByPackage.reduce((a, p) => a + p.revenueCents, 0 || 1)) * 100)
    : 0;

  const runway = burn?.runwayDistribution;
  const maxRunway = runway ? Math.max(runway.lt1, runway.oneToThree, runway.threeToSix, runway.over6, 1) : 1;

  const pool = supplyDemand?.poolFreshness;
  const donutAvailablePercent = pool ? Math.round(pool.activelyLookingPercent + pool.openToOffersPercent) : 0;
  const donutSegments = pool
    ? [
      { color: 'var(--adp-green)', from: 0, to: pool.activelyLookingPercent },
      { color: 'var(--adp-gold)', from: pool.activelyLookingPercent, to: pool.activelyLookingPercent + pool.openToOffersPercent },
      { color: 'var(--adp-slate-2)', from: pool.activelyLookingPercent + pool.openToOffersPercent, to: 100 },
    ]
    : [];
  const donutCss = donutSegments.map((s) => `${s.color} ${s.from * 3.6}deg ${s.to * 3.6}deg`).join(', ');

  const companySummary = companiesData?.summary;
  const companyItems = companiesData?.items || [];

  return (
    <div className="admin-panel">
      <Helmet>
        <title>Owner panel · Talentmon Admin</title>
      </Helmet>

      <header className="appbar">
        <div className="wrap appbar-in">
          <a href="/landing-page" className="brand">
            <span className="mk">
              <img src="/assets/images/talentmon.png" alt="Talentmon" />
            </span>
            <span>Talent<b>mon</b></span>
          </a>
          <span className="admin-badge">ADMIN</span>
          <div className="appbar-right">
            <AdminUserMenu name={me?.name || undefined} email={me?.email} role={me?.role ? ROLE_LABEL[me.role] : undefined} />
          </div>
        </div>
      </header>

      <main className="page">
        <div className="wrap">
          <div className="phead">
            <div>
              <h1>Owner panel</h1>
              <p>Your business as a loop: companies buy credits → burn them on unlocks → buy again.</p>
            </div>
            <select className="pselect" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="month">This month</option>
              <option value="quarter">This quarter</option>
              <option value="year">This year</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab${activeTab === tab.id ? ' on' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ============ OVERVIEW ============ */}
          <section className={`panel${activeTab === 'overview' ? ' on' : ''}`}>
            <div className="kpis">
              <div className="kpi hero">
                <div className="kl">Revenue (credit sales)</div>
                <div className="kn">{eur(overview?.revenueCents)}</div>
                <div className={`kd ${overview?.revenueMoMPercent > 0 ? 'up' : overview?.revenueMoMPercent < 0 ? 'down' : ''}`}>
                  {overview?.revenueMoMPercent !== null && overview?.revenueMoMPercent !== undefined
                    ? `${overview.revenueMoMPercent >= 0 ? '▲' : '▼'} ${Math.abs(overview.revenueMoMPercent)}% MoM`
                    : '—'}
                </div>
              </div>
              <div className="kpi"><div className="kl">Credits sold / spent</div><div className="kn">{overview?.creditsSold ?? '—'} / {overview?.creditsSpent ?? '—'}</div><div className="kd warn">{overview?.creditsUnspent ?? 0} unspent</div></div>
              <div className="kpi"><div className="kl">Companies</div><div className="kn">{overview?.companiesTotal ?? '—'}</div><div className="kd up">▲ {overview?.companiesNewInPeriod ?? 0} new</div></div>
              <div className="kpi"><div className="kl">Candidates</div><div className="kn">{overview?.candidatesTotal ?? '—'}</div><div className="kd up">▲ {overview?.candidatesNewInPeriod ?? 0} new</div></div>
            </div>

            <div className="card mb">
              <div className="card-h"><h3>The revenue loop</h3><span className="tag">BUY → BURN → REBUY</span></div>
              <div className="loop">
                <div className="loop-node buy">
                  <span className="li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /><path d="M3 4h2l2 12h11l2-8H6" /></svg></span>
                  <h4>Buy</h4>
                  <div className="ln">{overview?.loop?.buyRatePercent ?? '—'}%</div>
                  <div className="ll">of companies activate<br />(buy ≥ 1 pack)</div>
                </div>
                <div className="loop-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
                <div className="loop-node burn">
                  <span className="li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></svg></span>
                  <h4>Burn</h4>
                  <div className="ln">{overview?.loop?.avgBurnPerActiveCompany ?? '—'}</div>
                  <div className="ll">avg unlocks / active<br />company / month</div>
                </div>
                <div className="loop-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
                <div className="loop-node rebuy">
                  <span className="li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" /></svg></span>
                  <h4>Rebuy</h4>
                  <div className="ln">{overview?.loop?.rebuyRatePercent ?? '—'}%</div>
                  <div className="ll">buy again<br />(repeat purchasers)</div>
                </div>
              </div>
            </div>

            <div className="grid2w mb">
              <div className="card">
                <div className="card-h"><h3>Credit sales</h3><span className="tag">LAST {salesByMonth.length || 8} MONTHS · €</span></div>
                <div className="bars">
                  {salesByMonth.map((b, i) => (
                    <div className="bcol" key={i}>
                      <div className="bwrap"><div className="bar gold" style={{ height: `${barHeight(b.totalCents, maxSales)}%` }} /></div>
                      <span className="bv">{eur(b.totalCents)}</span><span className="bx">{monthLabel(b.month)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Health snapshot</h3><div className="csub">The few numbers that move revenue</div>
                <div className="mini">
                  <div className="mstat"><div className="mn green">{overview?.health?.activationRatePercent ?? '—'}%</div><div className="ml">Free → paid activation</div></div>
                  <div className="mstat"><div className="mn gold">{eur(overview?.health?.arpaCents)}</div><div className="ml">ARPA / company</div></div>
                  <div className="mstat"><div className="mn">{overview?.health?.creditsBurnedPerMonth ?? '—'}</div><div className="ml">Credits burned / mo</div></div>
                  <div className="mstat"><div className="mn red">{overview?.health?.companiesNearEmpty ?? '—'}</div><div className="ml">Companies near-empty</div></div>
                </div>
                <div className="note amber" style={{ marginTop: 14 }}><b>{overview?.health?.companiesNearEmpty ?? 0} companies</b> are currently near-empty on credits — upsell now.</div>
              </div>
            </div>
          </section>

          {/* ============ PURCHASES ============ */}
          <section className={`panel${activeTab === 'purchases' ? ' on' : ''}`}>
            <div className="grid2 mb">
              <div className="card">
                <h3>Activation funnel</h3><div className="csub">From sign-up to a paying, repeat customer</div>
                <div className="funnel">
                  <div className="fstep"><span className="ffill" style={{ width: '100%' }} /><span className="fl"><span className="fnum">1</span>Registered companies</span><span className="fr">{purchases?.funnel?.registered ?? '—'}</span></div>
                  <div className="fstep"><span className="ffill" style={{ width: `${purchases?.funnel?.registered ? Math.round((purchases.funnel.boughtFirstPack / purchases.funnel.registered) * 100) : 0}%` }} /><span className="fl"><span className="fnum">2</span>Bought first pack</span><span className="fr">{purchases?.funnel?.boughtFirstPack ?? '—'} <small>{purchases?.funnel?.registered ? Math.round((purchases.funnel.boughtFirstPack / purchases.funnel.registered) * 100) : 0}%</small></span></div>
                  <div className="fstep"><span className="ffill" style={{ width: `${purchases?.funnel?.registered ? Math.round((purchases.funnel.boughtAgain / purchases.funnel.registered) * 100) : 0}%` }} /><span className="fl"><span className="fnum">3</span>Bought again (repeat)</span><span className="fr">{purchases?.funnel?.boughtAgain ?? '—'} <small>{purchases?.funnel?.boughtFirstPack ? Math.round((purchases.funnel.boughtAgain / purchases.funnel.boughtFirstPack) * 100) : 0}%</small></span></div>
                </div>
              </div>
              <div className="card">
                <h3>Purchase behaviour</h3><div className="csub">When and why they come back</div>
                <div className="ratios">
                  <div className="ratio"><span className="rl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>Avg days to first purchase</span><span className="rv">{purchases?.behaviour?.avgDaysToFirstPurchase ?? '—'} <small>days</small></span></div>
                  <div className="ratio"><span className="rl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" strokeLinecap="round" strokeLinejoin="round" /></svg>Avg days to repurchase</span><span className="rv">{purchases?.behaviour?.avgDaysToRepurchase ?? '—'} <small>days</small></span></div>
                  <div className="ratio"><span className="rl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>Median balance at repurchase</span><span className="rv">{purchases?.behaviour?.medianBalanceAtRepurchase ?? '—'} <small>credits left</small></span></div>
                  <div className="ratio"><span className="rl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 7-7" /></svg>Package upgrade rate</span><span className="rv">{purchases?.behaviour?.packageUpgradeRatePercent ?? '—'}% <small>move up a tier</small></span></div>
                  <div className="ratio"><span className="rl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></svg>Top-10 revenue concentration</span><span className="rv">{purchases?.behaviour?.top10RevenueConcentrationPercent ?? '—'}%</span></div>
                </div>
              </div>
            </div>

            <div className="grid2">
              <div className="card">
                <div className="card-h"><h3>Sales by package</h3><span className="tag">UNITS · REVENUE</span></div>
                <div className="hbars">
                  {salesByPackage.map((pkg, i) => (
                    <div className="hbar" key={pkg.packageId || i}>
                      <div className="ht">
                        <span className="lab"><span className="dot" style={{ background: PACKAGE_COLORS[i % PACKAGE_COLORS.length] }} />{pkg.name} · {pkg.credits ?? '—'}{pkg.popular && <b style={{ color: 'var(--adp-gold-deep)' }}><StarIcon style={{ width: 12, height: 12 }} /></b>}</span>
                        <span className="val">{pkg.units} · {eur(pkg.revenueCents)}</span>
                      </div>
                      <div className="track"><i style={{ width: `${barHeight(pkg.revenueCents, maxPackageRevenue)}%`, background: PACKAGE_COLORS[i % PACKAGE_COLORS.length] }} /></div>
                    </div>
                  ))}
                </div>
                {topPackage && (
                  <div className="note green" style={{ marginTop: 14 }}><b>{topPackage.name}</b> drives <b>{topPackageSharePercent}% of revenue</b> — your best-value anchor.</div>
                )}
              </div>
              <div className="card">
                <h3>Revenue quality</h3><div className="csub">Recurring strength &amp; risk</div>
                <div className="mini">
                  <div className="mstat"><div className="mn green">{purchases?.quality?.repeatPurchaseRatePercent ?? '—'}%</div><div className="ml">Repeat-purchase rate</div></div>
                  <div className="mstat"><div className="mn">{eurCents2(purchases?.quality?.effectiveCentsPerCredit)}</div><div className="ml">Effective € / credit</div></div>
                  <div className="mstat"><div className="mn gold">{eur(purchases?.quality?.highestSingleOrderCents)}</div><div className="ml">Highest single order</div></div>
                  <div className="mstat"><div className="mn red">{purchases?.quality?.top10RevenueSharePercent ?? '—'}%</div><div className="ml">Revenue from top 10</div></div>
                </div>
                <div className="note amber" style={{ marginTop: 14 }}>Over <b>{purchases?.quality?.top10RevenueSharePercent ?? 0}%</b> of your revenue rides on 10 accounts — <b>whale risk</b>. Watch their runway closely.</div>
              </div>
            </div>
          </section>

          {/* ============ BURN ============ */}
          <section className={`panel${activeTab === 'burn' ? ' on' : ''}`}>
            <div className="kpis mb">
              <div className="kpi"><div className="kl">Burn this month</div><div className="kn">{burn?.burnThisMonth ?? '—'}</div><div className="kd">credits</div></div>
              <div className="kpi"><div className="kl">Avg burn / company</div><div className="kn">{burn?.avgBurnPerActiveCompany ?? '—'} <span style={{ fontSize: '.9rem' }}>/mo</span></div><div className="kd">across active companies</div></div>
              <div className="kpi"><div className="kl">Credits per hire</div><div className="kn">{burn?.creditsPerHire ?? '—'}</div><div className="kd warn">efficiency</div></div>
              <div className="kpi"><div className="kl">Idle credits</div><div className="kn">{burn?.idleCredits ?? '—'}</div><div className="kd warn">on dormant companies</div></div>
            </div>
            <div className="grid2 mb">
              <div className="card">
                <div className="card-h"><h3>Credits burned</h3><span className="tag">PER MONTH</span></div>
                <div className="bars">
                  {burnByMonth.map((b, i) => (
                    <div className="bcol" key={i}>
                      <div className="bwrap"><div className="bar green" style={{ height: `${barHeight(b.credits, maxBurn)}%` }} /></div>
                      <span className="bv">{b.credits}</span><span className="bx">{monthLabel(b.month)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Runway distribution</h3><div className="csub">Active companies by "months of credits left"</div>
                <div className="hbars">
                  <div className="hbar"><div className="ht"><span className="lab"><span className="dot" style={{ background: 'var(--adp-red)' }} />&lt; 1 month — buy soon</span><span className="val">{runway?.lt1 ?? 0}</span></div><div className="track"><i style={{ width: `${barHeight(runway?.lt1 || 0, maxRunway)}%`, background: 'var(--adp-red)' }} /></div></div>
                  <div className="hbar"><div className="ht"><span className="lab"><span className="dot" style={{ background: 'var(--adp-gold)' }} />1–3 months</span><span className="val">{runway?.oneToThree ?? 0}</span></div><div className="track"><i style={{ width: `${barHeight(runway?.oneToThree || 0, maxRunway)}%`, background: 'var(--adp-gold)' }} /></div></div>
                  <div className="hbar"><div className="ht"><span className="lab"><span className="dot" style={{ background: 'var(--adp-green)' }} />3–6 months</span><span className="val">{runway?.threeToSix ?? 0}</span></div><div className="track"><i style={{ width: `${barHeight(runway?.threeToSix || 0, maxRunway)}%`, background: 'var(--adp-green)' }} /></div></div>
                  <div className="hbar"><div className="ht"><span className="lab"><span className="dot" style={{ background: 'var(--adp-slate-2)' }} />Over-stocked (&gt;6mo)</span><span className="val">{runway?.over6 ?? 0}</span></div><div className="track"><i style={{ width: `${barHeight(runway?.over6 || 0, maxRunway)}%`, background: 'var(--adp-slate-2)' }} /></div></div>
                </div>
                <div className="note red" style={{ marginTop: 12 }}><b>{runway?.lt1 ?? 0} companies</b> run dry within a month — prime for a low-credit nudge.</div>
              </div>
            </div>
            <div className="card tbl-card">
              <div className="tbl-head">
                <div><h3>Companies to nudge</h3><div className="csub" style={{ margin: 0 }}>Low balance &amp; short runway — act before they stall</div></div>
              </div>
              <div className="tbl-scroll">
                <table>
                  <thead><tr><th>Company</th><th className="num">Balance</th><th className="num">Burn / mo</th><th className="num">Runway</th><th className="num">Last active</th><th className="num">Action</th></tr></thead>
                  <tbody>
                    {burn?.companiesToNudge?.map((c) => (
                      <tr key={c.id}>
                        <td><div className="co-cell"><span className="co-logo" style={{ background: companyVisual(c.id, c.name).color }}>{companyVisual(c.id, c.name).initial}</span><b>{c.name}</b></div></td>
                        <td className="num mono">{c.balance}</td>
                        <td className="num mono">{c.burnPerMonth}</td>
                        <td className="num"><span className={`run ${c.runwayMonths < 1 ? 's' : c.runwayMonths < 3 ? 'm' : 'l'}`}>{RUNWAY_LABEL(c.runwayMonths)}</span></td>
                        <td className="num">{timeAgo(c.lastActiveAt)}</td>
                        <td className="num"><span className="pill low">{c.runwayMonths < 1 ? 'Nudge' : 'Watch'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ============ SUPPLY & DEMAND ============ */}
          <section className={`panel${activeTab === 'supply' ? ' on' : ''}`}>
            <div className="grid2 mb">
              <div className="card">
                <h3>Pool freshness</h3><div className="csub">{overview?.candidatesTotal ?? '—'} candidates · what companies actually pay for</div>
                <div className="donut-wrap">
                  <div className="donut" style={{ background: `conic-gradient(${donutCss})` }}><div className="dc"><b>{donutAvailablePercent}%</b><span>available</span></div></div>
                  <div className="legend">
                    <div className="lg"><span className="dot" style={{ background: 'var(--adp-green)' }} />Actively looking<span className="v">{pool?.activelyLookingPercent ?? '—'}%</span></div>
                    <div className="lg"><span className="dot" style={{ background: 'var(--adp-gold)' }} />Open to offers<span className="v">{pool?.openToOffersPercent ?? '—'}%</span></div>
                    <div className="lg"><span className="dot" style={{ background: 'var(--adp-slate-2)' }} />Not interested<span className="v">{pool?.notInterestedPercent ?? '—'}%</span></div>
                    <div className="lg" style={{ borderTop: '1px solid var(--adp-line)', paddingTop: 9, marginTop: 2 }}><span className="dot" style={{ background: 'var(--adp-blue)' }} />Avg profile strength<span className="v">{pool?.avgProfileStrength ?? '—'}%</span></div>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3>Inflow vs outflow</h3><div className="csub">Is the pool growing? · this period</div>
                <div className="mini mb">
                  <div className="mstat"><div className="mn green">+{supplyDemand?.inflowOutflow?.newCandidates ?? 0}</div><div className="ml">New candidates</div></div>
                  <div className="mstat"><div className="mn red">−{supplyDemand?.inflowOutflow?.wentInactive ?? 0}</div><div className="ml">Went inactive</div></div>
                  <div className="mstat"><div className="mn gold">{(supplyDemand?.inflowOutflow?.netGrowth ?? 0) >= 0 ? '+' : ''}{supplyDemand?.inflowOutflow?.netGrowth ?? 0}</div><div className="ml">Net pool growth</div></div>
                </div>
              </div>
            </div>
          </section>

          {/* ============ COMPANIES ============ */}
          <section className={`panel${activeTab === 'companies' ? ' on' : ''}`}>
            <div className="kpis mb">
              <div className="kpi"><div className="kl">Total companies</div><div className="kn">{companySummary?.totalCompanies ?? '—'}</div><div className="kd up">{companySummary?.activeCount ?? 0} active · {companySummary?.dormantCount ?? 0} dormant</div></div>
              <div className="kpi"><div className="kl">HR seats (logins)</div><div className="kn">{companySummary?.hrSeatsTotal ?? '—'}</div><div className="kd">{companySummary?.avgSeatsPerCompany ?? '—'} avg / company</div></div>
              <div className="kpi"><div className="kl">Avg company rating</div><div className="kn">{companySummary?.avgRating ? companySummary.avgRating.toFixed(1) : '—'}★</div><div className="kd">from rated companies</div></div>
              <div className="kpi"><div className="kl">Companies rated</div><div className="kn">{companySummary?.companiesRatedPercent ?? '—'}%</div><div className="kd up">have at least one review</div></div>
            </div>
            <div className="card tbl-card">
              <div className="tbl-head">
                <div><h3>All companies</h3><div className="csub" style={{ margin: 0 }}>Credits, seats, burn, runway and lifetime value per account</div></div>
                <input
                  type="search"
                  placeholder="Search companies..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  style={{ padding: '.5em .8em', borderRadius: 8, border: '1px solid var(--adp-line)', fontSize: '.85rem', minWidth: 200 }}
                />
              </div>
              <div className="tbl-scroll">
                <table>
                  <thead><tr><th>Company</th><th className="num">Seats</th><th className="num">Balance</th><th className="num">Spent</th><th className="num">Bought</th><th className="num">Burn/mo</th><th className="num">Runway</th><th className="num">Rating</th><th className="num">LTV</th><th className="num">Status</th></tr></thead>
                  <tbody>
                    {companyItems.map((c) => (
                      <tr key={c.id}>
                        <td><div className="co-cell"><span className="co-logo" style={{ background: companyVisual(c.id, c.name).color }}>{companyVisual(c.id, c.name).initial}</span><b>{c.name}</b></div></td>
                        <td className="num mono">{c.seats}</td>
                        <td className="num mono">{c.balance}</td>
                        <td className="num mono">{c.spentCredits}</td>
                        <td className="num mono">{c.boughtCredits}</td>
                        <td className="num mono">{c.burnPerMonth}</td>
                        <td className="num"><span className={`run ${c.runwayMonths === null ? '' : c.runwayMonths < 1 ? 's' : c.runwayMonths < 3 ? 'm' : 'l'}`}>{RUNWAY_LABEL(c.runwayMonths)}</span></td>
                        <td className="num"><span className="rate">{c.rating ? (<><StarIcon />{c.rating.toFixed(1)}</>) : (<><StarIcon style={{ opacity: .4 }} />–</>)}</span></td>
                        <td className="num mono">{eur(c.ltvCents)}</td>
                        <td className="num"><span className={`pill ${c.status}`}>{STATUS_LABEL[c.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {companiesData && companiesData.total > companyItems.length && (
                <p className="csub" style={{ margin: '10px 0 0' }}>Showing {companyItems.length} of {companiesData.total} companies.</p>
              )}
            </div>
          </section>

          {/* ============ FORECAST ============ */}
          <section className={`panel${activeTab === 'forecast' ? ' on' : ''}`}>
            <p className="csub" style={{ marginBottom: 14 }}>
              Demo data — forecasting and cohort tracking aren't built yet, this tab isn't wired to real numbers.
            </p>
            <div className="kpis mb">
              <div className="kpi hero"><div className="kl">Projected sales (next 30d)</div><div className="kn">~€6,900</div><div className="kd up">~740 credits</div></div>
              <div className="kpi"><div className="kl">Companies expiring soon</div><div className="kn">22</div><div className="kd warn">near-empty in 30d</div></div>
              <div className="kpi"><div className="kl">Reactivation targets</div><div className="kn">46</div><div className="kd">dormant, win back</div></div>
              <div className="kpi"><div className="kl">Revenue at risk</div><div className="kn">€18k</div><div className="kd down">top accounts' runway</div></div>
            </div>
            <div className="grid2 mb">
              <div className="card">
                <div className="card-h"><h3>Projected vs actual credit sales</h3><span className="tag">CREDITS</span></div>
                <div className="bars">
                  <div className="bcol"><div className="bwrap"><div className="bar gold" style={{ height: '70%' }} /></div><span className="bv">560</span><span className="bx">May</span></div>
                  <div className="bcol"><div className="bwrap"><div className="bar gold" style={{ height: '78%' }} /></div><span className="bv">620</span><span className="bx">Jun</span></div>
                  <div className="bcol"><div className="bwrap"><div className="bar gold" style={{ height: '86%' }} /></div><span className="bv">680</span><span className="bx">Jul</span></div>
                  <div className="bcol"><div className="bwrap"><div className="bar blue" style={{ height: '93%', opacity: .55 }} /></div><span className="bv">740</span><span className="bx">Aug*</span></div>
                </div>
                <div className="note green" style={{ marginTop: 12 }}>Forecast from aggregate burn + company runway. <b>Aug ≈ 740 credits (~€6,900)</b>.</div>
              </div>
              <div className="card">
                <h3>Cohort retention</h3><div className="csub">% of a sign-up month's companies still buying</div>
                <div className="cohort">
                  <table>
                    <thead><tr><th>Cohort</th><th className="num">M0</th><th className="num">M1</th><th className="num">M3</th><th className="num">M6</th></tr></thead>
                    <tbody>
                      <tr><td>Feb</td><td className="num"><span className="cell" style={{ background: '#2f9e69', padding: '.3em .5em' }}>100</span></td><td className="num"><span className="cell" style={{ background: '#54ac7f', padding: '.3em .5em' }}>72</span></td><td className="num"><span className="cell" style={{ background: '#8fbfa2', padding: '.3em .5em' }}>58</span></td><td className="num"><span className="cell" style={{ background: '#b9d3c4', padding: '.3em .5em', color: '#234' }}>49</span></td></tr>
                      <tr><td>Mar</td><td className="num"><span className="cell" style={{ background: '#2f9e69', padding: '.3em .5em' }}>100</span></td><td className="num"><span className="cell" style={{ background: '#4ba878', padding: '.3em .5em' }}>75</span></td><td className="num"><span className="cell" style={{ background: '#84baa0', padding: '.3em .5em' }}>61</span></td><td className="num" style={{ color: 'var(--adp-slate-2)' }}>–</td></tr>
                      <tr><td>Apr</td><td className="num"><span className="cell" style={{ background: '#2f9e69', padding: '.3em .5em' }}>100</span></td><td className="num"><span className="cell" style={{ background: '#46a675', padding: '.3em .5em' }}>77</span></td><td className="num" style={{ color: 'var(--adp-slate-2)' }}>–</td><td className="num" style={{ color: 'var(--adp-slate-2)' }}>–</td></tr>
                      <tr><td>May</td><td className="num"><span className="cell" style={{ background: '#2f9e69', padding: '.3em .5em' }}>100</span></td><td className="num"><span className="cell" style={{ background: '#40a271', padding: '.3em .5em' }}>80</span></td><td className="num" style={{ color: 'var(--adp-slate-2)' }}>–</td><td className="num" style={{ color: 'var(--adp-slate-2)' }}>–</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="note green" style={{ marginTop: 12 }}>M1 retention improving (72% → 80%) — newer companies stick better.</div>
              </div>
            </div>
            <div className="card">
              <h3>Action list</h3><div className="csub">What to do this week, ranked by revenue impact</div>
              <div className="alerts">
                <div className="alert warn">
                  <span className="ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 4 6v6c0 5 8 10 8 10s8-5 8-10V6z" /></svg></span>
                  <div className="at"><b>14 companies run dry within a month</b><span>Send low-credit nudge / auto-refill offer</span></div>
                  <span className="aa">+ ~€3.9k</span>
                </div>
                <div className="alert bad">
                  <span className="ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  <div className="at"><b>Recruit React · Belgrade &amp; DevOps · Remote</b><span>Demand outruns supply — companies waste searches</span></div>
                  <span className="aa">retention</span>
                </div>
                <div className="alert good">
                  <span className="ai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /></svg></span>
                  <div className="at"><b>Win back 46 dormant companies</b><span>No purchase in 30+ days — targeted re-activation</span></div>
                  <span className="aa">+ ~€6k</span>
                </div>
              </div>
            </div>
          </section>

          <p className="foot-note">Overview/Purchases/Burn/Supply/Companies are live data · Forecast tab is demo data.</p>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
