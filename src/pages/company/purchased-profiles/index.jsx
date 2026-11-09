import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import Header from 'components/ui/Header';
import Icon from 'components/AppIcon';
import PurchasedProfileCard from './components/PurchasedProfileCard';
import PurchasedProfilesTable from './components/PurchasedProfilesTable';
import PurchasedHeader from './components/PurchasedHeader';
import PipelineCard from './components/PipelineCard';
import PurchasedFilters, { AttentionChip } from './components/PurchasedFilters';
import { ListSearch } from '../candidate-filters/CandidateFilterBar';
import { CV_PUSH_BREAKPOINT, useMinWidth } from '../candidate-filters/cvLayout';
import PurchasedFilterSidebar from './components/PurchasedFilterSidebar';
import PurchasedResultsBar from './components/PurchasedResultsBar';
import FeedbackModal from './components/FeedbackModal';
import CandidatePreviewDrawer from '../candidate-search-dashboard/components/CandidatePreviewDrawer';
import { downloadCandidateCv, printCandidateCv } from 'utils/downloadCv';
import {
  listPurchases,
  purchaseToFrontend,
  updatePurchaseStatus,
  updatePurchaseHiringFor,
  addPurchaseNote,
  updateNote,
  deleteNote,
  createHire,
  buildAnalytics,
  buildPipeline,
  attentionList,
  STATUS_KEYS,
} from './purchasesApi';
import { DEFAULT_SORT, EMPTY_FILTERS, activeFilterCount, applyFilters, sortProfiles } from './purchasedFilters';
import cf from '../candidate-filters/candidateFilters.module.scss';
import styles from './styles/purchased.module.scss';

// Matches the drawer's own slide transition (.34s) so the scroll-to-center
// below doesn't fire mid-animation, while the single-column layout is still
// settling into place.
const LAYOUT_SETTLE_MS = 360;

