import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/dashboard.module.scss';

/**
 * Cards / list switch, the same on Search and Purchased: one white box, the
 * picked one ink with a gold icon. `options`: { value, label, icon, className? }.
 */
const ViewToggle = ({ value, onChange, options }) => (
  <div className={styles.viewToggle} role="group" aria-label="View">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`${styles.viewToggleBtn} ${option.className || ''}`}
        aria-label={option.label}
        title={option.label}
        aria-pressed={value === option.value}
      >
        <Icon name={option.icon} size={16} />
      </button>
    ))}
  </div>
);

export default ViewToggle;
