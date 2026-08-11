import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from 'components/ui/Header';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import PurchasedProfileCard from './components/PurchasedProfileCard';
import PurchasedProfilesTable from './components/PurchasedProfilesTable';
import PurchaseHistorySidebar from './components/PurchaseHistorySidebar';
import FeedbackModal from './components/FeedbackModal';
import CandidatePreviewDrawer from '../candidate-search-dashboard/components/CandidatePreviewDrawer';
import { downloadCandidateCv, printCandidateCv } from 'utils/downloadCv';
import {
  listPurchases,
  purchaseToFrontend,
  updatePurchaseStatus,
  updatePurchaseNotes,
  createHire,
  buildAnalytics,
} from './purchasesApi';
import styles from './styles/purchased.module.scss';

// Matches the drawer's own slide transition (.34s) so the scroll-to-center
// below doesn't fire mid-animation, while the single-column layout is still
// settling into place.
const LAYOUT_SETTLE_MS = 360;

const PurchasedProfiles = () => {
  const [viewMode, setViewMode] = useState('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  // Purchase history mirrors the live recruitment status of each purchased profile,
  // so it stays in sync with status changes made from the cards/table.
  const purchaseHistory = [...purchasedProfiles]
    ?.sort((a, b) => b?.unlockedDate - a?.unlockedDate)
    ?.map((p) => ({
      candidateName: p?.name,
      position: p?.position,
      date: p?.unlockedDate,
      status: p?.recruitmentStatus
    }));

  const creditAnalytics = buildAnalytics(purchasedProfiles);

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'interviewed', label: 'Interviewed' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Filter profiles based on search and status
  const filteredProfiles = purchasedProfiles?.filter(profile => {
    const matchesSearch = !searchTerm ||
      profile?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      profile?.position?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      profile?.company?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      profile?.skills?.some(skill => skill?.toLowerCase()?.includes(searchTerm?.toLowerCase()));

    const matchesStatus = !statusFilter || profile?.recruitmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
    const previousStatus = purchase.recruitmentStatus;

    setPurchasedProfiles((prev) =>
      prev?.map((p) => (p?.id === profileId ? { ...p, recruitmentStatus: newStatus } : p))
    );

    try {
      await updatePurchaseStatus(purchase.purchaseId, newStatus);
      showNotification('Candidate status successfully updated');
    } catch {
      setPurchasedProfiles((prev) =>
        prev?.map((p) => (p?.id === profileId ? { ...p, recruitmentStatus: previousStatus } : p))
      );
      showNotification('Could not update status — please try again.', 'error');
    }
  };

  const handleContactCopy = (contactInfo) => {
    showNotification(`Contact info copied: ${contactInfo}`);
  };

  const handleUpdateNotes = async (profileId, notes) => {
    const purchase = purchasedProfiles?.find((p) => p?.id === profileId);
    if (!purchase) return;
    setPurchasedProfiles((prev) => prev?.map((p) => (p?.id === profileId ? { ...p, notes } : p)));
    try {
      await updatePurchaseNotes(purchase.purchaseId, notes);
      showNotification('Note saved');
    } catch {
      showNotification('Could not save note — please try again.', 'error');
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
      setPurchasedProfiles((prev) =>
        prev?.map((p) => (p?.id === profileId ? { ...p, recruitmentStatus: 'hired', hire } : p))
      );
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

  return (
    <>
      <Helmet>
        <title>Purchased Profiles - Talentmon</title>
        <meta name="description" content="Access all your unlocked candidates and manage the recruitment process" />
      </Helmet>
      <div className={`${styles.page} ${isCardsPreviewOpen ? styles.previewOpen : ''}`}>
        <Header />

        <main className="pt-16 max-w-[1320px] mx-auto px-[22px]">
          <div className={styles.head}>
            <h1>Purchased Profiles</h1>
            <p>Manage your unlocked candidates and track the recruitment process</p>
          </div>

          <div className={`${styles.layout} ${isCardsPreviewOpen ? styles.previewOpen : ''}`}>
            <div>
              {/* Stats — collapses away while the drawer pushes this column
                  down to 470px, since the 4-up grid has no room there. */}
              <div className={`${styles.statsWrap} ${isCardsPreviewOpen ? styles.collapsed : ''}`}>
                <div className={styles.statsWrapInner}>
                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <span className={`${styles.statIcon} ${styles.b1}`}>
                        <Icon name="Users" size={20} />
                      </span>
                      <div>
                        <div className={styles.statN}>{purchasedProfiles?.length}</div>
                        <div className={styles.statL}>Profiles unlocked</div>
                      </div>
                    </div>

                    <div className={styles.stat}>
                      <span className={`${styles.statIcon} ${styles.b2}`}>
                        <Icon name="UserCheck" size={20} />
                      </span>
                      <div>
                        <div className={styles.statN}>
                          {purchasedProfiles?.filter(p => p?.recruitmentStatus === 'hired')?.length}
                        </div>
                        <div className={styles.statL}>Hired</div>
                      </div>
                    </div>

                    <div className={styles.stat}>
                      <span className={`${styles.statIcon} ${styles.b3}`}>
                        <Icon name="MessageCircle" size={20} />
                      </span>
                      <div>
                        <div className={styles.statN}>
                          {purchasedProfiles?.filter(p => ['contacted', 'interviewed']?.includes(p?.recruitmentStatus))?.length}
                        </div>
                        <div className={styles.statL}>In progress</div>
                      </div>
                    </div>

                    <div className={styles.stat}>
                      <span className={`${styles.statIcon} ${styles.b4}`}>
                        <Icon name="Coins" size={20} />
                      </span>
                      <div>
                        <div className={styles.statN}>
                          {purchasedProfiles?.reduce((sum, p) => sum + p?.creditsCost, 0)}
                        </div>
                        <div className={styles.statL}>Credits spent</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toolbar — search breaks onto its own row above the status
                  filter/view toggle once the drawer squeezes this column
                  down to 470px, so nothing gets cramped side by side. */}
              <div className={`${styles.toolbar} ${isCardsPreviewOpen ? styles.previewOpen : ''}`}>
                <div className={styles.search}>
                  <Icon name="Search" size={17} />
                  <input
                    type="search"
                    placeholder="Search by name, position, company, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e?.target?.value)}
                  />
                </div>
                <Select value={statusFilter} onChange={setStatusFilter} placeholder="All statuses" options={statusOptions} />
                <div className={styles.viewtoggle}>
                  <button
                    className={`${styles.viewtoggleBtn} ${viewMode === 'cards' ? styles.on : ''}`}
                    onClick={() => setViewMode('cards')}
                    aria-label="Cards"
                  >
                    <Icon name="Grid3X3" size={17} />
                  </button>
                  <button
                    className={`${styles.viewtoggleBtn} ${viewMode === 'table' ? styles.on : ''}`}
                    onClick={() => setViewMode('table')}
                    aria-label="Table"
                  >
                    <Icon name="List" size={17} />
                  </button>
                </div>
              </div>

              {/* Content */}
              {viewMode === 'cards' ? (
                <div className={`${styles.cgrid} ${isCardsPreviewOpen ? styles.previewOpen : ''}`}>
                  {filteredProfiles?.map((profile) => (
                    <PurchasedProfileCard
                      key={profile?.id}
                      ref={(el) => { cardRefs.current[profile?.id] = el; }}
                      profile={profile}
                      isActive={previewId === profile?.id}
                      onStatusChange={handleStatusChange}
                      onContactCopy={handleContactCopy}
                      onCvDownload={handleCvDownload}
                      onViewDetails={handleViewDetails}
                      onUpdateNotes={handleUpdateNotes}
                    />
                  ))}
                </div>
              ) : (
                <PurchasedProfilesTable
                  profiles={filteredProfiles}
                  onStatusChange={handleStatusChange}
                  onContactCopy={handleContactCopy}
                  onCvDownload={handleCvDownload}
                  onViewDetails={handleViewDetails}
                  onUpdateNotes={handleUpdateNotes}
                  activePreviewId={previewId}
                />
              )}

              {/* Empty State */}
              {!loading && filteredProfiles?.length === 0 && (
                <div className={styles.emptyState}>
                  <Icon name="Search" size={48} />
                  <h3>{searchTerm || statusFilter ? 'No results' : 'No unlocked profiles'}</h3>
                  <p>
                    {searchTerm || statusFilter
                      ? 'Try different search criteria' : 'Unlocked profiles will appear here after purchase'
                    }
                  </p>
                  {!searchTerm && !statusFilter && (
                    <button className={styles.textBtn} onClick={() => window.location.href = '/candidate-search-dashboard'}>
                      <Icon name="Search" size={14} />Search candidates
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Purchase History Sidebar */}
            <PurchaseHistorySidebar
              purchaseHistory={purchaseHistory}
              creditAnalytics={creditAnalytics}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>
        </main>

        {/* CV preview drawer — enters from the left (mirror of the search
            dashboard's right-hand drawer) since results sit to its right
            here. Every profile is already purchased, so it always renders
            fully unlocked (no anonymity banner) with send-mail/print actions
            instead of bookmark/unlock. */}
        <CandidatePreviewDrawer
          candidates={filteredProfiles}
          activeId={previewId}
          onClose={handleClosePreview}
          purchasedCandidates={filteredProfiles?.map((p) => p?.id)}
          onPrint={handleCvPrint}
          side="left"
          variant="purchased"
          pushBreakpoint={1320}
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
