import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
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
import { getAppScroller } from 'components/ui/appScroll';
import { useMinWidth } from '../candidate-filters/cvLayout';
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

// Hiding / showing the filters (toggleFilters): they roll up to their title
// (or down from it), and the title changes into the toolbar's Filters button
// (or back). Same lengths as $vt-roll / $vt-move in dashboard.module.scss.
// Card view (dashboard.module.scss .body): from 846px the filters sit beside
// the cards (narrower, they slide in over the page); they can be hidden only
// from 1424px, where three 440px cards fit without them, up to 2800px, where
// three (the most there ever are) fit beside them. Outside that, hiding them
// wouldn't add a column, so they stay. List view follows the same widths; its
// filters slide in over the rows up to 1300px.
const FILTERS_BESIDE_MIN = 846;
const FILTERS_HIDE_MIN = 1424;
const FILTERS_HIDE_MAX = 2800;
const LIST_FILTERS_BESIDE_MIN = 1301;
// The CV drawer pushes the page aside from here: 55% of it holds the filters and a 440px card.
const CV_PUSH_MIN = 1502;

const FILTERS_ROLL_MS = 200;
const FILTERS_MOVE_MS = 300;
const ROLL_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const MOVE_EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
// The filters card's corners and shadow, and the button's (dashboard.module.scss).
const CARD_LOOK = {
  borderRadius: '18px',
  boxShadow: '0 1px 2px rgba(11, 26, 44, 0.06), 0 12px 32px -14px rgba(11, 26, 44, 0.22)'
};
const BUTTON_LOOK = {
  borderRadius: '10px',
  boxShadow: '0 1px 2px rgba(11, 26, 44, 0), 0 12px 32px -14px rgba(11, 26, 44, 0)'
};

const byClass = (name) => document.querySelector(`.${CSS.escape(name)}`);

/**
 * Where the filters' box is: the open filters card (with how tall its title
 * row is, what it rolls up to) or, hidden, the toolbar's Filters button.
 */
const filtersBox = (collapsed) => {
  if (collapsed) {
    const button = byClass(styles.filtersToggleBtn);
    return button ? { rect: button.getBoundingClientRect() } : null;
  }
  const card = document.querySelector(`.${CSS.escape(styles.filters)}:not(.${CSS.escape(styles.collapsed)})`);
  const head = card?.querySelector(`.${CSS.escape(styles.filtersHead)}`);
  if (!card || !head) return null;
  const rect = card.getBoundingClientRect();
  return { rect, titleHeight: head.getBoundingClientRect().bottom - rect.top };
};

/** One step of the box's path: where it is, its size and its look. */
const boxFrame = (rect, height, look, extra = {}) => ({
  transform: `translate(${rect.left}px, ${rect.top}px)`,
  width: `${rect.width}px`,
  height: `${height}px`,
  ...look,
  ...extra
});

const CandidateSearchDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  // Counted once per search (Apply); "Load more" doesn't count again.
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Best match first; with nothing Match counts that's newest first.
  const [sortBy, setSortBy] = useState('match');
  const [viewMode, setViewMode] = useState('grid');
  // Net or gross, per month or per year: what the cards show and sorting by
  // salary orders by. Its currency is the one a salary range is typed in.
  const [salaryView] = useSalaryView();
  // What the results show: the filters as last applied, with the salary view
  // their salary range was typed in (the sidebar's fields are a draft until Apply).
  const [applied, setApplied] = useState({ filters: {}, view: null });
  const appliedView = applied.view || salaryView;
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < FILTERS_BESIDE_MIN
  );
  const filtersBeside = useMinWidth(FILTERS_BESIDE_MIN);
  const roomToHideFilters = useMinWidth(FILTERS_HIDE_MIN);
  const threeBesideFilters = useMinWidth(FILTERS_HIDE_MAX);
  const listFiltersBeside = useMinWidth(LIST_FILTERS_BESIDE_MIN);
  // Hidden only where that helps: the slide-in filters (closed), or from 1424px
  // up to 2800px, where hiding them adds a column (list view too). Elsewhere
  // they show, whatever was picked before.
  const filtersSlideIn = !filtersBeside || (viewMode === 'list' && !listFiltersBeside);
  const canHideFilters = filtersSlideIn || (roomToHideFilters && !threeBesideFilters);
  const filtersCollapsed = isFilterCollapsed && canHideFilters;
  // For the toolbar's Filters button (the sidebar counts its fields).
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const filtersTransition = useRef(null);

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
      // The bookmark keeps their Match from this search.
      const bookmark = await createBookmark(candidateId, candidates.find((c) => c.id === candidateId)?.matchScore);
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

  // Hiding or showing the filters beside the results (a computer) is a view
  // transition in two steps (.filtersVt in dashboard.module.scss). Hiding: the
  // filters roll up to their title, then the title shrinks into the toolbar's
  // Filters button while the cards and the count move. Showing: the button
  // grows into the title as everything moves back, then the filters roll down.
  // The filters' box follows a path measured here. Not where the filters slide
  // in over the page (they have their own slide), not with a CV open (the cards
  // would pass over it), and not for reduced motion or a browser without view
  // transitions: there it just changes.
  const toggleFilters = () => {
    const next = !filtersCollapsed;
    if (next && !canHideFilters) return;
    const media = (query) => window.matchMedia?.(query)?.matches;
    const besideResults = media(`(min-width: ${FILTERS_BESIDE_MIN}px)`) && !(viewMode === 'list' && media('(max-width: 1300px)'));
    if (
      typeof document.startViewTransition !== 'function'
      || !besideResults
      || previewId !== null
      || media('(prefers-reduced-motion: reduce)')
    ) {
      setIsFilterCollapsed(next);
      return;
    }

    const hiding = next;
    const from = filtersBox(filtersCollapsed);
    // Hiding far down the page, the toolbar (where the button is) is out of
    // view: the filters only roll up and fade there.
    const viewTop = getAppScroller()?.getBoundingClientRect().top ?? 0;
    const far = hiding && (byClass(styles.toolbarRow)?.getBoundingClientRect().bottom ?? 0) <= viewTop;

    const root = document.documentElement;
    const classes = [styles.filtersVt, hiding ? styles.filtersVtHide : styles.filtersVtShow];
    if (far) classes.push(styles.filtersVtFar);
    // A quick second click starts over: off with the first one's classes.
    root.classList.remove(styles.filtersVt, styles.filtersVtHide, styles.filtersVtShow, styles.filtersVtFar);
    root.classList.add(...classes);

    let to = null;
    const transition = document.startViewTransition(() => {
      flushSync(() => setIsFilterCollapsed(next));
      to = filtersBox(next);
    });
    filtersTransition.current = transition;

    transition.ready
      .then(() => {
        if (!from || !to) return;
        const total = FILTERS_ROLL_MS + FILTERS_MOVE_MS;
        let frames;
        if (hiding) {
          const rolledUp = { offset: FILTERS_ROLL_MS / total, easing: MOVE_EASE };
          frames = far
            ? [
              boxFrame(from.rect, from.rect.height, CARD_LOOK, { opacity: 1, easing: ROLL_EASE }),
              boxFrame(from.rect, from.titleHeight, CARD_LOOK, { opacity: 1, ...rolledUp }),
              boxFrame(from.rect, from.titleHeight, CARD_LOOK, { opacity: 0 })
            ]
            : [
              boxFrame(from.rect, from.rect.height, CARD_LOOK, { easing: ROLL_EASE }),
              boxFrame(from.rect, from.titleHeight, CARD_LOOK, rolledUp),
              boxFrame(to.rect, to.rect.height, BUTTON_LOOK)
            ];
        } else {
          frames = [
            boxFrame(from.rect, from.rect.height, BUTTON_LOOK, { easing: MOVE_EASE }),
            boxFrame(to.rect, to.titleHeight, CARD_LOOK, { offset: FILTERS_MOVE_MS / total, easing: ROLL_EASE }),
            boxFrame(to.rect, to.rect.height, CARD_LOOK)
          ];
        }
        root.animate(frames, { duration: total, fill: 'both', pseudoElement: '::view-transition-group(search-filters)' });
      })
      .catch(() => {});

    transition.finished.finally(() => {
      if (filtersTransition.current === transition) root.classList.remove(...classes);
    });
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

        {!filtersCollapsed && (
          <div
            className={`${styles.scrim} ${styles.show}`}
            onClick={() => setIsFilterCollapsed(true)}
          />
        )}

        <div className={`${styles.body} ${previewId !== null ? styles.previewOpen : ''} ${filtersCollapsed ? styles.filtersCollapsed : ''}`}>
          {/* Filter Sidebar */}
          <FilterSidebar
            appliedFilters={applied.filters}
            appliedView={appliedView}
            onApply={handleApplyFilters}
            onClearFilters={handleClearFilters}
            isCollapsed={filtersCollapsed}
            canCollapse={canHideFilters}
            onToggleCollapse={toggleFilters}
            onActiveCountChange={setActiveFiltersCount}
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
              isFilterCollapsed={filtersCollapsed}
              activeFiltersCount={activeFiltersCount}
              onToggleFilters={toggleFilters}
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
                isFilterCollapsed={filtersCollapsed}
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
          pushBreakpoint={CV_PUSH_MIN}
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
