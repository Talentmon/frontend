import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/company.module.scss';

// Card header used across Account settings: gold bar, icon, title and
// subtitle, then a divider. `flat` drops the divider for a one-row card
// whose control sits beside the header (Billing currency).
const SectionHead = ({ icon, title, subtitle, flat = false }) => (
  <div className={flat ? `${styles.secHead} ${styles.secHeadFlat}` : styles.secHead}>
    <span className={styles.secIcon}><Icon name={icon} size={26} /></span>
    <div className={styles.secText}>
      <div className={styles.cardTitle}>{title}</div>
      {subtitle && <div className={styles.cardSub}>{subtitle}</div>}
    </div>
  </div>
);

export default SectionHead;
