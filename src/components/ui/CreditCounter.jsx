import React, { useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import styles from './styles/creditCounter.module.scss';

const PACKAGES = [
  { id: 'buy1', name: 'BUY 1', credits: 1, price: 20, pricePerCredit: 20.00, popular: false },
  { id: 'starter', name: 'STARTER', credits: 10, price: 119, pricePerCredit: 11.90, popular: false },
  { id: 'growth', name: 'GROWTH', credits: 30, price: 339, pricePerCredit: 11.30, popular: true },
  { id: 'scale', name: 'SCALE', credits: 50, price: 569, pricePerCredit: 11.38, popular: false },
  { id: 'agency', name: 'AGENCY', credits: 100, price: 1099, pricePerCredit: 10.99, popular: false }
];

const CreditCounter = () => {
  const [creditBalance, setCreditBalance] = useState(125);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedId, setSelectedId] = useState('growth');
  const [purchasing, setPurchasing] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const isLowBalance = creditBalance < 50;
  const selectedPackage = PACKAGES?.find((pkg) => pkg?.id === selectedId);

  const handlePurchaseClick = () => {
    setShowPurchaseModal(true);
  };

  const handleClosePurchaseModal = () => {
    if (purchasing) return;
    setShowPurchaseModal(false);
  };

  const handleConfirmPurchase = () => {
    if (purchasing || !selectedPackage) return;
    setPurchasing(true);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 800);
    setTimeout(() => {
      setCreditBalance((prev) => prev + selectedPackage?.credits);
      setShowPurchaseModal(false);
      setPurchasing(false);
    }, 1200);
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Credit Display */}
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          isLowBalance
            ? 'bg-warning/10 border-warning text-warning'
            : 'bg-white/5 border-white/10 text-[#F2C871]'
        }`}>
          <span
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ background: isLowBalance ? 'var(--color-warning)' : 'linear-gradient(135deg, #F2C871, #C98A1F)' }}
          />
          <span className="font-mono text-sm font-medium">{creditBalance}</span>
          {isLowBalance && (
            <Icon name="AlertTriangle" size={14} color="var(--color-warning)" />
          )}
        </div>

        {/* Purchase Button */}
        <Button
          size="sm"
          onClick={handlePurchaseClick}
          iconName="Plus"
          iconSize={14}
          className="hidden sm:flex bg-[#E6A93C] text-[#241704] hover:bg-[#F2C871] border-0"
        >
          Buy
        </Button>

        {/* Mobile Purchase Button */}
        <button
          onClick={handlePurchaseClick}
          className="sm:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Purchase credits"
        >
          <Icon name="Plus" size={16} />
        </button>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className={styles.overlay} onClick={handleClosePurchaseModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="creditCounterModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`${styles.flash} ${flashing ? styles.flashing : ''}`} />

            <div className={styles.head}>
              <div>
                <p className={styles.eyebrow}>Top up credits</p>
                <h2 className={styles.title} id="creditCounterModalTitle">Choose a package</h2>
              </div>
              <button className={styles.close} onClick={handleClosePurchaseModal} aria-label="Close">
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className={styles.balance}>
              <span className={styles.coin} />
              Current balance: <b>{creditBalance} Credits</b>
            </div>

            <div className={styles.packs}>
              {PACKAGES?.map((pkg) => (
                <button
                  key={pkg?.id}
                  className={`${styles.pack} ${pkg?.id === selectedId ? styles.sel : ''}`}
                  onClick={() => !purchasing && setSelectedId(pkg?.id)}
                  disabled={purchasing}
                >
                  <span className={styles.radio} />
                  <div className={styles.packMain}>
                    <div className={styles.packName}>
                      {pkg?.name}
                      {pkg?.popular && <span className={styles.packTag}>Most popular</span>}
                    </div>
                    <div className={styles.packSub}>{pkg?.credits} credits · €{pkg?.pricePerCredit?.toFixed(2)} / credit</div>
                  </div>
                  <div className={styles.packPrice}>
                    <div className={styles.amt}>€{pkg?.price?.toLocaleString('en-US')}</div>
                    <div className={styles.per}>+{pkg?.credits}</div>
                  </div>
                </button>
              ))}
            </div>

            <button
              className={`${styles.cta} ${purchasing ? styles.done : ''}`}
              onClick={handleConfirmPurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <>
                  <Icon name="Check" size={18} />
                  Purchased · +{selectedPackage?.credits} credits
                </>
              ) : (
                <>
                  <Icon name="CreditCard" size={18} />
                  Buy {selectedPackage?.credits} credits · €{selectedPackage?.price}
                </>
              )}
            </button>

            <div className={styles.foot}>
              <span><Icon name="Shield" size={13} />Secure payment processing</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreditCounter;
