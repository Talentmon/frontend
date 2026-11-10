import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import AdminAppBar from '../components/AdminAppBar';
import {
  getMe,
  getSuggestions,
  updateSuggestionAdmin,
  deleteSuggestionAdmin,
  companyVisual,
  shortDate,
} from '../adminApi';
import { AREA_BY_VALUE, STATUSES } from '../../company/suggestions/suggestionsApi';
import '../styles.scss';
import '../companies/companies.scss';
import './suggestions.scss';

const STATUS_OPTIONS = Object.entries(STATUSES).map(([value, meta]) => ({ value, label: meta.label }));
const REPLY_MAX = 1000;

const score = (s) => s.likes - s.dislikes;

const errorText = (err, fallback) => {
  const message = err?.response?.data?.message;
  return (Array.isArray(message) ? message[0] : message) || fallback;
};

const SuggestionAdminCard = ({ suggestion, onChanged, onDeleted }) => {
  const [status, setStatus] = useState(suggestion.status);
  const [reply, setReply] = useState(suggestion.teamReply || '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const visual = companyVisual(suggestion.company.id, suggestion.company.name);
  const area = AREA_BY_VALUE[suggestion.area];
  // Back in step with the saved row after a save.
  useEffect(() => {
    setStatus(suggestion.status);
    setReply(suggestion.teamReply || '');
  }, [suggestion.status, suggestion.teamReply]);

  const dirty = status !== suggestion.status || reply.trim() !== (suggestion.teamReply || '');

  const run = async (action, okText) => {
    setBusy(true);
    setNote(null);
    try {
      await action();
      if (okText) setNote({ kind: 'ok', text: okText });
    } catch (err) {
      setNote({ kind: 'err', text: errorText(err, 'Could not save — please try again.') });
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const dto = {};
    if (status !== suggestion.status) dto.status = status;
    if (reply.trim() !== (suggestion.teamReply || '')) dto.teamReply = reply.trim() || null;
    // Mirrors SuggestionsService.adminUpdate: a new status (not New) or a new reply notifies the author.
    const notifies = !suggestion.hidden && ((dto.status && dto.status !== 'NEW') || !!dto.teamReply);
    return run(async () => {
      const updated = await updateSuggestionAdmin(suggestion.id, dto);
      onChanged({ ...suggestion, ...updated });
    }, notifies ? 'Saved — the company has been notified.' : 'Saved.');
  };

  const toggleHidden = () =>
    run(async () => {
      const updated = await updateSuggestionAdmin(suggestion.id, { hidden: !suggestion.hidden });
      onChanged({ ...suggestion, ...updated });
    });

  const remove = () => {
    if (!window.confirm('Delete this suggestion for good? Its votes go with it. To only take it off the companies’ page, hide it instead.')) return;
    run(async () => {
      await deleteSuggestionAdmin(suggestion.id);
      onDeleted(suggestion.id);
    });
  };

  return (
    <div className={`card sg-card${suggestion.hidden ? ' sg-hidden' : ''}`}>
      <div className="sg-head">
        <div className="co-cell">
          <span className="co-logo" style={{ background: visual.color }}>{visual.initial}</span>
          <div>
            <b>{suggestion.company.name}</b>
            {suggestion.company.deletedAt && <span className="pill deleted" style={{ marginLeft: 6 }}>Deleted</span>}
            <span className="co-sub">{suggestion.company.email}</span>
          </div>
        </div>
        <div className="sg-meta">
          <span className="sg-area">{area?.label || suggestion.area}</span>
          <span className="sg-votes" title="Thumbs up / thumbs down">
            <span className="up">▲ {suggestion.likes}</span>
            <span className="down">▼ {suggestion.dislikes}</span>
          </span>
          <span className="muted">{shortDate(suggestion.createdAt)}{suggestion.editedAt ? ' · edited' : ''}</span>
          {suggestion.hidden && <span className="pill dormant">Hidden</span>}
        </div>
      </div>

      <p className="sg-text">{suggestion.text}</p>

      <div className="sg-form">
        <label className="sg-field">
          <span>Status</span>
          <select className="pselect" value={status} onChange={(e) => setStatus(e.target.value)} disabled={busy}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="sg-field sg-reply">
          <span>Reply from the Talentmon team <em>(shown to every company)</em></span>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={REPLY_MAX}
            rows={2}
            placeholder="Optional — e.g. “Good idea, it’s coming in December.”"
            disabled={busy}
          />
        </label>
      </div>

      <div className="match-actions">
        <span className="muted" style={{ fontSize: '.8rem' }}>
          {suggestion.statusChangedAt ? `Status set ${shortDate(suggestion.statusChangedAt)}` : 'No status set yet'}
          {suggestion.teamRepliedAt ? ` · replied ${shortDate(suggestion.teamRepliedAt)}` : ''}
        </span>
        <div className="match-btns">
          <button type="button" className="btn-del" disabled={busy} onClick={remove}>Delete</button>
          <button type="button" className="btn-no" disabled={busy} onClick={toggleHidden}>
            {suggestion.hidden ? 'Show to companies' : 'Hide'}
          </button>
          <button type="button" className="btn-yes" disabled={busy || !dirty} onClick={save}>Save</button>
        </div>
      </div>
      {note && <div className={`flash ${note.kind}`} style={{ margin: '12px 0 0' }}>{note.text}</div>}
    </div>
  );
};

const AdminSuggestions = () => {
  const [me, setMe] = useState(null);
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('new');
  const [sort, setSort] = useState('top');
  const [error, setError] = useState('');

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
    getSuggestions()
      .then(setItems)
      .catch(() => setError('Could not load suggestions — please refresh.'));
  }, []);

  const counts = useMemo(() => {
    const list = items || [];
    return {
      new: list.filter((s) => s.status === 'NEW' && !s.hidden).length,
      all: list.filter((s) => !s.hidden).length,
      hidden: list.filter((s) => s.hidden).length,
    };
  }, [items]);

  const visible = useMemo(() => {
    const list = (items || []).filter((s) => {
      if (tab === 'hidden') return s.hidden;
      if (tab === 'new') return s.status === 'NEW' && !s.hidden;
      return !s.hidden;
    });
    const newest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    return list.sort(sort === 'top' ? (a, b) => score(b) - score(a) || b.likes - a.likes || newest(a, b) : newest);
  }, [items, tab, sort]);

  const changed = (updated) => setItems((list) => list.map((s) => (s.id === updated.id ? updated : s)));
  const deleted = (id) => setItems((list) => list.filter((s) => s.id !== id));

  const tabs = [
    { id: 'new', label: 'New', count: counts.new, highlight: counts.new > 0 },
    { id: 'all', label: 'All suggestions', count: counts.all },
    { id: 'hidden', label: 'Hidden', count: counts.hidden },
  ];

  return (
    <div className="admin-panel">
      <Helmet>
        <title>Suggestions · Talentmon Admin</title>
      </Helmet>

      <AdminAppBar name={me?.name || undefined} email={me?.email} newSuggestions={items ? counts.new : undefined} />

      <main className="page">
        <div className="wrap">
          <div className="phead">
            <div>
              <h1>Suggestions</h1>
              <p>Ideas companies posted on “Your suggestions”. Companies see them anonymously; you see who wrote each one.</p>
            </div>
            <select className="pselect" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="top">Most liked first</option>
              <option value="new">Newest first</option>
            </select>
          </div>

          <div className="tabs">
            {tabs.map((t) => (
              <button key={t.id} type="button" className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
                {items && <span className={`tcount${t.highlight ? ' hot' : ''}`}>{t.count}</span>}
              </button>
            ))}
          </div>

          {error && <div className="flash err">{error}</div>}
          {items === null && !error && <p className="dir-empty">Loading…</p>}
          {items && visible.length === 0 && (
            <div className="card">
              <p className="dir-empty" style={{ padding: 0 }}>
                {tab === 'new' ? 'Nothing new — every suggestion has a status.' : tab === 'hidden' ? 'No hidden suggestions.' : 'No suggestions yet.'}
              </p>
            </div>
          )}

          {tab === 'new' && visible.length > 0 && (
            <p className="csub" style={{ marginBottom: 14 }}>
              Setting a status other than New, or writing a reply, notifies the company that posted it and locks the
              suggestion against further edits by them.
            </p>
          )}

          {visible.map((s) => (
            <SuggestionAdminCard key={s.id} suggestion={s} onChanged={changed} onDeleted={deleted} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminSuggestions;
