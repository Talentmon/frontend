import React from 'react';
import Icon from 'components/AppIcon';
import {
  CardAvatar,
  CardIdentity,
  CardStats,
  MatchRing,
  SkillsRow,
  StatusBadge
} from '../../candidate-search-dashboard/components/CandidateCardParts';
import CandidateNotes, { NotesButton } from '../../candidate-search-dashboard/components/CandidateNotes';
import dashboardStyles from '../../candidate-search-dashboard/styles/dashboard.module.scss';
import { shortDate } from 'utils/formatDate';
import styles from '../styles/bookmarked.module.scss';

const BookmarkedCandidateCard = ({
  candidate,
  onRemoveBookmark,
  onUnlockProfile,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onPreviewCandidate,
  isActive = false,
  creditBalance,
  isNotesOpen = false,
  onToggleNotes,
  reorderMode = false,
  selectionMode = false
}) => {
  const notes = candidate?.notes || [];
  const isUnlocked = !!candidate?.isPurchased;
  // In select mode a click anywhere on the card selects it, so the card's own buttons step aside.
  const mutedClass = selectionMode ? styles.mutedInSelect : '';
  const skipTab = selectionMode ? -1 : undefined;
  // Reorder and select: no hover lift — in reorder only the handle moves things, in select the slot shows hover.
  const stillClass = reorderMode || selectionMode
    ? `${styles.stillCard} ${!isUnlocked && !isActive ? styles.stillCardPlain : ''}`
    : '';
  const skills = candidate?.skills || [];
  const noteFieldId = `note-${candidate?.id}`;

  const handlePreviewClick = () => {
    onPreviewCandidate?.(candidate?.id);
  };

  return (
    <article className={`${dashboardStyles.card} ${dashboardStyles.scCard} ${isUnlocked ? dashboardStyles.unlocked : ''} ${isActive ? dashboardStyles.active : ''} ${stillClass}`}>
      {/* Top row: who saved it and when (left) + remove (right) */}
      <div className={styles.cardTop}>
        <p className={`${styles.savedBy} ${reorderMode || selectionMode ? styles.savedByShifted : ''}`}>
          <Icon name="Bookmark" size={14} className={styles.savedIcon} />
          <span>
            Saved on {shortDate(candidate?.bookmarkedDate)}{candidate?.bookmarkedBy && <> by <strong>{candidate.bookmarkedBy}</strong></>}
          </span>
        </p>

        {/* A teammate's personal bookmark: only they can remove it (it can still be unlocked). */}
        {candidate?.canRemove !== false && (
          <button
            onClick={() => onRemoveBookmark(candidate?.id)}
            className={`${styles.bcRemove} ${mutedClass}`}
            tabIndex={skipTab}
            title="Remove from saved"
            aria-label="Remove from saved"
          >
            <Icon name="X" size={18} />
          </button>
        )}
      </div>

      {/* Header: avatar, name/role/meta/status, match ring */}
      <div className={dashboardStyles.scHead}>
        <CardAvatar candidate={candidate} unlocked={isUnlocked} />

        <div className={dashboardStyles.scInfo}>
          <CardIdentity candidate={candidate} unlocked={isUnlocked} />
          <StatusBadge searchStatus={candidate?.searchStatus} />
        </div>

        {!!candidate?.matchScore && <MatchRing score={candidate?.matchScore} />}
      </div>

      <CardStats candidate={candidate} salaryFirst />
      {skills.length > 0 && <SkillsRow skills={skills} />}
      <p className={dashboardStyles.scDesc}>{candidate?.description}</p>

      {/* Actions */}
      <div className={`${dashboardStyles.scActions} ${mutedClass}`}>
        {!isUnlocked ? (
          <>
            <button
              className={`${dashboardStyles.scPrimary} ${styles.primaryBtn}`}
              onClick={() => onUnlockProfile(candidate?.id)}
              disabled={creditBalance < candidate?.unlockCost}
              tabIndex={skipTab}
            >
              <Icon name="Unlock" size={18} />
              Unlock profile
            </button>
            <button
              onClick={handlePreviewClick}
              className={`${dashboardStyles.scIconBtn} ${dashboardStyles.scPreviewBtn} ${isActive ? dashboardStyles.active : ''}`}
              aria-label="Preview CV"
              title="Preview CV"
              aria-pressed={isActive}
              tabIndex={skipTab}
            >
              <Icon name="Eye" size={19} />
            </button>
          </>
        ) : (
          <button
            className={`${dashboardStyles.scPrimary} ${dashboardStyles.done}`}
            onClick={handlePreviewClick}
            tabIndex={skipTab}
          >
            <Icon name="Eye" size={18} />
            View profile
          </button>
        )}
        <NotesButton count={notes.length} isOpen={isNotesOpen} onClick={onToggleNotes} tabIndex={skipTab} />
      </div>

      {/* Notes: a grey band under the card, opened with the pencil */}
      <div className={`${styles.notesWrap} ${isNotesOpen ? styles.open : ''}`}>
        <div className={styles.notesInner}>
          <div className={styles.notesBand}>
            <CandidateNotes
              notes={notes}
              fieldId={noteFieldId}
              isOpen={isNotesOpen}
              onAdd={(text) => onAddNote(candidate?.id, text)}
              onEdit={(noteId, text) => onEditNote(candidate?.id, noteId, text)}
              onDelete={(noteId) => onDeleteNote(candidate?.id, noteId)}
              tabIndex={skipTab}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export default BookmarkedCandidateCard;
