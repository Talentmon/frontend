import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { getCompanyById, getCompanyReviews, companyToDetails, reviewToFrontend } from '../companiesApi';
import CandidateHeader from 'components/ui/CandidateHeader';
import Stars from './Stars';
import './styles.scss';

// green on a high percentage, amber in the middle, red at 60% and below
const wageRateClass = (pct) => (pct <= 60 ? 'red' : pct < 85 ? 'amber' : 'green');

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

const CompanyDetails = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('about');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCompanyById(companyId), getCompanyReviews(companyId, { limit: 2 })])
      .then(([c, revData]) => {
        if (cancelled) return;
        setCompany(companyToDetails(c));
        setReviews(revData.items.map(reviewToFrontend));
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
        <title>{company.name} · Talentmon</title>
      </Helmet>

      <CandidateHeader />

      <main className="page">
        <div className="wrap">
          <Link to="/company-list" className="cpf-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
            Back to company list
          </Link>

          <article className="card">
            {/* identity */}
            <div className="co">
              <div className="co-logo" style={{ background: company.color }}>{company.initial}</div>
              <div className="co-main">
                <h2 className="co-name">{company.name}</h2>
                <div className="co-meta">{company.industry} · {company.location}</div>
              </div>
              <div className="co-rating">
                <div className="co-stars">
                  <Stars rating={company.rating} />
                  <span className="num">{company.rating.toFixed(1)}</span>
                </div>
                <div className="co-reviews">{company.totalReviews} reviews</div>
              </div>
            </div>

            {/* work mode + flexible hours badges */}
            {(company.workMode || company.flexibleHours) && (
              <div className="co-badges">
                {company.workMode && (
                  <span className="co-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
                    {company.workMode}
                  </span>
                )}
                {company.flexibleHours && (
                  <span className="co-badge co-badge-blue">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
                    Flexible working hours
                  </span>
                )}
              </div>
            )}

            {/* tabs */}
            <div className="cpf-tabs">
              <button type="button" className={tab === 'about' ? 'on' : ''} onClick={() => setTab('about')}>About the company</button>
              <button type="button" className={tab === 'reputation' ? 'on' : ''} onClick={() => setTab('reputation')}>Reputation</button>
            </div>

            {tab === 'about' ? (
              <>
                {/* stats */}
                <div className="co-stats">
                  <div className="co-stat"><div className="n">{company.employeesRange}</div><span className="l">Employees</span></div>
                  <div className="co-stat"><div className="n">{company.founded}</div><span className="l">Founded</span></div>
                  <div className="co-stat"><div className="n green">{company.hires}</div><span className="l">Hires</span></div>
                  <div className="co-stat"><div className="n gold">{company.recommendRate}%</div><span className="l">Recommends</span></div>
                  {typeof company.minWageRate === 'number' && (
                    <div className="co-stat"><div className={`n ${wageRateClass(company.minWageRate)}`}>{company.minWageRate}%</div><span className="l">Profile salary</span></div>
                  )}
                </div>

                {/* about */}
                <div className="sec-t">About the company</div>
                <p className="about">{company.about}</p>

                {/* benefits */}
                {company.benefits?.length > 0 && (
                  <>
                    <div className="sec-t">Benefits</div>
                    <div className="cpf-chips">
                      {company.benefits.map(b => (
                        <span key={b} className="cpf-chip">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          {b}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* contact */}
                <div className="contact">
                  <div className="contact-row">
                    {company.website && (
                      <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
                        {company.website}
                      </a>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                        {company.email}
                      </a>
                    )}
                    {company.address && (
                      <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                        {company.address}
                      </span>
                    )}
                    {company.phone && (
                      <a href={`tel:${company.phone.replace(/\s/g, '')}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z" /></svg>
                        {company.phone}
                      </a>
                    )}
                  </div>
                  {(company.registrationNumber || company.pib) && (
                    <span className="contact-legal">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                      <span>
                        {company.registrationNumber && <>Registration number: <b>{company.registrationNumber}</b></>}
                        {company.registrationNumber && company.pib && ' · '}
                        {company.pib && <>Tax ID: <b>{company.pib}</b></>}
                      </span>
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* reputation stats */}
                <div className="co-stats">
                  <div className="co-stat"><div className="n gold">{company.rating.toFixed(1)}</div><span className="l">Average rating</span></div>
                  <div className="co-stat"><div className="n">{company.totalReviews}</div><span className="l">Reviews</span></div>
                  <div className="co-stat"><div className="n green">{company.hires}</div><span className="l">Hires</span></div>
                  <div className="co-stat"><div className="n gold">{company.recommendRate}%</div><span className="l">Recommends</span></div>
                  {typeof company.minWageRate === 'number' && (
                    <div className="co-stat"><div className={`n ${wageRateClass(company.minWageRate)}`}>{company.minWageRate}%</div><span className="l">Profile salary</span></div>
                  )}
                </div>

                {/* reviews */}
                <div className="cpf-revhead">
                  <span className="cpf-revline" />
                  <Link to={`/company-details/${company.id}/reviews`} className="cpf-seeall cpf-seeall-lg">See all reviews</Link>
                </div>
                {reviews.length === 0 ? (
                  <p className="about">No reviews yet.</p>
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
              </>
            )}
          </article>
        </div>
      </main>
    </div>
  );
};

export default CompanyDetails;
