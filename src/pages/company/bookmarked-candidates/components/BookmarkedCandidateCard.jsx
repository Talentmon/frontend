import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import dashboardStyles from '../../candidate-search-dashboard/styles/dashboard.module.scss';
import { formatSalary } from '../../candidate-search-dashboard/utils/cvHelpers';
import styles from '../styles/bookmarked.module.scss';

const noticeLabels = {
  immediately: 'Immediately',
  '2-weeks': '2 weeks',
  '1-month': '1 month',
  '3-months': '3 months'
};

const BookmarkedCandidateCard = ({
  candidate,
  onRemoveBookmark,
  onUnlockProfile,
  onUpdateNotes,
  onPreviewCandidate,
  isActive = false,
  creditBalance,
  isNotesOpen = false,
  onToggleNotes,
  reorderMode = false
}) => {
  const [notes, setNotes] = useState(candidate?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(!candidate?.notes);
  const notesTextareaRef = useRef(null);

  useEffect(() => {
    if (isEditingNotes && notesTextareaRef.current) {
      notesTextareaRef.current.style.minHeight = `${notesTextareaRef.current.offsetHeight}px`;
    }
  }, [isEditingNotes]);

  const handleNotesChange = (e) => {
    setNotes(e?.target?.value);
  };

  const handleSaveNotes = () => {
    if (!notes.trim()) return;
    onUpdateNotes(candidate?.id, notes);
    setIsEditingNotes(false);
  };

  const handleDeleteNotes = () => {
    setNotes('');
    onUpdateNotes(candidate?.id, '');
    setIsEditingNotes(true);
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isUnlocked = !!candidate?.isPurchased;

  const description = candidate?.description || '';
  const truncatedDesc = description?.length > 300
    ? `${description?.slice(0, 300)?.trimEnd()}…`
    : description;

  const workArrangement = candidate?.workArrangement || (candidate?.jobType?.includes('remote') ? 'Remote' : 'On-site');

  const handlePreviewClick = () => {
    onPreviewCandidate?.(candidate?.id);
  };

  const BlurredText = ({ text, redactedClassName = '', className = '' }) => (
    isUnlocked
      ? <span className={className}>{text}</span>
      : <span className={redactedClassName}></span>
  );

  const Avatar = ({ size }) => (
    <div className={dashboardStyles.avatar} style={{ width: size, height: size }}>
      {!isUnlocked ? (
        <div className={dashboardStyles.avatarLocked}>
          <Image src={candidate?.avatar} alt="" className={dashboardStyles.avatarLockedImg} />
          <span className={dashboardStyles.avatarLockedTint} />
          <Icon name="Lock" size={size * 0.46} color="#F2C871" className={dashboardStyles.avatarLockedIcon} />
        </div>
      ) : (
        <Image
          src={candidate?.avatar}
          alt={candidate?.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );

  return (
    <article className={`${dashboardStyles.card} ${isUnlocked ? dashboardStyles.unlocked : ''} ${isActive ? dashboardStyles.active : ''}`}>
      {/* Top row: saved date (left) + available badge & remove (right) */}
      <div className={styles.cardTop}>
        <span className={`${styles.savedDate} ${reorderMode ? styles.savedDateShifted : ''}`}>
          Saved {formatDate(candidate?.bookmarkedDate)}
        </span>

        <div className={styles.cardTopRight}>
          {candidate?.availability === 'immediately' && (
            <span className={styles.availableBadge}>
              <span className={styles.pulse} />
              Available immediately
            </span>
          )}

          <button
            onClick={() => onRemoveBookmark(candidate?.id)}
            className={styles.bcRemove}
            title="Remove from saved"
            aria-label="Remove from saved"
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className={dashboardStyles.cardHead}>
        <Avatar size={72} />
        <div style={{ minWidth: 0 }}>
          <BlurredText
            text={candidate?.name}
            className={dashboardStyles.name}
            redactedClassName={dashboardStyles.redactedName}
          />
          <span className={dashboardStyles.role}>{candidate?.position}</span>
        </div>
      </div>

      <div className={dashboardStyles.divider} />

      {/* Facts */}
      <div className={dashboardStyles.factsGrid}>
        <div className={dashboardStyles.fact}>
          <span className={dashboardStyles.factIcon}><Icon name="Calendar" size={16} /></span>
          <span className={dashboardStyles.factText}>
            <span className={dashboardStyles.factK}>Experience</span>
            <span className={dashboardStyles.factV}>{candidate?.experience} yrs</span>
          </span>
        </div>
        <div className={dashboardStyles.fact}>
          <span className={dashboardStyles.factIcon}><Icon name="CreditCard" size={16} /></span>
          <span className={dashboardStyles.factText}>
            <span className={dashboardStyles.factK}>Salary</span>
            <span className={dashboardStyles.factV}>{formatSalary(candidate?.expectedSalary)}</span>
          </span>
        </div>
        <div className={dashboardStyles.fact}>
          <span className={dashboardStyles.factIcon}><Icon name="MapPin" size={16} /></span>
          <span className={dashboardStyles.factText}>
            <span className={dashboardStyles.factK}>Location</span>
            <span className={dashboardStyles.factV}>{candidate?.location}</span>
          </span>
        </div>
        <div className={dashboardStyles.fact}>
          <span className={dashboardStyles.factIcon}><Icon name="Building2" size={16} /></span>
          <span className={dashboardStyles.factText}>
            <span className={dashboardStyles.factK}>Work arrangement</span>
            <span className={dashboardStyles.factV}>{workArrangement}</span>
          </span>
        </div>
        {candidate?.availability && (
          <div className={dashboardStyles.fact}>
            <span className={dashboardStyles.factIcon}><Icon name="Clock" size={16} /></span>
            <span className={dashboardStyles.factText}>
              <span className={dashboardStyles.factK}>Notice period</span>
              <span className={dashboardStyles.factV}>{noticeLabels?.[candidate?.availability] || candidate?.availability}</span>
            </span>
          </div>
        )}
        {!!candidate?.matchScore && (
          <div className={dashboardStyles.fact}>
            <span className={dashboardStyles.factIcon}><Icon name="TrendingUp" size={16} /></span>
            <span className={dashboardStyles.factText}>
              <span className={dashboardStyles.factK}>Match</span>
              <span className={`${dashboardStyles.factV} ${dashboardStyles.factVGold}`}>{candidate?.matchScore}%</span>
            </span>
          </div>
        )}
      </div>

      <div className={dashboardStyles.divider} />

      {/* Skills */}
      <div className={dashboardStyles.skills}>
        {candidate?.skills?.slice(0, 4)?.map((skill, index) => (
          <span key={index} className={dashboardStyles.tag}>{skill}</span>
        ))}
        {candidate?.skills?.length > 4 && (
          <span className={dashboardStyles.moreTag}>+{candidate?.skills?.length - 4}</span>
        )}
      </div>

      {description && (
        <p className={dashboardStyles.desc}>{truncatedDesc}</p>
      )}

      {/* Actions */}
      <div className={dashboardStyles.cardActions}>
        {!isUnlocked ? (
          <>
            <button
              className={dashboardStyles.unlockBtn}
              onClick={() => onUnlockProfile(candidate?.id)}
              disabled={creditBalance < candidate?.unlockCost}
            >
              <Icon name="Unlock" size={16} />
              Unlock
            </button>
            <button
              onClick={handlePreviewClick}
              className={`${dashboardStyles.previewBtn} ${isActive ? dashboardStyles.active : ''}`}
              aria-label="View CV"
              title="View CV"
              aria-pressed={isActive}
            >
              <Icon name="Eye" size={16} />
            </button>
          </>
        ) : (
          <button className={`${dashboardStyles.unlockBtn} ${dashboardStyles.done}`} onClick={handlePreviewClick}>
            <Icon name="Eye" size={16} />
            View profile
          </button>
        )}
        <button
          onClick={onToggleNotes}
          className={`${dashboardStyles.cardBookmark} ${notes ? dashboardStyles.on : ''}`}
          title="Notes"
          aria-label="Notes"
          aria-expanded={isNotesOpen}
        >
          <Icon
            name="Pencil"
            size={18}
            color={notes ? undefined : 'var(--color-muted-foreground)'}
          />
        </button>
      </div>

      {/* Notes panel */}
      <div className={`${styles.bcNotesWrap} ${isNotesOpen ? styles.open : ''}`}>
        <div className={styles.bcNotesInner}>
          <div className={styles.bcNotes}>
            {isEditingNotes ? (
              <>
                <textarea
                  ref={notesTextareaRef}
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Add a note about the candidate..."
                  className={styles.bcNotesTextarea}
                  rows={3}
                />
                <button
                  className={styles.bcNotesSave}
                  onClick={handleSaveNotes}
                  disabled={!notes.trim()}
                >
                  <Icon name="Check" size={14} />
                  Save
                </button>
              </>
            ) : (
              <>
                <p className={styles.bcNotesText}>{notes}</p>
                <div className={styles.bcNotesActions}>
                  <button className={styles.bcNotesEdit} onClick={() => setIsEditingNotes(true)}>
                    <Icon name="Pencil" size={13} />
                    Edit
                  </button>
                  <button
                    className={`${styles.bcNotesDelete} ${styles.tooltip}`}
                    onClick={handleDeleteNotes}
                    data-tooltip="Delete note"
                    aria-label="Delete note"
                  >
                    <Icon name="X" size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default BookmarkedCandidateCard;
