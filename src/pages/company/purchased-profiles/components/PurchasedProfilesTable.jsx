import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import Select from 'components/ui/Select';
import CandidateNotes, { NotesButton } from '../../candidate-search-dashboard/components/CandidateNotes';
import { formatSalary, salaryPeriod } from '../../candidate-search-dashboard/utils/cvHelpers';
import { shortDate } from 'utils/formatDate';
import HiringForField from './HiringForField';
import { COLUMN_FIRST_DIR, parseSort } from '../purchasedFilters';
import styles from '../styles/purchased.module.scss';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' }
];

const STATUS_CLASS = {
  new: 'sNew',
  contacted: 'sContacted',
  interviewed: 'sInterviewed',
  hired: 'sHired',
  rejected: 'sRejected'
};

const PAGE_SIZES = [10, 25, 50];
const COPIED_MS = 1600;
const MENU_HEIGHT = 196;

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const hasPhoto = (avatar) => !!avatar && !avatar.includes('no_image');

const SortHeader = ({ id, label, sort, onSort, end = false }) => {
  const active = sort.key === id;
  return (
    <div
      role="columnheader"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`${styles.tHead} ${end ? styles.tEnd : ''}`}
    >
      <button type="button" className={`${styles.tSort} ${active ? styles.on : ''}`} onClick={() => onSort(id)}>
        {label}
        <svg aria-hidden="true" width="10" height="14" viewBox="0 0 10 14" className={styles.tSortIcon}>
          <path d="M5 1l4 4.5H1z" className={active && sort.dir === 'asc' ? styles.tSortOn : ''} />
          <path d="M5 13l4-4.5H1z" className={active && sort.dir === 'desc' ? styles.tSortOn : ''} />
        </svg>
      </button>
    </div>
  );
};

/**
 * The status pill and its menu. The menu is portalled to <body> with a fixed
 * position, so the table's own horizontal scroll can't clip it, and follows
 * the pill on scroll; it closes on a click outside or Escape, and opens
 * upwards near the bottom of the window.
 */
