import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import dashboardStyles from '../../candidate-search-dashboard/styles/dashboard.module.scss';
import styles from '../styles/bookmarked.module.scss';

const BulkActionsToolbar = ({
  selectedCandidates,
  allCandidates,
  onSelectAll,
  onClearSelection,
  onBulkUnlock,
  onBulkRemove,
  creditBalance
}) => {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [unlockedCandidates, setUnlockedCandidates] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const selectedCount = selectedCandidates?.length;
  const allSelected = selectedCount === allCandidates?.length && allCandidates?.length > 0;

  const calculateUnlockCost = () => {
    return selectedCandidates?.reduce((total, candidateId) => {
      const candidate = allCandidates?.find(c => c?.id === candidateId);
      return total + (candidate?.unlockCost || 0);
    }, 0);
  };

  const handleSelectAllChange = () => {
    if (allSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  const handleBulkAction = (type) => {
    // Deciding which candidates to unlock and which to skip when Credits run
    // short isn't ours to make - if the balance can't cover the whole
    // selection, point the company at buying more or unlocking one by one
    // instead of letting the backend pick winners.
    if (type === 'unlock' && !canAffordUnlock) {
      setActionType('insufficientCredits');
      setShowConfirmModal(true);
      return;
    }
    setActionType(type);
    setShowConfirmModal(true);
  };

  const handleGoToCreditManagement = () => {
    cancelBulkAction();
    navigate('/credit-management');
  };

  // onBulkUnlock resolves to { unlocked: revealedCandidate[], failed: [...] }
  // with real name/photo already attached (see index.jsx) - the backend
  // unlocks best-effort, so the success view only lists candidates that
  // actually got unlocked, not everything that was selected.
  const confirmBulkAction = async () => {
    if (actionType === 'unlock') {
      setBulkBusy(true);
      try {
        const result = await onBulkUnlock(selectedCandidates);
        if (result?.unlocked?.length > 0) {
          setUnlockedCandidates(result.unlocked);
        } else {
          cancelBulkAction();
        }
      } finally {
        setBulkBusy(false);
      }
    } else if (actionType === 'remove') {
      onBulkRemove(selectedCandidates);
      setShowConfirmModal(false);
      setActionType(null);
    }
  };

  const cancelBulkAction = () => {
    setShowConfirmModal(false);
    setActionType(null);
    setUnlockedCandidates(null);
  };

  const handleGoToPurchased = () => {
    cancelBulkAction();
    navigate('/purchased-profiles');
  };

  const unlockCost = calculateUnlockCost();
  const canAffordUnlock = creditBalance >= unlockCost;

  return (
    <>
      {selectedCount > 0 && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkLeft}>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={allSelected} onChange={handleSelectAllChange} />
              {selectedCount} of {allCandidates?.length} selected
            </label>

            {selectedCandidates?.length > 0 && (
              <span className={styles.bulkInfo}>
                {selectedCandidates?.length} not unlocked • {unlockCost} Credits needed
              </span>
            )}
          </div>

          <div className={styles.bulkActionsRow}>
            {selectedCandidates?.length > 0 && (
              <button
                className={styles.btnPrimary}
                onClick={() => handleBulkAction('unlock')}
              >
                <Icon name="Unlock" size={14} />Unlock all ({unlockCost})
              </button>
            )}

            <button className={styles.btnGhost} onClick={() => handleBulkAction('remove')}>
              <Icon name="Trash2" size={14} />Remove selected
            </button>

            <button className={styles.btnGhostMuted} onClick={onClearSelection}>
              <Icon name="X" size={14} />Cancel
            </button>
          </div>
        </div>
      )}

      {showConfirmModal && actionType === 'insufficientCredits' && (
        <div className={dashboardStyles.unlockOverlay} onClick={cancelBulkAction}>
          <div
            className={dashboardStyles.unlockModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="insufficientCreditsTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={dashboardStyles.unlockClose} onClick={cancelBulkAction} aria-label="Close">
              <Icon name="X" size={18} />
            </button>

            <div className={dashboardStyles.unlockHead}>
              <div className={dashboardStyles.unlockIconWrap}>
                <Icon name="AlertTriangle" size={22} />
              </div>
              <div>
                <p className={dashboardStyles.unlockEyebrow}>Not enough Credits</p>
                <h2 className={dashboardStyles.unlockTitle} id="insufficientCreditsTitle">
                  Can't unlock all {selectedCount} candidates
                </h2>
              </div>
            </div>

            <p className={dashboardStyles.unlockSub}>
              You have <b>{creditBalance}</b> Credits, but unlocking all {selectedCount} selected candidates needs <b>{unlockCost}</b>.
            </p>

            <div className={dashboardStyles.unlockNote}>
              <span className={dashboardStyles.unlockNoteIcon}>
                <Icon name="Info" size={14} />
              </span>
              <p className={dashboardStyles.unlockNoteText}>
                You decide who gets unlocked - either unlock candidates one at a time from your bookmarks, or buy more Credits to unlock all of them now.
              </p>
            </div>

            <div className={dashboardStyles.unlockActions}>
              <button className={dashboardStyles.unlockBtnGo} onClick={handleGoToCreditManagement}>
                <Icon name="ShoppingCart" size={16} />
                Buy Credits
              </button>
              <button className={dashboardStyles.unlockBtnX} onClick={cancelBulkAction}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && actionType === 'unlock' && !unlockedCandidates && (
        <div className={dashboardStyles.unlockOverlay} onClick={cancelBulkAction}>
          <div
            className={dashboardStyles.unlockModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulkUnlockModalTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={dashboardStyles.unlockClose} onClick={cancelBulkAction} aria-label="Close">
              <Icon name="X" size={18} />
            </button>

            <div className={dashboardStyles.unlockHead}>
              <div className={dashboardStyles.unlockIconWrap}>
                <Icon name="Unlock" size={22} />
              </div>
              <div>
                <p className={dashboardStyles.unlockEyebrow}>Unlocking Profiles</p>
                <h2 className={dashboardStyles.unlockTitle} id="bulkUnlockModalTitle">
                  Unlock {selectedCandidates?.length} candidate{selectedCandidates?.length === 1 ? '' : 's'}?
                </h2>
              </div>
            </div>

            <p className={dashboardStyles.unlockSub}>You'll reveal the full name, contact info, and profile details.</p>

            <div className={dashboardStyles.unlockRows}>
              <div className={dashboardStyles.unlockRow} style={{ alignItems: 'flex-start' }}>
                <span className={dashboardStyles.k}>Candidate{selectedCandidates?.length === 1 ? '' : 's'}</span>
                <div className={styles.unlockCandidateList}>
                  {selectedCandidates?.map((candidateId) => {
                    const candidate = allCandidates?.find((c) => c?.id === candidateId);
                    return (
                      <span key={candidateId} className={dashboardStyles.v}>
                        {candidate?.position}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className={dashboardStyles.unlockRow}>
                <span className={dashboardStyles.k}>Price</span>
                <span className={`${dashboardStyles.v} ${dashboardStyles.vGold}`}>{unlockCost} Credits</span>
              </div>
              <div className={dashboardStyles.unlockRow}>
                <span className={dashboardStyles.k}>Balance after</span>
                <span className={dashboardStyles.v}>{Math.max(creditBalance - unlockCost, 0)} Credits</span>
              </div>
            </div>

            <div className={dashboardStyles.unlockNote}>
              <span className={dashboardStyles.unlockNoteIcon}>
                <Icon name="Info" size={14} />
              </span>
              <p className={dashboardStyles.unlockNoteText}>
                By unlocking, I accept the salary clause:{' '}
                <b>the salary stated by the candidate is the minimum salary that will be offered to them.</b>
              </p>
            </div>

            <div className={dashboardStyles.unlockActions}>
              <button
                className={dashboardStyles.unlockBtnGo}
                onClick={confirmBulkAction}
                disabled={!canAffordUnlock || bulkBusy}
                style={!canAffordUnlock ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                <Icon name="Unlock" size={16} />
                {bulkBusy ? 'Unlocking…' : 'Confirm unlock'}
              </button>
              <button className={dashboardStyles.unlockBtnX} onClick={cancelBulkAction} disabled={bulkBusy}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && actionType === 'unlock' && unlockedCandidates && (
        <div className={dashboardStyles.unlockOverlay} onClick={cancelBulkAction}>
          <div
            className={dashboardStyles.unlockModal}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <button className={dashboardStyles.unlockClose} onClick={cancelBulkAction} aria-label="Close">
              <Icon name="X" size={18} />
            </button>

            <div className={styles.unlockedList}>
              {unlockedCandidates?.map((candidate) => (
                <div key={candidate?.id} className={styles.unlockedRow}>
                  <div className={styles.unlockedAvatar}>
                    <Image src={candidate?.avatar} alt={candidate?.name} />
                  </div>
                  <div className={styles.unlockedInfo}>
                    <span className={styles.unlockedNameRow}>
                      <span className={styles.unlockedName}>{candidate?.name}</span>
                      <Icon name="CheckCircle2" size={15} className={styles.unlockedCheck} />
                    </span>
                    <span className={styles.unlockedRole}>{candidate?.position}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className={dashboardStyles.unlockDoneSub}>
              {unlockedCandidates?.length === 1 ? 'The candidate is' : 'The candidates are'} now available on the{' '}
              <b>"Purchased"</b> page, where you can view their contact information.
            </p>

            <div className={dashboardStyles.unlockActions}>
              <button className={dashboardStyles.unlockBtnPurchased} onClick={handleGoToPurchased}>
                <Icon name="ArrowUpRight" size={16} />
                Purchased
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && actionType === 'remove' && (
        <div className={styles.overlay} onClick={cancelBulkAction}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={`${styles.modalIc} ${styles.danger}`}>
                <Icon name="Trash2" size={22} />
              </div>
              <div>
                <h3>Remove candidates</h3>
                <p className={styles.modalSub}>
                  {selectedCount} selected candidate{selectedCount === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className={styles.modalWarning}>
              <Icon name="AlertTriangle" size={16} />
              <span>
                Are you sure you want to remove {selectedCount} candidate{selectedCount === 1 ? '' : 's'} from your bookmarks? This action cannot be undone.
              </span>
            </div>

            <div className={styles.modalActions}>
              <button className={`${styles.btnGo} ${styles.danger}`} onClick={confirmBulkAction}>
                Remove
              </button>
              <button className={styles.btnX} onClick={cancelBulkAction}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsToolbar;
