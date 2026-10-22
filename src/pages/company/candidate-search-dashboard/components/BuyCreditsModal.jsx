import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import { usePaddleCheckout } from 'lib/usePaddleCheckout';
import { creditWord, formatCredits } from 'utils/formatCredits';
import { formatPrice } from 'pages/company/credit-management/creditsApi';
import styles from '../styles/dashboard.module.scss';

const BuyCreditsModal = ({ balance, packages = [], onClose, onPurchased = () => {} }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [done, setDone] = useState(false);

  const { buy, busy, error } = usePaddleCheckout({
    onSuccess: (result) => {
      setDone(true);
      onPurchased(result);
    },
  });

  if (selectedPackage) {
    return (
      <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className={`${styles.modal} ${styles.buy}`}>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <Icon name="X" size={18} />
          </button>

          {done ? (
            <>
              <h3 className={styles.modalTitle}>Payment successful</h3>
              <p className={styles.buyBal}>Your Credits have been added.</p>
              <div className={styles.buyConfirmActions}>
                <button className={styles.btnGo} onClick={onClose}>
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className={styles.modalTitle}>Buy {formatCredits(selectedPackage?.credits)}</h3>
              <p className={styles.buyBal}>
                <b>{formatPrice(selectedPackage?.price, selectedPackage?.currency)}</b> · {formatPrice(selectedPackage?.pricePerCredit, selectedPackage?.currency, { cents: true })} / unlock
              </p>

              {error && <p className={styles.checkoutError}>{error}</p>}

              <div className={styles.buyConfirmActions}>
                <button className={styles.buyBtnGhost} onClick={() => setSelectedPackage(null)} disabled={busy}>
                  Back to packages
                </button>
                <button className={styles.btnGo} onClick={() => buy(selectedPackage)} disabled={busy}>
                  {busy ? 'Processing…' : `Pay ${formatPrice(selectedPackage?.price, selectedPackage?.currency)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.buy}`}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          <Icon name="X" size={18} />
        </button>

        <h3 className={styles.modalTitle}>Buy Credits</h3>
        <p className={styles.buyBal}>
          Current balance: <b>{balance}</b> {creditWord(balance)} · 1 Credit = 1 unlock
        </p>

        {packages?.length === 0 ? (
          <p style={{ color: 'var(--slate)', fontSize: '.88rem' }}>Loading packages…</p>
        ) : (
          <div className={styles.pkgs}>
            {packages?.map((pkg) => (
              <button
                key={pkg?.id}
                className={`${styles.pkg} ${pkg?.popular ? styles.pop : ''}`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className={styles.pkgLeft}>
                  <b>{formatCredits(pkg?.credits)}</b>
                  {pkg?.popular && <span className={styles.pkgBadge}>POPULAR</span>}
                  <span className={styles.pkgUnit}>{formatPrice(pkg?.pricePerCredit, pkg?.currency, { cents: true })} / unlock</span>
                </div>
                <div className={styles.pkgRight}>
                  <b>{formatPrice(pkg?.price, pkg?.currency)}</b>
                  <span>one-time</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className={styles.buyNote}>
          <Icon name="ShieldCheck" size={14} />
          Secure payment · Credits never expire
        </div>
      </div>
    </div>
  );
};

export default BuyCreditsModal;
