import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import Header from 'components/ui/Header';
import FilterSidebar from './components/FilterSidebar';
import SearchToolbar from './components/SearchToolbar';
import CandidateGrid from './components/CandidateGrid';
import CandidatePreviewDrawer from './components/CandidatePreviewDrawer';
import UnlockConfirmModal from './components/UnlockConfirmModal';
import BuyCreditsModal from './components/BuyCreditsModal';
import Toast from './components/Toast';
import styles from './styles/dashboard.module.scss';
import { addNotification } from 'utils/notificationStore';
import {
  searchCandidates,
  candidateToFrontend,
  revealedToFrontend,
  unlockCandidate,
  listBookmarks,
  createBookmark,
  removeBookmark,
  getCreditsBalance,
  listCreditPackages,
} from './candidateSearchApi';

const UNLOCK_COST = 1;
const PAGE_SIZE = 20;
const MAX_BOOKMARKS = 10;
const SEARCH_DEBOUNCE_MS = 350;

const CandidateSearchDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({});
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  const [bookmarksById, setBookmarksById] = useState({});
  const [credits, setCredits] = useState(0);
  const [creditPackages, setCreditPackages] = useState([]);

  const [unlockTarget, setUnlockTarget] = useState(null);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const [previewId, setPreviewId] = useState(null);

  const bookmarkedCandidates = Object.keys(bookmarksById);

  // Debounce free-text search so every keystroke doesn't trigger a request.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    listBookmarks()
      .then((rows) => {
        const map = {};
        rows.forEach((b) => { map[b.candidateId] = b.id; });
        setBookmarksById(map);
      })
      .catch(() => {});
    getCreditsBalance().then(setCredits).catch(() => {});
  }, []);

  const fetchPage = (pageNum, { append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    return searchCandidates({ q: debouncedQuery || undefined, filters, sort: sortBy, page: pageNum, limit: PAGE_SIZE })
      .then((data) => {
        const mapped = (data.items || []).map(candidateToFrontend);
        setCandidates((prev) => (append ? [...prev, ...mapped] : mapped));
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => {
        if (!append) {
          setCandidates([]);
          setTotal(0);
          setTotalPages(1);
        }
      })
      .finally(() => (append ? setLoadingMore(false) : setLoading(false)));
  };

  useEffect(() => {
    fetchPage(1, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, filters, sortBy]);

  const handleLoadMore = () => {
    if (loadingMore || page >= totalPages) return;
    fetchPage(page + 1, { append: true });
  };

  // List view doesn't make sense below 1000px — fall back to grid.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1000px)');

    const handleChange = (e) => {
      if (e?.matches) {
        setViewMode('grid');
      }
    };

    if (mediaQuery?.matches) {
      setViewMode('grid');
    }

    mediaQuery?.addEventListener('change', handleChange);
    return () => mediaQuery?.removeEventListener('change', handleChange);
  }, []);

  const showToast = (message) => {
    setToastMsg(message);
    clearTimeout(toastTimer?.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  };

  const handleBookmarkCandidate = async (candidateId) => {
    const existingId = bookmarksById[candidateId];

    if (existingId) {
      setBookmarksById((prev) => {
        const next = { ...prev };
        delete next[candidateId];
        return next;
      });
      try {
        await removeBookmark(existingId);
        showToast('Removed from bookmarks');
      } catch {
        setBookmarksById((prev) => ({ ...prev, [candidateId]: existingId }));
        showToast('Could not remove bookmark — please try again.');
      }
      return;
    }

    if (bookmarkedCandidates.length >= MAX_BOOKMARKS) {
      showToast(`You can bookmark a maximum of ${MAX_BOOKMARKS} candidates. Remove some to add new ones.`);
      return;
    }

    try {
      const bookmark = await createBookmark(candidateId);
      setBookmarksById((prev) => ({ ...prev, [candidateId]: bookmark.id }));
      showToast('Saved to bookmarks');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not bookmark this candidate — please try again.');
    }
  };

  // Step 1: clicking "Unlock" opens a confirmation modal instead of unlocking immediately
  const handleRequestUnlock = (candidateId) => {
    if (credits < UNLOCK_COST) {
      showToast('Not enough Credits — buy more to unlock this profile');
      handleOpenBuyCredits();
      return;
    }
    const candidate = candidates?.find((c) => c?.id === candidateId);
    setUnlockTarget(candidate || null);
  };

  // Step 2: actual unlock call, only runs after the user confirms in the modal.
  // Returns a promise so UnlockConfirmModal can show its "unlocked" screen only on success.
  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    try {
      const unlock = await unlockCandidate(unlockTarget.id, unlockTarget.position);
      const revealed = revealedToFrontend(unlock.cvSnapshot);
      setUnlockTarget((prev) => (prev ? { ...prev, ...revealed } : prev));
      setCredits((c) => Math.max(0, c - UNLOCK_COST));
      setCandidates((prev) => prev?.filter((c) => c?.id !== unlockTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      setBookmarksById((prev) => {
        if (!prev[unlockTarget.id]) return prev;
        const next = { ...prev };
        delete next[unlockTarget.id];
        return next;
      });

      addNotification('company', {
        type: 'unlock',
        title: `You unlocked ${revealed?.name || 'a candidate'}`,
        desc: `The candidate has been notified that you unlocked their profile. Spent: ${UNLOCK_COST} Credit${UNLOCK_COST === 1 ? '' : 's'}.`,
        time: 'Just now'
      });
      addNotification('candidate', {
        type: 'unlock',
        title: 'A company unlocked you',
        desc: 'A company purchased access to your profile.',
        time: 'Just now'
      });

      showToast(`Candidate unlocked · ${UNLOCK_COST} Credits spent`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not unlock this profile — please try again.');
      throw err;
    }
  };

  const handleOpenBuyCredits = () => {
    setIsBuyOpen(true);
    if (creditPackages.length === 0) {
      listCreditPackages().then(setCreditPackages).catch(() => {});
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handlePreviewCandidate = (candidateId) => {
    setPreviewId(candidateId);
  };

  const handleClosePreview = () => {
    setPreviewId(null);
  };

  return (
    <>
      <Helmet>
        <title>Candidate Search - Talentmon</title>
        <meta name="description" content="Find the ideal candidates for your positions using advanced search filters" />
      </Helmet>
      <div className={`${styles.page} ${viewMode === 'list' ? styles.listMode : ''} ${previewId !== null ? styles.previewOpen : ''}`}>
        <Header />

        {!isFilterCollapsed && (
          <div
            className={`${styles.scrim} ${styles.show}`}
            onClick={() => setIsFilterCollapsed(true)}
          />
        )}

        <div className={`${styles.body} ${previewId !== null ? styles.previewOpen : ''}`}>
          {/* Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            isCollapsed={isFilterCollapsed}
            onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
            onNotify={showToast}
          />

          {/* Main Content */}
          <div className={`${styles.main} ${previewId !== null ? styles.previewOpen : ''}`}>
            {/* Search Toolbar */}
            <SearchToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultsCount={total}
              onClearSearch={handleClearSearch}
              isFilterCollapsed={isFilterCollapsed}
              onToggleFilters={() => setIsFilterCollapsed(!isFilterCollapsed)}
            />

            {/* Results */}
            <div className={styles.results}>
              <CandidateGrid
                candidates={candidates}
                viewMode={viewMode}
                bookmarkedCandidates={bookmarkedCandidates}
                onBookmarkCandidate={handleBookmarkCandidate}
                onUnlockCandidate={handleRequestUnlock}
                onPreviewCandidate={handlePreviewCandidate}
                activePreviewId={previewId}
                isPreviewOpen={previewId !== null}
                loading={loading}
                isFilterCollapsed={isFilterCollapsed}
                hasMore={page < totalPages}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </div>
          </div>
        </div>

        {/* Anonymous CV preview drawer */}
        <CandidatePreviewDrawer
          candidates={candidates}
          activeId={previewId}
          onClose={handleClosePreview}
          bookmarkedCandidates={bookmarkedCandidates}
          onBookmark={handleBookmarkCandidate}
          onUnlock={handleRequestUnlock}
          unlockCost={UNLOCK_COST}
          forceOverlay={viewMode === 'list'}
          pushBreakpoint={1520}
        />

        {/* Unlock confirmation modal */}
        {unlockTarget && (
          <UnlockConfirmModal
            candidate={unlockTarget}
            creditCost={UNLOCK_COST}
            balance={credits}
            onConfirm={handleConfirmUnlock}
            onClose={() => setUnlockTarget(null)}
          />
        )}

        {/* Buy credits modal */}
        {isBuyOpen && (
          <BuyCreditsModal
            balance={credits}
            packages={creditPackages}
            onClose={() => setIsBuyOpen(false)}
            onPurchased={({ balance, credited }) => {
              if (balance != null) setCredits(balance);
              showToast(credited ? 'Credits added to your balance!' : 'Payment confirmed — credits are on their way.');
            }}
          />
        )}

        <Toast message={toastMsg} />
      </div>
    </>
  );
};

export default CandidateSearchDashboard;
