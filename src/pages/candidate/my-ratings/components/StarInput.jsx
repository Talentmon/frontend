import React, { useState } from 'react';
import styles from '../styles/myRatings.module.scss';

const StarSvg = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <path d="M12 2.4l2.9 6 6.5.6-4.9 4.3 1.5 6.4L12 16.9 6 20.7l1.5-6.4L2.6 9l6.5-.6z" />
  </svg>
);

const StarInput = ({ value = 0, onChange }) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className={styles.starInput} role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          aria-label={`${n} of 5`}
          aria-pressed={value === n}
          className={active >= n ? styles.starInputOn : undefined}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n === value ? 0 : n)}
        >
          <StarSvg />
        </button>
      ))}
    </div>
  );
};

export default StarInput;
