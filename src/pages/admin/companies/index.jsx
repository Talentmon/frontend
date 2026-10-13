import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import AdminAppBar from '../components/AdminAppBar';
import {
  getMe,
  getCompanyDirectory,
  getCompanyMatches,
  confirmCompanyMatch,
  rejectCompanyMatch,
  companyVisual,
  shortDate,
  ROLE_LABEL,
  COMPANY_SIZE_LABEL,
  DELETION_REASON_LABEL,
  MATCH_SIGNAL_LABEL,
  STRONG_MATCH_SIGNALS,
} from '../adminApi';
import '../styles.scss';
import './companies.scss';

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
);

const reviewsLabel = (reviews) =>
  reviews?.total ? (
    <span className="rate"><StarIcon />{reviews.averageRating.toFixed(1)} <span className="co-sub-inline">· {reviews.total}</span></span>
  ) : (
    <span className="muted">No reviews</span>
  );

const place = (c) => [c.location, c.country].filter(Boolean).join(', ') || '—';

const host = (url) => {
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};
const emailDomains = (c) => [c.email, c.contactEmail].filter(Boolean).map((e) => e.split('@')[1]?.toLowerCase()).filter(Boolean);

// Basic + Contact information, in the order of the company's settings page.
// `signals` marks the rows a match highlights on the Possible matches tab.
const PROFILE_FIELDS = [
  { key: 'name', label: 'Company name', signals: ['NAME'] },
  { key: 'email', label: 'Company email', signals: ['EMAIL', 'EMAIL_DOMAIN'] },
  { key: 'foundedYear', label: 'Year founded', signals: ['FOUNDED_YEAR'] },
  { key: 'industry', label: 'Industry', signals: ['INDUSTRY'] },
  { key: 'size', label: 'Company size', signals: ['SIZE'], format: (v) => (v ? `${COMPANY_SIZE_LABEL[v]} employees` : null) },
  { key: 'location', label: 'City', signals: ['CITY'] },
  { key: 'country', label: 'Country', signals: ['COUNTRY'] },
  { key: 'address', label: 'Address', signals: ['ADDRESS'] },
  { key: 'registrationNumber', label: 'Registration number', signals: ['REGISTRATION_NUMBER'] },
  { key: 'pib', label: 'Tax ID', signals: ['TAX_ID'] },
  { key: 'contactEmail', label: 'Contact email', signals: ['EMAIL', 'EMAIL_DOMAIN'] },
  { key: 'phone', label: 'Phone', signals: ['PHONE'] },
  { key: 'linkedinUrl', label: 'LinkedIn', signals: ['LINKEDIN'], link: true },
  { key: 'website', label: 'Website', signals: ['WEBSITE'], link: true },
];

const fieldValue = (field, company) => {
  const raw = company[field.key];
  const value = field.format ? field.format(raw) : raw;
  if (value === null || value === undefined || value === '') return <span className="muted">—</span>;
  if (field.link) {
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return <a href={href} target="_blank" rel="noreferrer">{value}</a>;
  }
  return String(value);
};

const CompanyDetails = ({ company }) => (
  <dl className="dir-grid">
    {PROFILE_FIELDS.map((field) => (
      <div key={field.key}>
        <dt>{field.label}</dt>
        <dd>{fieldValue(field, company)}</dd>
      </div>
    ))}
    <div><dt>Registered</dt><dd>{shortDate(company.createdAt)}</dd></div>
    {company.deletedAt && (
      <>
        <div><dt>Deleted</dt><dd>{shortDate(company.deletedAt)}</dd></div>
        <div><dt>Reason</dt><dd>{DELETION_REASON_LABEL[company.deletionReason] || '—'}</dd></div>
        {company.deletionComment && <div className="wide"><dt>Comment</dt><dd>{company.deletionComment}</dd></div>}
      </>
    )}
  </dl>
);

const CompanyCell = ({ company }) => {
  const visual = companyVisual(company.id, company.name);
  return (
    <div className="co-cell">
      <span className="co-logo" style={{ background: visual.color }}>{visual.initial}</span>
      <div>
        <b>{company.name}</b>
        <span className="co-sub">{company.email}</span>
      </div>
    </div>
  );
};

