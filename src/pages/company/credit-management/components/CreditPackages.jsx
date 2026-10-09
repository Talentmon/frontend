import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { getPackageBookmarkBonuses, listPackages, packageToFrontend } from '../creditsApi';
import styles from '../styles/credits.module.scss';

const commonFeatures = [
  'Full candidate search',
  'Unlimited filtering',
  'Save candidates',
  'Candidate notes',
  'PDF print',
  'Email alerts'
];

const buildFeatures = (credits) => [
  `Unlock ${credits} profile${credits > 1 ? 's' : ''}`,
  ...commonFeatures,
];

const CreditPackages = ({ onPurchase }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bonuses are optional decoration — packages still render if that call fails.
    Promise.all([listPackages(), getPackageBookmarkBonuses().catch(() => null)])
      .then(([rows, bonuses]) => {
        const bonusById = new Map((bonuses?.packages || []).map((b) => [b.packageId, b.bookmarks]));
        setPackages(
          rows.map((row) => ({
            ...packageToFrontend(row),
            bookmarkBonus: bonusById.get(row.id) || 0,
            bookmarkBonusMonths: bonuses?.validMonths || 0,
          })),
        );
      })
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

            {pkg?.bookmarkBonus > 0 && (
              <div className={styles.pkgBonus}>
                <Icon name="Bookmark" size={15} />
                <span>+{pkg.bookmarkBonus} extra bookmarks for {pkg.bookmarkBonusMonths} months</span>
              </div>
            )}

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
