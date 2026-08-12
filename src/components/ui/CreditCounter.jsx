import React, { useEffect, useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import BuyCreditsModal from 'pages/company/candidate-search-dashboard/components/BuyCreditsModal';
import { getBalance, listPackages, packageToFrontend } from 'pages/company/credit-management/creditsApi';

const CreditCounter = () => {
  const [creditBalance, setCreditBalance] = useState(0);
  const [packages, setPackages] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    getBalance().then((r) => setCreditBalance(r.balance)).catch(() => {});
  }, []);

  const isLowBalance = creditBalance < 50;

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

      {showPurchaseModal && (
        <BuyCreditsModal
          balance={creditBalance}
          packages={packages}
          onClose={() => setShowPurchaseModal(false)}
          onPurchased={({ balance }) => {
            if (balance != null) setCreditBalance(balance);
          }}
        />
      )}
    </>
  );
};

export default CreditCounter;
