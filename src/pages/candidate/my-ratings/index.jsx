import React, { useState, useRef, useCallback, useEffect } from 'react';
import Icon from 'components/AppIcon';
import CandidateHeader from 'components/ui/CandidateHeader';
import Select from 'components/ui/Select';
import Stars from './components/Stars';
import StarInput from './components/StarInput';
import RatingModal from './components/RatingModal';
import Toast from './components/Toast';
import { CATS, calcOverall, fmtDate } from './utils';
import {
  getRated,
  getPending,
  createReview,
  updateReview,
  deleteReview,
  ratedToFrontend,
  pendingToFrontend,
  ratingFormToPayload,
} from './ratingsApi';
import styles from './styles/myRatings.module.scss';

// Undo window for delete: matches the toast's own visible+fade duration
// (Toast.jsx: 4500ms visible + 300ms fade) - the real DELETE call is
// scheduled for after this window, not fired immediately, so "Undo" is a
// genuine cancel rather than a decorative re-insert of already-deleted data.
const DELETE_GRACE_MS = 4800;

// Small filled star for the pub-chip (Lucide Star is outline, we use a custom one)
const StarFill = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <path d="M12 2.4l2.9 6 6.5.6-4.9 4.3 1.5 6.4L12 16.9 6 20.7l1.5-6.4L2.6 9l6.5-.6z" />
  </svg>
);

const PubChip = ({ pub }) => {
  if (!pub) return null;
  return (
    <span className={styles.pubChip}>
      <StarFill />
      Company average <b>{pub.avg.toFixed(1)}</b> · {pub.count} ratings
    </span>
  );
};

// Card for a single rated company
const RatedCard = ({ rating, onEdit, onDelete }) => {
  const overall    = calcOverall(rating.cats, rating.minPay);
  const isRescaled = rating.minPay === false;

  return (
    <article className={styles.ratedCard}>
      {/* Top row: logo + info + overall rating */}
      <div className={styles.rcTop}>
        <span className={styles.logo} style={{ background: rating.color }}>
          {rating.company[0]}
        </span>
        <div className={styles.rcId}>
          <div className={styles.rcName}>{rating.company}</div>
          <div className={styles.rcMeta}>
            {[rating.industry, rating.city].filter(Boolean).join(' · ')}
            {rating.role ? ` · ${rating.role}` : ''}
          </div>
          <div className={styles.rcPubRow}>
            <PubChip pub={rating.pub} />
          </div>
        </div>
        <div className={styles.rcOverall}>
          <span className={styles.rcOverallLabel}>Your rating</span>
          <span className={styles.rcOverallScore}>{overall.toFixed(1)}</span>
          <Stars value={overall} size="md" />
        </div>
      </div>

      {/* Categories */}
      <div className={styles.rcCats}>
        {CATS.map(cat => (
          <div key={cat.key} className={styles.rcCat}>
            <span className={styles.rcCatLabel}>{cat.label}</span>
            <Stars value={rating.cats[cat.key] ?? 0} size="sm" />
          </div>
        ))}
      </div>

      {/* Minimum salary */}
      {rating.minPay !== null && (
        <div className={styles.minPayRow}>
          <span
            className={`${styles.minPayIcon} ${rating.minPay ? styles.minPayIconOk : styles.minPayIconBad}`}
            aria-hidden="true"
          >
            <Icon name={rating.minPay ? 'Check' : 'X'} size={10} />
          </span>
          <span>
            Minimum salary from profile:{' '}
            <strong>{rating.minPay ? 'honored' : 'not honored'}</strong>
          </span>
          {isRescaled && (
            <em className={styles.minPayCap}>overall rating capped at max 3.0</em>
          )}
        </div>
      )}

      {/* Comment */}
      {rating.review && (
        <div className={styles.rcReview}>{rating.review}</div>
      )}

      {/* Footer: date + recommendation + buttons */}
      <div className={styles.rcFoot}>
        <span className={styles.rcDate}>Rated {fmtDate(rating.date)}</span>

        {rating.recommend === true && (
          <span className={`${styles.rec} ${styles.recYes}`}>
            <Icon name="ThumbsUp" size={14} />
            Recommend
          </span>
        )}
        {rating.recommend === false && (
          <span className={`${styles.rec} ${styles.recNo}`}>
            <Icon name="ThumbsDown" size={14} />
            Don’t recommend
          </span>
        )}

        <div className={styles.rcActions}>
          <button
            className={styles.iconBtn}
            onClick={onEdit}
            aria-label={`Edit rating for ${rating.company}`}
            title="Edit"
          >
            <Icon name="Pencil" size={17} />
          </button>
          <button
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            onClick={onDelete}
            aria-label={`Delete rating for ${rating.company}`}
            title="Delete"
          >
            <Icon name="Trash2" size={17} />
          </button>
        </div>
      </div>
    </article>
  );
};

