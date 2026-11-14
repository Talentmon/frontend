import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import BookmarkedCandidatesHeader from './components/BookmarkedCandidatesHeader';
import BookmarkedCandidatesFilters from './components/BookmarkedCandidatesFilters';
import BookmarkedFilterSidebar from './components/BookmarkedFilterSidebar';
import BookmarkedResultsBar from './components/BookmarkedResultsBar';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import BookmarkedCandidatesGrid from './components/BookmarkedCandidatesGrid';
import EmptyBookmarksState from './components/EmptyBookmarksState';
import Toast from './components/Toast';
import UnlockConfirmModal from '../candidate-search-dashboard/components/UnlockConfirmModal';
import CandidatePreviewDrawer from '../candidate-search-dashboard/components/CandidatePreviewDrawer';
import Icon from 'components/AppIcon';
import { ListSearch } from '../candidate-filters/CandidateFilterBar';
import { COMMON_EMPTY, applyCommonFilters, commonOptions } from '../candidate-filters/commonFilters';
import { CV_PUSH_BREAKPOINT, useMinWidth } from '../candidate-filters/cvLayout';
import cf from '../candidate-filters/candidateFilters.module.scss';
import { setCreditBalance, useCreditBalance } from 'lib/creditBalance';
import { salaryBase, useSalaryView } from 'lib/salaryView';
import {
  listBookmarks,
  getBookmarkLimit,
  bookmarkToFrontend,
  removeBookmark,
  addBookmarkNote,
  updateNote,
  deleteNote,
  reorderBookmarks,
  bulkUnlockBookmarks,
  unlockCandidate,
  revealedToFrontend,
  UNLOCK_COST,
} from './bookmarksApi';
import styles from './styles/bookmarked.module.scss';

// Search's filters (shared with Purchased) plus Saved by: the teammates picked, empty = everyone.
const EMPTY_FILTERS = { ...COMMON_EMPTY, savedBy: [] };

