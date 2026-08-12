import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { listPackages, packageToFrontend } from '../creditsApi';
import styles from '../styles/credits.module.scss';

const commonFeatures = [
  'Full candidate search',
  'Unlimited filtering',
  'Save candidates',
  'Candidate notes',
  'PDF print',
  'Email alerts'
];

// Multi-user workspace is called out for the two largest packages — a cosmetic
// grouping, not backend-tracked (the package row itself has no such flag).
const buildFeatures = (credits) => [
  `Unlock ${credits} profile${credits > 1 ? 's' : ''}`,
  ...commonFeatures,
  ...(credits >= 50 ? ['Multi-user workspace'] : [])
];

const CreditPackages = ({ onPurchase }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPackages()
      .then((rows) => setPackages(rows.map(packageToFrontend)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = (pkg) => {
    onPurchase(pkg);
  };

  if (loading) {
    return (
      <div>
        <div className={styles.pkgsHead}>
          <h2>Choose a Credits package</h2>
          <p>Buy Credits to unlock candidate profiles</p>
        </div>
        <p style={{ color: '#8693A0' }}>Loading packages…</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pkgsHead}>
        <h2>Choose a Credits package</h2>
        <p>Buy Credits to unlock candidate profiles</p>
      </div>

      <div className={styles.pkgs}>
        {packages?.map((pkg) => (
          <div
            key={pkg?.id}
            className={`${styles.pkg} ${pkg?.popular ? styles.pop : ''}`}
          >
            {pkg?.popular && (
              <div className={styles.pkgBadge}>Most popular</div>
            )}

            <div className={styles.pkgName}>{pkg?.name}</div>
            <div className={styles.pkgPrice}>€{pkg?.price?.toLocaleString('en-US')}</div>
            <div className={styles.pkgPriceSub}>€{pkg?.pricePerCredit?.toFixed(2)} per unlock</div>

            <div className={styles.pkgCredits}>
              <Icon name="Coins" size={20} />
              <b>{pkg?.credits}</b>
              <span>Credits</span>
            </div>

            <ul className={styles.pkgFeatures}>
              {buildFeatures(pkg?.credits)?.map((feature, index) => (
                <li key={index} className={styles.pkgFeature}>
                  <Icon name="Check" size={16} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`${styles.pkgBtn} ${pkg?.popular ? styles.pop : ''}`}
              onClick={(e) => { e.stopPropagation(); handlePurchase(pkg); }}
            >
              <Icon name="ShoppingCart" size={16} />Buy now
            </button>
          </div>
        ))}
      </div>

      <div className={styles.paynote}>
        <div><Icon name="ShieldCheck" size={15} /><span>Prices include 20% VAT</span></div>
        <div><Icon name="Clock" size={15} /><span>Credits never expire</span></div>
        <div><Icon name="CreditCard" size={15} /><span>Secure card payment</span></div>
      </div>
    </div>
  );
};

export default CreditPackages;
