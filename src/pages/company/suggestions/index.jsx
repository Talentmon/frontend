import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from 'components/ui/Header';
import Icon from 'components/AppIcon';
import { relativeTime } from 'utils/formatDate';
import {
  AREAS,
  AREA_BY_VALUE,
  CLOSED_STATUSES,
  MAX_LENGTH,
  MIN_LENGTH,
  STATUSES,
  createSuggestion,
  deleteSuggestion,
  errorMessage,
  listSuggestions,
  updateSuggestion,
  voteSuggestion,
} from './suggestionsApi';
import styles from './styles/suggestions.module.scss';

// "Your suggestions" in the profile menu: companies post ideas for the app,
// anonymously, and vote on each other's (one vote per company). The Talentmon
// team answers from the admin panel with a status and an optional reply.

const VIEWS = [
  { id: 'all', label: 'All ideas', icon: 'Lightbulb', match: () => true },
  { id: 'open', label: 'Open', icon: 'Hourglass', match: (s) => s.status === 'NEW' || s.status === 'UNDER_REVIEW' },
  { id: 'planned', label: 'Planned', icon: 'CalendarCheck', match: (s) => s.status === 'PLANNED' },
  { id: 'progress', label: 'In progress', icon: 'Hammer', match: (s) => s.status === 'IN_PROGRESS' },
  { id: 'shipped', label: 'Shipped', icon: 'Rocket', match: (s) => s.status === 'SHIPPED' },
];

const SORTS = [
  { id: 'top', label: 'Top' },
  { id: 'new', label: 'Newest' },
];

const score = (s) => s.likes - s.dislikes;
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const byTop = (a, b) => score(b) - score(a) || b.likes - a.likes || byNewest(a, b);

// ----- Building blocks -----

// One icon per area, used by the chips, the Areas list and the suggestion rows.
const AREA_PATHS = {
  SEARCH: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>,
  BOOKMARKS: <path d="M6 4h12v17l-6-4-6 4z" />,
  PURCHASED: <><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  CREDITS: (
    <>
      <ellipse cx="9" cy="8" rx="5.5" ry="3" />
      <path d="M3.5 8v4c0 1.7 2.5 3 5.5 3" />
      <ellipse cx="15" cy="14" rx="5.5" ry="3" />
      <path d="M9.5 14v3c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-3" />
    </>
  ),
  TEAM: <><circle cx="9" cy="9" r="3.5" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 5.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.5-4-5.2" /></>,
  PROFILE: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4" /></>,
  OTHER: <><circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" /></>,
};

