import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import {
  CardAvatar,
  CardIdentity,
  CardStats,
  SkillsRow,
  StatusBadge
} from '../../candidate-search-dashboard/components/CandidateCardParts';
import CandidateNotes, { NotesButton } from '../../candidate-search-dashboard/components/CandidateNotes';
import dashboardStyles from '../../candidate-search-dashboard/styles/dashboard.module.scss';
import { shortDate } from 'utils/formatDate';
import HiringForField from './HiringForField';
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

// How long a copy button shows its check mark.
const COPIED_MS = 1600;

// Same card as Bookmarked (shared CandidateCardParts and notes), with the
// notes pencil where the match ring would be, "Hiring for", the contact details and Hire tracking.
const PurchasedProfileCard = React.forwardRef(({
  profile,
  onStatusChange,
  onCvDownload,
  onViewDetails,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onSaveHiringFor,
  positionSuggestions = [],
  isActive = false
}, ref) => {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const copiedTimer = useRef(null);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const notes = profile?.notes || [];
  const skills = profile?.skills || [];
  const contactId = `contact-${profile?.id}`;
  const stagesId = `hire-stages-${profile?.id}`;
  const currentStage = STATUS_OPTIONS.find((stage) => stage.value === profile?.recruitmentStatus);

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text)?.catch(() => {});
    setCopied(key);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(null), COPIED_MS);
  };

  const copyButton = (key, text, label) => (
    <button
      type="button"
      className={`${styles.contactAction} ${copied === key ? styles.copied : ''}`}
      onClick={() => handleCopy(key, text)}
      aria-label={copied === key ? `${label} copied` : `Copy ${label.toLowerCase()}`}
    >
      <Icon name={copied === key ? 'Check' : 'Copy'} size={18} />
    </button>
  );

  const notProvided = <span className={`${styles.contactValue} ${styles.contactMissing}`}>Not provided</span>;

  return (
    <article
      ref={ref}
      className={`${dashboardStyles.card} ${dashboardStyles.scCard} ${dashboardStyles.unlocked} ${isActive ? `${dashboardStyles.active} ${styles.pcActive}` : ''} ${styles.pcCard}`}
    >
      {/* Who unlocked it and when ("by" only for a team), and the position they are considered for */}
      <div className={styles.cardTop}>
        <p className={styles.unlockedBy}>
          <Icon name="Unlock" size={14} className={styles.unlockedIcon} />
          <span>
            Unlocked on {shortDate(profile?.unlockedDate)}{profile?.unlockedBy && <> by <strong>{profile.unlockedBy}</strong></>}
          </span>
        </p>
        <HiringForField
          id={`hiring-for-${profile?.id}`}
          value={profile?.hiringFor}
          suggestions={positionSuggestions}
          onSave={(text) => onSaveHiringFor(profile?.id, text)}
        />
      </div>

      {/* Header: avatar, name/role/meta/status, notes pencil */}
      <div className={dashboardStyles.scHead}>
        <CardAvatar candidate={profile} unlocked />

        <div className={dashboardStyles.scInfo}>
          <CardIdentity candidate={profile} unlocked />
          <StatusBadge searchStatus={profile?.searchStatus} />
        </div>

        <NotesButton
          count={notes.length}
          isOpen={isNotesOpen}
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={styles.headNotesBtn}
        />
      </div>

      {/* Notes: a grey panel under the header, opened with the pencil */}
      <div className={`${styles.notesWrap} ${isNotesOpen ? styles.open : ''}`}>
        <div className={styles.notesInner}>
          <div className={styles.notesPanel}>
            <CandidateNotes
              notes={notes}
              visibleNotes={2}
              fieldId={`note-${profile?.id}`}
              isOpen={isNotesOpen}
              onAdd={(text) => onAddNote(profile?.id, text)}
              onEdit={(noteId, text) => onEditNote(profile?.id, noteId, text)}
              onDelete={(noteId) => onDeleteNote(profile?.id, noteId)}
            />
          </div>
        </div>
      </div>

      <CardStats candidate={profile} salaryFirst />
      {skills.length > 0 && <SkillsRow skills={skills} />}
      <p className={`${dashboardStyles.scDesc} ${styles.pcDesc}`}>{profile?.description}</p>

      <section className={styles.contact} aria-labelledby={contactId}>
        <h3 id={contactId} className={styles.contactTitle}>Contact</h3>
        <ul className={styles.contactList}>
          <li className={styles.contactRow}>
            <span className={styles.contactIcon} aria-hidden="true"><Icon name="Mail" size={18} /></span>
            <div className={styles.contactText}>
              <span className={styles.contactLabel}>Email</span>
              {profile?.email ? (
                <a href={`mailto:${profile.email}`} className={styles.contactValue}>{profile.email}</a>
              ) : notProvided}
            </div>
            {profile?.email && copyButton('email', profile.email, 'Email')}
          </li>

          <li className={styles.contactRow}>
            <span className={styles.contactIcon} aria-hidden="true"><Icon name="Phone" size={18} /></span>
            <div className={styles.contactText}>
              <span className={styles.contactLabel}>Phone</span>
              {profile?.phone ? (
                <a href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`} className={styles.contactValue}>{profile.phone}</a>
              ) : notProvided}
            </div>
            {profile?.phone && copyButton('phone', profile.phone, 'Phone number')}
          </li>

          <li className={styles.contactRow}>
            <span className={styles.contactIcon} aria-hidden="true"><Icon name="Linkedin" size={18} /></span>
            <div className={styles.contactText}>
              <span className={styles.contactLabel}>LinkedIn</span>
              {profile?.linkedin ? (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
                  {profile.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              ) : notProvided}
            </div>
            {profile?.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactAction}
                aria-label="Open LinkedIn profile in a new tab"
              >
                <Icon name="ExternalLink" size={18} />
              </a>
            )}
          </li>
        </ul>
      </section>

      <div className={dashboardStyles.scActions}>
        <button className={dashboardStyles.scPrimary} onClick={() => onViewDetails(profile?.id)}>
          <Icon name="FileText" size={18} />
          Open CV
        </button>
        <button
          className={`${dashboardStyles.scIconBtn} ${dashboardStyles.scSaveBtn} ${styles.downloadBtn}`}
          onClick={() => onCvDownload(profile?.id)}
          aria-label="Download CV"
          title="Download CV"
        >
          <Icon name="Download" size={19} />
        </button>
      </div>

      {/* Hire tracking: a bar across the card's bottom; the pills set the status */}
      <div className={styles.hireTracking}>
        <button
          type="button"
          className={styles.htToggle}
          onClick={() => setIsTrackingOpen(!isTrackingOpen)}
          aria-expanded={isTrackingOpen}
          aria-controls={stagesId}
        >
          <Icon name="Route" size={16} className={styles.htIcon} />
          <span className={styles.htLabel}>Hire tracking</span>
          {!isTrackingOpen && currentStage && (
            <span className={`${styles.htCurrent} ${styles[STATUS_CLASS?.[currentStage.value]]}`}>{currentStage.label}</span>
          )}
          <Icon name="ChevronDown" size={16} strokeWidth={2.2} className={`${styles.htChevron} ${isTrackingOpen ? styles.up : ''}`} />
        </button>

        <div className={`${styles.expandWrap} ${isTrackingOpen ? styles.open : ''}`}>
          <div className={styles.expandInner}>
            <div id={stagesId} role="group" aria-label="Hire stage" className={styles.pipeline}>
              {STATUS_OPTIONS?.map((stage, index) => {
                const isCurrent = stage?.value === profile?.recruitmentStatus;
                return (
                  <React.Fragment key={stage?.value}>
                    {index > 0 && index < 4 && <Icon name="ChevronRight" size={12} strokeWidth={2.6} className={styles.pipeArrow} />}
                    {index === 4 && <span className={styles.pipeOr} aria-hidden="true">or</span>}
                    <button
                      type="button"
                      className={`${styles.stage} ${styles[STATUS_CLASS?.[stage?.value]]} ${isCurrent ? styles.stageOn : ''}`}
                      onClick={() => !isCurrent && onStatusChange(profile?.id, stage?.value)}
                      aria-pressed={isCurrent}
                    >
                      {stage?.label}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

PurchasedProfileCard.displayName = 'PurchasedProfileCard';

export default PurchasedProfileCard;
