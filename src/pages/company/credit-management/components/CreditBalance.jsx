import React from 'react';
import Icon from 'components/AppIcon';
import { creditWord } from 'utils/formatCredits';
import styles from '../styles/credits.module.scss';

// Coin with concentric rings, sitting behind the right side of the card.
const BalanceArt = () => (
  <svg className={styles.balArt} aria-hidden="true" focusable="false" width="520" height="520" viewBox="0 0 520 520">
    <g fill="none" stroke="#e6a93c" strokeWidth="1">
      <circle cx="260" cy="260" r="256" strokeOpacity="0.05" />
      <circle cx="260" cy="260" r="230" strokeOpacity="0.06" />
      <circle cx="260" cy="260" r="204" strokeOpacity="0.08" />
      <circle cx="260" cy="260" r="178" strokeOpacity="0.1" />
      <circle cx="260" cy="260" r="152" strokeOpacity="0.13" />
      <circle cx="260" cy="260" r="126" strokeOpacity="0.17" />
      <circle cx="260" cy="260" r="100" strokeOpacity="0.22" />
      <circle cx="260" cy="260" r="80" strokeOpacity="0.34" pathLength="360" strokeDasharray="2 4" />
    </g>
    <circle cx="260" cy="260" r="62" fill="none" stroke="#e6a93c" strokeWidth="6" pathLength="360" strokeDasharray="1.6 2.4" />
    <circle cx="260" cy="260" r="58" fill="#e6a93c" />
    <circle cx="260" cy="260" r="47" fill="none" stroke="#0b1a2c" strokeOpacity="0.25" strokeWidth="1.5" />
    <path d="M211.1 242.2A52 52 0 0 1 277.8 211.1" fill="none" stroke="#fbe3b4" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
    <circle cx="260" cy="249" r="10" fill="#0b1a2c" />
    <path d="M254 254h12l4 27h-20z" fill="#0b1a2c" />
  </svg>
);

const CreditBalance = ({ balance, isLowBalance, isNewCompany, onBuy }) => {
  const isEmpty = !(balance > 0);
  const isWelcome = isEmpty && isNewCompany;

  return (
    <section className={styles.balCard} aria-labelledby="credit-balance-title">
      <div className={styles.balBody}>
        <BalanceArt />

        <div className={styles.balContent}>
          <h2 className={styles.balTitle} id="credit-balance-title">Current Credits balance</h2>
          <p className={styles.balSub}>Available Credits for unlocking profiles</p>
          <p className={styles.balAmount}>
            <span className={styles.balValue}>{balance?.toLocaleString('sr-RS')}</span>
            <span className={styles.balUnit}>{creditWord(balance)}</span>
          </p>
          <div className={styles.balActions}>
            <button type="button" className={styles.balBuy} onClick={onBuy}>
              <Icon name="Plus" size={18} strokeWidth={2.25} />
              <span>Buy Credits</span>
            </button>
            <span className={styles.balRate}>
              <span className={styles.balRateDot} aria-hidden="true"></span>
              <span>1 Credit = 1 unlock</span>
            </span>
          </div>
        </div>
      </div>

      {isLowBalance && (
        <div className={styles.balAlert} role="status">
          <span className={`${styles.balAlertIcon} ${isWelcome ? styles.welcome : ''}`} aria-hidden="true">
            <Icon name={isWelcome ? 'Sparkles' : 'AlertTriangle'} size={16} />
          </span>
          <p className={styles.balAlertText}>
            {isWelcome
              ? <><strong>Ready to find your next hire?</strong> Get your first Credits and unlock the candidates you like.</>
              : isEmpty
                ? <><strong>You’re out of Credits.</strong> Buy Credits to keep unlocking profiles.</>
                : <><strong>You’re running low on Credits.</strong> Top up to keep unlocking profiles.</>}
          </p>
        </div>
      )}
    </section>
  );
};

export default CreditBalance;
