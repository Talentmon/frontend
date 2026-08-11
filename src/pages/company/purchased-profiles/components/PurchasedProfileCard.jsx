import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import dashboardStyles from '../../candidate-search-dashboard/styles/dashboard.module.scss';
import { formatSalary } from '../../candidate-search-dashboard/utils/cvHelpers';
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

const PurchasedProfileCard = React.forwardRef(({
  profile,
  onStatusChange,
  onContactCopy,
  onCvDownload,
  onViewDetails,
  onUpdateNotes,
  isActive = false
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const skills = profile?.skills || [];

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState(profile?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(!profile?.notes);
  const notesTextareaRef = useRef(null);

  useEffect(() => {
    if (isEditingNotes && notesTextareaRef.current) {
      notesTextareaRef.current.style.minHeight = `${notesTextareaRef.current.offsetHeight}px`;
    }
  }, [isEditingNotes]);

  const handleNotesChange = (e) => {
    setNotes(e?.target?.value);
  };

  const handleSaveNotes = () => {
    if (!notes.trim()) return;
    onUpdateNotes?.(profile?.id, notes);
    setIsEditingNotes(false);
  };

  const handleDeleteNotes = () => {
    setNotes('');
    onUpdateNotes?.(profile?.id, '');
    setIsEditingNotes(true);
  };

  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const description = profile?.description || '';

  const handleContactCopy = (contactInfo) => {
    navigator.clipboard?.writeText(contactInfo);
    onContactCopy(contactInfo);
  };

  return (
    <article ref={ref} className={`${styles.pc} ${isActive ? styles.pcActive : ''}`}>
      <div className={styles.pcHead}>
        <span className={styles.unlockedTag}>
          <Icon name="Unlock" size={14} />
          Unlocked {formatDate(profile?.unlockedDate)}
        </span>
        {profile?.isAvailable ? (
          <span className={styles.availableBadge}>
            <span className={styles.pulse} />
            Available immediately
          </span>
        ) : (
          <span className={`${styles.availableBadge} ${styles.openBadge}`}>
            <span className={styles.pulse} />
            Open to offers
          </span>
        )}
      </div>

      <div className={styles.pcTop}>
        <span className={styles.pcAv}>
          <Image src={profile?.avatar} alt={profile?.name} />
        </span>
        <div className={styles.pcTopInfo}>
          <div className={styles.pcName}>{profile?.name}</div>
          <div className={styles.pcRole}>{profile?.position}</div>
        </div>
        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={`${dashboardStyles.cardBookmark} ${notes ? dashboardStyles.on : ''}`}
          title="Notes"
          aria-label="Notes"
          aria-expanded={isNotesOpen}
        >
          <Icon
            name="Pencil"
            size={18}
            color={notes ? undefined : 'var(--color-muted-foreground)'}
          />
        </button>
      </div>

      <div className={styles.headerDivider} />

      <div className={`${styles.bcNotesWrap} ${isNotesOpen ? styles.open : ''}`}>
        <div className={styles.bcNotesInner}>
          <div className={styles.bcNotes}>
            {isEditingNotes ? (
              <>
                <textarea
                  ref={notesTextareaRef}
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Add a note about the candidate..."
                  className={styles.bcNotesTextarea}
                  rows={3}
                />
                <button
                  className={styles.bcNotesSave}
                  onClick={handleSaveNotes}
                  disabled={!notes.trim()}
                >
                  <Icon name="Check" size={14} />
                  Save
                </button>
              </>
            ) : (
              <>
                <p className={styles.bcNotesText}>{notes}</p>
                <div className={styles.bcNotesActions}>
                  <button className={styles.bcNotesEdit} onClick={() => setIsEditingNotes(true)}>
                    <Icon name="Pencil" size={13} />
                    Edit
                  </button>
                  <button
                    className={`${styles.bcNotesDelete} ${styles.tooltip}`}
                    onClick={handleDeleteNotes}
                    data-tooltip="Delete note"
                    aria-label="Delete note"
                  >
                    <Icon name="X" size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.factsGrid}>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="Calendar" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Experience</span>
            <span className={styles.factV}>{profile?.experience} yrs</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="CreditCard" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Salary</span>
            <span className={styles.factV}>{formatSalary(profile?.expectedSalary)}</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="MapPin" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Location</span>
            <span className={styles.factV}>{profile?.location}</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="Building2" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Work arrangement</span>
            <span className={styles.factV}>{profile?.workArrangement}</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="Clock" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Notice period</span>
            <span className={styles.factV}>{profile?.notice}</span>
          </span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factIcon}><Icon name="TrendingUp" size={16} /></span>
          <span className={styles.factText}>
            <span className={styles.factK}>Match</span>
            <span className={`${styles.factV} ${styles.factGold}`}>{profile?.matchScore}%</span>
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.pcSkills}>
        {skills?.slice(0, 5)?.map((skill, index) => (
          <span key={index} className={styles.tag}>{skill}</span>
        ))}
        {skills?.length > 5 && (
          <span className={styles.moreTag}>+{skills?.length - 5}</span>
        )}
      </div>

      <p className={styles.pcDesc}>{description}</p>

      <div className={styles.contactBox}>
        <div className={styles.contactHead}>
          <Icon name="Check" size={14} />
          Contact unlocked
        </div>
        <div className={styles.contactRow}>
          <span className={styles.ctIcon}><Icon name="Mail" size={15} /></span>
          <div className={styles.ct}>
            <span className={styles.ctLabel}>Email</span>
            <div className={styles.ctValue}>{profile?.email}</div>
          </div>
          <button className={styles.copyBtn} onClick={() => handleContactCopy(profile?.email)} aria-label="Copy email">
            <Icon name="Copy" size={13} />
          </button>
        </div>
        <div className={styles.contactRow}>
          <span className={styles.ctIcon}><Icon name="Phone" size={15} /></span>
          <div className={styles.ct}>
            <span className={styles.ctLabel}>Phone</span>
            <div className={styles.ctValue}>{profile?.phone}</div>
          </div>
          <button className={styles.copyBtn} onClick={() => handleContactCopy(profile?.phone)} aria-label="Copy phone">
            <Icon name="Copy" size={13} />
          </button>
        </div>
        <div className={styles.contactRow}>
          <span className={styles.ctIcon}><Icon name="Linkedin" size={15} /></span>
          <div className={styles.ct}>
            <span className={styles.ctLabel}>LinkedIn</span>
            {profile?.linkedin ? (
              <a href={profile?.linkedin} target="_blank" rel="noopener noreferrer" className={styles.ctValue}>
                {profile?.linkedin?.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span className={styles.ctValue}>No profile</span>
            )}
          </div>
          {profile?.linkedin && (
            <button className={styles.copyBtn} onClick={() => window.open(profile?.linkedin, '_blank')} aria-label="Open LinkedIn">
              <Icon name="ExternalLink" size={13} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.cvBtnRow}>
        <button className={styles.openCvBtn} onClick={() => onViewDetails(profile?.id)}>
          <Icon name="ExternalLink" size={15} />
          Open CV
        </button>
        <button className={styles.downloadCvBtn} onClick={() => onCvDownload(profile?.id)} aria-label="Download CV">
          <Icon name="Download" size={15} />
        </button>
      </div>

      <span className={`${styles.status} ${styles[STATUS_CLASS?.[profile?.recruitmentStatus]]} ${styles.statusBlock}`}>
        <select
          value={profile?.recruitmentStatus}
          onChange={(e) => {
            onStatusChange(profile?.id, e?.target?.value);
            e?.target?.blur();
          }}
        >
          {STATUS_OPTIONS?.map((opt) => (
            <option key={opt?.value} value={opt?.value}>{opt?.label}</option>
          ))}
        </select>
      </span>

      <button
        className={styles.expandToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.expandToggleAction}>
          {isExpanded ? 'Show less' : 'Show more'}
          <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={15} />
        </span>
      </button>

      <div className={`${styles.expandWrap} ${isExpanded ? styles.open : ''}`}>
        <div className={styles.expandInner}>
          <div className={styles.expand}>
            <div className={styles.expandGrid}>
              <div className={styles.expandCol}>
                <div className={styles.expandColHead}>
                  <span className={styles.expandColIcon}><Icon name="Calendar" size={16} /></span>
                  <span className={styles.expandColLabel}>Work experience</span>
                </div>
                <div className={styles.timeline}>
                  {profile?.workHistory?.slice(0, 2)?.map((work, index) => (
                    <div key={index} className={styles.timelineItem}>
                      <span className={styles.timelineDot} />
                      <b>{work?.position}</b>
                      <span className={styles.timelineCompany}>{work?.company}</span>
                      <span className={styles.timelinePeriod}>
                        <Icon name="Calendar" size={12} />
                        {work?.period}
                      </span>
                      {work?.description && (
                        <p className={styles.timelineDesc}>{work?.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.expandCol}>
                {profile?.education && (
                  <>
                    <div className={styles.expandColHead}>
                      <span className={styles.expandColIcon}><Icon name="GraduationCap" size={16} /></span>
                      <span className={styles.expandColLabel}>Education</span>
                    </div>
                    <div className={styles.eduBox}>
                      <b>{profile?.education?.degree}</b>
                      <span className={styles.timelineCompany}>{profile?.education?.institution}</span>
                      <span className={styles.timelinePeriod}>
                        <Icon name="Calendar" size={12} />
                        {profile?.education?.year}
                      </span>
                    </div>
                  </>
                )}

                {profile?.additionalActivities && (
                  <div className={styles.activitiesBox}>
                    <div className={styles.activitiesHead}>
                      <span className={styles.activitiesIcon}><Icon name="Award" size={16} /></span>
                      <span className={styles.activitiesLabel}>Additional activities</span>
                    </div>
                    <p className={styles.activitiesText}>{profile?.additionalActivities}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

PurchasedProfileCard.displayName = 'PurchasedProfileCard';

export default PurchasedProfileCard;
