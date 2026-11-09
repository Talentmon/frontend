import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import { relativeTime } from 'utils/formatDate';
import dashboardStyles from '../styles/dashboard.module.scss';
import styles from '../styles/candidateNotes.module.scss';

// Older notes fold away behind "Show N older notes" past this many (cards;
// Purchased passes its own `visibleNotes`).
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

/**
 * The notes pencil on the Bookmarked and Purchased cards (and the Purchased
 * table). Shows the count and turns gold once there are notes; open with none
 * yet, it keeps its hover look. The caller sizes it through `className`.
 */
export const NotesButton = ({
  count = 0,
  isOpen = false,
  onClick,
  className = '',
  tabIndex,
  iconSize = 18,
  label = 'Notes',
  controls
}) => (
  <button
    onClick={onClick}
    tabIndex={tabIndex}
    className={`${dashboardStyles.scIconBtn} ${dashboardStyles.scSaveBtn} ${count ? dashboardStyles.on : isOpen ? styles.notesOpen : ''} ${className}`}
    title="Notes"
    aria-label={label}
    aria-expanded={isOpen}
    aria-controls={controls}
  >
    <span className={styles.notesBtnInner}>
      <Icon name="Pencil" size={iconSize} />
      {count > 0 && <span className={styles.notesCount}>{count}</span>}
    </span>
  </button>
);

/**
 * The team's notes on a candidate: the list (who wrote or last edited each one,
 * and when; anyone can edit or delete any of them) and a field for a new one.
 * The caller supplies the panel around it. `onAdd(text)` and `onEdit(noteId, text)`
 * resolve to whether the save worked, so the field knows to clear.
 *
 * layout "stack" (cards): the list, then the field below it; past `visibleNotes`
 * notes the older ones fold away. layout "columns" (Purchased table): the new note on the
 * left for `candidateName`, every saved note in a scrolling list on the right,
 * and Cancel (`onCancel`) closes the panel.
 */
const CandidateNotes = ({
  notes = [],
  fieldId,
  isOpen,
  onAdd,
  onEdit,
  onDelete,
  onCancel,
  tabIndex,
  layout = 'stack',
  candidateName = '',
  visibleNotes = VISIBLE_NOTES
}) => {
  const [draft, setDraft] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const fieldRef = useRef(null);
  const listRef = useRef(null);
  const isColumns = layout === 'columns';

  // Closing the panel drops a half-done edit and folds the older notes again.
  useEffect(() => {
    if (isOpen) return;
    setEditingId(null);
    setShowAllNotes(false);
  }, [isOpen]);

  // Columns: the field takes focus on open, and the list keeps its newest note in view.
  useEffect(() => {
    if (isColumns && isOpen) fieldRef.current?.focus({ preventScroll: true });
  }, [isColumns, isOpen]);

  useEffect(() => {
    if (isColumns && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [isColumns, isOpen, notes.length]);

  const handleSaveDraft = async () => {
    const text = draft.trim();
    if (!text || savingDraft) return;
    setSavingDraft(true);
    if (await onAdd(text)) setDraft('');
    setSavingDraft(false);
  };

  const handleCancel = onCancel && (() => {
    setDraft('');
    onCancel();
  });

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
    if (await onEdit(note?.id, text)) setEditingId(null);
    setSavingEdit(false);
  };

  const hiddenNotes = isColumns || showAllNotes ? 0 : Math.max(0, notes.length - visibleNotes);
  const shownNotes = notes.slice(hiddenNotes);

  const noteItem = (note) => (
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
            tabIndex={tabIndex}
          />
          <div className={styles.noteFormFoot}>
            <button type="button" className={`${styles.noteCancel} ${styles.small}`} onClick={cancelEdit} tabIndex={tabIndex}>
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.noteSave} ${styles.small}`}
              onClick={() => handleSaveEdit(note)}
              disabled={!editDraft.trim() || savingEdit}
              tabIndex={tabIndex}
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
                tabIndex={tabIndex}
              >
                <Icon name="Pencil" size={14} />
              </button>
              <button
                type="button"
                className={`${styles.noteAction} ${styles.noteDelete} ${styles.tooltip} ${styles.tooltipEnd}`}
                onClick={() => onDelete(note?.id)}
                data-tooltip="Delete note"
                aria-label="Delete note"
                tabIndex={tabIndex}
              >
                <Icon name="Trash2" size={14} />
              </button>
            </span>
          </div>
        </>
      )}
    </li>
  );

  const firstName = candidateName.split(' ')[0];
  const field = (
    <>
      <label htmlFor={fieldId} className={styles.noteLabel}>
        {isColumns ? <>New note {candidateName && <span className={styles.noteLabelFor}>for {candidateName}</span>}</> : 'Note'}
      </label>
      <textarea
        ref={fieldRef}
        id={fieldId}
        value={draft}
        onChange={(e) => setDraft(e?.target?.value)}
        onKeyDown={noteKeys(handleSaveDraft, handleCancel)}
        placeholder={isColumns && firstName ? `Add a note about ${firstName}…` : 'Add a note about this candidate…'}
        className={styles.noteInput}
        maxLength={2000}
        rows={3}
        tabIndex={tabIndex}
      />
      <div className={styles.noteFormFoot}>
        {handleCancel && (
          <button type="button" className={styles.noteCancel} onClick={handleCancel} tabIndex={tabIndex}>
            Cancel
          </button>
        )}
        <button
          type="button"
          className={styles.noteSave}
          onClick={handleSaveDraft}
          disabled={!draft.trim() || savingDraft}
          tabIndex={tabIndex}
        >
          <Icon name="Check" size={16} strokeWidth={2.2} />
          Save note
        </button>
      </div>
    </>
  );

  if (isColumns) {
    return (
      <div className={styles.columns}>
        <div className={styles.column}>{field}</div>
        <div className={styles.column}>
          <span className={styles.noteLabel}>
            Saved notes <span className={styles.noteLabelFor}>({notes.length})</span>
          </span>
          {notes.length > 0 ? (
            <ul ref={listRef} aria-label="Saved notes" className={`${styles.noteList} ${styles.noteListScroll}`}>
              {notes.map(noteItem)}
            </ul>
          ) : (
            <p className={styles.notesEmpty}>No notes yet. What you write on the left will show up here.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {notes.length > visibleNotes && (
        <button
          type="button"
          className={styles.notesOlder}
          onClick={() => setShowAllNotes((prev) => !prev)}
          tabIndex={tabIndex}
        >
          <Icon name={showAllNotes ? 'ChevronUp' : 'ChevronDown'} size={15} />
          {showAllNotes
            ? 'Hide older notes'
            : `Show ${hiddenNotes} older note${hiddenNotes === 1 ? '' : 's'}`}
        </button>
      )}

      {shownNotes.length > 0 && (
        <ul aria-label="Notes" className={styles.noteList}>
          {shownNotes.map(noteItem)}
        </ul>
      )}

      {field}
    </>
  );
};

export default CandidateNotes;
