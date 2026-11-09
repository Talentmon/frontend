import React, { useCallback, useState } from 'react';
import Icon from 'components/AppIcon';
import Popover from '../../bookmarked-candidates/components/Popover';
import bm from '../../bookmarked-candidates/styles/bookmarked.module.scss';
import { ATTENTION_DAYS } from '../purchasesApi';
import styles from '../styles/purchased.module.scss';

const STAGE = {
  new: { label: 'New', tone: 'sNew', empty: 'Nobody here yet' },
  contacted: { label: 'Contacted', tone: 'sContacted', empty: 'Nobody here yet' },
  interviewed: { label: 'Interviewed', tone: 'sInterviewed', empty: 'Nobody here yet' },
  hired: { label: 'Hired', tone: 'sHired', empty: 'No hires yet' },
  rejected: { label: 'Rejected', tone: 'sRejected', empty: 'None rejected' }
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const avgText = (key, days) => {
  if (days === null) return '';
  const rounded = Math.round(days);
  const span = days < 1 ? '<1 day' : plural(rounded, 'day');
  return key === 'hired' ? `avg ${span} to hire` : `avg ${span}`;
};

// What a screen reader hears: count, a few names, average time and who's waiting.
const stageAria = (stage, selected) => {
  const meta = STAGE[stage.key];
  const parts = [`${meta.label}, ${plural(stage.n, 'candidate')}`];
  if (stage.n) {
    const shown = stage.names.slice(0, 3).join(', ');
    parts[0] += `: ${shown}${stage.n > 3 ? ` and ${stage.n - 3} more` : ''}`;
    const avg = avgText(stage.key, stage.avgDays);
    if (avg) parts.push(avg.replace('avg', 'average'));
  }
  if (stage.waiting) parts.push(`${stage.waiting} waiting up to ${stage.maxWait} days`);
  if (selected) parts.push('selected');
  return parts.join(', ');
};

const Segment = ({ stage, selected, onPick, chevron, first }) => {
  const meta = STAGE[stage.key];
  const avg = avgText(stage.key, stage.avgDays);
  return (
    <button
      type="button"
      className={`${styles.seg} ${styles[meta.tone]} ${selected ? styles.on : ''} ${chevron ? styles.segChevron : styles.segBox} ${first ? styles.segFirst : ''}`}
      aria-pressed={selected}
      aria-label={stageAria(stage, selected)}
      onClick={onPick}
    >
      <span className={styles.segMain}>
        <span className={styles.segTop}>
          {stage.n > 0 && <span className={styles.segN}>{stage.n}</span>}
          <span className={styles.segLabel}>
            <span className={styles.segDot} aria-hidden="true" />
            {meta.label}
          </span>
        </span>
        {stage.n > 0 ? (
          <span className={styles.segSub}>
            <strong>{stage.share}%</strong>
            {avg && (
              <>
                <span className={styles.segSep} aria-hidden="true" />
                <span>{avg}</span>
              </>
            )}
          </span>
        ) : (
          <span className={styles.segEmpty}>{meta.empty}</span>
        )}
      </span>
      {stage.waiting > 0 && (
        <span
          className={styles.segWait}
          aria-hidden="true"
          title={stage.waiting === 1 ? `1 candidate waiting ${stage.maxWait} days` : `${stage.waiting} candidates waiting up to ${stage.maxWait} days`}
        >
          <Icon name="Clock" size={11} strokeWidth={2.6} />
          {stage.maxWait}d
        </span>
      )}
    </button>
  );
};

/**
 * The pipeline for the chosen position ("Hiring for", or all positions): a
 * stage per status — how many, their share, the average days there and a
 * badge when someone has waited ATTENTION_DAYS — where a click shows only that
 * stage (the Status filter can pick several; they're all marked). The counts
 * follow the other filters. Below it, who
 * needs a follow-up; Review shows exactly those, the longest waiting first.
 */
const PipelineCard = ({
  pipeline,
  attention,
  stages = [],
  onStageChange,
  position,
  positions,
  onPositionChange,
  onReviewAttention
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const byKey = Object.fromEntries(pipeline.stages.map((s) => [s.key, s]));
  const pick = (key) => onStageChange(stages.length === 1 && stages[0] === key ? '' : key);

  const pickPosition = (value) => {
    onPositionChange(value);
    closeMenu();
    document.getElementById('pp-position-trigger')?.focus();
  };

  const longest = attention[0];
  const attentionText = !longest
    ? ''
    : attention.length === 1
      ? `${longest.name} has been at ${STAGE[longest.status].label} for ${longest.days} days without a change.`
      : `${attention.length} candidates need a follow-up — longest: ${longest.name}, ${longest.days} days at ${STAGE[longest.status].label}.`;

  return (
    <section aria-label="Pipeline" className={styles.pipeCard}>
      <div className={styles.pipeBody}>
        <div className={styles.pipeHead}>
          <h2 className={styles.pipeTitle}>Pipeline</h2>
          <span className={styles.pipeCount}>{plural(pipeline.total, 'candidate')}</span>

          <Popover
            id="pp-position"
            label="Hiring for"
            role="listbox"
            open={menuOpen}
            onToggle={() => setMenuOpen((prev) => !prev)}
            onClose={closeMenu}
            width={320}
            renderTrigger={(props) => (
              <button {...props} className={`${styles.scopeBtn} ${position ? styles.on : ''} ${menuOpen ? styles.open : ''}`}>
                <Icon name="Briefcase" size={14} strokeWidth={2.2} />
                <span className={styles.scopeMuted}>Hiring for:</span>
                <span className={styles.scopeValue}>{position || 'All positions'}</span>
                <Icon name="ChevronDown" size={14} strokeWidth={2.2} className={styles.scopeChevron} />
              </button>
            )}
          >
            <button
              type="button"
              role="option"
              aria-selected={!position}
              className={`${bm.menuOption} ${!position ? bm.menuOptionSelected : ''}`}
              onClick={() => pickPosition('')}
            >
              <span className={styles.scopeOption}>
                <span className={styles.scopeName}>All positions</span>
              </span>
            </button>
            {positions.length === 0 ? (
              <p className={bm.menuNote}>No positions yet. Set one on a candidate with “+ Hiring for”.</p>
            ) : (
              positions.map((p) => (
                <button
                  key={p.position}
                  type="button"
                  role="option"
                  aria-selected={position === p.position}
                  className={`${bm.menuOption} ${position === p.position ? bm.menuOptionSelected : ''}`}
                  onClick={() => pickPosition(p.position)}
                >
                  <span className={styles.scopeOption}>
                    <span className={styles.scopeName}>{p.position}</span>
                    <span className={styles.scopeMeta}>
                      {p.unlocked} unlocked · {p.hired} hired · {p.hireRate}%
                    </span>
                  </span>
                </button>
              ))
            )}
          </Popover>

          <span className={styles.pipeSpacer} />
          {stages.length ? (
            <button type="button" className={styles.pipeShowAll} onClick={() => onStageChange('')}>
              Show all stages
            </button>
          ) : (
            <span className={styles.pipeHint}>Click a stage to filter the list</span>
          )}
        </div>

        <div role="group" aria-label="Filter by stage" className={styles.pipeRow}>
          <div className={styles.pipePath}>
            {['new', 'contacted', 'interviewed', 'hired'].map((key, i) => (
              <Segment key={key} stage={byKey[key]} selected={stages.includes(key)} onPick={() => pick(key)} chevron first={i === 0} />
            ))}
          </div>
          <span className={styles.pipeOrText} aria-hidden="true">or</span>
          <Segment stage={byKey.rejected} selected={stages.includes('rejected')} onPick={() => pick('rejected')} />
        </div>
      </div>

      {longest ? (
        <div role="status" className={styles.attentionBar}>
          <Icon name="Clock" size={18} className={styles.attentionIcon} />
          <p>
            <strong>Needs attention:</strong> {attentionText}
          </p>
          <button type="button" className={styles.attentionReview} onClick={onReviewAttention}>
            Review
            <Icon name="ChevronRight" size={14} strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <div className={`${styles.attentionBar} ${styles.attentionOk}`}>
          <Icon name="CheckCircle2" size={16} />
          <p>Every open candidate moved in the last {ATTENTION_DAYS} days.</p>
        </div>
      )}
    </section>
  );
};

export default PipelineCard;