const BookmarkedCandidatesPage = () => {
  const navigate = useNavigate();

  const [allBookmarkedCandidates, setAllBookmarkedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);
  const previousSortByRef = useRef('bookmarked-date-desc');
  const [sortBy, setSortBy] = useState('bookmarked-date-desc');
  const { balance: creditBalance } = useCreditBalance();
  const [bookmarkLimit, setBookmarkLimit] = useState(10);
  const [personalLimit, setPersonalLimit] = useState(0);
  const [overflowDeadline, setOverflowDeadline] = useState(null);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Net or gross, per month or per year (shared with Search and Purchased).
  const [salaryView] = useSalaryView();
  const isPushWide = useMinWidth(CV_PUSH_BREAKPOINT);

  useEffect(() => {
    listBookmarks()
      .then((rows) => setAllBookmarkedCandidates(rows.map(bookmarkToFrontend)))
      .catch(() => {})
      .finally(() => setLoading(false));
    getBookmarkLimit()
      .then(({ limit, personalLimit: personal, overflowDeadline: deadline }) => {
        setBookmarkLimit(limit);
        setPersonalLimit(personal || 0);
        setOverflowDeadline(deadline || null);
      })
      .catch(() => {});
  }, []);

  // Everyone who saved at least one candidate, with how many — the "saved by"
  // filter only shows up once there are two or more of them.
  const recruiterOptions = useMemo(() => {
    const byId = new Map();
    allBookmarkedCandidates.forEach((c) => {
      if (!c?.bookmarkedById) return;
      const entry = byId.get(c.bookmarkedById) || { value: c.bookmarkedById, label: c.bookmarkedBy, count: 0 };
      entry.count += 1;
      byId.set(c.bookmarkedById, entry);
    });
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [allBookmarkedCandidates]);

  // What the filter lists offer: only what the bookmarked candidates have, with counts.
  const filterOpts = useMemo(() => commonOptions(allBookmarkedCandidates), [allBookmarkedCandidates]);

  // Drop a pick whose last bookmark was removed, so it can't keep the list empty.
  useEffect(() => {
    setFilters((prev) => {
      const next = prev.savedBy.filter((id) => recruiterOptions.some((o) => o.value === id));
      return next.length === prev.savedBy.length ? prev : { ...prev, savedBy: next };
    });
  }, [recruiterOptions]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allBookmarkedCandidates];

    if (filters.savedBy.length > 0) {
      filtered = filtered.filter((candidate) => filters.savedBy.includes(candidate?.bookmarkedById));
    }

    // Search: position, skills and location. (Bookmarked candidates are never
    // unlocked - those move to Purchased - so there's no name to search.)
    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      filtered = filtered?.filter(candidate =>
        candidate?.position?.toLowerCase()?.includes(searchTerm) ||
        candidate?.location?.toLowerCase()?.includes(searchTerm) ||
        candidate?.country?.toLowerCase()?.includes(searchTerm) ||
        candidate?.skills?.some(skill => skill?.toLowerCase()?.includes(searchTerm))
      );
    }

    // Search's filters, matched as Search's backend does (candidate-filters/commonFilters.js).
    filtered = applyCommonFilters(filtered, filters, salaryView);

    // Apply sorting
    filtered?.sort((a, b) => {
      switch (sortBy) {
        case 'bookmarked-date-desc':
          return new Date(b.bookmarkedDate) - new Date(a.bookmarkedDate);
        case 'bookmarked-date-asc':
          return new Date(a.bookmarkedDate) - new Date(b.bookmarkedDate);
        case 'experience-desc':
          return b?.experience - a?.experience;
        case 'experience-asc':
          return a?.experience - b?.experience;
        case 'salary-desc':
          return (salaryBase(b?.expectedSalary, salaryView) || 0) - (salaryBase(a?.expectedSalary, salaryView) || 0);
        case 'salary-asc':
          return (salaryBase(a?.expectedSalary, salaryView) || 0) - (salaryBase(b?.expectedSalary, salaryView) || 0);
        case 'match-score-desc':
          return (b?.matchScore || 0) - (a?.matchScore || 0);
        case 'custom':
          return a?.sortIndex - b?.sortIndex;
        default:
          return 0;
      }
    });

    setFilteredCandidates(filtered);
  }, [allBookmarkedCandidates, filters, sortBy, salaryView]);

  const showToast = (message) => {
    setToastMsg(message);
    clearTimeout(toastTimer?.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const handleRemoveBookmark = async (candidateId) => {
    const candidate = allBookmarkedCandidates?.find(c => c?.id === candidateId);
    if (!candidate) return;
    if (!candidate.canRemove) {
      showToast(`This is ${candidate.bookmarkedBy || 'a teammate'}'s personal bookmark — only they can remove it.`);
      return;
    }

    setAllBookmarkedCandidates(prev => prev?.filter(c => c?.id !== candidateId));
    setSelectedCandidates(prev => prev?.filter(id => id !== candidateId));

    try {
      await removeBookmark(candidate.bookmarkId);
    } catch (err) {
      setAllBookmarkedCandidates(prev => [...prev, candidate]);
      showToast(err?.response?.data?.message || 'Could not remove bookmark — please try again.');
    }
  };

  // Step 1: clicking "Unlock" opens a confirmation modal instead of unlocking immediately
  const handleRequestUnlock = (candidateId) => {
    const candidate = allBookmarkedCandidates?.find(c => c?.id === candidateId);
    if (!candidate) return;
    if (creditBalance < candidate?.unlockCost) {
      showToast("You don't have enough Credits to unlock this profile.");
      return;
    }
    setUnlockTarget(candidate);
  };

  // Step 2: actual unlock call, only runs after the user confirms in the modal.
  // Returns a promise so UnlockConfirmModal only shows its "unlocked" screen on success.
  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    try {
      const unlock = await unlockCandidate(unlockTarget.id, unlockTarget.position, salaryView);
      const revealed = revealedToFrontend(unlock.cvSnapshot);
      setUnlockTarget((prev) => (prev ? { ...prev, ...revealed } : prev));
      setCreditBalance((c) => Math.max(0, c - unlockTarget.unlockCost));
      setAllBookmarkedCandidates((prev) => prev?.filter((c) => c?.id !== unlockTarget.id));
      setSelectedCandidates((prev) => prev?.filter((id) => id !== unlockTarget.id));
      showToast('Candidate unlocked and moved to Purchased Profiles');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not unlock this profile — please try again.');
      throw err;
    }
  };

  const updateCandidateNotes = (candidateId, update) => {
    setAllBookmarkedCandidates((prev) => prev.map((c) => (c?.id === candidateId ? { ...c, notes: update(c?.notes || []) } : c)));
  };

  // Add and edit wait for the saved note (it carries the id, author and time);
  // both return whether it worked so the card knows to clear its field.
  const handleAddNote = async (candidateId, text) => {
    const candidate = allBookmarkedCandidates?.find((c) => c?.id === candidateId);
    if (!candidate) return false;
    try {
      const note = await addBookmarkNote(candidate.bookmarkId, text);
      updateCandidateNotes(candidateId, (notes) => [...notes, note]);
      return true;
    } catch {
      showToast('Could not save note — please try again.');
      return false;
    }
  };

  const handleEditNote = async (candidateId, noteId, text) => {
    try {
      const note = await updateNote(noteId, text);
      updateCandidateNotes(candidateId, (notes) => notes.map((n) => (n?.id === noteId ? note : n)));
      return true;
    } catch {
      showToast('Could not save note — please try again.');
      return false;
    }
  };

  const handleDeleteNote = async (candidateId, noteId) => {
    const removed = allBookmarkedCandidates?.find((c) => c?.id === candidateId)?.notes?.find((n) => n?.id === noteId);
    if (!removed) return;
    updateCandidateNotes(candidateId, (notes) => notes.filter((n) => n?.id !== noteId));
    try {
      await deleteNote(noteId);
    } catch {
      updateCandidateNotes(candidateId, (notes) =>
        [...notes, removed].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      );
      showToast('Could not delete note — please try again.');
    }
  };

  const handleCandidateSelect = (candidateId, checked) => {
    if (checked) {
      setSelectedCandidates(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidates(prev => prev?.filter(id => id !== candidateId));
    }
  };

  const handleSelectAll = () => {
    setSelectedCandidates(filteredCandidates?.map(c => c?.id));
  };

  const handleClearSelection = () => {
    setSelectedCandidates([]);
  };

  // Returns { unlocked, failed } so the toolbar can show the real outcome
  // (the backend unlocks best-effort - one candidate running out of balance
  // mid-batch doesn't roll back the ones already unlocked).
  const handleBulkUnlock = async (candidateIds) => {
    const totalCost = candidateIds?.length * UNLOCK_COST;
    if (creditBalance < totalCost) {
      showToast('Not enough Credits for all selected candidates.');
      return { unlocked: [], failed: candidateIds.map((candidateId) => ({ candidateId, reason: 'Insufficient balance' })) };
    }

    try {
      const result = await bulkUnlockBookmarks(candidateIds, salaryView);
      const unlockedIds = (result?.unlocked || []).map((u) => u.candidateId);
      const unlockedCount = unlockedIds.length;

      if (unlockedCount > 0) {
        setCreditBalance((c) => Math.max(0, c - unlockedCount * UNLOCK_COST));
        setAllBookmarkedCandidates((prev) => prev?.filter((c) => !unlockedIds.includes(c?.id)));
        setSelectedCandidates((prev) => prev?.filter((id) => !unlockedIds.includes(id)));
      }
      if (result?.failed?.length > 0) {
        showToast(`Unlocked ${unlockedCount} of ${candidateIds?.length} candidates — some could not be unlocked.`);
      } else {
        showToast(`Unlocked ${unlockedCount} candidate${unlockedCount === 1 ? '' : 's'} and moved to Purchased Profiles`);
      }

      // Real name/photo per candidate, straight from what was just unlocked
      // (not looked up from the still-anonymized local list).
      const unlocked = (result?.unlocked || []).map((u) => ({ id: u.candidateId, ...revealedToFrontend(u.cvSnapshot) }));
      return { unlocked, failed: result?.failed || [] };
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not unlock these profiles — please try again.');
      return { unlocked: [], failed: candidateIds.map((candidateId) => ({ candidateId, reason: 'Request failed' })) };
    }
  };

  const handleBulkRemove = async (requestedIds) => {
    // Teammates' personal bookmarks are skipped — only whoever saved them can remove those.
    const selected = allBookmarkedCandidates?.filter((c) => requestedIds?.includes(c?.id));
    const removed = selected.filter((c) => c.canRemove);
    const skipped = selected.length - removed.length;
    const candidateIds = removed.map((c) => c.id);
    setSelectedCandidates([]);
    if (removed.length === 0) {
      showToast("Those are teammates' personal bookmarks — only they can remove them.");
      return;
    }
    setAllBookmarkedCandidates(prev => prev?.filter(c => !candidateIds?.includes(c?.id)));

    const results = await Promise.allSettled(removed.map((c) => removeBookmark(c.bookmarkId)));
    const failedCount = results.filter((r) => r.status === 'rejected').length;
    if (failedCount > 0) {
      const failedIds = removed
        .filter((_, i) => results[i].status === 'rejected')
        .map((c) => c.id);
      setAllBookmarkedCandidates((prev) => [...prev, ...removed.filter((c) => failedIds.includes(c.id))]);
      showToast(`Removed ${candidateIds?.length - failedCount} of ${candidateIds?.length} — some could not be removed.`);
    } else {
      showToast(
        `Removed ${candidateIds?.length} candidate${candidateIds?.length === 1 ? '' : 's'} from bookmarks` +
          (skipped > 0 ? ` · ${skipped} of teammates' personal bookmarks skipped` : ''),
      );
    }
  };

  const handleToggleSelectionMode = () => {
    const turningOn = !selectionMode;
    setSelectionMode(turningOn);
    if (turningOn) {
      setReorderMode(false);
    } else {
      setSelectedCandidates([]);
    }
  };

  // Entering reorder mode remembers the active sort so it can be restored if
  // the user cancels without moving anything; while active, sorting is
  // pinned to 'custom' so the sort effect doesn't fight the drag order.
  const handleToggleReorderMode = () => {
    if (reorderMode) {
      setReorderMode(false);
      setHasReordered(false);
      setSortBy(previousSortByRef.current);
      return;
    }
    previousSortByRef.current = sortBy;
    setSelectionMode(false);
    setSelectedCandidates([]);
    setReorderMode(true);
    setHasReordered(false);
    setSortBy('custom');
  };

  const handleReorderCandidates = (draggedId, targetId) => {
    if (draggedId === targetId) return;
    setAllBookmarkedCandidates((prev) => {
      const list = [...prev];
      const fromIndex = list?.findIndex((c) => c?.id === draggedId);
      const toIndex = list?.findIndex((c) => c?.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = list?.splice(fromIndex, 1);
      list?.splice(toIndex, 0, moved);
      return list.map((c, index) => ({ ...c, sortIndex: index }));
    });
    setHasReordered(true);
  };

  const handleSaveOrder = async () => {
    const items = allBookmarkedCandidates.map((c) => ({ id: c.bookmarkId, position: c.sortIndex }));
    setReorderMode(false);
    setHasReordered(false);
    try {
      await reorderBookmarks(items);
      showToast('Order saved as default');
    } catch {
      showToast('Could not save order — please try again.');
    }
  };

  const handleSearchCandidates = () => {
    navigate('/candidate-search-dashboard');
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePreviewCandidate = (candidateId) => {
    setPreviewId(candidateId);
  };

  const handleClosePreview = () => {
    setPreviewId(null);
  };

  // Clears every filter (Saved by too); the salary currency stays as picked.
  const handleClearFilters = () => {
    setFilters((prev) => ({ ...EMPTY_FILTERS, salary: { ...EMPTY_FILTERS.salary, currency: prev?.salary?.currency || 'EUR' } }));
  };

  // "Remove some" on a full list: straight into select mode.
  const handleRemoveSome = () => {
    setReorderMode(false);
    setSelectionMode(true);
  };

  const sharedCount = allBookmarkedCandidates?.filter((c) => c?.pocket !== 'PERSONAL')?.length;

  // CV open beside the cards (as on Search and Purchased): the filters in a
  // column on the left, the search, results bar and cards (448px) beside it.
  const isCompact = previewId !== null && isPushWide;

  const results = (
    <>
      <BookmarkedResultsBar
        shown={filteredCandidates?.length}
        total={allBookmarkedCandidates?.length}
        sortBy={sortBy}
        onSortChange={setSortBy}
        reorderMode={reorderMode}
        hasReordered={hasReordered}
        onToggleReorderMode={handleToggleReorderMode}
        onSaveOrder={handleSaveOrder}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        compact={isCompact}
      />

      {/* Bulk Actions Toolbar */}
      {selectionMode && (
        <BulkActionsToolbar
          selectedCandidates={selectedCandidates}
          allCandidates={filteredCandidates}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkUnlock={handleBulkUnlock}
          onBulkRemove={handleBulkRemove}
          creditBalance={creditBalance}
        />
      )}

      {/* Candidates Grid */}
      {filteredCandidates?.length > 0 ? (
        <BookmarkedCandidatesGrid
          candidates={filteredCandidates}
          selectedCandidates={selectedCandidates}
          onCandidateSelect={handleCandidateSelect}
          onRemoveBookmark={handleRemoveBookmark}
          onUnlockProfile={handleRequestUnlock}
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          onPreviewCandidate={handlePreviewCandidate}
          activePreviewId={previewId}
          creditBalance={creditBalance}
          selectionMode={selectionMode}
          reorderMode={reorderMode}
          onReorderCandidates={handleReorderCandidates}
        />
      ) : (
        <div className={styles.noResults}>
          <Icon name="Search" size={48} />
          <h3>No results</h3>
          <p>Try different filters or search for new candidates.</p>
          <button className={styles.btnGhost} onClick={handleClearFilters}>
            <Icon name="RotateCcw" size={16} />Clear filters
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={`${styles.page} ${previewId !== null ? styles.previewOpen : ''}`}>
      <Header />
      <main className={`pt-16 max-w-[1420px] mx-auto px-[22px] ${isCompact ? cf.cvMain : ''}`}>
        {/* Title, the slots strip and Search candidates (just the title beside an open CV) */}
        {isCompact ? (
          <header className={cf.cvTitle}>
            <h1>Bookmarked candidates</h1>
          </header>
        ) : (
          <BookmarkedCandidatesHeader
            slots={{
              used: sharedCount,
              limit: bookmarkLimit,
              personalUsed: allBookmarkedCandidates?.filter((c) => c?.pocket === 'PERSONAL' && c?.canRemove)?.length,
              personalLimit,
              overflowDeadline
            }}
            onSearchCandidates={handleSearchCandidates}
            onRemoveSome={handleRemoveSome}
          />
        )}

        {!loading && allBookmarkedCandidates?.length === 0 ? (
          <EmptyBookmarksState onSearchCandidates={handleSearchCandidates} />
        ) : isCompact ? (
          <div className={cf.cvLayout}>
            <div className={cf.cvSide}>
              <BookmarkedFilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                opts={filterOpts}
                recruiterOptions={recruiterOptions}
              />
            </div>
            <div className={cf.cvResults}>
              <ListSearch
                id="bm-search"
                label="Search bookmarked candidates"
                placeholder="Search by position, skills, location…"
                className={cf.cvSearch}
                value={filters.search}
                onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              />
              {results}
            </div>
          </div>
        ) : (
          <>
            <BookmarkedCandidatesFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              opts={filterOpts}
              recruiterOptions={recruiterOptions}
            />
            {results}
          </>
        )}
      </main>

      <Toast message={toastMsg} />

      {/* Anonymous CV preview drawer, on the right. From CV_PUSH_BREAKPOINT it
          pushes the page aside (the filters and cards beside it, as on Search
          and Purchased); below that it overlays. It gets every bookmark, not
          just the filtered ones, so filtering beside an open CV keeps it open. */}
      <CandidatePreviewDrawer
        candidates={allBookmarkedCandidates}
        activeId={previewId}
        onClose={handleClosePreview}
        showBookmark={false}
        onUnlock={handleRequestUnlock}
        unlockCost={allBookmarkedCandidates?.find((c) => c?.id === previewId)?.unlockCost || UNLOCK_COST}
        pushBreakpoint={CV_PUSH_BREAKPOINT}
      />

      {/* Unlock confirmation modal */}
      {unlockTarget && (
        <UnlockConfirmModal
          candidate={unlockTarget}
          creditCost={unlockTarget?.unlockCost}
          balance={creditBalance}
          onConfirm={handleConfirmUnlock}
          onClose={() => setUnlockTarget(null)}
        />
      )}
    </div>
  );
};

export default BookmarkedCandidatesPage;
