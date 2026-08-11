import React, { useState } from 'react';
import Select from 'components/ui/Select';
import styles from '../styles/purchased.module.scss';

const RATING_LABELS = { 1: 'Poor', 2: 'Average', 3: 'Good', 4: 'Very good', 5: 'Excellent' };

const FeedbackModal = ({
  isOpen,
  onClose,
  candidateProfile,
  onSubmitFeedback
}) => {
  const emptyFeedback = {
    rating: '',
    hireDate: '',
    position: '',
    salaryClauseRespected: '',
    comments: ''
  };

  const [feedback, setFeedback] = useState(emptyFeedback);
  const [hoverRating, setHoverRating] = useState(0);

  const handleInputChange = (field, value) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSubmitFeedback(candidateProfile?.id, feedback);
    onClose();
    setFeedback(emptyFeedback);
    setHoverRating(0);
  };

  if (!isOpen) return null;

  const isValid = feedback?.rating && feedback?.hireDate && feedback?.position && feedback?.salaryClauseRespected;
  const activeRating = hoverRating || Number(feedback?.rating) || 0;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-label="Hiring feedback">
        <div className={styles.mHead}>
          <span className={styles.mIc}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 6 .8-4.5 4.2 1.2 6L12 16l-5.7 3 1.2-6L3 8.8 9 8z" /></svg>
          </span>
          <div>
            <h2>Hiring feedback</h2>
            <p>Rate your experience with <b>{candidateProfile?.name}</b> — this helps keep the candidate pool high quality.</p>
          </div>
          <button type="button" className={styles.mClose} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.mBody}>
            <div className={styles.cand}>
              <span className={styles.candAv}>{candidateProfile?.name?.charAt(0)}</span>
              <div>
                <b>{candidateProfile?.name}</b>
                <span>{candidateProfile?.position} · <span className={styles.candCo}>{candidateProfile?.company}</span></span>
              </div>
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.flabel}>Overall candidate rating <span className={styles.req}>*</span></label>
              <div className={styles.stars}>
                <div className={styles.starRow} onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5]?.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.star} ${activeRating >= v ? styles.on : ''}`}
                      aria-label={`${v} ${v === 1 ? 'star' : 'stars'}`}
                      onMouseEnter={() => setHoverRating(v)}
                      onClick={() => handleInputChange('rating', String(v))}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 6 .8-4.5 4.2 1.2 6L12 16l-5.7 3 1.2-6L3 8.8 9 8z" /></svg>
                    </button>
                  ))}
                </div>
                <span className={styles.starLabel}>{activeRating ? RATING_LABELS?.[activeRating] : 'Click to rate'}</span>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.flabel} htmlFor="fm-hireDate">Hire date <span className={styles.req}>*</span></label>
                <input
                  id="fm-hireDate"
                  type="date"
                  className={styles.finput}
                  value={feedback?.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e?.target?.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.flabel} htmlFor="fm-position">Position hired for <span className={styles.req}>*</span></label>
                <input
                  id="fm-position"
                  type="text"
                  placeholder="e.g. Senior React Developer"
                  className={styles.finput}
                  value={feedback?.position}
                  onChange={(e) => handleInputChange('position', e?.target?.value)}
                  required
                />
              </div>
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.flabel} htmlFor="fm-clause">
                Did you honor the minimum salary clause you agreed to when unlocking the candidate? <span className={styles.req}>*</span>
              </label>
              <Select
                id="fm-clause"
                value={feedback?.salaryClauseRespected}
                onChange={(value) => handleInputChange('salaryClauseRespected', value)}
                placeholder="Select an answer"
                required
                options={[
                  { value: 'yes', label: 'Yes — we honored the clause' },
                  { value: 'no', label: 'No — we offered a lower salary' },
                ]}
              />
              <div className={styles.fhint}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                This helps us protect candidates and keep salary data on the platform honest.
              </div>
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.flabel} htmlFor="fm-comments">Additional comments</label>
              <textarea
                id="fm-comments"
                className={styles.ftext}
                placeholder="Describe your experience with the candidate, their strengths, areas for improvement..."
                value={feedback?.comments}
                onChange={(e) => handleInputChange('comments', e?.target?.value)}
              />
            </div>
          </div>

          <div className={styles.mFoot}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnSend} disabled={!isValid}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
              Submit rating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
