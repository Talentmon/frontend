import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/company.module.scss';

const DeleteAccountModal = ({ isVisible, companyName, onClose, onConfirm, busy }) => {
  const [confirmText, setConfirmText] = useState('');
  const isDeleting = !!busy;

  useEffect(() => {
    if (!isVisible) {
      setConfirmText('');
      return;
    }
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const isMatch = confirmText?.trim() === companyName;

  const handleConfirm = () => {
    if (!isMatch || isDeleting) return;
    onConfirm?.();
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e?.target === e?.currentTarget) onClose?.(); }}
    >
      <div className={styles.dmodal} role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
        <div className={styles.mHead}>
          <div className={styles.mHeadTop}>
            <div className={styles.mIcon}>
              <Icon name="AlertTriangle" size={23} />
            </div>
            <div className={styles.mHtext}>
              <p className={styles.mEyebrow}>Dangerous action</p>
              <h2 className={styles.mTitle} id="deleteModalTitle">Delete account</h2>
            </div>
            <button className={styles.mClose} onClick={onClose} aria-label="Close">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className={styles.mSub}>This action is permanent and cannot be undone.</div>
        </div>

        <div className={styles.mBody}>
          <ul className={styles.cons}>
            <li className={styles.consItem}>
              <span className={styles.consX}><Icon name="X" size={12} /></span>
              All company, reputation, and rating data will be permanently deleted.
            </li>
            <li className={styles.consItem}>
              <span className={styles.consX}><Icon name="X" size={12} /></span>
              All unlocked candidate profiles and token purchase history will be lost.
            </li>
            <li className={styles.consItem}>
              <span className={styles.consX}><Icon name="X" size={12} /></span>
              Remaining tokens on the account will not be refunded.
            </li>
            <li className={styles.consItem}>
              <span className={styles.consX}><Icon name="X" size={12} /></span>
              This account cannot be recovered after deletion.
            </li>
          </ul>

          <label className={styles.confirmLab} htmlFor="deleteConfirmInput">
            To confirm, type the company name <b>{companyName}</b>
          </label>
          <div className={`${styles.confirmField} ${isMatch ? styles.ok : ''}`}>
            <input
              id="deleteConfirmInput"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e?.target?.value)}
              placeholder={companyName}
              autoComplete="off"
              spellCheck="false"
              aria-label="Company name to confirm"
            />
            <span className={styles.tick}><Icon name="Check" size={18} /></span>
          </div>

          <div className={styles.mActions}>
            <button
              className={styles.btnDel}
              onClick={handleConfirm}
              disabled={!isMatch || isDeleting}
            >
              <Icon name="Trash2" size={16} />
              {isDeleting ? 'Deleting...' : 'Permanently delete account'}
            </button>
            <button className={styles.btnCancel} onClick={onClose} disabled={isDeleting}>
              Cancel
            </button>
          </div>

          <div className={styles.mFoot}>
            <Icon name="Lock" size={13} />
            You can also export your data before deleting
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
