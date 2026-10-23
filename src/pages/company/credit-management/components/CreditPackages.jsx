import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import { creditWord } from 'utils/formatCredits';
import { formatPrice, getPackageBookmarkBonuses, listPackages, packageToFrontend } from '../creditsApi';
import styles from '../styles/credits.module.scss';

/** Whole-percent saving per unlock against the 1-Credit package, rounded down so it's never overstated. */
const savingsPercent = (pkg, base) => {
  if (!base || pkg.id === base.id) return 0;
  return Math.floor((1 - pkg.pricePerCredit / base.pricePerCredit) * 100 + 1e-9);
};

// The strip under the packages. Prices are VAT-inclusive in Paddle (tax_mode internal) and no card data is stored here.
const payNotes = [
  { icon: 'ShieldCheck', chip: 'chipGreen', title: 'Prices include VAT', text: 'The price you see is the price you pay.' },
  { icon: 'Lock', chip: 'chipBlue', title: 'Secure card payment', text: 'Processed by Paddle.' },
  { icon: 'Infinity', chip: 'chipAmber', title: 'Credits never expire', text: 'Use them whenever you need them.' },
];

// What a Credit pays for on the left, what costs nothing on the right.
const PackagesHead = () => (
  <div className={styles.pkgsHead}>
    <div className={styles.pkgsTitle}>
      <h2>Choose a Credits package</h2>
      <p><b>1 Credit unlocks one candidate</b>: full profile with contact details.</p>
    </div>
    <div className={styles.pkgsFree}>
      <Icon name="CheckCircle2" size={18} />
      <span>Searching, filtering, CV previews, bookmarking and notes are <b>free</b>.</span>
    </div>
  </div>
);

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

  if (loading) {
    return (
      <div>
        <PackagesHead />
        <p style={{ color: '#8693A0' }}>Loading packages…</p>
      </div>
    );
  }

  const basePackage = packages.find((pkg) => pkg.credits === 1);

  return (
    <div>
      <PackagesHead />

      <div className={styles.pkgs} style={{ '--pkg-count': packages.length }}>
        {packages.map((pkg) => {
          const savings = savingsPercent(pkg, basePackage);
          return (
            <div key={pkg.id} className={`${styles.pkg} ${pkg.popular ? styles.pop : ''}`}>
              {pkg.popular && (
                <div className={styles.pkgBadge}>Most popular</div>
              )}

              <div className={styles.pkgHead}>
                <span className={styles.pkgName}>{pkg.name}</span>
                {savings > 0 && <span className={styles.pkgSaveBadge}>Save {savings}%</span>}
              </div>

              <div className={styles.pkgBig}>
                <b>{pkg.credits}</b>
                <span>{creditWord(pkg.credits)}</span>
              </div>

              <div className={styles.pkgBox}>
                <div className={styles.pkgPrice}>{formatPrice(pkg.price, pkg.currency)}</div>
                <div className={styles.pkgPriceSub}>{formatPrice(pkg.pricePerCredit, pkg.currency, { cents: true })} per unlock</div>
              </div>

              {/* Kept even when empty so every card's bonus and button line up. */}
              <div className={`${styles.pkgSavings} ${savings > 0 ? '' : styles.pkgSavingsEmpty}`}>
                {savings > 0 ? (
                  <>
                    <Icon name="Check" size={16} />
                    Save {savings}% vs {basePackage.name}
                  </>
                ) : ' '}
              </div>

              {pkg.bookmarkBonus > 0 && (
                <div className={styles.pkgBonus}>
                  <Icon name="Bookmark" size={20} />
                  <span>
                    <span>+{pkg.bookmarkBonus} bonus bookmarks</span>
                    {/* An invisible "+" so this line starts under the number, not the sign. */}
                    <span><span className={styles.pkgBonusIndent} aria-hidden="true">+</span>for {pkg.bookmarkBonusMonths} months</span>
                  </span>
                </div>
              )}

              <button
                className={`${styles.pkgBtn} ${pkg.popular ? styles.pop : ''}`}
                onClick={() => onPurchase(pkg)}
              >
                <Icon name="ShoppingCart" size={16} />Buy now
              </button>
            </div>
          );
        })}
      </div>

      <ul className={styles.paynote}>
        {payNotes.map((note) => (
          <li key={note.title}>
            <span className={`${styles.chip} ${styles[note.chip]}`} aria-hidden="true">
              <Icon name={note.icon} size={18} />
            </span>
            <span className={styles.paynoteText}>
              <b>{note.title}</b>
              <span>{note.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreditPackages;
