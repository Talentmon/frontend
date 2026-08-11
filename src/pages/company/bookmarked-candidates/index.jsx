import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from 'components/ui/Header';
import BookmarkedCandidatesHeader from './components/BookmarkedCandidatesHeader';
import BookmarkLimitIndicator from './components/BookmarkLimitIndicator';
import BookmarkedCandidatesFilters from './components/BookmarkedCandidatesFilters';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import BookmarkedCandidatesGrid from './components/BookmarkedCandidatesGrid';
import EmptyBookmarksState from './components/EmptyBookmarksState';
import Toast from './components/Toast';
import UnlockConfirmModal from '../candidate-search-dashboard/components/UnlockConfirmModal';
import CandidatePreviewDrawer from '../candidate-search-dashboard/components/CandidatePreviewDrawer';
import Icon from 'components/AppIcon';
import { buildBaseSalaryRange, filterByBaseSalary } from 'utils/salaryFilterService';
import { getSkillNamesFor } from 'utils/skills';
import {
  listBookmarks,
  bookmarkToFrontend,
  removeBookmark,
  updateBookmarkNotes,
  reorderBookmarks,
  bulkUnlockBookmarks,
  unlockCandidate,
  revealedToFrontend,
  getCreditsBalance,
  UNLOCK_COST,
} from './bookmarksApi';
import styles from './styles/bookmarked.module.scss';

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
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('bookmarked-date-desc');
  const [creditBalance, setCreditBalance] = useState(0);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const [filters, setFilters] = useState({
    search: '',
    experience: '',
    status: '',
    salary: { min: '', max: '', currency: 'EUR' },
    industry: [],
    subIndustry: [],
    skillCategory: [],
    skills: [],
    hasNotes: false
  });

  useEffect(() => {
    listBookmarks()
      .then((rows) => setAllBookmarkedCandidates(rows.map(bookmarkToFrontend)))
      .catch(() => {})
      .finally(() => setLoading(false));
    getCreditsBalance().then(setCreditBalance).catch(() => {});
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allBookmarkedCandidates];

    // Apply search filter
    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      filtered = filtered?.filter(candidate =>
        candidate?.name?.toLowerCase()?.includes(searchTerm) ||
        candidate?.position?.toLowerCase()?.includes(searchTerm) ||
        candidate?.skills?.some(skill => skill?.toLowerCase()?.includes(searchTerm))
      );
    }

    // Apply experience filter
    if (filters?.experience) {
      filtered = filtered?.filter(candidate => {
        const exp = candidate?.experience;
        switch (filters?.experience) {
          case '0-1': return exp <= 1;
          case '1-3': return exp >= 1 && exp <= 3;
          case '3-5': return exp >= 3 && exp <= 5;
          case '5-10': return exp >= 5 && exp <= 10;
          case '10+': return exp > 10;
          default: return true;
        }
      });
    }

    // Apply status filter
    if (filters?.status) {
      filtered = filtered?.filter(candidate => candidate?.searchStatus === filters?.status);
    }

    // Apply industry filter - a specific subindustry narrows to it directly;
    // an industry with no subindustry picked yet matches any of its subindustries.
    if (filters?.subIndustry?.length > 0) {
      filtered = filtered?.filter(candidate => filters?.subIndustry?.includes(candidate?.subIndustry));
    } else if (filters?.industry?.length > 0) {
      filtered = filtered?.filter(candidate => filters?.industry?.includes(candidate?.industry));
    }

    // Apply salary range filter - the filter range is converted to base
    // currency once, then compared against each candidate's precomputed
    // base salary (see salaryFilterService).
    if (filters?.salary?.min || filters?.salary?.max) {
      const baseRange = buildBaseSalaryRange({
        min: filters?.salary?.min,
        max: filters?.salary?.max,
        currency: filters?.salary?.currency || 'EUR'
      });
      filtered = filterByBaseSalary(filtered, baseRange, (candidate) => candidate?.expectedSalary?.base);
    }

    // Apply skills filter - a specific skill narrows to it directly; a
    // category with no specific skill picked yet matches any skill in it.
    if (filters?.skills && filters?.skills?.length > 0) {
      filtered = filtered?.filter(candidate =>
        filters?.skills?.some(skill =>
          candidate?.skills?.some(candidateSkill =>
            candidateSkill?.toLowerCase()?.includes(skill?.toLowerCase())
          )
        )
      );
    } else if (filters?.skillCategory && filters?.skillCategory?.length > 0) {
      const categorySkills = getSkillNamesFor({ categories: filters?.skillCategory });
      filtered = filtered?.filter(candidate =>
        categorySkills?.some(skill =>
          candidate?.skills?.some(candidateSkill =>
            candidateSkill?.toLowerCase()?.includes(skill?.toLowerCase())
          )
        )
      );
    }

    // Apply notes filter
    if (filters?.hasNotes) {
      filtered = filtered?.filter(candidate => candidate?.notes && candidate?.notes?.trim() !== '');
    }

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
          return (b?.expectedSalary?.base || 0) - (a?.expectedSalary?.base || 0);
        case 'salary-asc':
          return (a?.expectedSalary?.base || 0) - (b?.expectedSalary?.base || 0);
        case 'match-score-desc':
          return (b?.matchScore || 0) - (a?.matchScore || 0);
        case 'custom':
          return a?.sortIndex - b?.sortIndex;
        default:
          return 0;
      }
    });

    setFilteredCandidates(filtered);
  }, [allBookmarkedCandidates, filters, sortBy]);

  const showToast = (message) => {
    setToastMsg(message);
    clearTimeout(toastTimer?.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const handleRemoveBookmark = async (candidateId) => {
    const candidate = allBookmarkedCandidates?.find(c => c?.id === candidateId);
    if (!candidate) return;

    setAllBookmarkedCandidates(prev => prev?.filter(c => c?.id !== candidateId));
    setSelectedCandidates(prev => prev?.filter(id => id !== candidateId));

    try {
      await removeBookmark(candidate.bookmarkId);
    } catch {
      setAllBookmarkedCandidates(prev => [...prev, candidate]);
      showToast('Could not remove bookmark — please try again.');
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
      const unlock = await unlockCandidate(unlockTarget.id, unlockTarget.position);
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

  const handleUpdateNotes = async (candidateId, notes) => {
    const candidate = allBookmarkedCandidates?.find((c) => c?.id === candidateId);
    if (!candidate) return;
    setAllBookmarkedCandidates((prev) => prev.map((c) => (c?.id === candidateId ? { ...c, notes } : c)));
    try {
      await updateBookmarkNotes(candidate.bookmarkId, notes);
    } catch {
      showToast('Could not save note — please try again.');
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
      const result = await bulkUnlockBookmarks(candidateIds);
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

  const handleBulkRemove = async (candidateIds) => {
    const removed = allBookmarkedCandidates?.filter((c) => candidateIds?.includes(c?.id));
    setAllBookmarkedCandidates(prev => prev?.filter(c => !candidateIds?.includes(c?.id)));
    setSelectedCandidates([]);

    const results = await Promise.allSettled(removed.map((c) => removeBookmark(c.bookmarkId)));
    const failedCount = results.filter((r) => r.status === 'rejected').length;
    if (failedCount > 0) {
      const failedIds = removed
        .filter((_, i) => results[i].status === 'rejected')
        .map((c) => c.id);
      setAllBookmarkedCandidates((prev) => [...prev, ...removed.filter((c) => failedIds.includes(c.id))]);
      showToast(`Removed ${candidateIds?.length - failedCount} of ${candidateIds?.length} — some could not be removed.`);
    } else {
      showToast(`Removed ${candidateIds?.length} candidate${candidateIds?.length === 1 ? '' : 's'} from bookmarks`);
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

  const handleClearFilters = () => {
    setFilters({
      search: '',
      experience: '',
      status: '',
      salary: { min: '', max: '', currency: 'EUR' },
      industry: [],
      subIndustry: [],
      skillCategory: [],
      skills: [],
      hasNotes: false
    });
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className="pt-16 max-w-[1320px] mx-auto px-[22px]">
        {/* Header */}
        <BookmarkedCandidatesHeader
          candidatesCount={filteredCandidates?.length}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onToggleSelectionMode={handleToggleSelectionMode}
          selectionMode={selectionMode}
          onSearchCandidates={handleSearchCandidates}
          reorderMode={reorderMode}
          hasReordered={hasReordered}
          onToggleReorderMode={handleToggleReorderMode}
          onSaveOrder={handleSaveOrder}
        />

        {!loading && allBookmarkedCandidates?.length === 0 ? (
          <EmptyBookmarksState onSearchCandidates={handleSearchCandidates} />
        ) : (
          <>
            {/* Bookmark Limit Indicator + Filters, as two separate cards */}
            <div className={`${styles.topRow} ${filtersExpanded ? styles.expanded : ''}`}>
              <div className={styles.topRowLimit}>
                <BookmarkLimitIndicator
                  currentCount={allBookmarkedCandidates?.length}
                  maxCount={10}
                  onManageBookmarks={() => { setReorderMode(false); setSelectionMode(true); }}
                  onSearchCandidates={handleSearchCandidates}
                  stacked={filtersExpanded}
                />
              </div>

              <div className={styles.topRowFilters}>
                <BookmarkedCandidatesFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  candidatesCount={filteredCandidates?.length}
                  isExpanded={filtersExpanded}
                  onToggleExpand={() => setFiltersExpanded((prev) => !prev)}
                />
              </div>
            </div>

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
                onUpdateNotes={handleUpdateNotes}
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
        )}
      </main>

      <Toast message={toastMsg} />

      {/* Anonymous CV preview drawer — always overlay+scrim (no filter
          sidebar to make room for by pushing, and bookmark grids stay narrow
          by design, so squeezing them further never makes sense). */}
      <CandidatePreviewDrawer
        candidates={filteredCandidates}
        activeId={previewId}
        onClose={handleClosePreview}
        bookmarkedCandidates={filteredCandidates?.map((c) => c?.id)}
        onBookmark={handleRemoveBookmark}
        onUnlock={handleRequestUnlock}
        unlockCost={filteredCandidates?.find((c) => c?.id === previewId)?.unlockCost || UNLOCK_COST}
        forceOverlay
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
