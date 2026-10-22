import React from 'react';
import Icon from 'components/AppIcon';
import Stars from '../../../candidate/company-details/Stars';
import styles from '../styles/company.module.scss';
import './previewStars.css';

const CATS = [
  { key: 'process', label: 'Hiring process' },
  { key: 'comms', label: 'Communication' },
  { key: 'culture', label: 'Work culture' },
  { key: 'benefits', label: 'Benefits' },
];

// One candidate rating — the same card candidates see on the public company page.
const ReviewCard = ({ review }) => (
  <div className={styles.dRevCard}>
    <div className={styles.dRevTop}>
      <div>
        <div className={styles.dRevRole}>{review?.position}</div>
        <div className={styles.dRevDept}>{review?.department}</div>
      </div>
      <div className={styles.dRevOverall}>
        <span className={styles.dRevNum}>{(review?.rating ?? 0).toFixed(1)}</span>
        <span className="ppStars sm" aria-label={`${review?.rating ?? 0} out of 5`}><Stars rating={review?.rating ?? 0} /></span>
      </div>
    </div>

    {review?.cats && (
      <div className={styles.dRevCats}>
        {CATS.map((cat) => (
          <div key={cat.key} className={styles.dRevCat}>
            <span className={styles.dRevCatLabel}>{cat.label}</span>
            <span className="ppStars xs" aria-label={`${cat.label}: ${review.cats[cat.key]} out of 5`}>
              <Stars rating={review.cats[cat.key] ?? 0} />
            </span>
          </div>
        ))}
      </div>
    )}

    <p className={styles.dRevText}>{review?.comment}</p>
    <div className={`${styles.dRevWage} ${review?.minWageRespected ? styles.ok : styles.bad}`}>
      {review?.minWageRespected ? '✓ Minimum salary from profile: honored' : '✗ Minimum salary from profile: not honored'}
    </div>

    <div className={styles.dRevFoot}>
      <div className={styles.dRevDate}>{review?.reviewDate}</div>
      {review?.recommend === true && (
        <span className={`${styles.dRevRec} ${styles.yes}`}><Icon name="ThumbsUp" size={13} />Recommend</span>
      )}
      {review?.recommend === false && (
        <span className={`${styles.dRevRec} ${styles.no}`}><Icon name="ThumbsDown" size={13} />Don&apos;t recommend</span>
      )}
    </div>
  </div>
);

export default ReviewCard;
