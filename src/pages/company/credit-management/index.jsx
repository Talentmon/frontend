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
import { getBalance, getUsageAnalytics } from './creditsApi';
import styles from './styles/credits.module.scss';

const CreditManagement = () => {
  const [currentBalance, setCurrentBalance] = useState(0);
  const [quickStats, setQuickStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  const isLowBalance = currentBalance < 50;

  const showToast = (message) => {
    setToastMsg(message);
    clearTimeout(toastTimer?.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const { buy, busy, error: checkoutError } = usePaddleCheckout({
    onSuccess: ({ balance, credited }) => {
      if (balance != null) setCurrentBalance(balance);
      setPurchaseResult({ credited });
      showToast(credited ? 'Credits added to your balance!' : 'Payment confirmed — credits are on their way.');
    },
  });

  useEffect(() => {
    getBalance().then((d) => setCurrentBalance(d.balance)).catch(() => {});
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

  const handleCloseModal = () => {
    setShowPurchaseModal(false);
    setSelectedPackage(null);
    setPurchaseResult(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div style={{ marginBottom: 18 }}>
              <CreditBalance balance={currentBalance} isLowBalance={isLowBalance} />
            </div>
            <div className={styles.grid2}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Quick stats</div>
                <div className={styles.qstats}>
                  <div className={styles.qstat}>
                    <span className={styles.qstatL}>Used this month</span>
                    <span className={styles.qstatV}>{quickStats ? `${quickStats.usedThisMonth} Credits` : '—'}</span>
                  </div>
                  <div className={styles.qstat}>
                    <span className={styles.qstatL}>Profiles unlocked</span>
                    <span className={styles.qstatV}>{quickStats ? quickStats.usedThisMonth : '—'}</span>
                  </div>
                  <div className={styles.qstat}>
                    <span className={styles.qstatL}>Average monthly spend</span>
                    <span className={styles.qstatV}>{quickStats ? `${quickStats.avgUsed} Credits` : '—'}</span>
                  </div>
                  <div className={styles.qstat}>
                    <span className={styles.qstatL}>Hires this month</span>
                    <span className={`${styles.qstatV} ${styles.green}`}>{quickStats ? quickStats.hiresThisMonth : '—'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardTitle}>Recommendations</div>
                <div className={styles.recs}>
                  <div className={styles.rec}>
                    <span className={`${styles.recIcon} ${styles.r1}`}><Icon name="TrendingUp" size={16} /></span>
                    <div className={styles.recBody}>
                      <b>Track your usage</b>
                      <span>See trends and hires in the Analytics tab</span>
                    </div>
                  </div>
                  <div className={styles.rec}>
                    <span className={`${styles.recIcon} ${styles.r2}`}><Icon name="Zap" size={16} /></span>
                    <div className={styles.recBody}>
                      <b>Auto-renewal</b>
                      <span>Enable it for uninterrupted use</span>
                    </div>
                  </div>
                  <div className={styles.rec}>
                    <span className={`${styles.recIcon} ${styles.r3}`}><Icon name="Award" size={16} /></span>
                    <div className={styles.recBody}>
                      <b>Bigger packages, lower cost per unlock</b>
                      <span>Compare packages on the Purchase tab</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'purchase':
        return <CreditPackages onPurchase={handlePurchase} />;
      case 'history':
        return <TransactionHistory />;
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
      <main className="pt-16 max-w-[1180px] mx-auto px-[22px]" style={{ paddingBottom: '70px' }}>
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
              <span className={styles.balChipUnit}>Credits</span>
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={handleCloseModal} aria-label="Close">
              <Icon name="X" size={18} />
            </button>

            <div className={styles.modalIcon}>
              <Icon name="ShoppingCart" size={30} />
            </div>

            {purchaseResult ? (
              <>
                <p className={styles.modalEyebrow}>Purchase confirmation</p>
                <h2 className={styles.modalTitle}>Payment successful</h2>
                <p className={styles.modalSub}>
                  {purchaseResult.credited
                    ? <>Your <b>+{selectedPackage?.credits} Credits</b> are now available.</>
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
                <h2 className={styles.modalTitle}>Buy {selectedPackage?.name} package</h2>
                <p className={styles.modalSub}>
                  Credits are added instantly and <b>never expire</b>. You only spend them when you unlock a candidate.
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
                        (€{selectedPackage?.pricePerCredit?.toFixed(2)} / unlock)
                      </span>
                    </b>
                  </div>
                  <div className={styles.modalRow}>
                    <span className={styles.modalRowKey}>Price</span>
                    <b>€{selectedPackage?.price?.toLocaleString('en-US')}</b>
                  </div>
                </div>

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
                        Pay €{selectedPackage?.price?.toLocaleString('en-US')}
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
