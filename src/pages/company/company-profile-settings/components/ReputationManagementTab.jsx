import React from 'react';
import Icon from 'components/AppIcon';
import SectionHead from './SectionHead';
import styles from '../styles/company.module.scss';

const ReputationManagementTab = ({ reputationData }) => {
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

  const ReviewCard = ({ review }) => (
    <div className={styles.review}>
      <div className={styles.reviewTop}>
        <div>
          <b>{review?.position}</b>
          <div className={styles.reviewRole}>{review?.department}</div>
        </div>
        <span className={styles.reviewStars}>{'★'.repeat(review?.rating)}{'☆'.repeat(5 - review?.rating)}</span>
      </div>
      <p className={styles.reviewText}>{review?.comment}</p>
      <div className={`${styles.reviewWage} ${review?.minWageRespected ? styles.ok : styles.bad}`}>
        {review?.minWageRespected ? '✓ Minimum salary from profile: honored' : '✗ Minimum salary from profile: not honored'}
      </div>
      <div className={styles.reviewMeta}>
        <span>Hired: {review?.hiredDate}</span>
        <span>{review?.reviewDate}</span>
      </div>
    </div>
  );

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
          aside={<button className={styles.linkBtn}>Show all ratings</button>}
        />

        {reputationData?.recentReviews?.length === 0 && (
          <p style={{ color: '#8693A0', fontSize: '.9rem', padding: '18px 0' }}>No ratings yet.</p>
        )}
        {reputationData?.recentReviews?.map((review, index) => (
          <ReviewCard key={index} review={review} />
        ))}
      </div>
    </div>
  );
};

export default ReputationManagementTab;
