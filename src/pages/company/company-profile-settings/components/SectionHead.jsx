import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/company.module.scss';

// Card header used across the settings tabs: an icon tile, title and
// subtitle, then a divider across the card. `flat` drops the divider for a
// one-row card whose control sits beside the header; `aside` puts something
// on the header's right, e.g. the Team seats meter.
const SectionHead = ({ icon, title, subtitle, flat = false, aside = null }) => (
  <div className={flat ? `${styles.secHead} ${styles.secHeadFlat}` : styles.secHead}>
    <span className={styles.secIcon} aria-hidden="true"><Icon name={icon} size={22} /></span>
    <div className={styles.secText}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {subtitle && <div className={styles.cardSub}>{subtitle}</div>}
    </div>
    {aside && <div className={styles.secAside}>{aside}</div>}
  </div>
);

export default SectionHead;
