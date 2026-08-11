import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import styles from '../styles/dashboard.module.scss';

const UnlockConfirmModal = ({ candidate, creditCost, balance, onConfirm, onClose }) => {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!candidate) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
      setUnlocked(true);
    } catch {
      // Error toast is already shown by the caller — just let the user retry.
    } finally {
      setConfirming(false);
    }
  };

  const handleGoToPurchased = () => {
    onClose();
    navigate('/purchased-profiles');
  };

  return (
    <div className={styles.unlockOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={styles.unlockModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlockModalTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.unlockClose} onClick={onClose} aria-label="Close">
          <Icon name="X" size={18} />
        </button>

        {!unlocked ? (
          <>
            <div className={styles.unlockHead}>
              <div className={styles.unlockIconWrap}>
                <Icon name="Unlock" size={22} />
              </div>
              <div>
                <p className={styles.unlockEyebrow}>Unlocking Profile</p>
                <h2 className={styles.unlockTitle} id="unlockModalTitle">Unlock this candidate?</h2>
              </div>
            </div>

            <p className={styles.unlockSub}>You'll reveal the full name, contact info, and profile details.</p>

            <div className={styles.unlockRows}>
              <div className={styles.unlockRow}>
                <span className={styles.k}>Candidate</span>
                <span className={styles.v}>{candidate?.position}</span>
              </div>
              <div className={styles.unlockRow}>
                <span className={styles.k}>Price</span>
                <span className={`${styles.v} ${styles.vGold}`}>{creditCost} Credits</span>
              </div>
              <div className={styles.unlockRow}>
                <span className={styles.k}>Balance after</span>
                <span className={styles.v}>{Math.max(balance - creditCost, 0)} Credits</span>
              </div>
            </div>

            <div className={styles.unlockNote}>
              <span className={styles.unlockNoteIcon}>
                <Icon name="Info" size={14} />
              </span>
              <p className={styles.unlockNoteText}>
                By unlocking, I accept the salary clause:{' '}
                <b>the salary stated by the candidate is the minimum salary that will be offered to them.</b>
              </p>
            </div>

            <div className={styles.unlockActions}>
              <button className={styles.unlockBtnGo} onClick={handleConfirm} disabled={confirming}>
                <Icon name="Unlock" size={16} />
                {confirming ? 'Unlocking…' : 'Confirm unlock'}
              </button>
              <button className={styles.unlockBtnX} onClick={onClose} disabled={confirming}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.unlockDoneHead}>
              <div className={styles.unlockDoneAvatar}>
                <Image src={candidate?.avatar} alt={candidate?.name} />
              </div>
              <div>
                <span className={styles.unlockDoneName}>{candidate?.name}</span>
                <span className={styles.unlockDoneRole}>{candidate?.position}</span>
              </div>
            </div>

            <p className={styles.unlockDoneSub}>
              The candidate is now available on the <b>"Purchased"</b> page, where you can view their contact information.
            </p>

            <div className={styles.unlockActions}>
              <button className={styles.unlockBtnDone} disabled>
                <Icon name="CheckCircle2" size={30} />
                Candidate unlocked
              </button>
              <button className={styles.unlockBtnPurchased} onClick={handleGoToPurchased}>
                <Icon name="ArrowUpRight" size={16} />
                Purchased
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UnlockConfirmModal;
