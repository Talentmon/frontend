import React from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/credits.module.scss';

const CreditBalance = ({ balance, isLowBalance }) => {
  return (
    <div className={`${styles.card} ${styles.balBig}`}>
      <div className={styles.balBigTop}>
        <div>
          <div className={styles.cardTitle} style={{ color: '#E9F0F7', marginBottom: 2 }}>Current Credits balance</div>
          <div className={styles.balBigLbl}>Available Credits for unlocking profiles</div>
        </div>
        <div className={styles.balBigIcons}>
          <Icon name="Coins" size={24} />
          {isLowBalance && <Icon name="AlertTriangle" size={20} color="#f0b552" />}
        </div>
      </div>

      <div className={`${styles.balBigVal} ${isLowBalance ? styles.warn : ''}`}>
        {balance?.toLocaleString('sr-RS')}
        <span>Credits</span>
      </div>
      <div className={styles.balBigMeta}>1 Credit = 1 unlock</div>

      {isLowBalance && (
        <div className={styles.balBigWarn}>
          <Icon name="AlertTriangle" size={16} />
          <span>Low on Credits! We recommend topping up.</span>
        </div>
      )}
    </div>
  );
};

export default CreditBalance;