const DirectoryTable = ({ status, items, expandedId, onToggle }) => {
  const deleted = status === 'deleted';
  const columns = deleted ? 7 : 8;
  if (!items.length) return <p className="dir-empty">No companies found.</p>;
  return (
    <div className="tbl-scroll">
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Location</th>
            <th>Industry</th>
            {deleted ? (
              <>
                <th>Deleted</th>
                <th>Reason</th>
              </>
            ) : (
              <>
                <th>Size</th>
                <th className="num">Team</th>
              </>
            )}
            <th>Reviews</th>
            <th>Registered</th>
            {!deleted && <th aria-label="Profile status" />}
          </tr>
        </thead>
        <tbody>
          {items.map((c) => {
            const open = expandedId === c.id;
            return (
              <Fragment key={c.id}>
                <tr
                  className={`dir-row${open ? ' open' : ''}`}
                  tabIndex={0}
                  aria-expanded={open}
                  onClick={() => onToggle(c.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(c.id); } }}
                >
                  <td><CompanyCell company={c} /></td>
                  <td>{place(c)}</td>
                  <td>{c.industry || '—'}</td>
                  {deleted ? (
                    <>
                      <td>{shortDate(c.deletedAt)}</td>
                      <td>{DELETION_REASON_LABEL[c.deletionReason] || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td>{c.size ? COMPANY_SIZE_LABEL[c.size] : '—'}</td>
                      <td className="num mono">{c.teamSize}</td>
                    </>
                  )}
                  <td>{reviewsLabel(c.reviews)}</td>
                  <td>{shortDate(c.createdAt)}</td>
                  {!deleted && <td>{c.missingFields?.length > 0 && <span className="pill incomplete">Profile incomplete</span>}</td>}
                </tr>
                {open && (
                  <tr className="dir-detail">
                    <td colSpan={columns}><CompanyDetails company={c} /></td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const signalText = (signal, match) => {
  const label = MATCH_SIGNAL_LABEL[signal] || signal;
  if (signal === 'EMAIL_DOMAIN') {
    const domains = emailDomains(match.deletedCompany);
    const shared = emailDomains(match.company).find((d) => domains.includes(d));
    return shared ? `${label} · ${shared}` : label;
  }
  if (signal === 'WEBSITE') {
    const site = host(match.company.website);
    return site ? `${label} · ${site}` : label;
  }
  return label;
};

const MatchCard = ({ match, busy, onConfirm, onReject }) => {
  const { company, deletedCompany, signals } = match;
  const hit = (field) => field.signals.some((s) => signals.includes(s));
  const moving = deletedCompany.reviews?.total || 0;
  return (
    <div className="card match">
      <div className="match-head">
        <div>
          <h3>{company.name} <span className="match-vs">looks like</span> {deletedCompany.name}</h3>
          <div className="csub" style={{ margin: 0 }}>Suggested {shortDate(match.createdAt)}</div>
        </div>
        <div className="sig-list">
          {signals.map((s) => (
            <span key={s} className={`sig${STRONG_MATCH_SIGNALS.has(s) ? ' strong' : ''}`}>{signalText(s, match)}</span>
          ))}
        </div>
      </div>

      <div className="tbl-scroll">
        <table className="cmp">
          <thead>
            <tr>
              <th />
              <th>New company <span className="pill active">Active</span></th>
              <th>Deleted company <span className="pill deleted">Deleted</span></th>
            </tr>
          </thead>
          <tbody>
            {PROFILE_FIELDS.map((field) => (
              <tr key={field.key} className={hit(field) ? 'hit' : ''}>
                <th scope="row">{hit(field) && <span className="hit-mark" aria-label="matches">✓</span>}{field.label}</th>
                <td>{fieldValue(field, company)}</td>
                <td>{fieldValue(field, deletedCompany)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Registered</th>
              <td>{shortDate(company.createdAt)}</td>
              <td>{shortDate(deletedCompany.createdAt)}</td>
            </tr>
            <tr>
              <th scope="row">Deleted</th>
              <td className="muted">—</td>
              <td>
                {shortDate(deletedCompany.deletedAt)}
                {deletedCompany.deletionReason && <> · {DELETION_REASON_LABEL[deletedCompany.deletionReason]}</>}
                {deletedCompany.deletionComment && <span className="co-sub">“{deletedCompany.deletionComment}”</span>}
              </td>
            </tr>
            <tr>
              <th scope="row">Reviews</th>
              <td>{reviewsLabel(company.reviews)}</td>
              <td>{reviewsLabel(deletedCompany.reviews)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="match-actions">
        <span className="match-q">Is this the same company?</span>
        <div className="match-btns">
          <button type="button" className="btn-no" disabled={busy} onClick={() => onReject(match)}>No, different companies</button>
          <button type="button" className="btn-yes" disabled={busy} onClick={() => onConfirm(match)}>
            {moving > 0 ? `Yes — move ${moving} ${moving === 1 ? 'review' : 'reviews'}` : 'Yes, same company'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminCompanies = () => {
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [directory, setDirectory] = useState(null);
  const [counts, setCounts] = useState(null);
  const [matches, setMatches] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // The directory call also brings the tab counts, so it runs on every tab.
  const loadDirectory = useCallback(() => {
    const status = tab === 'deleted' ? 'deleted' : 'active';
    setError('');
    return getCompanyDirectory({ status, search: tab === 'matches' ? undefined : debouncedSearch })
      .then((data) => {
        setCounts(data.counts);
        if (tab !== 'matches') setDirectory({ status, ...data });
      })
      .catch(() => setError('Could not load companies — please refresh.'));
  }, [tab, debouncedSearch]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (tab !== 'matches') return;
    getCompanyMatches()
      .then(setMatches)
      .catch(() => setError('Could not load possible matches — please refresh.'));
  }, [tab]);

  const switchTab = (next) => {
    setTab(next);
    setSearch('');
    setDebouncedSearch('');
    setExpandedId(null);
    setFlash(null);
  };

  const decide = async (match, confirmed) => {
    if (confirmed) {
      const n = match.deletedCompany.reviews?.total || 0;
      const ok = window.confirm(
        `${match.company.name} and ${match.deletedCompany.name} are the same company?\n\n` +
          (n > 0
            ? `${match.deletedCompany.name}'s ${n} ${n === 1 ? 'review moves' : 'reviews move'} to ${match.company.name} (where a candidate reviewed both, their newer review is kept). This can't be undone.`
            : 'There are no reviews to move.'),
      );
      if (!ok) return;
    }
    setBusyId(match.id);
    setFlash(null);
    try {
      if (confirmed) {
        const result = await confirmCompanyMatch(match.id);
        const moved = result.movedReviews > 0
          ? `${result.movedReviews} ${result.movedReviews === 1 ? 'review' : 'reviews'} moved to ${match.company.name}.`
          : `Confirmed — no reviews needed moving to ${match.company.name}.`;
        const twice = result.reviewsReviewedTwice > 0
          ? ` ${result.reviewsReviewedTwice} ${result.reviewsReviewedTwice === 1 ? 'candidate had' : 'candidates had'} reviewed both — their newer review was kept.`
          : '';
        setFlash({ kind: 'ok', text: moved + twice });
      } else {
        await rejectCompanyMatch(match.id);
        setFlash({ kind: 'ok', text: `Marked as different companies — ${match.company.name} won't be suggested with ${match.deletedCompany.name} again.` });
      }
      setMatches((prev) => prev.filter((m) => m.id !== match.id));
      setCounts((prev) => (prev ? { ...prev, pendingMatches: Math.max(0, prev.pendingMatches - 1) } : prev));
    } catch (err) {
      setFlash({ kind: 'err', text: err?.response?.data?.message || 'Could not save the decision — please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { id: 'active', label: 'All companies', count: counts?.active },
    { id: 'deleted', label: 'Deleted companies', count: counts?.deleted },
    { id: 'matches', label: 'Possible matches', count: counts?.pendingMatches, highlight: counts?.pendingMatches > 0 },
  ];
  const showDirectory = tab !== 'matches' && directory?.status === tab;

  return (
    <div className="admin-panel">
      <Helmet>
        <title>Companies · Talentmon Admin</title>
      </Helmet>

      <AdminAppBar
        name={me?.name || undefined}
        email={me?.email}
        role={me?.role ? ROLE_LABEL[me.role] : undefined}
        pendingMatches={counts?.pendingMatches}
      />

      <main className="page">
        <div className="wrap">
          <div className="phead">
            <div>
              <h1>Companies</h1>
              <p>Every company on Talentmon — active, deleted, and deleted ones that may have registered again.</p>
            </div>
          </div>

          <div className="tabs">
            {tabs.map((t) => (
              <button key={t.id} type="button" className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => switchTab(t.id)}>
                {t.label}
                {t.count !== undefined && <span className={`tcount${t.highlight ? ' hot' : ''}`}>{t.count}</span>}
              </button>
            ))}
          </div>

          {error && <div className="flash err">{error}</div>}
          {flash && <div className={`flash ${flash.kind}`}>{flash.text}</div>}

          {tab !== 'matches' && (
            <div className="card tbl-card">
              <div className="tbl-head">
                <div>
                  <h3>{tab === 'deleted' ? 'Deleted companies' : 'All companies'}</h3>
                  <div className="csub" style={{ margin: 0 }}>
                    {tab === 'deleted'
                      ? 'Hidden from everyone — kept so a company that registers again can be recognised. Click a row for all details.'
                      : 'Basic and contact information as each company entered it. Click a row for all details.'}
                  </div>
                </div>
                <input
                  type="search"
                  className="dir-search"
                  placeholder="Search name, email or website…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {showDirectory ? (
                <>
                  <DirectoryTable
                    status={tab}
                    items={directory.items}
                    expandedId={expandedId}
                    onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
                  />
                  {directory.items.length >= directory.limit && (
                    <p className="dir-empty">Showing the newest {directory.limit} — search to narrow it down.</p>
                  )}
                </>
              ) : (
                !error && <p className="dir-empty">Loading…</p>
              )}
            </div>
          )}

          {tab === 'matches' && (
            <>
              <p className="csub" style={{ marginBottom: 14 }}>
                A company lands here when it shares at least one strong detail (email, email domain, website, registration number,
                tax ID, phone or name) with a deleted company. <b>Yes</b> moves the deleted company&apos;s reviews to the new one;
                <b> No</b> keeps them apart for good.
              </p>
              {matches === null && !error && <p className="dir-empty">Loading…</p>}
              {matches?.length === 0 && (
                <div className="card"><p className="dir-empty" style={{ padding: 0 }}>No possible matches waiting.</p></div>
              )}
              {matches?.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  busy={busyId === match.id}
                  onConfirm={(m) => decide(m, true)}
                  onReject={(m) => decide(m, false)}
                />
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCompanies;
