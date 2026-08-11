import React, { useState } from 'react';
import Icon from 'components/AppIcon';
import { usePaddleCheckout } from 'lib/usePaddleCheckout';
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
              <p className={styles.buyBal}>Your credits have been added.</p>
              <div className={styles.buyConfirmActions}>
                <button className={styles.btnGo} onClick={onClose}>
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className={styles.modalTitle}>Buy {selectedPackage?.credits} credits</h3>
              <p className={styles.buyBal}>
                <b>€{selectedPackage?.price?.toLocaleString('en-US')}</b> · €{selectedPackage?.pricePerCredit?.toFixed(2)} / unlock
              </p>

              {error && <p className={styles.checkoutError}>{error}</p>}

              <div className={styles.buyConfirmActions}>
                <button className={styles.buyBtnGhost} onClick={() => setSelectedPackage(null)} disabled={busy}>
                  Back to packages
                </button>
                <button className={styles.btnGo} onClick={() => buy(selectedPackage)} disabled={busy}>
                  {busy ? 'Processing…' : `Pay €${selectedPackage?.price?.toLocaleString('en-US')}`}
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
          Current balance: <b>{balance}</b> credits · 1 credit = 1 unlock
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
                  <b>{pkg?.credits} credits</b>
                  {pkg?.popular && <span className={styles.pkgBadge}>POPULAR</span>}
                  <span className={styles.pkgUnit}>€{pkg?.pricePerCredit?.toFixed(2)} / unlock</span>
                </div>
                <div className={styles.pkgRight}>
                  <b>€{pkg?.price?.toLocaleString('en-US')}</b>
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
