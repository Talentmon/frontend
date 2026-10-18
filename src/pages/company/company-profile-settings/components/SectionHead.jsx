import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/company.module.scss';

// Card header used across the settings tabs: gold bar, icon, title and
// subtitle, then a divider. `flat` drops the divider for a one-row card
// whose control sits beside the header (Billing currency); `aside` puts
// something on the header's right, e.g. a "Show all" link.
const SectionHead = ({ icon, title, subtitle, flat = false, aside = null }) => (
  <div className={flat ? `${styles.secHead} ${styles.secHeadFlat}` : styles.secHead}>
    <span className={styles.secIcon}><Icon name={icon} size={26} /></span>
    <div className={styles.secText}>
      <div className={styles.cardTitle}>{title}</div>
      {subtitle && <div className={styles.cardSub}>{subtitle}</div>}
    </div>
    {aside && <div className={styles.secAside}>{aside}</div>}
  </div>
);

export default SectionHead;