const MyRatingsPage = () => {
  const [rated,   setRated]   = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy,  setSortBy]  = useState('new');
  const [filterBy,setFilterBy]= useState('all');
  const [modal,   setModal]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState({ msg: '', actionLabel: '', onAction: null });
  const toastTimer = useRef(null);
  const pendingDeletesRef = useRef(new Map());

  useEffect(() => {
    Promise.all([getRated(), getPending()])
      .then(([ratedRows, pendingRows]) => {
        setRated(ratedRows.map(ratedToFrontend));
        setPending(pendingRows.map(pendingToFrontend));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = useCallback((msg, actionLabel = '', onAction = null) => {
    setToast({ msg, actionLabel, onAction });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast({ msg: '', actionLabel: '', onAction: null }),
      4800
    );
  }, []);

  const openNewRating = (company) => {
    setModal({ company, mode: 'new', ratingId: null, initialData: null });
  };

  const openEditRating = (rating) => {
    setModal({
      company: { companyId: rating.companyId, company: rating.company, industry: rating.industry, city: rating.city, color: rating.color, role: rating.role },
      mode: 'edit',
      ratingId: rating.id,
      initialData: { cats: rating.cats, minPay: rating.minPay, recommend: rating.recommend, review: rating.review },
    });
  };

  const handleModalSave = async ({ cats, minPay, recommend, review }) => {
    setSaving(true);
    try {
      if (modal.mode === 'edit') {
        const payload = ratingFormToPayload({ cats, minPay, recommend, review });
        const updated = await updateReview(modal.ratingId, payload);
        setRated(prev => prev.map(r => (r.id === modal.ratingId ? ratedToFrontend(updated) : r)));
        showToast(`Rating updated: ${modal.company.company}`);
      } else {
        // Ratings are anonymous — the company doesn't get the candidate's identity
        const payload = ratingFormToPayload({ companyId: modal.company.companyId, cats, minPay, recommend, review });
        const created = await createReview(payload);
        setPending(prev => prev.filter(p => p.id !== modal.company.id));
        setRated(prev => [ratedToFrontend(created), ...prev]);
        showToast(`Thanks! Your rating for ${modal.company.company} has been saved.`);
      }
      setModal(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save rating — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (ratingId, companyName) => {
    const idx     = rated.findIndex(r => r.id === ratingId);
    if (idx === -1) return;
    const removed = rated[idx];
    setRated(prev => prev.filter(r => r.id !== ratingId));

    // The actual delete is scheduled, not fired immediately, so "Undo" can
    // still cancel it for real within the grace window.
    const timer = setTimeout(() => {
      pendingDeletesRef.current.delete(ratingId);
      deleteReview(ratingId).catch(() => {
        setRated(prev => (prev.some(r => r.id === ratingId) ? prev : [...prev, removed]));
        showToast('Could not delete rating — please try again.');
      });
    }, DELETE_GRACE_MS);
    pendingDeletesRef.current.set(ratingId, timer);

    showToast(`Rating deleted: ${companyName}`, 'Undo', () => {
      clearTimeout(pendingDeletesRef.current.get(ratingId));
      pendingDeletesRef.current.delete(ratingId);
      setRated(prev => {
        const next = [...prev];
        next.splice(Math.min(idx, next.length), 0, removed);
        return next;
      });
    });
  };

  // Stats
  const avgRating = rated.length
    ? Math.round(
        rated.reduce((a, r) => a + calcOverall(r.cats, r.minPay), 0) / rated.length * 10
      ) / 10
    : 0;

  // Filtered and sorted ratings
  const displayedRated = (() => {
    let list = rated.slice();
    if (filterBy === 'rec')   list = list.filter(r => r.recommend === true);
    if (filterBy === 'norec') list = list.filter(r => r.recommend === false);
    list.sort((a, b) => {
      if (sortBy === 'new')  return b.date.localeCompare(a.date);
      if (sortBy === 'old')  return a.date.localeCompare(b.date);
      const oa = calcOverall(a.cats, a.minPay);
      const ob = calcOverall(b.cats, b.minPay);
      return sortBy === 'high' ? ob - oa : oa - ob;
    });
    return list;
  })();

  return (
    <div className={styles.page}>
      <CandidateHeader />

      <main className={styles.main}>
        <div className={styles.inner}>

          {/* Title */}
          <div className={styles.pageHead}>
            <h1 className={styles.pageTitle}>My Ratings</h1>
            <p className={styles.pageSub}>
              Companies you've rated after completing their process. Ratings help other candidates.
            </p>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNum}>{rated.length}</div>
              <div className={styles.statLabel}>Companies rated</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>
                {avgRating || '—'}
                {avgRating > 0 && <span className={styles.statNumSmall}>/ 5</span>}
              </div>
              <div className={styles.statLabel}>Average rating given</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>{pending.length}</div>
              <div className={styles.statLabel}>Awaiting your rating</div>
            </div>
          </div>

          {/* Info note */}
          <div className={styles.note} role="note">
            <span className={styles.noteIcon} aria-hidden="true">
              <Icon name="Lock" size={18} />
            </span>
            <span>
              You can rate a company only <b>after it unlocks you</b> and once the{' '}
              <b>hiring process is completed</b>. Your ratings are <b>anonymous</b> — the
              company can't see who rated them.
            </span>
          </div>

          {/* Section: To rate */}
          {pending.length > 0 && (
            <section aria-labelledby="sec-pending">
              <div className={styles.secHead}>
                <h2 id="sec-pending" className={styles.secTitle}>To rate</h2>
                <span className={styles.secCount}>
                  {pending.length} {pending.length === 1 ? 'company' : 'companies'}
                </span>
              </div>
              <div className={styles.pendingList}>
                {pending.map(company => (
                  <div key={company.id} className={styles.pendingCard}>
                    <span className={styles.logo} style={{ background: company.color }}>
                      {company.company[0]}
                    </span>
                    <div className={styles.pendingMain}>
                      <div className={styles.pendingName}>{company.company}</div>
                      <div className={styles.pendingMeta}>
                        {[company.industry, company.city].filter(Boolean).join(' · ')}
                        {company.role ? ` · position: ${company.role}` : ''}
                      </div>
                      <div className={styles.pendingBottom}>
                        <PubChip pub={company.pub} />
                      </div>
                    </div>
                    <span className={`${styles.chip} ${styles.chipGreen}`}>
                      <Icon name="CheckCircle2" size={13} />
                      Process completed
                    </span>
                    <button
                      className={`${styles.btnGold} ${styles.btnSm}`}
                      onClick={() => openNewRating(company)}
                      aria-label={`Rate ${company.company}`}
                    >
                      <Icon name="Star" size={15} />
                      Rate
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Rated companies */}
          <section aria-labelledby="sec-rated">
            <div className={styles.secHead}>
              <h2 id="sec-rated" className={styles.secTitle}>Rated companies</h2>
              {rated.length > 0 && (
                <span className={styles.secCount}>
                  {rated.length} {rated.length === 1 ? 'company' : 'companies'}
                </span>
              )}

              {/* Toolbar — sort + filter */}
              {rated.length > 0 && (
                <div className={styles.secTools}>
                  <label className={styles.toolLabel}>
                    Sort
                    <Select
                      value={sortBy}
                      onChange={setSortBy}
                      aria-label="Sort ratings"
                      options={[
                        { value: 'new', label: 'Newest' },
                        { value: 'old', label: 'Oldest' },
                        { value: 'high', label: 'Highest rated' },
                        { value: 'low', label: 'Lowest rated' },
                      ]}
                    />
                  </label>
                  <label className={styles.toolLabel}>
                    Show
                    <Select
                      value={filterBy}
                      onChange={setFilterBy}
                      aria-label="Filter ratings"
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 'rec', label: 'Recommended' },
                        { value: 'norec', label: 'Not recommended' },
                      ]}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className={styles.ratedList}>
              {loading ? null : rated.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>
                    <Icon name="Star" size={28} />
                  </div>
                  <h3 className={styles.emptyTitle}>No ratings yet</h3>
                  <p className={styles.emptyText}>
                    Once you complete a process with a company that unlocked you, you'll be able to rate it here.
                  </p>
                </div>
              ) : displayedRated.length === 0 ? (
                <div className={styles.empty}>
                  <h3 className={styles.emptyTitle}>No results for this filter</h3>
                  <p className={styles.emptyText}>Change the filter to see other ratings.</p>
                  <button className={styles.btnGhost} onClick={() => setFilterBy('all')}>
                    Show all
                  </button>
                </div>
              ) : (
                displayedRated.map(rating => (
                  <RatedCard
                    key={rating.id}
                    rating={rating}
                    onEdit={() => openEditRating(rating)}
                    onDelete={() => handleDelete(rating.id, rating.company)}
                  />
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Rating / edit modal */}
      {modal && (
        <RatingModal
          company={modal.company}
          mode={modal.mode}
          initialData={modal.initialData}
          onSave={handleModalSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Toast with undo option */}
      <Toast
        msg={toast.msg}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
        onDismiss={() => setToast({ msg: '', actionLabel: '', onAction: null })}
      />
    </div>
  );
};

export default MyRatingsPage;
