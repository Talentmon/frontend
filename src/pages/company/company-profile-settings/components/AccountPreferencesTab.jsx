import React, { useMemo, useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { getTimezoneOptions } from 'utils/timezones';
import { BILLING_CURRENCY_OPTIONS } from '../companyApi';
import ChangeEmailModal from './ChangeEmailModal';
import styles from '../styles/company.module.scss';

// Billing currency and account deletion are company-wide (owner-only); language and security are each person's own.
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
  const [pwBusy, setPwBusy] = useState(false);

  const changePassword = async () => {
    if (!pwCurrent || !pwNew) return;
    setPwBusy(true);
    try {
      await clerk.user.updatePassword({ currentPassword: pwCurrent, newPassword: pwNew, signOutOfOtherSessions: false });
      setPwCurrent('');
      setPwNew('');
      fireToast?.('Password updated');
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

  return (
    <div className={styles.stack}>
      {/* Your profile — the name teammates see on what you unlock, save and buy */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Your profile</div>
        <div className={styles.cardSub}>Shown to your team next to what you unlock, save and buy — without a name they see your email</div>

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel}>Your name {!isOwner && <span className={styles.req}>*</span>}</label>
            <input
              className={nameMissing ? `${styles.finput} ${styles.finvalid}` : styles.finput}
              type="text"
              maxLength={100}
              placeholder="e.g. Ana Jovanović"
              value={preferences?.name || ''}
              onChange={(e) => handlePreferenceChange('name', e.target.value)}
            />
            {nameMissing && <span className={styles.ferr}>Your name is required.</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.flabel}>Login email</label>
            <div className={styles.inputAction}>
              <input className={styles.finput} type="email" value={preferences?.email || ''} disabled />
              <button type="button" className={styles.btnSm} onClick={() => setShowEmailModal(true)}>Change</button>
            </div>
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
        <div className={styles.cardTitle}>Language & region</div>
        <div className={styles.cardSub}>How the platform is displayed to you</div>

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel}>Interface language</label>
            <input className={styles.finput} type="text" value="English" disabled />
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

      {/* Billing currency — company-wide, everyone sees it, only the owner changes it */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Billing currency</div>
        <div className={styles.cardSub}>Credit packages are priced and paid in this currency — for the whole team</div>

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel}>Currency</label>
            <Select
              value={preferences?.currency}
              onChange={(value) => handlePreferenceChange('currency', value)}
              options={BILLING_CURRENCY_OPTIONS}
              disabled={!isOwner}
            />
            {!isOwner && <span className={styles.fhint}>Only the account owner can change this.</span>}
          </div>
        </div>
      </div>

      {/* Data & Security */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Data & security</div>
        <div className={styles.cardSub}>Keep your account secure</div>

        <div className={styles.form2} style={{ marginBottom: 8 }}>
          <div className={styles.field}>
            <label className={styles.flabel}>Current password</label>
            <input
              className={styles.finput}
              type="password"
              placeholder="Enter your current password"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>New password</label>
            <input
              className={styles.finput}
              type="password"
              placeholder="Enter your new password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <button className={styles.btnSm} disabled={pwBusy || !pwCurrent || !pwNew} onClick={changePassword}>
            {pwBusy ? 'Updating…' : 'Update password'}
          </button>
        </div>

        <div className={`${styles.toggleRow} ${styles.forceBorder}`}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences?.twoFactorEnabled}
              onChange={(e) => handlePreferenceChange('twoFactorEnabled', e?.target?.checked)}
            />
            <span className={styles.toggleTrack}></span>
          </label>
          <div className={styles.toggleTxt}>
            <b>Two-factor authentication (2FA)</b>
            <span>Add an extra layer of security to your account</span>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences?.loginNotifications}
              onChange={(e) => handlePreferenceChange('loginNotifications', e?.target?.checked)}
            />
            <span className={styles.toggleTrack}></span>
          </label>
          <div className={styles.toggleTxt}>
            <b>Login notifications</b>
            <span>Receive notifications when someone logs into your account</span>
          </div>
        </div>

        {isOwner && (
          <div className={`${styles.dangerRow} ${styles.dangerRowDel}`}>
            <div className={`${styles.dangerTxt} ${styles.del}`}>
              <b>Delete account</b>
              <span>Permanently delete the company account and all associated data — the whole team loses access</span>
            </div>
            <button className={`${styles.btnSm} ${styles.btnSmRed}`} onClick={onDeleteAccount}>
              <Icon name="Trash2" size={14} />Delete account
            </button>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className={styles.btnPrimary} onClick={onSave} disabled={isSaving}>
          <Icon name="Save" size={16} />{isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

export default AccountPreferencesTab;
