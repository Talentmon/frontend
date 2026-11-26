import React from 'react';
import styles from '../styles/dashboard.module.scss';

// The wording for languages and certificates (Search, Bookmarked, Purchased); skills use the defaults below.
export const LANGUAGE_MATCH = {
  label: 'Language matching',
  anyHint: 'Candidates need at least one of the selected languages.',
  allHint: 'Candidates must have every selected language.'
};
export const CERTIFICATE_MATCH = {
  label: 'Certificate matching',
  anyHint: 'Candidates need at least one of the selected certificates.',
  allHint: 'Candidates must have every selected certificate.'
};

/**
 * "Match any / Match all" for 2+ picked skills (or languages, certificates),
 * shared by Search (FilterSidebar) and Bookmarked. `value` is 'any' or 'all';
 * the defaults are the Skills wording.
 */
const SkillsMatchToggle = ({
  value,
  onChange,
  label = 'Skill matching',
  anyHint = 'Candidates need at least one of the selected skills.',
  allHint = 'Candidates must have every selected skill.'
}) => {
  const matchAll = value === 'all';
  const option = (optionValue, text) => {
    const on = (optionValue === 'all') === matchAll;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        className={`${styles.matchOption} ${on ? styles.matchOptionOn : ''}`}
        onClick={() => onChange(optionValue)}
      >
        {text}
      </button>
    );
  };

  return (
    <div className={styles.skillsMatch}>
      <div className={styles.matchToggle} role="radiogroup" aria-label={label}>
        {option('any', 'Match any')}
        {option('all', 'Match all')}
      </div>
      <p className={styles.fieldHint}>{matchAll ? allHint : anyHint}</p>
    </div>
  );
};

export default SkillsMatchToggle;
