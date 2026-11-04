import React, { useEffect, useState } from 'react';
import Icon from 'components/AppIcon';
import {
  CardAvatar,
  CardIdentity,
  CardStats,
  MatchRing,
  SkillsRow,
  StatusBadge
} from '../../candidate-search-dashboard/components/CandidateCardParts';
import dashboardStyles from '../../candidate-search-dashboard/styles/dashboard.module.scss';
import { relativeTime, shortDate } from 'utils/formatDate';
import styles from '../styles/bookmarked.module.scss';

// Older notes fold away behind "Show N older notes" past this many.
const VISIBLE_NOTES = 3;

// "You, just now" / "Mirko, 2 days ago · edited" — after an edit, the editor and the edit time.
const noteMeta = (note) => {
  const by = note?.editedAt ? note?.editedBy : note?.author;
  const when = relativeTime(note?.editedAt || note?.createdAt);
  const who = by && (by.you ? 'You' : by.name);
  const meta = who ? `${who}, ${when}` : when.charAt(0).toUpperCase() + when.slice(1);
  return note?.editedAt ? `${meta} · edited` : meta;
};

// Ctrl/Cmd+Enter saves, Escape cancels (when there's something to cancel).
const noteKeys = (onSave, onCancel) => (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    onSave();
  } else if (e.key === 'Escape' && onCancel) {
    e.preventDefault();
    onCancel();
  }
};

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
  const [draft, setDraft] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);

  // Closing the panel drops a half-done edit and folds the older notes again.
  useEffect(() => {
    if (isNotesOpen) return;
    setEditingId(null);
    setShowAllNotes(false);
  }, [isNotesOpen]);

  const handleSaveDraft = async () => {
    const text = draft.trim();
    if (!text || savingDraft) return;
    setSavingDraft(true);
    if (await onAddNote(candidate?.id, text)) setDraft('');
    setSavingDraft(false);
  };

  const startEdit = (note) => {
    setEditingId(note?.id);
    setEditDraft(note?.text);
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (note) => {
    const text = editDraft.trim();
    if (!text || savingEdit) return;
    if (text === note?.text) {
      setEditingId(null);
      return;
    }
    setSavingEdit(true);
    if (await onEditNote(candidate?.id, note?.id, text)) setEditingId(null);
    setSavingEdit(false);
  };

  const isUnlocked = !!candidate?.isPurchased;
  const hasNotes = notes.length > 0;
  const hiddenNotes = showAllNotes ? 0 : Math.max(0, notes.length - VISIBLE_NOTES);
  const shownNotes = notes.slice(hiddenNotes);
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
        <button
          onClick={onToggleNotes}
          tabIndex={skipTab}
          className={`${dashboardStyles.scIconBtn} ${dashboardStyles.scSaveBtn} ${hasNotes ? dashboardStyles.on : isNotesOpen ? styles.notesOpen : ''}`}
          title="Notes"
          aria-label="Notes"
          aria-expanded={isNotesOpen}
        >
          <span className={styles.notesBtnInner}>
            <Icon name="Pencil" size={18} />
            {hasNotes && <span className={styles.notesCount}>{notes.length}</span>}
          </span>
        </button>
      </div>

      {/* Notes: a grey band under the card, opened with the pencil */}
      <div className={`${styles.notesWrap} ${isNotesOpen ? styles.open : ''}`}>
        <div className={styles.notesInner}>
          <div className={styles.notesBand}>
            {notes.length > VISIBLE_NOTES && (
              <button
                type="button"
                className={styles.notesOlder}
                onClick={() => setShowAllNotes((prev) => !prev)}
                tabIndex={skipTab}
              >
                <Icon name={showAllNotes ? 'ChevronUp' : 'ChevronDown'} size={15} />
                {showAllNotes
                  ? 'Hide older notes'
                  : `Show ${hiddenNotes} older note${hiddenNotes === 1 ? '' : 's'}`}
              </button>
            )}

            {shownNotes.length > 0 && (
              <ul aria-label="Notes" className={styles.noteList}>
                {shownNotes.map((note) => (
                  <li key={note?.id} className={styles.note}>
                    {editingId === note?.id ? (
                      <>
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e?.target?.value)}
                          onKeyDown={noteKeys(() => handleSaveEdit(note), cancelEdit)}
                          className={`${styles.noteInput} ${styles.noteInputEdit}`}
                          aria-label="Edit note"
                          maxLength={2000}
                          rows={3}
                          autoFocus
                          tabIndex={skipTab}
                        />
                        <div className={styles.noteFormFoot}>
                          <button type="button" className={`${styles.noteCancel} ${styles.small}`} onClick={cancelEdit} tabIndex={skipTab}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={`${styles.noteSave} ${styles.small}`}
                            onClick={() => handleSaveEdit(note)}
                            disabled={!editDraft.trim() || savingEdit}
                            tabIndex={skipTab}
                          >
                            <Icon name="Check" size={15} strokeWidth={2.2} />
                            Save
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={styles.noteText}>{note?.text}</span>
                        <div className={styles.noteFoot}>
                          <span className={styles.noteMeta}>{noteMeta(note)}</span>
                          <span className={styles.noteActions}>
                            <button
                              type="button"
                              className={`${styles.noteAction} ${styles.tooltip}`}
                              onClick={() => startEdit(note)}
                              data-tooltip="Edit note"
                              aria-label="Edit note"
                              tabIndex={skipTab}
                            >
                              <Icon name="Pencil" size={14} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.noteAction} ${styles.noteDelete} ${styles.tooltip}`}
                              onClick={() => onDeleteNote(candidate?.id, note?.id)}
                              data-tooltip="Delete note"
                              aria-label="Delete note"
                              tabIndex={skipTab}
                            >
                              <Icon name="Trash2" size={14} />
                            </button>
                          </span>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <label htmlFor={noteFieldId} className={styles.noteLabel}>Note</label>
            <textarea
              id={noteFieldId}
              value={draft}
              onChange={(e) => setDraft(e?.target?.value)}
              onKeyDown={noteKeys(handleSaveDraft)}
              placeholder="Add a note about this candidate…"
              className={styles.noteInput}
              maxLength={2000}
              rows={3}
              tabIndex={skipTab}
            />
            <div className={styles.noteFormFoot}>
              <button
                type="button"
                className={styles.noteSave}
                onClick={handleSaveDraft}
                disabled={!draft.trim() || savingDraft}
                tabIndex={skipTab}
              >
                <Icon name="Check" size={16} strokeWidth={2.2} />
                Save note
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default BookmarkedCandidateCard;
