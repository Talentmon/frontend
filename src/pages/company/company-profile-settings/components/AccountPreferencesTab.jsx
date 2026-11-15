import React, { useMemo, useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { getTimezoneOptions } from 'utils/timezones';
import ChangeEmailModal from './ChangeEmailModal';
import SectionHead from './SectionHead';
import YourDevicesCard from './YourDevicesCard';
import { FieldError, Group, Hint } from './FormBits';
import styles from '../styles/company.module.scss';

// Weak / Okay / Strong for the new password — a nudge only; Clerk does the real check.
const STRENGTH = [
  { label: '', color: '#8693a0' },
  { label: 'Weak', color: '#D14343' },
  { label: 'Okay', color: '#E6A93C' },
  { label: 'Strong', color: '#2E9E63' },
];

const strengthLevel = (pw) => {
  if (!pw) return 0;
  if (pw.length < 8) return 1;
  let score = 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 2) return 1;
  return score <= 3 ? 2 : 3;
};

// Account deletion is company-wide (owner-only); language and security are each person's own.
// There's no billing currency to pick: credits are priced and paid in EUR.
// Saved with the page header's Save button on desktop, the one at the bottom on phones.
const AccountPreferencesTab = ({
  preferences,
  onPreferencesChange,
  onSave,
  isSaving,
  onDeleteAccount,
  onLoginEmailChanged,
  fireToast,
  isOwner,
}) => {
  const clerk = useClerk();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShow, setPwShow] = useState(false);
  // On by default: a password usually changes because someone else might know the old one.
  const [pwSignOutOthers, setPwSignOutOthers] = useState(true);
  const [pwBusy, setPwBusy] = useState(false);
  // Bumped after a password change so the devices list drops the signed-out ones.
  const [devicesKey, setDevicesKey] = useState(0);

  const pwTooShort = pwNew.length > 0 && pwNew.length < 8;
  const pwMismatch = pwConfirm.length > 0 && pwConfirm !== pwNew;
  const pwMatch = pwConfirm.length > 0 && pwConfirm === pwNew;
  const level = strengthLevel(pwNew);
  const canUpdate = !!pwCurrent && !!pwNew && !!pwConfirm && !pwTooShort && !pwMismatch;

  const changePassword = async () => {
    if (!canUpdate) return;
    setPwBusy(true);
    try {
      await clerk.user.updatePassword({ currentPassword: pwCurrent, newPassword: pwNew, signOutOfOtherSessions: pwSignOutOthers });
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      fireToast?.(pwSignOutOthers ? 'Password updated — other devices were signed out' : 'Password updated');
      setDevicesKey((k) => k + 1);
    } catch (err) {
      fireToast?.(err?.errors?.[0]?.message || 'Could not update password — check your current password.');
    } finally {
      setPwBusy(false);
    }
  };

  // Recruiters can't clear their name (they gave it when accepting the invite); the owner's is optional.
  const nameMissing = !isOwner && !preferences?.name?.trim();

  const handlePreferenceChange = (key, value) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const timezoneOptions = useMemo(() => getTimezoneOptions(preferences?.timezone), [preferences?.timezone]);

  const lock = <span className={styles.inputLock} title="Can't be changed here"><Icon name="Lock" size={15} /></span>;

  return (
    <div className={styles.stack}>
      {/* Your profile — the name teammates see on what you unlock, save and buy */}
      <div className={styles.card}>
        <SectionHead icon="UserRound" title="Your profile" subtitle="How you appear to your team." />

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="profileName">
              Your name {!isOwner && <span className={styles.req}>*</span>}
            </label>
            <div className={styles.inputIcon}>
              <Icon name="User" size={16} />
              <input
                id="profileName"
                className={nameMissing ? `${styles.finput} ${styles.finvalid}` : styles.finput}
                type="text"
                maxLength={100}
                placeholder="e.g. Jane Smith"
                value={preferences?.name || ''}
                aria-invalid={nameMissing}
                onChange={(e) => handlePreferenceChange('name', e.target.value)}
              />
            </div>
            {nameMissing && <FieldError>Your name is required.</FieldError>}
            <Hint>
              Your team sees it next to what you unlock, save and buy.{isOwner && ' Without a name, they see your email.'}
            </Hint>
          </div>
          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="profileEmail">Login email</label>
            <div className={styles.inputAction}>
              <div className={`${styles.inputIcon} ${styles.inputIconR}`}>
                <Icon name="Mail" size={16} />
                <input id="profileEmail" className={styles.finput} type="email" value={preferences?.email || ''} disabled />
                {lock}
              </div>
              <button type="button" className={styles.btnSm} style={{ height: 42 }} onClick={() => setShowEmailModal(true)}>
                Change
              </button>
            </div>
            <Hint>You sign in with this email.</Hint>
          </div>
        </div>
      </div>

      <ChangeEmailModal
        isVisible={showEmailModal}
        currentEmail={preferences?.email}
        isOwner={isOwner}
        onClose={() => setShowEmailModal(false)}
        onChanged={(email) => {
          setShowEmailModal(false);
          onLoginEmailChanged?.(email);
        }}
      />

      {/* Language & Region */}
      <div className={styles.card}>
        <SectionHead icon="Globe" title="Language and region" subtitle="How the platform is shown to you." />

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="interfaceLanguage">Interface language</label>
            <div className={`${styles.inputIcon} ${styles.inputIconR}`}>
              <Icon name="Languages" size={16} />
              <input id="interfaceLanguage" className={styles.finput} type="text" value="English" disabled />
              {lock}
            </div>
            <Hint>More languages are on the way.</Hint>
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Time zone</label>
            <Select
              value={preferences?.timezone}
              onChange={(value) => handlePreferenceChange('timezone', value)}
              options={timezoneOptions}
              searchable
            />
          </div>
        </div>
      </div>

      <YourDevicesCard fireToast={fireToast} refreshKey={devicesKey} />

      {/* Data & Security */}
      <div className={styles.card}>
        <SectionHead icon="ShieldCheck" title="Data and security" subtitle="Keep your account safe." />

        <Group label="Password">
          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="pwCurrent">Current password</label>
            <div className={styles.inputIcon}>
              <Icon name="Lock" size={16} />
              <input
                id="pwCurrent"
                className={styles.finput}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your current password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
              />
            </div>
          </div>
          <div aria-hidden="true" />

          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="pwNew">New password</label>
            <div className={`${styles.inputIcon} ${styles.inputIconR}`}>
              <Icon name="Lock" size={16} />
              <input
                id="pwNew"
                className={styles.finput}
                type={pwShow ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
              />
              <button
                type="button"
                className={`${styles.inInputBtn} ${styles.inInputBtnGrey}`}
                aria-label={pwShow ? 'Hide password' : 'Show password'}
                title={pwShow ? 'Hide password' : 'Show password'}
                onClick={() => setPwShow((v) => !v)}
              >
                <Icon name={pwShow ? 'EyeOff' : 'Eye'} size={17} strokeWidth={1.9} />
              </button>
            </div>
            {pwNew && (
              <div className={styles.pwStrength}>
                <span className={styles.pwBars} aria-hidden="true">
                  {[1, 2, 3].map((i) => (
                    <span key={i} style={i <= level ? { background: STRENGTH[level].color } : undefined} />
                  ))}
                </span>
                <span className={styles.pwLevel} style={{ color: STRENGTH[level].color }} aria-live="polite">
                  {STRENGTH[level].label}
                </span>
              </div>
            )}
            {pwTooShort && <Hint>Use at least 8 characters.</Hint>}
          </div>

          <div className={styles.field}>
            <label className={styles.flabel} htmlFor="pwConfirm">Confirm new password</label>
            <div className={styles.inputIcon}>
              <Icon name="Lock" size={16} />
              <input
                id="pwConfirm"
                className={pwMismatch ? `${styles.finput} ${styles.finvalid}` : styles.finput}
                type={pwShow ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Type the new password again"
                value={pwConfirm}
                aria-invalid={pwMismatch}
                onChange={(e) => setPwConfirm(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
              />
            </div>
            {pwMismatch && <FieldError>The passwords don't match yet.</FieldError>}
            {pwMatch && (
              <span className={styles.okMsg} style={{ marginTop: 6, fontSize: 12.5, fontWeight: 400 }}>
                <Icon name="Check" size={13} strokeWidth={2.6} />
                Passwords match.
              </span>
            )}
            <Hint>Type it again. Pasting is turned off here.</Hint>
          </div>

          <div className={styles.pwFoot}>
            <label className={styles.pwOthers}>
              <input type="checkbox" checked={pwSignOutOthers} onChange={(e) => setPwSignOutOthers(e.target.checked)} />
              <span className={`${styles.bCheck} ${pwSignOutOthers ? styles.checked : ''}`}><Icon name="Check" size={12} strokeWidth={3.4} /></span>
              Sign out of all other devices
            </label>
            <button type="button" className={styles.btnGold} disabled={pwBusy || !canUpdate} onClick={changePassword}>
              <Icon name="KeyRound" size={16} />
              {pwBusy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </Group>

        <Group label="Sign-in protection" grid={false}>
          <div className={styles.switchRow}>
            <div className={styles.switchText}>
              <b id="tfaLabel">Two-factor authentication (2FA)</b>
              <span>Add an extra layer of security to your account</span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                role="switch"
                aria-labelledby="tfaLabel"
                checked={!!preferences?.twoFactorEnabled}
                onChange={(e) => handlePreferenceChange('twoFactorEnabled', e?.target?.checked)}
              />
              <span className={styles.toggleTrack}></span>
            </label>
          </div>
        </Group>

        {isOwner && (
          <Group label="Danger zone" grid={false}>
            <div className={styles.dangerBox}>
              <span className={styles.dangerIcon} aria-hidden="true"><Icon name="Trash2" size={18} /></span>
              <div className={styles.dangerText}>
                <b>Delete company account</b>
                <span>Removes the company profile and any remaining credits. Everyone on your team loses access.</span>
              </div>
              <button type="button" className={styles.btnRedGhost} onClick={onDeleteAccount}>Delete account…</button>
            </div>
          </Group>
        )}
      </div>

      {/* Phones/tablets only — on desktop the page header's Save is always in view */}
      <div className={styles.saveBottom}>
        <button className={styles.btnPrimary} onClick={onSave} disabled={isSaving}>
          <Icon name="Save" size={16} />{isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

export default AccountPreferencesTab;
