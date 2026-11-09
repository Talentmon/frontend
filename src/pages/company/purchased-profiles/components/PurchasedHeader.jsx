import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import BuyCreditsModal from '../../candidate-search-dashboard/components/BuyCreditsModal';
import { listPackages, packageToFrontend } from '../../credit-management/creditsApi';
import { useCreditBalance } from 'lib/creditBalance';
import styles from '../styles/purchased.module.scss';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Title and the hiring numbers over every unlocked candidate, in one card that
 * ends with Analytics (the full report on the Credits page). Each number has an
 * icon and a chip beside it. Until the first hire there's nothing to average,
 * so instead of empty dashes it shows how many moved past New and this week's
 * unlocks; after it, time and Credits per hire. Credits left turn red at the
 * company's low-balance level, with Buy.
 * (Beside an open CV the page shows just the title instead.)
 */
const PurchasedHeader = ({ analytics }) => {
  const { balance, lowBalanceThreshold } = useCreditBalance();
  const [buyOpen, setBuyOpen] = useState(false);
  const [packages, setPackages] = useState([]);

  const openBuy = () => {
    setBuyOpen(true);
    if (!packages.length) {
      listPackages().then((rows) => setPackages(rows.map(packageToFrontend))).catch(() => {});
    }
  };

  const {
    profilesUnlocked: total,
    successfulHires: hired,
    hireRate,
    avgTimeToHire,
    creditsPerHire,
    movedPastNew,
    unlockedThisWeek,
    unlockedPreviousWeek,
    totalSpent
  } = analytics;
  const weekDiff = unlockedThisWeek - unlockedPreviousWeek;
  const lowCredits = typeof balance === 'number' && balance <= lowBalanceThreshold;

  // tone: the icon tile's colours; chipTone: the chip's.
  const stats = [
    {
      label: 'Hire rate',
      icon: 'Trophy',
      tone: 'green',
      value: `${hireRate}%`,
      valueTone: hired ? 'green' : '',
      chip: hired ? `${hired} of ${total} hired` : 'No hires yet',
      chipTone: hired ? 'green' : 'neutral'
    },
    ...(hired
      ? [
          {
            label: 'Avg. time to hire',
            icon: 'Clock',
            tone: 'blue',
            // No usable hire date (e.g. one before the unlock) leaves nothing to average.
            value: avgTimeToHire === null ? '—' : plural(avgTimeToHire, 'day'),
            chip: 'unlock to hire',
            chipTone: 'neutral'
          },
          { label: 'Credits per hire', icon: 'Coins', tone: 'gold', value: String(creditsPerHire), chip: 'per hire', chipTone: 'neutral' }
        ]
      : [
          {
            label: 'Moved past New',
            icon: 'ArrowRightLeft',
            tone: 'blue',
            value: `${movedPastNew} of ${total}`,
            chip: `${total ? Math.round((movedPastNew / total) * 100) : 0}%`,
            chipTone: 'blue',
            title: 'Average time to hire and Credits per hire show up after your first hire'
          },
          {
            label: 'Unlocked this week',
            icon: 'Unlock',
            tone: 'gold',
            value: String(unlockedThisWeek),
            chip: weekDiff > 0 ? `↑ ${weekDiff} vs last week` : weekDiff < 0 ? `↓ ${-weekDiff} vs last week` : 'Same as last week',
            chipTone: weekDiff > 0 ? 'green' : weekDiff < 0 ? 'red' : 'neutral'
          }
        ]),
    {
      label: 'Credits spent',
      icon: 'Coins',
      tone: 'neutral',
      value: String(totalSpent),
      chip: typeof balance === 'number' ? `${balance} left` : '',
      chipTone: lowCredits ? 'red' : 'neutral',
      buy: lowCredits
    }
  ];

  return (
    <header className={styles.phead}>
      <div className={styles.pheadTitle}>
        <h1>Purchased Profiles</h1>
        <p>Manage your unlocked candidates and track the recruitment process</p>
      </div>

      <div className={styles.kpiCard}>
        <dl className={styles.kpis} aria-label="Key numbers">
          {stats.map((stat) => (
            <div key={stat.label} className={styles.kpi} title={stat.title}>
              <span className={`${styles.kpiIcon} ${styles[stat.tone]}`} aria-hidden="true">
                <Icon name={stat.icon} size={18} />
              </span>
              <div className={styles.kpiText}>
                <dt className={styles.kpiLabel}>{stat.label}</dt>
                <dd className={styles.kpiBody}>
                  <span className={`${styles.kpiValue} ${stat.valueTone === 'green' ? styles.green : ''}`}>{stat.value}</span>
                  {stat.chip && <span className={`${styles.kpiChip} ${styles[stat.chipTone]}`}>{stat.chip}</span>}
                  {stat.buy && (
                    <button type="button" className={styles.kpiLink} onClick={openBuy}>
                      Buy
                    </button>
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
        <Link to="/credit-management?tab=analytics" className={styles.analyticsBtn}>
          <span className={styles.analyticsTitle}>
            <Icon name="LineChart" size={18} strokeWidth={2.2} />
            Analytics
          </span>
          <span className={styles.analyticsSub}>
            Full report
            <Icon name="ChevronRight" size={12} strokeWidth={2.6} />
          </span>
        </Link>
      </div>

      {buyOpen && <BuyCreditsModal balance={balance} packages={packages} onClose={() => setBuyOpen(false)} />}
    </header>
  );
};

export default PurchasedHeader;
