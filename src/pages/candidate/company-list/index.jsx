import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import CandidateHeader from 'components/ui/CandidateHeader';
import Select from 'components/ui/Select';
import { listCompanies, getCompanyFilterOptions, companyToListCard } from '../companiesApi';
import './styles.scss';

const RATING_OPTIONS = [
  { value: '4+', label: '4+' },
  { value: '3-4', label: '3–4' },
  { value: '2-3', label: '2–3' },
  { value: '1-2', label: '1–2' },
  { value: '<1', label: '< 1' },
];

// green on a high percentage, amber in the middle, red at 60% and below
const wageRateClass = (pct) => (pct <= 60 ? 'red' : pct < 85 ? 'amber' : 'green');

const SALARY_OPTIONS = [
  { value: 'above90', label: 'Honored above 90%' },
  { value: '80-90', label: 'Honored 80–90%' },
  { value: '60-80', label: 'Honored 60–80%' },
  { value: '40-60', label: 'Honored 40–60%' },
  { value: 'below40', label: 'Honored below 40%' },
];

const CompanyList = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [minRating, setMinRating] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  const [filterOptions, setFilterOptions] = useState({ locations: [], industries: [], sizes: [] });
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getCompanyFilterOptions().then(setFilterOptions).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = {
    search: debouncedSearch || undefined,
    location: location || undefined,
    industry: industry || undefined,
    size: size || undefined,
    minRating: minRating || undefined,
    salaryRange: salaryRange || undefined,
    sort: sortOrder || undefined,
  };
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    listCompanies({ ...query, page: 1 })
      .then((data) => {
        setCompanies(data.items.map(companyToListCard));
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    listCompanies({ ...query, page: nextPage })
      .then((data) => {
        setCompanies((prev) => [...prev, ...data.items.map(companyToListCard)]);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const resetFilters = () => {
    setSearch('');
    setLocation('');
    setIndustry('');
    setSize('');
    setMinRating('');
    setSalaryRange('');
    setSortOrder('');
  };

  const hasActiveFilters = search || location || industry || size || minRating || salaryRange || sortOrder;

  return (
    <div className="cl-page">
      <Helmet>
        <title>Companies · Talentmon</title>
      </Helmet>

      <CandidateHeader />

      <main className="page">
        <div className="wrap">
          {/* ===== COMPANIES ===== */}
          <section className="companies" id="companies">
            <div className="co-head">
              <div>
                <h2>Companies on Talentmon</h2>
                <p>These employers are actively sourcing here. Any of them could discover your profile — except the one you work for.</p>
              </div>
              <span className="co-count">{companies.length} of {total} companies</span>
            </div>

            {/* ===== FILTERS ===== */}
            <div className="co-filters">
              <div className="co-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input
                  type="text"
                  placeholder="Search companies by name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={location}
                onChange={setLocation}
                placeholder="Location"
                clearable
                options={filterOptions.locations.map((loc) => ({ value: loc, label: loc }))}
              />
              <Select
                value={industry}
                onChange={setIndustry}
                placeholder="Industry"
                clearable
                options={filterOptions.industries.map((ind) => ({ value: ind, label: ind }))}
              />
              <Select className="size-select" value={size} onChange={setSize} placeholder="Size" clearable options={filterOptions.sizes} />
              <Select value={minRating} onChange={setMinRating} placeholder="Rating" clearable listClassName="rating-list" options={RATING_OPTIONS} />
              <Select value={salaryRange} onChange={setSalaryRange} placeholder="Candidate salary" clearable options={SALARY_OPTIONS} />
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                placeholder="Sort"
                clearable
                options={[
                  { value: 'asc', label: 'Name A–Z' },
                  { value: 'desc', label: 'Name Z–A' },
                ]}
              />
              {hasActiveFilters && (
                <button type="button" className="co-clear" onClick={resetFilters}>Clear filters</button>
              )}
            </div>

            {loading ? (
              <div className="co-empty">
                <p>Loading companies…</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="co-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <p>No companies match your filters.</p>
                <button type="button" className="co-clear" onClick={resetFilters}>Clear filters</button>
              </div>
            ) : (
              <>
                <div className="co-grid">
                  {companies.map((c) => (
                    <Link key={c.id} to={`/company-details/${c.id}`} className={`co-card${c.mine ? ' mine' : ''}`}>
                      {c.mine && <span className="co-mine">YOUR EMPLOYER</span>}
                      <div className="co-logo" style={{ background: c.color }}>{c.initial}</div>
                      <div className="co-name">{c.name}</div>
                      <div className="co-meta">{c.industry} · {c.location}</div>
                      <div className="co-tags">
                        <span className="co-tag">{c.sizeLabel} employees</span>
                        <span className="co-tag rating"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3 1.2-6.9-5-4.9 6.9-1z" /></svg>{c.rating.toFixed(1)}</span>
                        {typeof c.minWageRate === 'number' && (
                          <span className={`co-tag wage ${wageRateClass(c.minWageRate)}`}>Candidate salary: honored {c.minWageRate}%</span>
                        )}
                      </div>
                      {c.mine ? (
                        <div className="co-hidden"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Can&apos;t see you</div>
                      ) : c.hiring ? (
                        <div className="co-foot"><span className="pdot" />Actively hiring</div>
                      ) : null}
                    </Link>
                  ))}
                </div>
                {page < totalPages && (
                  <div className="co-loadmore">
                    <button type="button" className="co-clear" disabled={loadingMore} onClick={loadMore}>
                      {loadingMore ? 'Loading…' : 'Load more companies'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default CompanyList;
