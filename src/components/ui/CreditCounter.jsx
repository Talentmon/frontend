import React, { useState } from 'react';
import Icon from '../AppIcon';
import { HEADER_FOCUS } from './headerStyles';
import BuyCreditsModal from 'pages/company/candidate-search-dashboard/components/BuyCreditsModal';
import { listPackages, packageToFrontend } from 'pages/company/credit-management/creditsApi';
import { useCreditBalance } from 'lib/creditBalance';

const CreditCounter = () => {
  const { balance: creditBalance, lowBalanceThreshold } = useCreditBalance();
  const [packages, setPackages] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const isLowBalance = creditBalance <= lowBalanceThreshold;

  const handlePurchaseClick = () => {
    setShowPurchaseModal(true);
    if (packages.length === 0) {
      listPackages()
        .then((rows) => setPackages(rows.map(packageToFrontend)))
        .catch(() => {});
    }
  };

  return (
    <>
      {/* One tray: coin, balance and the Buy button inside it. */}
      <div
        role="group"
        aria-label="Credits"
        className={`flex-none inline-flex items-center gap-1 h-[46px] py-1 pl-3 pr-1 rounded-xl bg-[#2B3646] border transition-colors duration-200 ${
          isLowBalance ? 'border-warning' : 'border-white/[0.06]'
        }`}
      >
        <span
          aria-hidden="true"
          className="flex-none w-4 h-4 rounded-full"
          style={{
            background: isLowBalance
              ? 'var(--color-warning)'
              : 'radial-gradient(circle at 35% 35%, #F7C766 0%, #E6A93C 55%, #C98A1F 100%)',
          }}
        />
        <span className="inline-flex items-center gap-1.5 pl-1 pr-2.5">
          <span
            aria-label={`${creditBalance} credits left`}
            className={`font-mono text-[15px] leading-[18px] font-bold whitespace-nowrap ${isLowBalance ? 'text-warning' : 'text-white'}`}
          >
            {creditBalance}
          </span>
          {isLowBalance && (
            <Icon name="AlertTriangle" size={14} color="var(--color-warning)" aria-label="Low balance" />
          )}
        </span>

        {/* Purchase Button: "+ Buy", just "+" on phones */}
        <button
          type="button"
          onClick={handlePurchaseClick}
          aria-label="Buy credits"
          className={`flex-none inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:pl-3 sm:pr-3.5 rounded-[9px] bg-[#E6A93C] hover:bg-[#EDB651] text-[#1B2330] text-sm font-bold whitespace-nowrap transition-colors duration-150 ${HEADER_FOCUS}`}
        >
          <Icon name="Plus" size={14} strokeWidth={2.8} />
          <span className="hidden sm:inline">Buy</span>
        </button>
      </div>

      {showPurchaseModal && (
        <BuyCreditsModal
          balance={creditBalance}
          packages={packages}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
    </>
  );
};

export default CreditCounter;
