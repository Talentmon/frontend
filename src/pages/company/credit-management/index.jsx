import React, { useEffect, useState, useRef } from 'react';
import Header from 'components/ui/Header';
import CreditBalance from './components/CreditBalance';
import CreditPackages from './components/CreditPackages';
import TransactionHistory from './components/TransactionHistory';
import UsageAnalytics from './components/UsageAnalytics';
import AutoRenewalSettings from './components/AutoRenewalSettings';
import PaymentMethods from './components/PaymentMethods';
import Icon from 'components/AppIcon';
import { usePaddleCheckout } from 'lib/usePaddleCheckout';
import { creditWord, formatCredits, LOW_CREDIT_BALANCE } from 'utils/formatCredits';
import { formatPrice, getBalance, getUsageAnalytics } from './creditsApi';
import styles from './styles/credits.module.scss';

// Overview panel header icons (bar chart on a baseline, sparkles) — not in lucide in this shape.
const StatsIcon = () => (
  <svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" /><path d="M6 17v-4" /><path d="M10 17V9" /><path d="M14 17V5" /><path d="M18 17v-6" />
  </svg>
);

const SparkleIcon = () => (
  <svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 1.5Q15 9 22.5 10Q15 11 14 18.5Q13 11 5.5 10Q13 9 14 1.5Z" />
    <path d="M5 16.5Q5.3 18.7 7.5 19Q5.3 19.3 5 21.5Q4.7 19.3 2.5 19Q4.7 18.7 5 16.5Z" fill="currentColor" strokeWidth="1" />
  </svg>
);

