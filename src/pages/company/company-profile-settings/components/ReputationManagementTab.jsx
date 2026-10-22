import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import SectionHead from './SectionHead';
import ReviewCard from './ReviewCard';
import styles from '../styles/company.module.scss';

// Newest ratings shown before "Show all ratings".
const PREVIEW_COUNT = 2;

const ReputationManagementTab = ({ reputationData }) => {
  const [showAll, setShowAll] = useState(false);
  const reviews = reputationData?.reviews || [];

  const renderStars = (rating, size = 16) => {
    const stars = [];
    const fullStars = Math.round(rating);

    for (let i = 0; i < 5; i++) {
      stars?.push(
        <Icon
          key={i}
          name="Star"
          size={size}
          className={i < fullStars ? styles.starOn : styles.starOff}
        />
      );
    }
    return stars;
  };

  return (
    <div className={styles.stack}>
      {/* Overall Rating */}
      <div className={styles.card}>
        <SectionHead icon="Star" title="Overall reputation" subtitle="How candidates rate working with you" />

        <div className={styles.repTop}>
          <div className={styles.repScore}>
            <div className={styles.repBig}>{reputationData?.overallRating}</div>
            <div className={styles.repStars}>{renderStars(reputationData?.overallRating, 20)}</div>
            <p className={styles.repBased}>Based on {reputationData?.totalReviews} ratings</p>
          </div>

          <div className={styles.repBreak}>
            {[5, 4, 3, 2, 1]?.map(star => {
              const count = reputationData?.ratingBreakdown?.[star] || 0;
              const percentage = (count / reputationData?.totalReviews) * 100;

              return (
                <div key={star} className={styles.repRow}>
                  <span className={styles.repRowLab}>{star}<Icon name="Star" size={11} /></span>
                  <span className={styles.repBar}><i style={{ width: `${percentage}%` }} /></span>
                  <span className={styles.repNum}>{count}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.repRight}>
            <div className={styles.repPct}>{reputationData?.recommendationRate}%</div>
            <p className={styles.repPl}>Recommend the company</p>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className={styles.card}>
        <SectionHead
          icon="MessageSquareQuote"
          title="Recent ratings"
          subtitle="What candidates say about being hired by you"
          aside={reviews.length > PREVIEW_COUNT && (
            <button type="button" className={styles.linkBtn} onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show fewer' : `Show all ratings (${reviews.length})`}
            </button>
          )}
        />

        {reviews.length === 0 && (
          <p style={{ color: '#8693A0', fontSize: '.9rem', padding: '18px 0' }}>No ratings yet.</p>
        )}
        {reviews.length > 0 && (
          <div className={`${styles.dRevGrid} ${styles.dRevGridTight}`}>
            {(showAll ? reviews : reviews.slice(0, PREVIEW_COUNT)).map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReputationManagementTab;
