import React, { useState, useEffect, useRef } from 'react';
import Icon from 'components/AppIcon';
import StarInput from './StarInput';
import Stars from './Stars';
import { CATS, calcOverall } from '../utils';
import styles from '../styles/myRatings.module.scss';

const RatingModal = ({ company, mode, initialData, onSave, onClose, saving = false }) => {
  const [cats, setCats] = useState(
    mode === 'edit' && initialData
      ? { ...initialData.cats }
      : { process: 0, comms: 0, culture: 0, benefits: 0 }
  );
  const [minPay,    setMinPay]    = useState(mode === 'edit' && initialData ? initialData.minPay    : null);
  const [recommend, setRecommend] = useState(mode === 'edit' && initialData ? initialData.recommend : null);
  const [review,    setReview]    = useState(mode === 'edit' && initialData ? (initialData.review ?? '') : '');

  const overall    = calcOverall(cats, minPay);
  const isComplete = CATS.every(c => cats[c.key] > 0) && minPay !== null;
  const overlayRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const setCat = (key, val) => setCats(prev => ({ ...prev, [key]: val }));

  const toggleMinPay = (val) => setMinPay(prev => prev === val ? null : val);

  const toggleRecommend = (val) => setRecommend(prev => prev === val ? null : val);

  const handleSave = () => {
    if (!isComplete || saving) return;
    onSave({ cats, minPay, recommend, review });
  };

  return (
    <div
      className={styles.modalOverlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rm-title"
    >
      <div className={styles.modal}>
        <button
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close modal"
        >
          <Icon name="X" size={19} />
        </button>

        {/* Company header */}
        <div className={styles.modalHead}>
          <span className={`${styles.logo} ${styles.logoLg}`} style={{ background: company.color }}>
            {company.company[0]}
          </span>
          <div>
            <h2 id="rm-title" className={styles.modalTitle}>
              {mode === 'edit' ? 'Edit rating' : 'Rate'} — {company.company}
            </h2>
          </div>
        </div>
        <div className={styles.modalSub}>
          {[company.industry, company.city, company.role].filter(Boolean).join(' · ')}
        </div>

        {/* Category rows */}
        <div className={styles.rateRows}>
          {CATS.map(cat => (
            <div key={cat.key} className={styles.rateRow}>
              <div className={styles.rateLabel}>
                {cat.label}
                <span>{cat.hint}</span>
              </div>
              <StarInput
                value={cats[cat.key]}
                onChange={(val) => setCat(cat.key, val)}
              />
            </div>
          ))}
        </div>

        {/* Minimum salary question */}
        <div className={styles.minPayQ}>
          <div className={styles.minPayQLabel}>
            Was the minimum salary from your profile honored?
            <span>If not, the overall rating cannot exceed 3.</span>
          </div>
          <div className={styles.minPayToggle}>
            <button
              aria-label="Yes, the minimum salary was honored"
              aria-pressed={minPay === true}
              className={`${styles.minPayBtn} ${minPay === true ? styles.minPayBtnYesOn : ''}`}
              onClick={() => toggleMinPay(true)}
            >
              Yes
            </button>
            <button
              aria-label="No, the minimum salary was not honored"
              aria-pressed={minPay === false}
              className={`${styles.minPayBtn} ${minPay === false ? styles.minPayBtnNoOn : ''}`}
              onClick={() => toggleMinPay(false)}
            >
              No
            </button>
          </div>
        </div>

        {/* Live overall rating */}
        <div className={styles.overallLive}>
          Overall rating: <strong>{overall ? overall.toFixed(1) : '—'}</strong>
          {overall > 0 && <Stars value={overall} size="sm" />}
          {minPay === false && overall > 0 && (
            <span className={styles.overallCapped}>Capped at 3 · minimum not honored</span>
          )}
        </div>

        {/* Comment */}
        <div className={styles.field}>
          <label htmlFor="rm-review">Your comment</label>
          <textarea
            id="rm-review"
            value={review}
            onChange={e => setReview(e.target.value)}
            placeholder="What was the process, communication, culture like…"
          />
        </div>

        {/* Recommendation (optional) */}
        <div className={styles.recToggle}>
          {[
            { val: true,  label: 'Recommend',    icon: 'ThumbsUp',   onCls: styles.recBtnYesOn },
            { val: false, label: 'Don’t recommend',  icon: 'ThumbsDown', onCls: styles.recBtnNoOn  },
          ].map(opt => {
            const isOn = recommend === opt.val;
            return (
              <button
                key={String(opt.val)}
                type="button"
                aria-label={opt.label}
                aria-pressed={isOn}
                className={`${styles.recBtn} ${isOn ? opt.onCls : ''}`}
                onClick={() => toggleRecommend(opt.val)}
              >
                <span className={styles.recBtnFace}>
                  <Icon name={opt.icon} size={15} />
                  {opt.label}
                </span>
                {isOn && (
                  <span
                    className={styles.recBtnX}
                    aria-label="Clear recommendation choice"
                    onClick={(e) => { e.stopPropagation(); setRecommend(null); }}
                  >
                    <Icon name="X" size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className={styles.recNote}>Optional — you can leave it neutral.</p>

        {/* Buttons */}
        <div className={styles.modalFoot}>
          <p className={styles.anonNote}>
            <Icon name="Lock" size={12} />
            Your review is submitted anonymously
          </p>

          <div className={styles.modalFootActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnGold}
              onClick={handleSave}
              disabled={!isComplete || saving}
              aria-label="Save rating"
              title={!isComplete ? 'Rate all categories and answer the minimum salary question' : undefined}
            >
              <Icon name="Check" size={16} />
              {saving ? 'Saving…' : 'Save rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
