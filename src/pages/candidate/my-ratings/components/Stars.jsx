import React from 'react';
import styles from '../styles/myRatings.module.scss';

const StarSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <path d="M12 2.4l2.9 6 6.5.6-4.9 4.3 1.5 6.4L12 16.9 6 20.7l1.5-6.4L2.6 9l6.5-.6z" />
  </svg>
);

const SIZE_CLASS = { sm: styles.starsSm, md: styles.starsMd, lg: styles.starsLg };

const Stars = ({ value = 0, size = 'md' }) => {
  const filled = Math.round(value);
  return (
    <span
      className={`${styles.stars} ${SIZE_CLASS[size] ?? styles.starsMd}`}
      aria-label={`${value} of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= filled ? styles.starGold : styles.starGrey} aria-hidden="true">
          <StarSvg />
        </span>
      ))}
    </span>
  );
};

export default Stars;