const StatusCell = ({ profile, onStatusChange }) => {
  const [menuPos, setMenuPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const isOpen = !!menuPos;
  const current = STATUS_OPTIONS.find((option) => option.value === profile?.recruitmentStatus) || STATUS_OPTIONS[0];

  const placement = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    const below = rect.bottom + 4;
    const top = below + MENU_HEIGHT > window.innerHeight ? Math.max(8, rect.top - MENU_HEIGHT - 4) : below;
    return { left: rect.left - 4, top };
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = () => setMenuPos(null);
    const follow = () => {
      if (buttonRef.current) setMenuPos(placement());
    };
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) close();
    };
    // Escape is the menu's (the CV drawer behind it stays open).
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      close();
      buttonRef.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [isOpen]);

  const toggle = () => {
    if (isOpen) {
      setMenuPos(null);
      return;
    }
    setMenuPos(placement());
  };

  const pick = (value) => {
    setMenuPos(null);
    buttonRef.current?.focus();
    if (value !== current.value) onStatusChange(profile?.id, value);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.tStatus} ${styles[STATUS_CLASS[current.value]]}`}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Status for ${profile?.name}: ${current.label}`}
      >
        <span className={styles.tDot} aria-hidden="true" />
        {current.label}
        <Icon name="ChevronDown" size={14} strokeWidth={2.4} className={`${styles.tStatusChevron} ${isOpen ? styles.up : ''}`} />
      </button>

      {isOpen && createPortal(
        <div ref={menuRef} role="listbox" aria-label="Hire stage" className={styles.tMenu} style={{ left: menuPos.left, top: menuPos.top }}>
          {STATUS_OPTIONS.map((option) => {
            const selected = option.value === current.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`${styles.tMenuItem} ${selected ? styles.on : ''}`}
                onClick={() => pick(option.value)}
              >
                <span className={`${styles.tDot} ${styles[STATUS_CLASS[option.value]]}`} aria-hidden="true" />
                <span className={styles.tMenuLabel}>{option.label}</span>
                <Icon name="Check" size={14} strokeWidth={2.6} className={styles.tMenuCheck} />
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};

// `profiles` come sorted by the page's `sortBy` — the same one as the cards' Sort menu;
// a header click picks that column (or flips its direction).
const PurchasedProfilesTable = ({
  profiles,
  sortBy,
  onSortChange,
  positionSuggestions = [],
  onSaveHiringFor,
  onStatusChange,
  onCvDownload,
  onViewDetails,
  onAddNote,
  onEditNote,
  onDeleteNote,
  activePreviewId = null
}) => {
  const sort = parseSort(sortBy);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [notesOpenId, setNotesOpenId] = useState(null);
  const [copied, setCopied] = useState(null);
  const copiedTimer = useRef(null);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const handleSort = (key) => {
    const dir = sort.key === key ? (sort.dir === 'asc' ? 'desc' : 'asc') : COLUMN_FIRST_DIR[key];
    onSortChange(`${key}-${dir}`);
  };

  const sortedProfiles = profiles;
  const totalItems = sortedProfiles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const pageProfiles = sortedProfiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text)?.catch(() => {});
    setCopied(key);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(null), COPIED_MS);
  };

  // One contact line: icon, mailto/tel link and copy (a check mark for a moment), or "Not provided".
  const contactLine = (profile, kind) => {
    const value = profile?.[kind];
    const key = `${profile?.id}:${kind}`;
    const isEmail = kind === 'email';
    const label = isEmail ? 'email' : 'phone number';
    return (
      <div className={styles.tContactLine}>
        <Icon name={isEmail ? 'Mail' : 'Phone'} size={14} strokeWidth={1.9} className={styles.tContactIcon} />
        {value ? (
          <>
            <a href={isEmail ? `mailto:${value}` : `tel:${value.replace(/[^\d+]/g, '')}`} className={styles.tContactLink}>{value}</a>
            <button
              type="button"
              className={`${styles.tCopy} ${copied === key ? styles.copied : ''}`}
              onClick={() => handleCopy(key, value)}
              aria-label={copied === key ? `${isEmail ? 'Email' : 'Phone number'} copied` : `Copy ${label} of ${profile?.name}`}
            >
              <Icon name={copied === key ? 'Check' : 'Copy'} size={14} strokeWidth={copied === key ? 2.6 : 1.9} />
            </button>
          </>
        ) : (
          <span className={styles.tContactMissing}>Not provided</span>
        )}
      </div>
    );
  };

  // The page's own empty state covers "no candidates" and "no results".
  if (totalItems === 0) return null;

  return (
    <div className={styles.ptable}>
      <div className={styles.tScroll}>
        <div role="table" aria-label="Unlocked candidates" aria-rowcount={totalItems} className={styles.tGrid}>
          <div role="row" className={`${styles.tRow} ${styles.tHeadRow}`}>
            <SortHeader id="name" label="Candidate" sort={sort} onSort={handleSort} />
            <SortHeader id="experience" label="Experience" sort={sort} onSort={handleSort} />
            <SortHeader id="salary" label="Salary" sort={sort} onSort={handleSort} end />
            <SortHeader id="unlocked" label="Unlocked" sort={sort} onSort={handleSort} />
            <div role="columnheader" className={styles.tHead}>Status</div>
            <div role="columnheader" className={styles.tHead}>Contact</div>
            <div role="columnheader" className={styles.tHead}>Actions</div>
          </div>

          {pageProfiles.map((profile) => {
            const id = profile?.id;
            const notes = profile?.notes || [];
            const isNotesOpen = notesOpenId === id;
            const isPreviewed = activePreviewId === id;
            const period = salaryPeriod(profile?.expectedSalary);
            const experience = profile?.experience || 0;
            const notesId = `table-notes-${id}`;

            return (
              <React.Fragment key={id}>
                <div role="row" className={`${styles.tRow} ${styles.tBodyRow} ${isNotesOpen || isPreviewed ? styles.tRowOn : ''}`}>
                  <div role="cell" className={`${styles.tCell} ${styles.tCandidate}`}>
                    <span className={styles.tAvatar} aria-hidden="true">
                      {hasPhoto(profile?.avatar) ? <Image src={profile.avatar} alt="" /> : initials(profile?.name)}
                    </span>
                    <span className={styles.tWho}>
                      <span className={styles.tName} title={profile?.name}>{profile?.name}</span>
                      <span className={styles.tRole} title={profile?.position}>{profile?.position}</span>
                    </span>
                  </div>
                  <div role="cell" className={styles.tCell}>{experience} {experience === 1 ? 'year' : 'years'}</div>
                  <div role="cell" className={`${styles.tCell} ${styles.tEnd} ${styles.tNowrap}`}>
                    {profile?.expectedSalary ? (
                      <>
                        <span className={styles.tSalary}>{formatSalary(profile.expectedSalary)}</span>
                        {period && <> <span className={styles.tPer}>/ {period}</span></>}
                      </>
                    ) : '—'}
                  </div>
                  <div role="cell" className={`${styles.tCell} ${styles.tNowrap}`}>
                    {shortDate(profile?.unlockedDate)}
                    {profile?.unlockedBy && <span className={styles.tBy}>by {profile.unlockedBy}</span>}
                  </div>
                  <div role="cell" className={`${styles.tCell} ${styles.tStatusCell}`}>
                    <StatusCell profile={profile} onStatusChange={onStatusChange} />
                    <HiringForField
                      id={`table-hiring-for-${id}`}
                      size="row"
                      value={profile?.hiringFor}
                      suggestions={positionSuggestions}
                      onSave={(text) => onSaveHiringFor(id, text)}
                    />
                  </div>
                  <div role="cell" className={`${styles.tCell} ${styles.tContact}`}>
                    {contactLine(profile, 'email')}
                    {contactLine(profile, 'phone')}
                  </div>
                  <div role="cell" className={`${styles.tCell} ${styles.tActions}`}>
                    <button
                      type="button"
                      className={styles.tIconBtn}
                      onClick={() => onViewDetails(id)}
                      title="Preview"
                      aria-label={`Preview profile of ${profile?.name}`}
                      aria-pressed={isPreviewed}
                    >
                      <Icon name="Eye" size={18} strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      className={styles.tIconBtn}
                      onClick={() => onCvDownload(id)}
                      title="Download CV"
                      aria-label={`Download CV of ${profile?.name}`}
                    >
                      <Icon name="Download" size={18} strokeWidth={1.8} />
                    </button>
                    <NotesButton
                      count={notes.length}
                      isOpen={isNotesOpen}
                      onClick={() => setNotesOpenId(isNotesOpen ? null : id)}
                      className={styles.tNotesBtn}
                      iconSize={17}
                      label={notes.length ? `Notes for ${profile?.name}` : `Add note for ${profile?.name}`}
                      controls={notesId}
                    />
                  </div>
                </div>

                {/* Notes: the new note on the left, the saved ones on the right */}
                <div role="row" id={notesId} className={`${styles.tNotesWrap} ${isNotesOpen ? styles.open : ''}`}>
                  <div role="cell" aria-label="Notes" className={styles.tNotesInner}>
                    <div className={styles.tNotesPanel}>
                      <CandidateNotes
                        layout="columns"
                        candidateName={profile?.name}
                        notes={notes}
                        fieldId={`table-note-${id}`}
                        isOpen={isNotesOpen}
                        onAdd={(text) => onAddNote(id, text)}
                        onEdit={(noteId, text) => onEditNote(id, noteId, text)}
                        onDelete={(noteId) => onDeleteNote(id, noteId)}
                        onCancel={() => setNotesOpenId(null)}
                      />
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className={styles.pagBar}>
        <p role="status" className={styles.pagInfo}>
          Showing <strong>{rangeStart}–{rangeEnd}</strong> of {totalItems} candidates
        </p>
        <div className={styles.pagControls}>
          <div className={styles.pagSize}>
            <label htmlFor="purchased-rows-per-page" className={styles.pagSizeLabel}>Rows per page</label>
            <Select
              id="purchased-rows-per-page"
              className={styles.pagSizeSelect}
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              options={PAGE_SIZES.map((size) => ({ value: size, label: String(size) }))}
            />
          </div>
          <nav aria-label="Pagination" className={styles.pagNav}>
            <button
              type="button"
              className={styles.pagArrow}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <Icon name="ChevronLeft" size={16} strokeWidth={2.2} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`${styles.pagBtn} ${page === currentPage ? styles.on : ''}`}
                onClick={() => setCurrentPage(page)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className={styles.pagArrow}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              aria-label="Next page"
            >
              <Icon name="ChevronRight" size={16} strokeWidth={2.2} />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PurchasedProfilesTable;
