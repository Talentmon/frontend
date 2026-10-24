import React, { useEffect, useRef, useState } from 'react';
import Icon from 'components/AppIcon';
import { useCurrentUser } from 'lib/CurrentUserContext';
import { creditWord, formatCredits, LOW_BALANCE_EVENT } from 'utils/formatCredits';
import { getLowBalanceAlert, updateLowBalanceAlert } from '../creditsApi';
import styles from '../styles/credits.module.scss';

const PRESETS = [3, 5, 10, 20];
// Matches MAX_LOW_BALANCE_THRESHOLD in the backend (credits/low-balance-alert.ts).
const MAX_THRESHOLD = 100;
const clamp = (n) => Math.min(MAX_THRESHOLD, Math.max(1, n));
const AVG_MONTH_DAYS = 30.44;

// How long `months` of Credits last, in words: "about 4 days", "about 2 weeks", "about 3 months".
const roughDuration = (months) => {
  const days = months * AVG_MONTH_DAYS;
  if (days < 1.5) return 'about a day';
  if (days < 13) return `about ${Math.round(days)} days`;
  if (days < 56) return `about ${Math.round(days / 7)} weeks`;
  if (months < 18) return `about ${Math.round(months)} months`;
  return `about ${Math.round(months / 12)} years`;
};

const paceLabel = (perMonth) =>
  perMonth < 1 ? 'less than 1 Credit a month' : `about ${formatCredits(Math.round(perMonth))} a month`;

// Same look as an item in the header's bell (CompanyNotifications), with the copy the unlock flow sends.
const NotificationPreview = ({ title, description }) => (
  <div className={styles.lbaNotif}>
    <span className={styles.lbaNotifIcon}><Icon name="AlertTriangle" size={16} /></span>
    <div className={styles.lbaNotifBody}>
      <b>{title}</b>
      <span>{description}</span>
      <small>Just now</small>
    </div>
    <span className={styles.lbaNotifDot} aria-hidden="true" />
  </div>
);

/**
 * When the company counts as "running low" and whether the team's bell is told.
 * Saves each change on its own (no Save button); only the owner can change it,
 * the rest of the team sees how it's set.
 */