const CreditManagement = () => {
  const [currentBalance, setCurrentBalance] = useState(0);
  // null until the balance loads, false for a new company that has never had Credits.
  const [hasCreditHistory, setHasCreditHistory] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  const isLowBalance = currentBalance <= LOW_CREDIT_BALANCE;

  const showToast = (message) => {
    setToastMsg(message);
    clearTimeout(toastTimer?.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const { buy, busy, error: checkoutError } = usePaddleCheckout({
    onSuccess: ({ balance, credited }) => {
      if (balance != null) setCurrentBalance(balance);
      setHasCreditHistory(true);
      setPurchaseResult({ credited });
      showToast(credited ? 'Credits added to your balance!' : 'Payment confirmed — credits are on their way.');
    },
  });

  useEffect(() => {
    getBalance()
      .then((d) => {
        setCurrentBalance(d.balance);
        setHasCreditHistory(d.hasCreditHistory);
      })
      .catch(() => {});
    getUsageAnalytics(6)
      .then(({ monthlyUsage, hiresInvestment }) => {
        const thisMonth = monthlyUsage[monthlyUsage.length - 1];
        const thisMonthHires = hiresInvestment[hiresInvestment.length - 1];
        const avgUsed = Math.round(monthlyUsage.reduce((sum, m) => sum + m.used, 0) / monthlyUsage.length);
        setQuickStats({ usedThisMonth: thisMonth.used, hiresThisMonth: thisMonthHires.hires, avgUsed });
      })
      .catch(() => {});
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'BarChart3' },
    { id: 'purchase', name: 'Purchase', icon: 'ShoppingCart' },
    { id: 'history', name: 'History', icon: 'Clock' },
    { id: 'analytics', name: 'Analytics', icon: 'TrendingUp' },
    { id: 'settings', name: 'Settings', icon: 'Settings' },
    { id: 'payment', name: 'Payment', icon: 'CreditCard' }
  ];

  const handlePurchase = (packageData) => {
    setSelectedPackage(packageData);
    setPurchaseResult(null);
    setShowPurchaseModal(true);
  };

  // Stays open while a payment is in flight, so its result can't land on a different package's modal.
  const handleCloseModal = () => {
    if (busy) return;
    setShowPurchaseModal(false);
    setSelectedPackage(null);
    setPurchaseResult(null);
  };

  useEffect(() => {
    if (!showPurchaseModal) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') handleCloseModal(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showPurchaseModal, busy]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <CreditBalance
              balance={currentBalance}
              isLowBalance={hasCreditHistory !== null && isLowBalance}
              isNewCompany={hasCreditHistory === false}
              onBuy={() => setActiveTab('purchase')}
            />

            <div className={styles.ovGrid}>
              <section className={styles.ovPanel} aria-labelledby="quick-stats-title">
                <div className={styles.ovPanelHead}>
                  <StatsIcon />
                  <h2 className={styles.ovPanelTitle} id="quick-stats-title">Quick stats</h2>
                </div>

                <dl className={styles.ovStats}>
                  <div className={styles.ovStat}>
                    <dt className={styles.ovStatLabel}>
                      <span className={`${styles.chip} ${styles.chipAmber}`} aria-hidden="true"><span className={styles.chipCoin}></span></span>
                      <span>Used this month</span>
                    </dt>
                    <dd className={styles.ovStatValue}>
                      <span>{quickStats ? quickStats.usedThisMonth : '—'}</span>
                      {quickStats && <span className={styles.ovStatUnit}>{creditWord(quickStats.usedThisMonth)}</span>}
                    </dd>
                  </div>

                  <div className={styles.ovStat}>
                    <dt className={styles.ovStatLabel}>
                      <span className={`${styles.chip} ${styles.chipBlue}`} aria-hidden="true"><Icon name="UserRound" size={18} /></span>
                      <span>Profiles unlocked</span>
                    </dt>
                    <dd className={styles.ovStatValue}>
                      <span>{quickStats ? quickStats.usedThisMonth : '—'}</span>
                    </dd>
                  </div>

                  <div className={styles.ovStat}>
                    <dt className={styles.ovStatLabel}>
                      <span className={`${styles.chip} ${styles.chipIndigo}`} aria-hidden="true"><Icon name="Wallet" size={18} /></span>
                      <span>Average monthly spend</span>
                    </dt>
                    <dd className={styles.ovStatValue}>
                      <span>{quickStats ? quickStats.avgUsed : '—'}</span>
                      {quickStats && <span className={styles.ovStatUnit}>{creditWord(quickStats.avgUsed)}</span>}
                    </dd>
                  </div>

                  <div className={styles.ovStat}>
                    <dt className={styles.ovStatLabel}>
                      <span className={`${styles.chip} ${styles.chipGreen}`} aria-hidden="true"><Icon name="TrendingUp" size={18} /></span>
                      <span>Hires this month</span>
                    </dt>
                    <dd className={`${styles.ovStatValue} ${styles.positive}`}>
                      <span>{quickStats ? quickStats.hiresThisMonth : '—'}</span>
                    </dd>
                  </div>
                </dl>
              </section>

              <section className={styles.ovPanel} aria-labelledby="recommendations-title">
                <div className={styles.ovPanelHead}>
                  <SparkleIcon />
                  <h2 className={styles.ovPanelTitle} id="recommendations-title">Recommendations</h2>
                </div>

                <ul className={styles.ovRecs}>
                  <li>
                    <button type="button" className={styles.ovRec} onClick={() => setActiveTab('analytics')}>
                      <span className={`${styles.chip} ${styles.chipLg} ${styles.chipGreen}`} aria-hidden="true"><Icon name="TrendingUp" size={20} /></span>
                      <span className={styles.ovRecText}>
                        <span className={styles.ovRecTitle}>Track your usage</span>
                        <span className={styles.ovRecDesc}>See trends and hires in the Analytics tab</span>
                      </span>
                      <Icon name="ChevronRight" size={18} className={styles.ovRecArrow} aria-hidden="true" />
                    </button>
                  </li>
                  <li>
                    <button type="button" className={styles.ovRec} onClick={() => setActiveTab('settings')}>
                      <span className={`${styles.chip} ${styles.chipLg} ${styles.chipAmber}`} aria-hidden="true"><Icon name="Zap" size={20} strokeWidth={1.5} fill="#e6a93c" /></span>
                      <span className={styles.ovRecText}>
                        <span className={styles.ovRecTitle}>Auto-renewal</span>
                        <span className={styles.ovRecDesc}>Enable it for uninterrupted use</span>
                      </span>
                      <Icon name="ChevronRight" size={18} className={styles.ovRecArrow} aria-hidden="true" />
                    </button>
                  </li>
                  <li>
                    <button type="button" className={styles.ovRec} onClick={() => setActiveTab('purchase')}>
                      <span className={`${styles.chip} ${styles.chipLg} ${styles.chipBlue}`} aria-hidden="true"><Icon name="Award" size={20} /></span>
                      <span className={styles.ovRecText}>
                        <span className={styles.ovRecTitle}>Bigger packages, lower cost per unlock</span>
                        <span className={styles.ovRecDesc}>Compare packages on the Purchase tab</span>
                      </span>
                      <Icon name="ChevronRight" size={18} className={styles.ovRecArrow} aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        );
      case 'purchase':
        return <CreditPackages onPurchase={handlePurchase} />;
      case 'history':
        return <TransactionHistory balance={currentBalance} />;
      case 'analytics':
        return <UsageAnalytics />;
      case 'settings':
        return <AutoRenewalSettings />;
      case 'payment':
        return <PaymentMethods onNotify={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className="pt-16 max-w-[1180px] mx-auto px-[22px]" style={{ paddingBottom: '32px' }}>
        {/* Page Header */}
        <div className={styles.head}>
          <div>
            <h1>Credits management</h1>
            <p>Buy, track, and manage your Credits for unlocking profiles</p>
          </div>

          <div className={styles.headR}>
            <div className={`${styles.balChip} ${isLowBalance ? styles.low : ''}`}>
              <span className={styles.coin}></span>
              <span>{currentBalance?.toLocaleString('sr-RS')}</span>
              <span className={styles.balChipUnit}>{creditWord(currentBalance)}</span>
            </div>

            <button className={styles.btnPrimary} onClick={() => setActiveTab('purchase')}>
              <Icon name="Plus" size={16} />Buy Credits
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className={styles.tabs}>
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`${styles.tab} ${activeTab === tab?.id ? styles.on : ''}`}
            >
              <Icon name={tab?.icon} size={18} />
              <span>{tab?.name}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className={styles.panel}>
          {renderTabContent()}
        </div>
      </main>
      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedPackage && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalClose} onClick={handleCloseModal} disabled={busy} aria-label="Close">
              <Icon name="X" size={18} />
            </button>

            <div className={styles.modalIcon}>
              <Icon name="ShoppingCart" size={30} />
            </div>

            {purchaseResult ? (
              <>
                <p className={styles.modalEyebrow}>Purchase confirmation</p>
                <h2 className={styles.modalTitle} id="purchase-modal-title">Payment successful</h2>
                <p className={styles.modalSub}>
                  {purchaseResult.credited
                    ? <>Your <b>+{formatCredits(selectedPackage?.credits)}</b> {selectedPackage?.credits === 1 ? 'is' : 'are'} now available.</>
                    : 'Your card was charged — credits will appear on your balance shortly.'}
                </p>
                <div className={styles.modalActions}>
                  <button className={`${styles.btnFull} ${styles.done}`} onClick={handleCloseModal}>
                    <Icon name="Check" size={16} />Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.modalEyebrow}>Purchase confirmation</p>
                <h2 className={styles.modalTitle} id="purchase-modal-title">Buy {selectedPackage?.name} package</h2>
                <p className={styles.modalSub}>
                  Credits are added right after payment and <b>never expire</b>. You only spend them when you unlock a candidate.
                </p>

                <div className={styles.modalBox}>
                  <div className={styles.modalRow}>
                    <span className={styles.modalRowKey}>Package</span>
                    <span className={styles.modalPkgBadge}>
                      <Icon name="CheckCheck" size={13} />
                      {selectedPackage?.name}
                    </span>
                  </div>
                  <div className={styles.modalRow}>
                    <span className={styles.modalRowKey}>Credits</span>
                    <b>
                      +{selectedPackage?.credits}{' '}
                      <span style={{ color: '#8693A0', fontWeight: 400 }}>
                        ({formatPrice(selectedPackage?.pricePerCredit, selectedPackage?.currency, { cents: true })} / unlock)
                      </span>
                    </b>
                  </div>
                  {selectedPackage?.bookmarkBonus > 0 && (
                    <div className={styles.modalRow}>
                      <span className={styles.modalRowKey}>Bonus</span>
                      <b>+{selectedPackage.bookmarkBonus} bookmarks · {selectedPackage.bookmarkBonusMonths}{' '}months</b>
                    </div>
                  )}
                  <div className={styles.modalRow}>
                    <span className={styles.modalRowKey}>Price</span>
                    <b>{formatPrice(selectedPackage?.price, selectedPackage?.currency)}</b>
                  </div>
                </div>

                <p className={styles.modalFine}>
                  All purchases are final and non-refundable.{' '}
                  <a href="/refund-policy" target="_blank" rel="noopener noreferrer">Refund Policy</a>
                </p>

                {checkoutError && <p className={styles.checkoutError}>{checkoutError}</p>}

                <div className={styles.modalActions}>
                  <button className={styles.btnOutline} onClick={handleCloseModal} disabled={busy}>
                    Cancel
                  </button>
                  <button className={styles.btnFull} onClick={() => buy(selectedPackage)} disabled={busy}>
                    {busy ? (
                      'Processing…'
                    ) : (
                      <>
                        <Icon name="Lock" size={16} />
                        Pay {formatPrice(selectedPackage?.price, selectedPackage?.currency)}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`${styles.toast} ${toastMsg ? styles.show : ''}`}>
        <Icon name="CheckCircle" size={17} />
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default CreditManagement;
