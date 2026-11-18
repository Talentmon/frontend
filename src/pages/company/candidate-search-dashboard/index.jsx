import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import FilterSidebar from './components/FilterSidebar';
import SearchToolbar from './components/SearchToolbar';
import CandidateGrid from './components/CandidateGrid';
import CandidatePreviewDrawer from './components/CandidatePreviewDrawer';
import UnlockConfirmModal from './components/UnlockConfirmModal';
import BuyCreditsModal from './components/BuyCreditsModal';
import Toast from './components/Toast';
import styles from './styles/dashboard.module.scss';
import { addNotification } from 'utils/notificationStore';
import { formatCredits } from 'utils/formatCredits';
import { setCreditBalance, useCreditBalance } from 'lib/creditBalance';
import { useSalaryView } from 'lib/salaryView';
import {
  searchCandidates,
  getSearchCandidate,
  candidateToFrontend,
  revealedToFrontend,
  unlockCandidate,
  listBookmarkIds,
  createBookmark,
  removeBookmark,
  listCreditPackages,
} from './candidateSearchApi';

const UNLOCK_COST = 1;
const PAGE_SIZE = 20;

const CandidateSearchDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  // Counted once per search (Apply); "Load more" doesn't count again.
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  // Net or gross, per month or per year: what the cards show and sorting by
  // salary orders by. Its currency is the one a salary range is typed in.
  const [salaryView] = useSalaryView();
  // What the results show: the filters as last applied, with the salary view
  // their salary range was typed in (the sidebar's fields are a draft until Apply).
  const [applied, setApplied] = useState({ filters: {}, view: null });
  const appliedView = applied.view || salaryView;
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );

  const [bookmarksById, setBookmarksById] = useState({});
  const { balance: credits } = useCreditBalance();
  const [creditPackages, setCreditPackages] = useState([]);

  const [unlockTarget, setUnlockTarget] = useState(null);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  // Bumped by every new search; see runSearch.
  const searchGeneration = useRef(0);
  const [previewId, setPreviewId] = useState(null);

  // The cards carry only what they show; a CV's jobs, education and languages
  // load when its preview opens, or ahead of that while the pointer rests on
  // its card. Each CV is asked for once and kept while the page is open.
  const [cvById, setCvById] = useState({});
  const [cvFailed, setCvFailed] = useState({});
  const cvRequests = useRef({});

  const loadCv = useCallback((id) => {
    if (!id || cvRequests.current[id]) return;
    setCvFailed((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    cvRequests.current[id] = getSearchCandidate(id)
      .then((raw) => setCvById((prev) => ({ ...prev, [id]: candidateToFrontend(raw) })))
      .catch(() => {
        // Asked again on Try again, the next hover or the next Preview.
        delete cvRequests.current[id];
        setCvFailed((prev) => ({ ...prev, [id]: true }));
      });
  }, []);

  useEffect(() => {
    if (previewId) loadCv(previewId);
  }, [previewId, loadCv]);

  // The drawer gets each card with its whole CV once that's here.
  const previewCandidates = useMemo(
    () => candidates.map((c) => (cvById[c.id] ? { ...c, ...cvById[c.id] } : c)),
    [candidates, cvById]
  );
  const cvStatus = !previewId || cvById[previewId] ? 'ready' : cvFailed[previewId] ? 'failed' : 'loading';

  const bookmarkedCandidates = Object.keys(bookmarksById);

  // Which candidates are bookmarked (and each bookmark's id, to remove it): ids only, no CVs.
  useEffect(() => {
    listBookmarkIds()
      .then((rows) => {
        const map = {};
        rows.forEach((b) => { map[b.candidateId] = b.id; });
        setBookmarksById(map);
      })
      .catch(() => {});
  }, []);

  // A new search (Apply, a sort, a saved filter) counts the total and starts
  // a new generation: only the latest may touch the results, so a slow reply
  // to an earlier search, or its "Load more", never lands over a newer one.
  // "Load more" asks for the next 20 after the cards already shown, without a count.
  const runSearch = ({ append = false } = {}) => {
    if (!append) {
      searchGeneration.current += 1;
      setLoadingMore(false);
    }
    const generation = searchGeneration.current;
    const isLatest = () => generation === searchGeneration.current;

    append ? setLoadingMore(true) : setLoading(true);
    return searchCandidates({
      filters: applied.filters,
      sort: sortBy,
      offset: append ? candidates.length : 0,
      limit: PAGE_SIZE,
      filterView: appliedView,
      sortView: salaryView
    })
      .then((data) => {
        if (!isLatest()) return;
        const mapped = (data.items || []).map(candidateToFrontend);
        // A candidate who joined in between can push one already shown into the next batch; it's shown once.
        setCandidates((prev) => (append ? [...prev, ...mapped.filter((c) => !prev.some((p) => p.id === c.id))] : mapped));
        if (typeof data.total === 'number') setTotal(data.total);
        setHasMore(!!data.hasMore);
      })
      .catch(() => {
        if (!append && isLatest()) {
          setCandidates([]);
          setTotal(0);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!isLatest()) return;
        append ? setLoadingMore(false) : setLoading(false);
      });
  };

  // Sorting by salary orders by the salary view the cards are in, so another view re-sorts.
  const salarySort = sortBy === 'salary' || sortBy === 'salary_asc';
  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, sortBy, salarySort ? salaryView.basis : '', salarySort ? salaryView.period : '']);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    runSearch({ append: true });
  };

  // From the sidebar: Apply filters, or a saved filter (with the view its range was typed in).
  const handleApplyFilters = (filters, view) => {
    setApplied({ filters, view: view || salaryView });
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
      } catch (err) {
        setBookmarksById((prev) => ({ ...prev, [candidateId]: existingId }));
        showToast(err?.response?.data?.message || 'Could not remove bookmark — please try again.');
      }
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
      const unlock = await unlockCandidate(unlockTarget.id, unlockTarget.position, salaryView);
      const revealed = revealedToFrontend(unlock.cvSnapshot);
      setUnlockTarget((prev) => (prev ? { ...prev, ...revealed } : prev));
      setCreditBalance((c) => Math.max(0, c - UNLOCK_COST));
      setCandidates((prev) => prev?.filter((c) => c?.id !== unlockTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      setBookmarksById((prev) => {
        if (!prev[unlockTarget.id]) return prev;
        const next = { ...prev };
        delete next[unlockTarget.id];
        return next;
      });

      // The company's own "unlocked" notification comes from the backend (UnlocksService).
      addNotification('candidate', {
        type: 'unlock',
        title: 'A company unlocked you',
        desc: 'A company purchased access to your profile.',
        time: 'Just now'
      });

      showToast(`Candidate unlocked · ${formatCredits(UNLOCK_COST)} spent`);
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

  // Clear all in the sidebar searches right away, with no filters.
  const handleClearFilters = () => {
    setApplied({ filters: {}, view: salaryView });
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

        {!isFilterCollapsed && (
          <div
            className={`${styles.scrim} ${styles.show}`}
            onClick={() => setIsFilterCollapsed(true)}
          />
        )}

        <div className={`${styles.body} ${previewId !== null ? styles.previewOpen : ''}`}>
          {/* Filter Sidebar */}
          <FilterSidebar
            appliedFilters={applied.filters}
            appliedView={appliedView}
            onApply={handleApplyFilters}
            onClearFilters={handleClearFilters}
            isCollapsed={isFilterCollapsed}
            onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
            onNotify={showToast}
          />

          {/* Main Content */}
          <div className={`${styles.main} ${previewId !== null ? styles.previewOpen : ''}`}>
            {/* Search Toolbar */}
            <SearchToolbar
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultsCount={total}
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
                onPrefetchCandidate={loadCv}
                activePreviewId={previewId}
                isPreviewOpen={previewId !== null}
                loading={loading}
                isFilterCollapsed={isFilterCollapsed}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </div>
          </div>
        </div>

        {/* Anonymous CV preview drawer */}
        <CandidatePreviewDrawer
          candidates={previewCandidates}
          activeId={previewId}
          cvStatus={cvStatus}
          onRetry={() => loadCv(previewId)}
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
            onPurchased={({ credited }) => {
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
