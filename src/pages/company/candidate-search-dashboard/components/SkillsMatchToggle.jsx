import React from 'react';
import styles from '../styles/dashboard.module.scss';

/**
 * "Match any / Match all" for 2+ picked skills, shared by Search
 * (FilterSidebar) and Bookmarked. `value` is 'any' or 'all'.
 */
const SkillsMatchToggle = ({ value, onChange }) => {
  const matchAll = value === 'all';
  const option = (optionValue, label) => {
    const on = (optionValue === 'all') === matchAll;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        className={`${styles.matchOption} ${on ? styles.matchOptionOn : ''}`}
        onClick={() => onChange(optionValue)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={styles.skillsMatch}>
      <div className={styles.matchToggle} role="radiogroup" aria-label="Skill matching">
        {option('any', 'Match any')}
        {option('all', 'Match all')}
      </div>
      <p className={styles.fieldHint}>
        {matchAll ? 'Candidates must have every selected skill.' : 'Candidates need at least one of the selected skills.'}
      </p>
    </div>
  );
};

export default SkillsMatchToggle;
