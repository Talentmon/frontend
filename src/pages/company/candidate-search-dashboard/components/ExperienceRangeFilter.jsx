import React, { useId } from 'react';
import Select from 'components/ui/Select';
import { experienceFromOptions, experienceToOptions } from 'utils/experienceRange';
import styles from '../styles/dashboard.module.scss';

/**
 * Years of experience, From – To (Search's sidebar, and the Experience pill and
 * sidebar on Bookmarked / Purchased). `value`: { min, max }, '' for an open
 * end; each dropdown's X opens its end again. Each list stops at the other end,
 * so From never passes To.
 */
const ExperienceRangeFilter = ({ id, value, onChange, label = 'Years of experience', hideLabel = false }) => {
  const autoId = useId();
  const baseId = id || autoId;
  const range = { min: value?.min ?? '', max: value?.max ?? '' };

  return (
    <div className={styles.field}>
      <span id={`${baseId}-label`} className={hideLabel ? styles.srOnly : styles.fieldLabel}>{label}</span>
      <div className={styles.salaryRow} role="group" aria-labelledby={`${baseId}-label`}>
        <div className={styles.salaryField}>
          <Select
            id={baseId}
            aria-label="Years of experience from"
            options={experienceFromOptions(range)}
            value={range.min}
            onChange={(min) => onChange({ ...range, min: min ?? '' })}
            placeholder="From"
            clearable
          />
        </div>
        <span className={styles.salaryDash} aria-hidden="true" />
        <div className={styles.salaryField}>
          <Select
            id={`${baseId}-to`}
            aria-label="Years of experience to"
            options={experienceToOptions(range)}
            value={range.max}
            onChange={(max) => onChange({ ...range, max: max ?? '' })}
            placeholder="To"
            clearable
          />
        </div>
      </div>
    </div>
  );
};

export default ExperienceRangeFilter;
