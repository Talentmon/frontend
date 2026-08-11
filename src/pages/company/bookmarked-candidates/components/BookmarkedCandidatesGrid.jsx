import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import BookmarkedCandidateCard from './BookmarkedCandidateCard';
import styles from '../styles/bookmarked.module.scss';

const BookmarkedCandidatesGrid = ({
  candidates,
  selectedCandidates,
  onCandidateSelect,
  onRemoveBookmark,
  onUnlockProfile,
  onUpdateNotes,
  onPreviewCandidate,
  activePreviewId = null,
  creditBalance,
  selectionMode = false,
  reorderMode = false,
  onReorderCandidates
}) => {
  const [expandedNotesId, setExpandedNotesId] = useState(null);
  const [rowSiblingIds, setRowSiblingIds] = useState(() => new Set());
  const [draggedId, setDraggedId] = useState(null);
  const slotRefs = useRef(new Map());
  const unpinTimeoutRef = useRef(null);

  const handleDragStart = (e, candidateId) => {
    setDraggedId(candidateId);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(candidateId));
    } catch {
      // Some browsers restrict setData outside a real drag gesture - the
      // drag still works via draggedId state, so this is safe to ignore.
    }
  };

  // Swap on dragenter (fires once per new target) rather than dragover
  // (fires continuously), so the list doesn't thrash mid-hover.
  const handleDragEnter = (candidateId) => {
    if (draggedId === null || draggedId === candidateId) return;
    onReorderCandidates?.(draggedId, candidateId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleCandidateSelection = (candidateId, checked) => {
    onCandidateSelect(candidateId, checked);
  };

  const handleToggleNotes = (candidateId) => {
    setExpandedNotesId((prev) => (prev === candidateId ? null : candidateId));
  };

  // Only the cards sharing a grid row with the expanded card should stop
  // stretching to its height — every other row stays normally equal-height.
  const recomputeRowSiblings = useCallback(() => {
    if (unpinTimeoutRef.current) {
      clearTimeout(unpinTimeoutRef.current);
      unpinTimeoutRef.current = null;
    }

    if (!expandedNotesId) {
      // The closing card is still animating its height down (CSS transition).
      // Un-pin the siblings only once that's done, otherwise they'd briefly
      // re-stretch to the still-tall card and snap back a moment later.
      unpinTimeoutRef.current = setTimeout(() => {
        setRowSiblingIds(new Set());
      }, 340);
      return;
    }

    const expandedEl = slotRefs.current?.get(expandedNotesId);
    if (!expandedEl) return;

    const expandedTop = expandedEl.offsetTop;
    const siblings = new Set();
    slotRefs.current?.forEach((el, id) => {
      if (id !== expandedNotesId && Math.abs(el.offsetTop - expandedTop) < 2) {
        siblings.add(id);
      }
    });
    setRowSiblingIds(siblings);
  }, [expandedNotesId]);

  useLayoutEffect(() => {
    recomputeRowSiblings();
  }, [recomputeRowSiblings, candidates]);

  useLayoutEffect(() => {
    return () => clearTimeout(unpinTimeoutRef.current);
  }, []);

  useLayoutEffect(() => {
    window.addEventListener('resize', recomputeRowSiblings);
    return () => window.removeEventListener('resize', recomputeRowSiblings);
  }, [recomputeRowSiblings]);

  return (
    <div className={styles.cgrid}>
      {candidates?.map((candidate) => (
        <div
          key={candidate?.id}
          ref={(el) => {
            if (el) slotRefs.current.set(candidate?.id, el);
            else slotRefs.current.delete(candidate?.id);
          }}
          className={`${styles.cardSlot} ${draggedId === candidate?.id ? styles.dragging : ''}`}
          style={rowSiblingIds?.has(candidate?.id) ? { alignSelf: 'start' } : undefined}
          onDragEnter={reorderMode ? () => handleDragEnter(candidate?.id) : undefined}
          onDragOver={reorderMode ? handleDragOver : undefined}
          onDrop={reorderMode ? (e) => e.preventDefault() : undefined}
        >
          {selectionMode && (
            <div className={styles.selectBox}>
              <input
                type="checkbox"
                checked={selectedCandidates?.includes(candidate?.id)}
                onChange={(e) => handleCandidateSelection(candidate?.id, e?.target?.checked)}
              />
            </div>
          )}

          {reorderMode && (
            <div
              className={styles.dragHandle}
              draggable
              onDragStart={(e) => handleDragStart(e, candidate?.id)}
              onDragEnd={handleDragEnd}
              title="Drag to reorder"
              aria-label="Drag to reorder"
            >
              <Icon name="GripVertical" size={20} />
            </div>
          )}

          <BookmarkedCandidateCard
            candidate={candidate}
            onRemoveBookmark={onRemoveBookmark}
            onUnlockProfile={onUnlockProfile}
            onUpdateNotes={onUpdateNotes}
            onPreviewCandidate={onPreviewCandidate}
            isActive={activePreviewId === candidate?.id}
            creditBalance={creditBalance}
            isNotesOpen={expandedNotesId === candidate?.id}
            onToggleNotes={() => handleToggleNotes(candidate?.id)}
            reorderMode={reorderMode}
          />
        </div>
      ))}
    </div>
  );
};

export default BookmarkedCandidatesGrid;
