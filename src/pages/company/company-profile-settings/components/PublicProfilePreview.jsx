import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import Stars from '../../../candidate/company-details/Stars';
import styles from '../styles/company.module.scss';
import './previewStars.css';

const CATS = [
  { key: 'process', label: 'Hiring process' },
  { key: 'comms', label: 'Communication' },
  { key: 'culture', label: 'Work culture' },
  { key: 'benefits', label: 'Benefits' },
];

// green on a high percentage, amber in the middle, red at 60% and below
const wageRateClass = (pct) => (pct <= 60 ? 'red' : pct < 85 ? 'amber' : 'green');

const PublicProfilePreview = ({ companyData, reputationData, isVisible, onClose }) => {
  const [tab, setTab] = useState('about');

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  useEffect(() => {
    if (isVisible) setTab('about');
  }, [isVisible]);

  if (!isVisible) return null;

  const location = [companyData?.location, companyData?.country].filter(Boolean).join(', ');
  const initial = (companyData?.name || 'C').trim().charAt(0).toUpperCase();

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose?.(); }}
    >
      <div className={styles.pmodal} role="dialog" aria-modal="true" aria-labelledby="ppModalTitle">
        <div className={styles.pmodalHead}>
          <div>
            <p className={styles.pmodalEyebrow}>Preview</p>
            <h3 id="ppModalTitle">Public company profile</h3>
            <p>This is how candidates see your company on the platform.</p>
          </div>
          <button className={styles.pmodalClose} onClick={onClose} aria-label="Close">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className={styles.pmodalBody}>
          {/* Identity */}
          <div className={styles.dCo}>
            <div className={styles.dCoLogo}>
              {companyData?.logo ? (
                <Image src={companyData?.logo} alt={companyData?.name} className={styles.dCoLogoImg} />
              ) : (
                initial
              )}
            </div>

            <div className={styles.dCoMain}>
              <div className={styles.dCoName}>{companyData?.name || 'Company name'}</div>
              <div className={styles.dCoMeta}>
                {[companyData?.industry, location].filter(Boolean).join(' · ') || 'Industry · Location'}
              </div>
            </div>

            <div className={styles.dCoRating}>
              <div className={styles.dCoStars}>
                <span className="ppStars"><Stars rating={reputationData?.overallRating ?? 0} /></span>
                <span className={styles.dNum}>{(reputationData?.overallRating ?? 0).toFixed(1)}</span>
              </div>
              <div className={styles.dReviewsCount}>{reputationData?.totalReviews ?? 0} reviews</div>
            </div>
          </div>

          {/* Work mode + flexible hours badges */}
          {(companyData?.workMode || companyData?.flexibleHours) && (
            <div className={styles.dBadgeRow}>
              {companyData?.workMode && (
                <span className={styles.dBadge}>
                  <Icon name="MapPin" size={13} />
                  {companyData.workMode}
                </span>
              )}
              {companyData?.flexibleHours && (
                <span className={`${styles.dBadge} ${styles.dBadgeBlue}`}>
                  <Icon name="Clock" size={13} />
                  Flexible working hours
                </span>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className={styles.dTabs}>
            <button type="button" className={tab === 'about' ? styles.on : ''} onClick={() => setTab('about')}>
              About the company
            </button>
            <button type="button" className={tab === 'reputation' ? styles.on : ''} onClick={() => setTab('reputation')}>
              Reputation
            </button>
          </div>

          {tab === 'about' ? (
            <>
              {/* Stats */}
              <div className={`${styles.dStats} ${styles.five}`}>
                <div className={styles.dStat}>
                  <div className={styles.dStatN}>{(companyData?.size || '—')?.replace(/\s*employees\s*$/i, '')}</div>
                  <span className={styles.dStatL}>Employees</span>
                </div>
                <div className={styles.dStat}>
                  <div className={styles.dStatN}>{companyData?.foundedYear || '—'}</div>
                  <span className={styles.dStatL}>Founded</span>
                </div>
                <div className={styles.dStat}>
                  <div className={`${styles.dStatN} ${styles.green}`}>{reputationData?.successfulHires ?? 0}</div>
                  <span className={styles.dStatL}>Hires</span>
                </div>
                <div className={styles.dStat}>
                  <div className={`${styles.dStatN} ${styles.gold}`}>{reputationData?.recommendationRate ?? 0}%</div>
                  <span className={styles.dStatL}>Recommends</span>
                </div>
                {typeof reputationData?.minWageRate === 'number' && (
                  <div className={styles.dStat}>
                    <div className={`${styles.dStatN} ${styles[wageRateClass(reputationData.minWageRate)]}`}>{reputationData.minWageRate}%</div>
                    <span className={styles.dStatL}>Profile salary</span>
                  </div>
                )}
              </div>

              {/* About */}
              <div className={styles.dSecTitle}>About the company</div>
              <p className={styles.dAbout}>
                {companyData?.detailedDescription || companyData?.shortDescription || 'Detailed company description, mission, vision, and values...'}
              </p>

              {/* Benefits */}
              {companyData?.benefits?.length > 0 && (
                <>
                  <div className={styles.dSecTitle}>Benefits</div>
                  <div className={styles.dChips}>
                    {companyData.benefits.map((benefit) => (
                      <span key={benefit} className={styles.dChip}>
                        <Icon name="Check" size={12} style={{ color: '#2f9e69' }} />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Contact */}
              <div className={styles.dContact}>
                <div className={styles.dContactRow}>
                  <span className={styles.dContactItem}>
                    <Icon name="Globe" size={15} />
                    {companyData?.website || 'www.yoursite.com'}
                  </span>
                  <span className={styles.dContactItem}>
                    <Icon name="Mail" size={15} />
                    {companyData?.contactEmail || 'contact@yoursite.com'}
                  </span>
                  <span className={styles.dContactItem}>
                    <Icon name="MapPin" size={15} />
                    {companyData?.address || 'Company address'}
                  </span>
                  <span className={styles.dContactItem}>
                    <Icon name="Phone" size={15} />
                    {companyData?.phone || '+381 11 123 4567'}
                  </span>
                </div>
                {(companyData?.registrationNumber || companyData?.pib) && (
                  <div className={styles.dContactLegal}>
                    <Icon name="FileText" size={15} />
                    <span>
                      {companyData?.registrationNumber && <>Registration number: <b>{companyData.registrationNumber}</b></>}
                      {companyData?.registrationNumber && companyData?.pib && ' · '}
                      {companyData?.pib && <>Tax ID: <b>{companyData.pib}</b></>}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Reputation stats */}
              <div className={`${styles.dStats} ${styles.five}`}>
                <div className={styles.dStat}>
                  <div className={`${styles.dStatN} ${styles.gold}`}>{(reputationData?.overallRating ?? 0).toFixed(1)}</div>
                  <span className={styles.dStatL}>Average rating</span>
                </div>
                <div className={styles.dStat}>
                  <div className={styles.dStatN}>{reputationData?.totalReviews ?? 0}</div>
                  <span className={styles.dStatL}>Reviews</span>
                </div>
                <div className={styles.dStat}>
                  <div className={`${styles.dStatN} ${styles.green}`}>{reputationData?.successfulHires ?? 0}</div>
                  <span className={styles.dStatL}>Hires</span>
                </div>
                <div className={styles.dStat}>
                  <div className={`${styles.dStatN} ${styles.gold}`}>{reputationData?.recommendationRate ?? 0}%</div>
                  <span className={styles.dStatL}>Recommends</span>
                </div>
                {typeof reputationData?.minWageRate === 'number' && (
                  <div className={styles.dStat}>
                    <div className={`${styles.dStatN} ${styles[wageRateClass(reputationData.minWageRate)]}`}>{reputationData.minWageRate}%</div>
                    <span className={styles.dStatL}>Profile salary</span>
                  </div>
                )}
              </div>

              {/* Reviews — two examples are enough for a preview */}
              <div className={styles.dRevHead}>
                <span className={styles.dRevLine} />
              </div>
              <div className={styles.dRevGrid}>
                {reputationData?.recentReviews?.slice(0, 2)?.map((review, index) => (
                  <div key={index} className={styles.dRevCard}>
                    <div className={styles.dRevTop}>
                      <div>
                        <div className={styles.dRevRole}>{review?.position}</div>
                        <div className={styles.dRevDept}>{review?.department}</div>
                      </div>
                      <div className={styles.dRevOverall}>
                        <span className={styles.dRevNum}>{(review?.rating ?? 0).toFixed(1)}</span>
                        <span className="ppStars sm"><Stars rating={review?.rating ?? 0} /></span>
                      </div>
                    </div>

                    {review?.cats && (
                      <div className={styles.dRevCats}>
                        {CATS.map((cat) => (
                          <div key={cat.key} className={styles.dRevCat}>
                            <span className={styles.dRevCatLabel}>{cat.label}</span>
                            <span className="ppStars sm"><Stars rating={review.cats[cat.key] ?? 0} /></span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className={styles.dRevText}>{review?.comment}</p>
                    <div className={`${styles.dRevWage} ${review?.minWageRespected ? styles.ok : styles.bad}`}>
                      {review?.minWageRespected ? '✓ Minimum salary from profile: honored' : '✗ Minimum salary from profile: not honored'}
                    </div>
                    <div className={styles.dRevDate}>{review?.reviewDate}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePreview;