const AreaIcon = ({ area, size = 14, strokeWidth = 2 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {AREA_PATHS[area] || AREA_PATHS.OTHER}
  </svg>
);

// `allowDeselect`: clicking the picked chip again clears it (the composer
// starts with no area picked; an edit always keeps one).
const AreaPicker = ({ value, onChange, disabled, allowDeselect = false }) => (
  <div className={styles.areaPicker}>
    {AREAS.map((area) => {
      const on = value === area.value;
      return (
        <button
          key={area.value}
          type="button"
          aria-pressed={on}
          disabled={disabled}
          className={styles.areaChip}
          onClick={() => onChange(on && allowDeselect ? null : area.value)}
        >
          <AreaIcon area={area.value} />
          {area.label}
        </button>
      );
    })}
  </div>
);

const Counter = ({ length }) => (
  <span className={`${styles.counter} ${length > MAX_LENGTH ? styles.counterOver : ''}`}>
    {length}/{MAX_LENGTH}
  </span>
);

const StatusBadge = ({ status }) => {
  const meta = STATUSES[status] || STATUSES.NEW;
  return <span className={`${styles.status} ${styles[meta.tone]}`}>{meta.label}</span>;
};

// Status legend in the side column: the five steps an idea moves through,
// joined by a line, then "or" and Declined.
const svgProps = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };
const LEGEND_ICONS = {
  NEW: (
    <svg {...svgProps} strokeWidth="2.1"><path d="M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M4 13h4l1.5 2h5L16 13h4" /></svg>
  ),
  UNDER_REVIEW: (
    <svg {...svgProps} strokeWidth="2.2"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></svg>
  ),
  PLANNED: (
    <svg {...svgProps} strokeWidth="2.1"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>
  ),
  IN_PROGRESS: (
    <svg {...svgProps} strokeWidth="2.2"><path d="M20 12a8 8 0 1 1-3-6.2" /><path d="M20 4v4.5h-4.5" /></svg>
  ),
  SHIPPED: (
    <svg {...svgProps} strokeWidth="2.6"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  ),
  DECLINED: (
    <svg {...svgProps} width={14} height={14} strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
  ),
};
const LEGEND_FLOW = ['NEW', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED'];

const LegendStep = ({ status, as: Tag = 'li' }) => {
  const meta = STATUSES[status];
  return (
    <Tag className={`${styles.legendStep} ${styles[`lg${meta.tone.slice(2)}`]}`}>
      <span className={styles.legendDot} aria-hidden="true">{LEGEND_ICONS[status]}</span>
      <div className={styles.legendText}>
        <p className={styles.legendName}>{meta.label}</p>
        <p className={styles.legendDesc}>{meta.text}</p>
      </div>
    </Tag>
  );
};

const StatusLegend = () => (
  <section className={`${styles.sideCard} ${styles.legend}`} aria-labelledby="legend-title">
    <h2 id="legend-title" className={styles.legendTitle}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 8h.01" />
      </svg>
      What each status means
    </h2>
    <p className={styles.legendSub}>How an idea moves from your post to the product.</p>
    <ol className={styles.legendFlow}>
      {LEGEND_FLOW.map((status) => <LegendStep key={status} status={status} />)}
    </ol>
    <div role="separator" aria-hidden="true" className={styles.legendOr}>
      <span />
      or
      <span />
    </div>
    <LegendStep status="DECLINED" as="div" />
  </section>
);

const VoteButtons = ({ suggestion, busy, onVote }) => {
  const closed = CLOSED_STATUSES.includes(suggestion.status);
  const locked = suggestion.mine || closed;
  const why = suggestion.mine ? "You can't vote on your own suggestion" : closed ? 'Voting is closed' : null;
  const button = (value, icon, count, label) => {
    const on = suggestion.myVote === value;
    return (
      <button
        type="button"
        className={`${styles.vote} ${value > 0 ? styles.voteUp : styles.voteDown} ${on ? styles.voteOn : ''}`}
        disabled={locked || busy}
        aria-pressed={on}
        aria-label={`${label} (${count})`}
        title={why || (on ? 'Take your vote back' : label)}
        onClick={() => onVote(suggestion, on ? 0 : value)}
      >
        <Icon name={icon} size={17} />
        <span>{count}</span>
      </button>
    );
  };
  return (
    <div className={styles.votes}>
      {button(1, 'ThumbsUp', suggestion.likes, 'I need this too')}
      {button(-1, 'ThumbsDown', suggestion.dislikes, "I don't need this")}
    </div>
  );
};

const SuggestionCard = ({ suggestion, highlighted, voting, onVote, onSaved, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [text, setText] = useState(suggestion.text);
  const [area, setArea] = useState(suggestion.area);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const areaLabel = (AREA_BY_VALUE[suggestion.area] || AREA_BY_VALUE.OTHER).label;

  const startEdit = () => {
    setText(suggestion.text);
    setArea(suggestion.area);
    setError('');
    setConfirmDelete(false);
    setEditing(true);
  };

  const save = async () => {
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH) {
      setError(`A suggestion needs at least ${MIN_LENGTH} characters.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      onSaved(await updateSuggestion(suggestion.id, { text: trimmed, area }));
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not save your changes — please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await deleteSuggestion(suggestion.id);
      onDeleted(suggestion.id);
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the suggestion — please try again.'));
      setBusy(false);
    }
  };

  return (
    <article id={`s-${suggestion.id}`} className={`${styles.item} ${highlighted ? styles.itemFlash : ''} ${suggestion.mine ? styles.itemMine : ''}`}>
      <VoteButtons suggestion={suggestion} busy={voting} onVote={onVote} />

      <div className={styles.itemBody}>
        <div className={styles.itemTop}>
          <span className={styles.areaTag}>
            <AreaIcon area={suggestion.area} size={13} strokeWidth={2.1} />
            {areaLabel}
          </span>
          <span className={styles.areaDot} aria-hidden="true" />
          <StatusBadge status={suggestion.status} />
          {suggestion.mine && (
            <span className={styles.yours} title="Only your company sees this — other companies don't know who wrote it">
              <Icon name="UserRound" size={12} />
              Yours
            </span>
          )}
          <span className={styles.itemTime}>
            {relativeTime(suggestion.createdAt)}
            {suggestion.editedAt && ' · edited'}
          </span>
        </div>

        {editing ? (
          <div className={styles.editBox}>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={MAX_LENGTH}
              disabled={busy}
              autoFocus
            />
            <AreaPicker value={area} onChange={setArea} disabled={busy} />
            <div className={styles.editFoot}>
              <Counter length={text.length} />
              <div className={styles.editBtns}>
                <button type="button" className={styles.btnGhost} onClick={() => setEditing(false)} disabled={busy}>
                  Cancel
                </button>
                <button type="button" className={styles.btnGold} onClick={save} disabled={busy}>
                  <Icon name="Check" size={15} />
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className={styles.itemText}>{suggestion.text}</p>
        )}

        {suggestion.canEdit && !editing && !confirmDelete && (
          <div className={styles.itemActions}>
            <button type="button" onClick={startEdit}>
              <Icon name="Pencil" size={14} />
              Edit
            </button>
            <button
              type="button"
              className={styles.itemDelete}
              onClick={() => { setConfirmDelete(true); setError(''); }}
            >
              <Icon name="Trash2" size={14} />
              Delete
            </button>
          </div>
        )}
        {suggestion.mine && !suggestion.canEdit && (
          <div className={styles.itemLocked}>
            <Icon name="Lock" size={12} />
            Picked up by our team, so it can no longer be changed
          </div>
        )}

        {suggestion.teamReply && (
          <div className={styles.reply}>
            <span className={styles.replyMark}>
              <img src="/assets/images/talentmon.png" alt="" />
            </span>
            <div>
              <div className={styles.replyHead}>
                <b>Talentmon team</b>
                {suggestion.teamRepliedAt && <span>{relativeTime(suggestion.teamRepliedAt)}</span>}
              </div>
              <p>{suggestion.teamReply}</p>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className={styles.confirm}>
            <span>Delete this suggestion? Its votes go with it.</span>
            <div className={styles.editBtns}>
              <button type="button" className={styles.btnGhost} onClick={() => setConfirmDelete(false)} disabled={busy}>
                Keep it
              </button>
              <button type="button" className={styles.btnDanger} onClick={remove} disabled={busy}>
                <Icon name="Trash2" size={14} />
                Delete
              </button>
            </div>
          </div>
        )}

        {error && <div className={styles.itemError}>{error}</div>}
      </div>
    </article>
  );
};

// ----- Page -----

const Suggestions = () => {
  const location = useLocation();
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState('all');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [onlyMine, setOnlyMine] = useState(false);
  const [sort, setSort] = useState('top');
  const [highlightId, setHighlightId] = useState(null);
  const [votingId, setVotingId] = useState(null);
  const [listError, setListError] = useState('');

  // Composer
  const [text, setText] = useState('');
  const [area, setArea] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [posted, setPosted] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    document.title = 'Your suggestions · Talentmon';
  }, []);

  useEffect(() => {
    listSuggestions()
      .then(setItems)
      .catch(() => setLoadError('Could not load suggestions — please refresh the page.'));
  }, []);

  // Deep links from the bell: /suggestions#s-<id>. Clear the filters so the
  // suggestion is on screen, scroll to it and flash it.
  useEffect(() => {
    const hash = location.hash?.slice(1);
    if (!hash?.startsWith('s-') || !items) return undefined;
    const id = hash.slice(2);
    if (!items.some((s) => s.id === id)) return undefined;
    setView('all');
    setAreaFilter('ALL');
    setOnlyMine(false);
    setHighlightId(id);
    const scroll = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    const unflash = setTimeout(() => setHighlightId(null), 2600);
    return () => { clearTimeout(scroll); clearTimeout(unflash); };
  }, [location.hash, items]);

  const counts = useMemo(() => {
    const list = items || [];
    const byView = Object.fromEntries(VIEWS.map((v) => [v.id, list.filter(v.match).length]));
    const byArea = Object.fromEntries(AREAS.map((a) => [a.value, list.filter((s) => s.area === a.value).length]));
    return { byView, byArea, total: list.length, mine: list.filter((s) => s.mine).length };
  }, [items]);

  const visible = useMemo(() => {
    const match = VIEWS.find((v) => v.id === view)?.match || (() => true);
    return (items || [])
      .filter(match)
      .filter((s) => areaFilter === 'ALL' || s.area === areaFilter)
      .filter((s) => !onlyMine || s.mine)
      .sort(sort === 'top' ? byTop : byNewest);
  }, [items, view, areaFilter, onlyMine, sort]);

  const trimmedLength = text.trim().length;
  const tooLong = text.length > MAX_LENGTH;
  const canPost = trimmedLength >= MIN_LENGTH && !!area && !tooLong && !posting;
  // What's still missing, shown beside the button once something is typed.
  let hint = '';
  if (trimmedLength && !canPost && !posting) {
    if (!area) hint = 'Pick an area to post';
    else if (trimmedLength < MIN_LENGTH) hint = 'Add a few more words';
    else if (tooLong) hint = 'Too long, shorten it a little';
  }
  const countTone = tooLong ? styles.taCountOver : text.length > MAX_LENGTH * 0.9 ? styles.taCountNear : '';

  const post = async () => {
    if (!canPost) return;
    setPosting(true);
    setPostError('');
    setPosted(false);
    try {
      const created = await createSuggestion({ text: text.trim(), area });
      setItems((prev) => [created, ...(prev || [])]);
      setText('');
      setArea(null);
      setPosted(true);
      // Show it where it lands: newest first, nothing filtered away.
      setView('all');
      setAreaFilter('ALL');
      setOnlyMine(false);
      setSort('new');
      setHighlightId(created.id);
      setTimeout(() => setHighlightId(null), 2600);
      setTimeout(() => setPosted(false), 3200);
    } catch (err) {
      setPostError(errorMessage(err, 'Could not post your suggestion — please try again.'));
    } finally {
      setPosting(false);
    }
  };

  const vote = async (suggestion, value) => {
    const before = items;
    const delta = (v) => ({ likes: v === 1 ? 1 : 0, dislikes: v === -1 ? 1 : 0 });
    const prev = delta(suggestion.myVote);
    const next = delta(value);
    setVotingId(suggestion.id);
    setListError('');
    setItems((list) => list.map((s) => (s.id === suggestion.id
      ? { ...s, myVote: value, likes: s.likes - prev.likes + next.likes, dislikes: s.dislikes - prev.dislikes + next.dislikes }
      : s)));
    try {
      const result = await voteSuggestion(suggestion.id, value);
      setItems((list) => list.map((s) => (s.id === result.id ? { ...s, ...result } : s)));
    } catch (err) {
      setItems(before);
      setListError(errorMessage(err, 'Could not save your vote — please try again.'));
    } finally {
      setVotingId(null);
    }
  };

  const replaceItem = (updated) => setItems((list) => list.map((s) => (s.id === updated.id ? updated : s)));
  const removeItem = (id) => setItems((list) => list.filter((s) => s.id !== id));

  const areaLabel = areaFilter === 'ALL' ? null : AREA_BY_VALUE[areaFilter]?.label;
  const viewLabel = VIEWS.find((v) => v.id === view)?.label;
  const filtered = view !== 'all' || areaFilter !== 'ALL' || onlyMine;

  return (
    <div className={styles.page}>
      <Header />
      <main className="pt-16 max-w-[1180px] mx-auto px-[22px]" style={{ paddingBottom: '80px' }}>
        {/* ===== Hero ===== */}
        <section className={styles.hero}>
          <span className={styles.heroEyebrow}>
            <Icon name="Lightbulb" size={14} />
            Your suggestions
          </span>
          <h1>Help shape Talentmon</h1>
          <p className={styles.heroLead}>
            Tell us what would make Talentmon work better for <em>your</em> hiring.
          </p>
          <p className={styles.heroText}>
            Every company can read the ideas posted here and vote on them. The ones most companies need move up our
            list, and our team marks each one as planned, in progress or shipped.
          </p>

          <div className={styles.pillars}>
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}><Icon name="EyeOff" size={20} /></span>
              <b>Anonymous</b>
              <span>Other companies never see who wrote a suggestion.</span>
            </div>
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}><Icon name="ThumbsUp" size={20} /></span>
              <b>One company, one vote</b>
              <span>Thumbs up what you need too, thumbs down what you don&apos;t.</span>
            </div>
            <div className={styles.pillar}>
              <span className={styles.pillarIcon}><Icon name="MessageSquareReply" size={20} /></span>
              <b>We answer</b>
              <span>Each idea gets a status from our team, often with a short reply.</span>
            </div>
          </div>
        </section>

        {/* ===== Status views (also the filter) ===== */}
        <nav className={styles.views} aria-label="Filter by status">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              className={`${styles.viewBtn} ${view === v.id ? styles.viewOn : ''}`}
              onClick={() => setView(v.id)}
            >
              <span className={styles.viewIcon}><Icon name={v.icon} size={18} /></span>
              <span className={styles.viewText}>
                <b>{items ? counts.byView[v.id] : '–'}</b>
                <span>{v.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className={styles.layout}>
          {/* ===== Areas + status guide ===== */}
          <aside className={styles.side}>
            <div className={styles.sideCard}>
              <div className={styles.sideTitle}>Areas</div>
              <ul className={styles.areaList}>
                <li>
                  <button
                    type="button"
                    className={areaFilter === 'ALL' ? styles.areaOn : ''}
                    onClick={() => setAreaFilter('ALL')}
                  >
                    <span className={styles.areaIcon}><Icon name="LayoutGrid" size={14} /></span>
                    <span className={styles.areaName}>All areas</span>
                    <span className={styles.areaCount}>{counts.total}</span>
                  </button>
                </li>
                {AREAS.map((a) => (
                  <li key={a.value}>
                    <button
                      type="button"
                      className={areaFilter === a.value ? styles.areaOn : ''}
                      onClick={() => setAreaFilter(a.value)}
                    >
                      <span className={styles.areaIcon}><AreaIcon area={a.value} /></span>
                      <span className={styles.areaName}>{a.label}</span>
                      <span className={styles.areaCount}>{counts.byArea[a.value] || 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <StatusLegend />
          </aside>

          <div className={styles.content}>
            {/* ===== Composer ===== */}
            <section className={styles.composer} aria-labelledby="composer-title">
              <div className={styles.composerHead}>
                <span className={styles.composerIcon} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18h6" /><path d="M10 21h4" />
                    <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
                  </svg>
                </span>
                <div>
                  <h2 id="composer-title" className={styles.composerTitle}>Share a suggestion</h2>
                  <p className={styles.composerSub}>What would make Talentmon work better for your hiring?</p>
                </div>
              </div>

              <div className={styles.composerBody}>
                <div className={styles.taWrap}>
                  <label htmlFor="idea-text" className={styles.srOnly}>Your suggestion</label>
                  <textarea
                    id="idea-text"
                    ref={textRef}
                    className={styles.taField}
                    value={text}
                    onChange={(e) => { setText(e.target.value); if (postError) setPostError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); post(); } }}
                    rows={4}
                    placeholder="e.g. Let me save a search and get a notification when a new candidate matches it."
                    disabled={posting}
                  />
                  <span aria-live="polite" className={`${styles.taCount} ${countTone}`}>
                    {text.length} / {MAX_LENGTH}
                  </span>
                </div>

                <div role="group" aria-labelledby="area-label" className={styles.areaGroup}>
                  <span id="area-label" className={styles.areaQuestion}>Which part of Talentmon is it about?</span>
                  <AreaPicker value={area} onChange={setArea} disabled={posting} allowDeselect />
                </div>
              </div>

              <div className={styles.composerFoot}>
                <p className={styles.anon}>
                  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  Posted anonymously. Other companies won&rsquo;t see who wrote it.
                </p>
                {postError && <span role="alert" className={styles.footError}>{postError}</span>}
                {!postError && hint && <span className={styles.footHint}>{hint}</span>}
                {posted && (
                  <span role="status" className={styles.footOk}>
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    Thanks, it&rsquo;s posted
                  </span>
                )}
                <button type="button" className={styles.postBtn} onClick={post} disabled={!canPost} title="Ctrl + Enter">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 3L10 14" /><path d="M21 3l-7 18-4-7-7-4z" />
                  </svg>
                  {posting ? 'Posting…' : 'Post suggestion'}
                </button>
              </div>
            </section>

            {/* ===== List ===== */}
            <section className={styles.listCard} aria-labelledby="list-title">
              <div className={styles.listHead}>
                <div className={styles.listTitleWrap}>
                  <h2 id="list-title" className={styles.cardTitle}>
                    {viewLabel}
                    {areaLabel && <span className={styles.listScope}> · {areaLabel}</span>}
                  </h2>
                  <p className={styles.cardSub}>
                    {items ? `${visible.length} ${visible.length === 1 ? 'suggestion' : 'suggestions'}` : 'Loading…'}
                    {filtered && (
                      <button
                        type="button"
                        className={styles.clearLink}
                        onClick={() => { setView('all'); setAreaFilter('ALL'); setOnlyMine(false); }}
                      >
                        Clear filters
                      </button>
                    )}
                  </p>
                </div>
                <div className={styles.listTools}>
                  <div className={styles.segment} role="group" aria-label="Show">
                    <button
                      type="button"
                      aria-pressed={!onlyMine}
                      className={!onlyMine ? styles.segmentOn : ''}
                      onClick={() => setOnlyMine(false)}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      aria-pressed={onlyMine}
                      className={onlyMine ? styles.segmentOn : ''}
                      onClick={() => setOnlyMine(true)}
                    >
                      Yours
                      <span className={styles.mineCount}>{counts.mine}</span>
                    </button>
                  </div>
                  <div className={styles.segment} role="group" aria-label="Sort">
                    {SORTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={sort === s.id}
                        className={sort === s.id ? styles.segmentOn : ''}
                        onClick={() => setSort(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {listError && <div className={styles.formError}>{listError}</div>}
              {loadError && <div className={styles.formError}>{loadError}</div>}

              {items && visible.length === 0 && (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}><Icon name="Lightbulb" size={26} /></span>
                  {counts.total === 0 || (onlyMine && counts.mine === 0) ? (
                    <>
                      <b>{counts.total === 0 ? 'No suggestions yet' : 'Nothing from you yet'}</b>
                      <span>
                        {counts.total === 0
                          ? 'Be the first to tell us what you need.'
                          : "You haven't posted any suggestions yet."}
                      </span>
                      <button type="button" className={styles.btnGhost} onClick={() => textRef.current?.focus()}>
                        Write a suggestion
                      </button>
                    </>
                  ) : (
                    <>
                      <b>Nothing here</b>
                      <span>No suggestions match these filters.</span>
                    </>
                  )}
                </div>
              )}

              <div className={styles.items}>
                {visible.map((s) => (
                  <SuggestionCard
                    key={`${s.id}-${s.editedAt || ''}`}
                    suggestion={s}
                    highlighted={highlightId === s.id}
                    voting={votingId === s.id}
                    onVote={vote}
                    onSaved={replaceItem}
                    onDeleted={removeItem}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Suggestions;