const LowBalanceAlertSettings = ({ balance, balanceLoaded, pacePerMonth, onBuy }) => {
  const { isCompanyOwner } = useCurrentUser();
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const saved = useRef(null);
  const requestId = useRef(0);
  const stepTimer = useRef(null);
  const pendingStep = useRef(null);
  const savedTimer = useRef(null);

  // The header counter and the page's balance chip listen for this, so they follow without a reload.
  const announceThreshold = (threshold) =>
    window.dispatchEvent(new CustomEvent(LOW_BALANCE_EVENT, { detail: threshold }));

  const load = () => {
    setLoadError(false);
    getLowBalanceAlert()
      .then((row) => {
        saved.current = row;
        setSettings(row);
        setDraft(String(row.thresholdCredits));
      })
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    load();
    return () => {
      clearTimeout(stepTimer.current);
      clearTimeout(savedTimer.current);
      // A +/− still waiting out its pause when the owner leaves the tab is saved now, not dropped.
      const pending = pendingStep.current;
      if (pending !== null && pending !== saved.current?.thresholdCredits) {
        updateLowBalanceAlert({ thresholdCredits: pending })
          .then((row) => announceThreshold(row.thresholdCredits))
          .catch(() => {});
      }
    };
  }, []);

  // Only the latest request updates the screen, so quick +/− clicks can't land out of order.
  const save = (patch) => {
    const id = ++requestId.current;
    setSettings((prev) => ({ ...prev, ...patch }));
    setSaveState('saving');
    clearTimeout(savedTimer.current);
    updateLowBalanceAlert(patch)
      .then((row) => {
        const thresholdChanged = row.thresholdCredits !== saved.current?.thresholdCredits;
        saved.current = row;
        if (thresholdChanged) announceThreshold(row.thresholdCredits);
        if (id !== requestId.current) return;
        setSettings(row);
        setDraft(String(row.thresholdCredits));
        setSaveState('saved');
        savedTimer.current = setTimeout(() => setSaveState('idle'), 2200);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setSettings(saved.current);
        setDraft(String(saved.current.thresholdCredits));
        setSaveState('error');
      });
  };

  const commitThreshold = (value) => {
    clearTimeout(stepTimer.current);
    pendingStep.current = null;
    const next = clamp(value);
    setDraft(String(next));
    if (next !== settings.thresholdCredits) save({ thresholdCredits: next });
  };

  // +/− save after a short pause, so holding a few clicks sends one request.
  const step = (delta) => {
    const next = clamp((parseInt(draft, 10) || settings.thresholdCredits) + delta);
    setDraft(String(next));
    pendingStep.current = next;
    clearTimeout(stepTimer.current);
    stepTimer.current = setTimeout(() => commitThreshold(next), 450);
  };

  const commitDraft = () => {
    const typed = parseInt(draft, 10);
    if (Number.isNaN(typed)) setDraft(String(settings.thresholdCredits));
    else commitThreshold(typed);
  };

  const saveIndicator = {
    saving: <span className={styles.lbaSave}><Icon name="Loader2" size={15} className="animate-spin" />Saving…</span>,
    saved: <span className={`${styles.lbaSave} ${styles.ok}`}><Icon name="Check" size={15} />Saved</span>,
    error: <span className={`${styles.lbaSave} ${styles.err}`}><Icon name="AlertCircle" size={15} />Couldn’t save — try again</span>,
  }[saveState] || null;

  const head = (
    <div className={styles.lbaHead}>
      <div className={styles.lbaHeadText}>
        <h2>Low balance alert</h2>
        <p>Get a heads-up before your team runs out of Credits</p>
      </div>
      {saveIndicator}
    </div>
  );

  if (loadError) {
    return (
      <div className={styles.settingsCard}>
        {head}
        <div className={styles.lbaLoadError}>
          <Icon name="CloudOff" size={20} />
          <span>Couldn’t load your alert settings.</span>
          <button type="button" className={styles.btnGhost} onClick={load}>Try again</button>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.settingsCard}>
        {head}
        <p className={styles.lbaLoading}>Loading…</p>
      </div>
    );
  }

  const typed = parseInt(draft, 10);
  const threshold = Number.isNaN(typed) ? settings.thresholdCredits : clamp(typed);
  const isOut = balance <= 0;
  const isLow = !isOut && balance <= threshold;
  const unlocksToGo = balance - threshold;
  // The bar shows the balance against twice the alert level, so the marker never hugs either edge.
  const scale = Math.max(balance, threshold * 2, 10);
  const fillPct = Math.min(100, (balance / scale) * 100);
  const markerPct = Math.min(100, (threshold / scale) * 100);
  const tone = isOut ? styles.out : isLow ? styles.low : styles.fine;
  // Pace from the Analytics numbers; nothing to go by until the team has unlocked someone.
  const hasPace = balanceLoaded && pacePerMonth > 0;
  const suggested = hasPace ? clamp(Math.ceil((pacePerMonth * 7) / AVG_MONTH_DAYS)) : null;

  return (
    <div className={styles.settingsCard}>
      {head}

      {!isCompanyOwner && (
        <div className={styles.noteRow} style={{ marginBottom: 20 }}>
          <Icon name="Lock" size={18} />
          <div>Only the account owner can change the alert. Here’s how it’s set for your team.</div>
        </div>
      )}

      <div className={styles.lbaGrid}>
        {/* A disabled <fieldset> locks every control inside it for the rest of the team. */}
        <fieldset disabled={!isCompanyOwner} className={styles.lbaControls}>
          <div className={styles.lbaBlock}>
            <label className={styles.lbaLabel} htmlFor="lba-threshold">Alert level</label>
            <p className={styles.lbaHint}>When your balance drops to this many Credits or fewer, you count as running low.</p>

            <div className={styles.lbaStepRow}>
              <div className={styles.lbaStepper}>
                <button type="button" onClick={() => step(-1)} disabled={threshold <= 1} aria-label="Lower the alert level">
                  <Icon name="Minus" size={16} />
                </button>
                <input
                  id="lba-threshold"
                  type="text"
                  inputMode="numeric"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  onBlur={commitDraft}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                  aria-describedby="lba-threshold-range"
                />
                <button type="button" onClick={() => step(1)} disabled={threshold >= MAX_THRESHOLD} aria-label="Raise the alert level">
                  <Icon name="Plus" size={16} />
                </button>
              </div>
              <span className={styles.lbaUnit}>{creditWord(threshold)}</span>
            </div>

            <div className={styles.lbaPresets} role="group" aria-label="Quick picks">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${styles.lbaPreset} ${threshold === n ? styles.on : ''}`}
                  aria-pressed={threshold === n}
                  onClick={() => commitThreshold(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className={styles.lbaRange} id="lba-threshold-range">Any whole number from 1 to {MAX_THRESHOLD}.</p>

            {suggested && (
              <div className={styles.lbaSuggest}>
                <Icon name="Sparkles" size={16} />
                <span>About a week of unlocks at your team’s pace is <b>{formatCredits(suggested)}</b>.</span>
                {threshold === suggested ? (
                  <span className={styles.lbaSuggestOn}><Icon name="Check" size={14} />In use</span>
                ) : (
                  <button type="button" onClick={() => commitThreshold(suggested)}>Use {suggested}</button>
                )}
              </div>
            )}
          </div>

          <div className={`${styles.lbaBlock} ${styles.lbaToggleBlock}`}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => save({ enabled: e.target.checked })}
                aria-describedby="lba-notify-desc"
              />
              <span className={styles.toggleTrack}></span>
            </label>
            <div className={styles.toggleTxt}>
              <b>Notify the team</b>
              <span id="lba-notify-desc">
                A bell notification for everyone on your team when the balance reaches the alert level, and again at zero.
              </span>
            </div>
          </div>

          <ul className={styles.lbaWhere}>
            <li><Icon name="Coins" size={16} />The balance in the header turns amber at the alert level</li>
            <li><Icon name="Bell" size={16} />Each alert is sent once, not on every unlock after it</li>
          </ul>
        </fieldset>

        <aside className={styles.lbaSide} aria-label="How the alert looks right now">
          <div className={`${styles.lbaStatus} ${tone}`}>
            <div className={styles.lbaEyebrow}>Right now</div>
            <div className={styles.lbaBalance}>
              <span className={styles.lbaBalanceValue}>{balanceLoaded ? balance.toLocaleString('sr-RS') : '—'}</span>
              <span className={styles.lbaBalanceUnit}>{creditWord(balance)}</span>
            </div>

            <div className={styles.lbaMeter} aria-hidden="true">
              <span className={styles.lbaMeterFill} style={{ width: `${fillPct}%` }} />
              <span className={styles.lbaMeterMark} style={{ left: `${markerPct}%` }}>
                <span>Alert at {threshold}</span>
              </span>
            </div>

            {balanceLoaded && (
              <div className={styles.lbaState}>
                <Icon name={isOut || isLow ? 'AlertTriangle' : 'CheckCircle'} size={17} />
                <span>
                  {isOut
                    ? <><b>You’re out of Credits.</b> Buy more to keep unlocking profiles.</>
                    : isLow
                      ? <><b>You’re {balance === threshold ? 'at' : 'below'} your alert level.</b> Top up to keep unlocking profiles.</>
                      : <><b>{unlocksToGo} more {unlocksToGo === 1 ? 'unlock' : 'unlocks'}</b> before the alert goes off.</>}
                </span>
              </div>
            )}

            {hasPace && !isOut && (
              <p className={styles.lbaPace}>
                <Icon name="Gauge" size={15} />
                <span>
                  Your team uses {paceLabel(pacePerMonth)}, so{' '}
                  {isLow
                    ? <>your {formatCredits(balance)} {balance === 1 ? 'lasts' : 'last'} <b>{roughDuration(balance / pacePerMonth)}</b>.</>
                    : <>the alert goes off in <b>{roughDuration(unlocksToGo / pacePerMonth)}</b>.</>}
                </span>
              </p>
            )}

            {balanceLoaded && (isOut || isLow) && (
              <button type="button" className={`${styles.btnPrimary} ${styles.lbaBuy}`} onClick={onBuy}>
                <Icon name="Plus" size={16} />Buy Credits
              </button>
            )}
          </div>

          <div className={`${styles.lbaPreview} ${settings.enabled ? '' : styles.off}`}>
            <div className={styles.lbaPreviewHead}>
              <span className={styles.lbaEyebrow}>What your team sees</span>
              {!settings.enabled && <span className={styles.lbaOffBadge}><Icon name="BellOff" size={13} />Off</span>}
            </div>
            <NotificationPreview
              title="You’re running low on Credits"
              description={`${formatCredits(threshold)} left. Top up to keep unlocking profiles.`}
            />
            <NotificationPreview title="You’re out of Credits" description="Buy Credits to keep unlocking profiles." />
            {!settings.enabled && <p className={styles.lbaOffNote}>Bell notifications are off. Only the header balance turns amber.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LowBalanceAlertSettings;
