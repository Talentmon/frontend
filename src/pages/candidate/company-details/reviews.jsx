import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { getCompanyById, getCompanyReviews, companyToDetails, reviewToFrontend } from '../companiesApi';
import CandidateHeader from 'components/ui/CandidateHeader';
import Select from 'components/ui/Select';
import Stars from './Stars';
import './styles.scss';

const CATS = [
  { key: 'process', label: 'Hiring process' },
  { key: 'comms', label: 'Communication' },
  { key: 'culture', label: 'Work culture' },
  { key: 'benefits', label: 'Benefits' },
];

const ThumbsUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12M15 5.88 14 10h6.29a2 2 0 0 1 1.94 2.5l-2.34 9A2 2 0 0 1 18 23H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L13 2a3.13 3.13 0 0 1 3 3.88Z" /></svg>
);

const ThumbsDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2M9 18.12 10 14H3.71a2 2 0 0 1-1.94-2.5l2.34-9A2 2 0 0 1 6 1h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L11 22a3.13 3.13 0 0 1-3-3.88Z" /></svg>
);

const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4+ stars' },
  { value: '3', label: '3+ stars' },
];

const WAGE_OPTIONS = [
  { value: '', label: 'Any review' },
  { value: 'yes', label: 'Minimum salary honored' },
  { value: 'no', label: 'Minimum salary not honored' },
];

const CompanyDetailsReviews = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dept, setDept] = useState('');
  const [minRating, setMinRating] = useState('');
  const [wage, setWage] = useState('');
  const [page, setPage] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCompanyById(companyId)
      .then((c) => {
        if (!cancelled) setCompany(companyToDetails(c));
      })
      .catch(() => {
        if (!cancelled) setCompany(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  useEffect(() => {
    if (!company) return undefined;
    let cancelled = false;
    setReviewsLoading(true);
    getCompanyReviews(companyId, {
      department: dept || undefined,
      minRating: minRating || undefined,
      wage: wage || undefined,
      page,
    })
      .then((data) => {
        if (cancelled) return;
        setReviews(data.items.map(reviewToFrontend));
        setDepartments(data.departments || []);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, company, dept, minRating, wage, page]);

  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const resetFilters = () => {
    setDept('');
    setMinRating('');
    setWage('');
    setPage(1);
  };

  const hasActiveFilters = dept || minRating || wage;

  if (loading) {
    return (
      <div className="cpf-page">
        <CandidateHeader />
        <main className="page">
          <div className="wrap cpf-notfound">
            <p>Loading…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="cpf-page">
        <CandidateHeader />
        <main className="page">
          <div className="wrap cpf-notfound">
            <h2>Company not found</h2>
            <Link to="/company-list" className="btn-back">Back to company list</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="cpf-page">
      <Helmet>
        <title>Reviews · {company.name} · Talentmon</title>
      </Helmet>

      <CandidateHeader />

      <main className="page">
        <div className="wrap">
          <Link to={`/company-details/${company.id}`} className="cpf-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
            Back to company profile
          </Link>

          <article className="card">
            {/* identity */}
            <div className="co">
              <div className="co-logo" style={{ background: company.color }}>{company.initial}</div>
              <div className="co-main">
                <h2 className="co-name">{company.name}</h2>
                <div className="co-meta">All employee reviews</div>
              </div>
              <div className="co-rating">
                <div className="co-stars">
                  <Stars rating={company.rating} />
                  <span className="num">{company.rating.toFixed(1)}</span>
                </div>
                <div className="co-reviews">{company.totalReviews} reviews</div>
              </div>
            </div>

            {/* filters */}
            <div className="rev-filters">
              <Select
                value={dept}
                onChange={updateFilter(setDept)}
                placeholder="All departments"
                options={['', ...departments].map((d) => ({ value: d, label: d || 'All departments' }))}
              />
              <Select value={minRating} onChange={updateFilter(setMinRating)} placeholder="Any rating" options={RATING_OPTIONS} />
              <Select value={wage} onChange={updateFilter(setWage)} placeholder="Any review" options={WAGE_OPTIONS} />
              {hasActiveFilters && (
                <button type="button" className="cpf-seeall" onClick={resetFilters}>Clear filters</button>
              )}
              <span className="rev-filter-count">{reviewsLoading ? '…' : `${total} review${total === 1 ? '' : 's'}`}</span>
            </div>

            {reviewsLoading ? (
              <div className="rev-empty">
                <p>Loading reviews…</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="rev-empty">
                <p>No reviews match the selected filters.</p>
              </div>
            ) : (
              <div className="rev">
                {reviews.map((review, idx) => (
                  <div key={idx} className="rev-card">
                    <div className="rev-top">
                      <div>
                        <div className="rev-role">{review.role}</div>
                        <div className="rev-dept">{review.dept}</div>
                      </div>
                      <div className="rev-overall">
                        <span className="rev-overall-num">{review.rating.toFixed(1)}</span>
                        <span className="rev-stars" aria-label={`${review.rating} out of 5`}>
                          <Stars rating={review.rating} />
                        </span>
                      </div>
                    </div>

                    {review.cats && (
                      <div className="rev-cats">
                        {CATS.map((cat) => (
                          <div key={cat.key} className="rev-cat">
                            <span className="rev-cat-label">{cat.label}</span>
                            <span className="rev-stars" aria-label={`${cat.label}: ${review.cats[cat.key]} out of 5`}>
                              <Stars rating={review.cats[cat.key]} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="rev-text">{review.text}</p>
                    <div className={`rev-wage ${review.minWageRespected ? 'ok' : 'bad'}`}>
                      {review.minWageRespected ? '✓ Minimum salary from profile: honored' : '✗ Minimum salary from profile: not honored'}
                    </div>

                    <div className="rev-foot">
                      <div className="rev-date">{review.date}</div>
                      {review.recommend === true && (
                        <span className="rev-rec yes"><ThumbsUpIcon />Recommend</span>
                      )}
                      {review.recommend === false && (
                        <span className="rev-rec no"><ThumbsDownIcon />Don't recommend</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="rev-pagination">
                <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
};

export default CompanyDetailsReviews;
