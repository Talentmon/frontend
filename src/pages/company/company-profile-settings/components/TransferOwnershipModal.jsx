import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import styles from '../styles/company.module.scss';

/** Confirms handing the company to an active recruiter — the owner's password is required (checked by the backend). */
const TransferOwnershipModal = ({ member, onClose, onConfirm, busy, error }) => {
  const [password, setPassword] = useState('');

  useEffect(() => {
    setPassword('');
  }, [member?.id]);

  useEffect(() => {
    if (!member) return undefined;
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape' && !busy) onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [member, busy, onClose]);

  if (!member) return null;

  const name = member.name || member.email;
  const submit = (e) => {
    e.preventDefault();
    if (password && !busy) onConfirm?.(password);
  };

  const points = [
    `${name} gets everything only the owner can do: the company profile, the team, payment cards and deleting the company.`,
    `You stay on the team as a recruiter — after this, ${name} can remove you.`,
    `${name}'s personal bookmarks move to the company list.`,
    'Every unlock, bookmark and purchase keeps showing who made it.',
    `The company email becomes ${member.email}.`,
  ];

  return (
    <div className={styles.overlay} onClick={(e) => { if (e?.target === e?.currentTarget && !busy) onClose?.(); }}>
      <div className={styles.dmodal} role="dialog" aria-modal="true" aria-labelledby="transferOwnerTitle">
        <div className={styles.mHead}>
          <div className={styles.mHeadTop}>
            <div className={`${styles.mIcon} ${styles.mIconGold}`}>
              <Icon name="Crown" size={23} />
            </div>
            <div className={styles.mHtext}>
              <p className={`${styles.mEyebrow} ${styles.mEyebrowGold}`}>Transfer ownership</p>
              <h2 className={styles.mTitle} id="transferOwnerTitle">Make {name} the owner?</h2>
            </div>
            <button className={styles.mClose} onClick={onClose} disabled={busy} aria-label="Close">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className={styles.mSub}>Only {name} will be able to hand it back.</div>
        </div>

        <form className={styles.mBody} onSubmit={submit} noValidate>
          <ul className={styles.cons}>
            {points.map((point) => (
              <li key={point} className={styles.consItem}>
                <span className={`${styles.consX} ${styles.consInfo}`}><Icon name="Check" size={12} /></span>
                {point}
              </li>
            ))}
          </ul>

          <div className={styles.mFields}>
            <div className={styles.field}>
              <label className={styles.flabel} htmlFor="transferPassword">Your password</label>
              <input
                id="transferPassword"
                className={styles.finput}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          {error && <div className={styles.mError}>{error}</div>}

          <div className={styles.mActions}>
            <button type="submit" className={styles.btnPrimary} disabled={!password || busy}>
              <Icon name="Crown" size={16} />{busy ? 'Transferring…' : 'Make owner'}
            </button>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={busy}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferOwnershipModal;