const PurchasedProfiles = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('cards');
  // ?status=new — the Analytics tab's "still at New" notice links straight to that filter.
  const [filters, setFilters] = useState(() => {
    const status = searchParams.get('status');
    return STATUS_KEYS.includes(status) ? { ...EMPTY_FILTERS, statuses: [status] } : EMPTY_FILTERS;
  });
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  const isPushWide = useMinWidth(CV_PUSH_BREAKPOINT);
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, candidate: null });
  const [notification, setNotification] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const cardRefs = useRef({});

  const [purchasedProfiles, setPurchasedProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPurchases()
      .then((rows) => setPurchasedProfiles(rows.map(purchaseToFrontend)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const analytics = useMemo(() => buildAnalytics(purchasedProfiles), [purchasedProfiles]);
  const visibleProfiles = useMemo(
    () => sortProfiles(applyFilters(purchasedProfiles, filters), sortBy),
    [purchasedProfiles, filters, sortBy]
  );
  // The pipeline follows every filter but its own stage; "Needs attention" only the position.
  const pipeline = useMemo(
    () => buildPipeline(applyFilters(purchasedProfiles, { ...filters, statuses: [], attention: false })),
    [purchasedProfiles, filters]
  );
  const attention = useMemo(
    () => attentionList(filters.hiringFor.length ? purchasedProfiles.filter((p) => filters.hiringFor.includes(p?.hiringFor)) : purchasedProfiles),
    [purchasedProfiles, filters.hiringFor]
  );
  // Positions already in use, offered when setting "Hiring for".
  const positionSuggestions = useMemo(
    () => [...new Set(purchasedProfiles.map((p) => p?.hiringFor).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [purchasedProfiles]
  );
  const isFiltered = activeFilterCount(filters) > 0 || !!filters.search.trim();

  // One stage and one position at a time ('' = all).
  const setStage = (stage) => setFilters((prev) => ({ ...prev, statuses: stage ? [stage] : [], attention: false }));
  const setPosition = (position) => setFilters((prev) => ({ ...prev, hiringFor: position ? [position] : [] }));
  // Review: exactly the candidates who need a follow-up (other filters stay), the longest waiting first.
  const reviewAttention = () => {
    setFilters((prev) => ({ ...prev, statuses: [], attention: true }));
    setSortBy('waiting-desc');
  };
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const updateProfile = (profileId, changes) => {
    setPurchasedProfiles((prev) => prev?.map((p) => (p?.id === profileId ? { ...p, ...(typeof changes === 'function' ? changes(p) : changes) } : p)));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusChange = async (profileId, newStatus) => {
    // Hiring isn't a bare status flip - it needs the feedback form, since
    // that's what actually creates the Hire record (see handleSubmitFeedback).
    if (newStatus === 'hired') {
      handleProvideFeedback(profileId);
      return;
    }

    const purchase = purchasedProfiles?.find((p) => p?.id === profileId);
    if (!purchase) return;
    const { recruitmentStatus: previousStatus, statusChangedAt: previousChangedAt } = purchase;

    updateProfile(profileId, { recruitmentStatus: newStatus, statusChangedAt: new Date() });

    try {
      await updatePurchaseStatus(purchase.purchaseId, newStatus);
      showNotification('Candidate status successfully updated');
    } catch {
      updateProfile(profileId, { recruitmentStatus: previousStatus, statusChangedAt: previousChangedAt });
      showNotification('Could not update status — please try again.', 'error');
    }
  };

  const handleSaveHiringFor = async (profileId, text) => {
    const purchase = purchasedProfiles?.find((p) => p?.id === profileId);
    if (!purchase) return false;
    try {
      await updatePurchaseHiringFor(purchase.purchaseId, text);
      updateProfile(profileId, { hiringFor: text });
      // A cleared position can't stay picked in the filter.
      if (!text && purchase.hiringFor) {
        const stillUsed = purchasedProfiles.some((p) => p?.id !== profileId && p?.hiringFor === purchase.hiringFor);
        if (!stillUsed) setFilters((prev) => ({ ...prev, hiringFor: prev.hiringFor.filter((v) => v !== purchase.hiringFor) }));
      }
      return true;
    } catch {
      showNotification('Could not save the position — please try again.', 'error');
      return false;
    }
  };

  const updateProfileNotes = (profileId, update) => {
    updateProfile(profileId, (p) => ({ notes: update(p?.notes || []) }));
  };

  // Same as on Bookmarked: add and edit wait for the saved note (it carries the
  // id, author and time) and return whether it worked so the card clears its field.
  const handleAddNote = async (profileId, text) => {
    const purchase = purchasedProfiles?.find((p) => p?.id === profileId);
    if (!purchase) return false;
    try {
      const note = await addPurchaseNote(purchase.purchaseId, text);
      updateProfileNotes(profileId, (notes) => [...notes, note]);
      return true;
    } catch {
      showNotification('Could not save note — please try again.', 'error');
      return false;
    }
  };

  const handleEditNote = async (profileId, noteId, text) => {
    try {
      const note = await updateNote(noteId, text);
      updateProfileNotes(profileId, (notes) => notes.map((n) => (n?.id === noteId ? note : n)));
      return true;
    } catch {
      showNotification('Could not save note — please try again.', 'error');
      return false;
    }
  };

  const handleDeleteNote = async (profileId, noteId) => {
    const removed = purchasedProfiles?.find((p) => p?.id === profileId)?.notes?.find((n) => n?.id === noteId);
    if (!removed) return;
    updateProfileNotes(profileId, (notes) => notes.filter((n) => n?.id !== noteId));
    try {
      await deleteNote(noteId);
    } catch {
      updateProfileNotes(profileId, (notes) =>
        [...notes, removed].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      );
      showNotification('Could not delete note — please try again.', 'error');
    }
  };

  const handleCvDownload = (profileId) => {
    const profile = purchasedProfiles?.find((p) => p?.id === profileId);
    if (!profile) return;
    downloadCandidateCv(profile);
    showNotification(`${profile?.name}'s CV has been downloaded`);
  };

  const handleViewDetails = (profileId) => {
    setPreviewId(profileId);
    setTimeout(() => {
      cardRefs.current?.[profileId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, LAYOUT_SETTLE_MS);
  };

  const handleClosePreview = () => {
    setPreviewId(null);
  };

  const handleCvPrint = (profile) => {
    printCandidateCv(profile);
  };

  const handleProvideFeedback = (profileId) => {
    const candidate = purchasedProfiles?.find(p => p?.id === profileId);
    setFeedbackModal({ isOpen: true, candidate });
  };

  const handleSubmitFeedback = async (profileId, feedback) => {
    const purchase = purchasedProfiles?.find((p) => p?.id === profileId);
    if (!purchase) return;

    try {
      const hire = await createHire(purchase.purchaseId, {
        hireDate: feedback?.hireDate,
        position: feedback?.position,
        salaryClauseRespected: feedback?.salaryClauseRespected === 'yes',
        ratingOverall: feedback?.rating,
        comments: feedback?.comments,
      });
      // The backend fills an empty "Hiring for" with the position hired for.
      updateProfile(profileId, (p) => ({
        recruitmentStatus: 'hired',
        statusChangedAt: new Date(),
        hiringFor: p?.hiringFor || feedback?.position?.trim() || '',
        hire,
      }));
      showNotification('Feedback submitted successfully. Thank you for your input!');
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Could not submit feedback — please try again.', 'error');
    }
  };

  useEffect(() => {
    // Set page title based on current language
    document.title = 'Purchased Profiles - Talentmon';
  }, []);

  // The push layout (drawer squeezes the page instead of overlaying it) only
  // makes sense for the card grid — a table has no comfortable narrower form,
  // so table view always stays overlay+scrim instead (see forceOverlay below).
  const isCardsPreviewOpen = previewId !== null && viewMode === 'cards';
  // CV open beside the cards (as on Search): the filters in a column on the
  // left, the search, Sort and the cards (448px) beside it.
  const isCompact = isCardsPreviewOpen && isPushWide;
  const hasProfiles = purchasedProfiles.length > 0;

  // The cards (or table) with the results bar; beside an open CV the search and
  // the Needs attention chip come along above them.
  const results = (
    <div className={`${styles.layout} ${isCardsPreviewOpen ? styles.previewOpen : ''}`}>
      {hasProfiles && isCompact && (
        <>
          <ListSearch
            id="pp-search"
            label="Search unlocked candidates"
            placeholder="Name, email, phone, skills, notes…"
            className={cf.cvSearch}
            value={filters.search}
            onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          />
          <AttentionChip filters={filters} onFiltersChange={setFilters} className={cf.cvChips} />
        </>
      )}
      {hasProfiles && (
        <PurchasedResultsBar
          shown={visibleProfiles.length}
          total={purchasedProfiles.length}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          compact={isCompact}
        />
      )}

      {/* Content */}
      {viewMode === 'cards' ? (
        <div className={`${styles.cgrid} ${isCardsPreviewOpen ? styles.previewOpen : ''}`}>
          {visibleProfiles.map((profile) => (
            <PurchasedProfileCard
              key={profile?.id}
              ref={(el) => { cardRefs.current[profile?.id] = el; }}
              profile={profile}
              isActive={previewId === profile?.id}
              onStatusChange={handleStatusChange}
              onCvDownload={handleCvDownload}
              onViewDetails={handleViewDetails}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onSaveHiringFor={handleSaveHiringFor}
              positionSuggestions={positionSuggestions}
            />
          ))}
        </div>
      ) : (
        <PurchasedProfilesTable
          profiles={visibleProfiles}
          sortBy={sortBy}
          onSortChange={setSortBy}
          positionSuggestions={positionSuggestions}
          onSaveHiringFor={handleSaveHiringFor}
          onStatusChange={handleStatusChange}
          onCvDownload={handleCvDownload}
          onViewDetails={handleViewDetails}
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          activePreviewId={previewId}
        />
      )}

      {/* Empty states: nothing unlocked yet, or nothing left after the filters */}
      {!loading && !hasProfiles && (
        <div className={styles.emptyState}>
          <Icon name="Search" size={48} />
          <h3>No unlocked profiles</h3>
          <p>Unlocked profiles will appear here after purchase</p>
          <button className={styles.textBtn} onClick={() => window.location.href = '/candidate-search-dashboard'}>
            <Icon name="Search" size={14} />Search candidates
          </button>
        </div>
      )}
      {!loading && hasProfiles && visibleProfiles.length === 0 && (
        <div className={styles.noMatch}>
          <Icon name="Filter" size={28} strokeWidth={1.9} className={styles.noMatchIcon} />
          <p className={styles.noMatchTitle}>No purchased profiles match these filters</p>
          <p className={styles.noMatchText}>
            {isFiltered ? 'Remove a filter or start over.' : 'Try a different search.'}
          </p>
          <button type="button" className={styles.noMatchBtn} onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Purchased Profiles - Talentmon</title>
        <meta name="description" content="Access all your unlocked candidates and manage the recruitment process" />
      </Helmet>
      <div className={`${styles.page} ${isCardsPreviewOpen ? styles.previewOpen : ''}`}>
        <Header />

        <main className={`pt-16 max-w-[1420px] mx-auto px-[22px] ${isCompact ? cf.cvMain : ''}`}>
          {isCompact ? (
            <header className={cf.cvTitle}>
              <h1>Purchased Profiles</h1>
            </header>
          ) : (
            <PurchasedHeader analytics={analytics} />
          )}

          {/* Pipeline — folds away while the CV drawer pushes the page aside. */}
          {hasProfiles && (
            <div className={`${styles.statsWrap} ${isCardsPreviewOpen ? styles.collapsed : ''}`}>
              <div className={styles.statsWrapInner}>
                <PipelineCard
                  pipeline={pipeline}
                  attention={attention}
                  stages={filters.statuses}
                  onStageChange={setStage}
                  position={filters.hiringFor[0] || ''}
                  positions={analytics.byPosition}
                  onPositionChange={setPosition}
                  onReviewAttention={reviewAttention}
                />
              </div>
            </div>
          )}

          {hasProfiles && !isCompact && (
            <PurchasedFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
              profiles={purchasedProfiles}
            />
          )}

          {isCompact ? (
            <div className={cf.cvLayout}>
              <div className={cf.cvSide}>
                <PurchasedFilterSidebar filters={filters} onFiltersChange={setFilters} profiles={purchasedProfiles} />
              </div>
              <div className={cf.cvResults}>{results}</div>
            </div>
          ) : results}
        </main>

        {/* CV preview drawer — enters from the right, as on Search, with the
            cards column packed against it. Every profile is already purchased, so it always renders
            fully unlocked (no anonymity banner) with send-mail/print actions
            instead of bookmark/unlock. It gets every unlocked candidate, not
            just the filtered ones, so filtering beside an open CV keeps it open. */}
        <CandidatePreviewDrawer
          candidates={purchasedProfiles}
          activeId={previewId}
          onClose={handleClosePreview}
          purchasedCandidates={purchasedProfiles.map((p) => p?.id)}
          onPrint={handleCvPrint}
          variant="purchased"
          pushBreakpoint={CV_PUSH_BREAKPOINT}
          forceOverlay={viewMode === 'table'}
        />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={feedbackModal?.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, candidate: null })}
          candidateProfile={feedbackModal?.candidate}
          onSubmitFeedback={handleSubmitFeedback}
        />

        {/* Notification */}
        {notification && (
          <div className={`${styles.toast} ${styles.show}`}>
            <Icon
              name={notification?.type === 'success' ? 'CheckCircle' : 'AlertCircle'}
              size={17}
            />
            <span>{notification?.message}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default PurchasedProfiles;
