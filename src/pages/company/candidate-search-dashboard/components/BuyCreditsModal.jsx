import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { usePaddleCheckout } from 'lib/usePaddleCheckout';
import { formatCredits } from 'utils/formatCredits';
import { formatPrice } from 'pages/company/credit-management/creditsApi';
import styles from '../styles/dashboard.module.scss';

// Quick top-up from the header's Buy button and the search page: pick a package, then Paddle's
// checkout takes the payment — the button only opens it, hence "Continue to payment".
const BuyCreditsModal = ({ balance, packages = [], onClose, onPurchased = () => {} }) => {
  const [pickedId, setPickedId] = useState(null);
  const [result, setResult] = useState(null);

  const { buy, busy, error } = usePaddleCheckout({
    onSuccess: (res) => {
      setResult(res);
      onPurchased(res);
    },
  });

  // The most popular package is picked until the user picks another.
  const selected = packages.find((p) => p.id === pickedId) || packages.find((p) => p.popular) || packages[0];
  const done = !!result;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  let cta;
  if (done) {
    cta = (
      <>
        <Icon name="Check" size={18} strokeWidth={2.6} />
        {result.credited ? `Purchased · +${formatCredits(selected?.credits)}` : 'Paid · Credits on their way'}
      </>
    );
  } else if (busy) {
    cta = 'Processing…';
  } else {
    cta = (
      <>
        <Icon name="CreditCard" size={18} />
        Continue to payment{selected && ` · ${formatPrice(selected.price, selected.currency)}`}
      </>
    );
  }

  return (
    <div className={styles.qbOverlay} onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className={`${styles.qbModal} ${done ? styles.flashing : ''}`} role="dialog" aria-modal="true" aria-labelledby="qb-title">
        <span className={styles.qbFlash} aria-hidden="true" />

        <div className={styles.qbHead}>
          <div>
            <p className={styles.qbEyebrow}>Top up Credits</p>
            <h2 className={styles.qbTitle} id="qb-title">Choose a package</h2>
          </div>
          <button type="button" className={styles.qbClose} onClick={onClose} disabled={busy} aria-label="Close">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className={styles.qbBalance}>
          <span className={styles.qbCoin} />
          Current balance: <b>{formatCredits(balance ?? 0)}</b>
        </div>

        {packages.length === 0 ? (
          <p className={styles.qbLoading}>Loading packages…</p>
        ) : (
          <div className={styles.qbPacks} role="radiogroup" aria-label="Credit packages">
            {packages.map((pkg) => {
              const on = pkg.id === selected?.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`${styles.qbPack} ${on ? styles.sel : ''}`}
                  onClick={() => setPickedId(pkg.id)}
                  disabled={busy || done}
                >
                  <span className={styles.qbRadio} />
                  <span className={styles.qbPackMain}>
                    <span className={styles.qbPackName}>
                      {pkg.name}
                      {pkg.popular && <span className={styles.qbTag}>Most popular</span>}
                    </span>
                    <span className={styles.qbPackSub}>
                      {formatCredits(pkg.credits)} · {formatPrice(pkg.pricePerCredit, pkg.currency, { cents: true })} / unlock
                    </span>
                  </span>
                  <span className={styles.qbPackPrice}>
                    <span className={styles.qbAmt}>{formatPrice(pkg.price, pkg.currency)}</span>
                    <span className={styles.qbPer}>+{pkg.credits}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className={styles.qbError}>{error}</p>}

        <button
          type="button"
          className={`${styles.qbCta} ${done ? styles.done : ''}`}
          onClick={() => (done ? onClose() : buy(selected))}
          disabled={busy || !selected}
        >
          {cta}
        </button>

        <div className={styles.qbFoot}>
          <span><Icon name="Shield" size={13} />Secure checkout by Paddle</span>
          <span><Icon name="Infinity" size={13} />Credits never expire</span>
        </div>
        <p className={styles.qbFinal}>
          All purchases are final and non-refundable. <a href="/refund-policy" target="_blank" rel="noreferrer">Refund Policy</a>
        </p>
      </div>
    </div>
  );
};

export default BuyCreditsModal;
