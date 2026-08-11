import React, { useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import styles from '../styles/company.module.scss';

const AccountPreferencesTab = ({ preferences, onPreferencesChange, onSave, isSaving, onDeleteAccount, fireToast }) => {
  const clerk = useClerk();
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

  const handlePreferenceChange = (key, value) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const handleNotificationChange = (category, type, value) => {
    const updatedNotifications = {
      ...preferences?.notifications,
      [category]: {
        ...preferences?.notifications?.[category],
        [type]: value
      }
    };
    handlePreferenceChange('notifications', updatedNotifications);
  };

  const languageOptions = [
    { value: 'sr-cyrl', label: 'Serbian (Cyrillic)' },
    { value: 'sr-latn', label: 'Serbian (Latin)' },
    { value: 'en', label: 'English' }
  ];

  const timezoneOptions = [
    { value: 'Europe/Belgrade', label: 'Belgrade (UTC+1)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' }
  ];

  const currencyOptions = [
    { value: 'RSD', label: 'Serbian dinar (RSD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US dollar (USD)' }
  ];

  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const NotificationSection = ({ title, category, settings }) => (
    <div className={styles.notifGrp}>
      <div className={styles.notifGrpTitle}>{title}</div>
      {Object.entries(settings)?.map(([key, setting]) => (
        <div key={key} className={styles.notifRow}>
          <span>{setting?.label}</span>
          <div className={styles.notifCh}>
            <label className={styles.ncheck}>
              <input
                type="checkbox"
                checked={preferences?.notifications?.[category]?.[key]?.email || false}
                onChange={(e) => handleNotificationChange(category, key, {
                  ...preferences?.notifications?.[category]?.[key],
                  email: e?.target?.checked
                })}
              />
              <span className={styles.ncheckBx}><CheckIcon /></span>Email
            </label>
            <label className={styles.ncheck}>
              <input
                type="checkbox"
                checked={preferences?.notifications?.[category]?.[key]?.sms || false}
                onChange={(e) => handleNotificationChange(category, key, {
                  ...preferences?.notifications?.[category]?.[key],
                  sms: e?.target?.checked
                })}
              />
              <span className={styles.ncheckBx}><CheckIcon /></span>SMS
            </label>
            <label className={styles.ncheck}>
              <input
                type="checkbox"
                checked={preferences?.notifications?.[category]?.[key]?.push || false}
                onChange={(e) => handleNotificationChange(category, key, {
                  ...preferences?.notifications?.[category]?.[key],
                  push: e?.target?.checked
                })}
              />
              <span className={styles.ncheckBx}><CheckIcon /></span>Push
            </label>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.stack}>
      {/* Language & Region */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Language & region</div>
        <div className={styles.cardSub}>How the platform is displayed to your team</div>

        <div className={styles.form2}>
          <div className={styles.field}>
            <label className={styles.flabel}>Interface language</label>
            <Select
              value={preferences?.language}
              onChange={(value) => handlePreferenceChange('language', value)}
              options={languageOptions}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Time zone</label>
            <Select
              value={preferences?.timezone}
              onChange={(value) => handlePreferenceChange('timezone', value)}
              options={timezoneOptions}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.flabel}>Currency</label>
            <Select
              value={preferences?.currency}
              onChange={(value) => handlePreferenceChange('currency', value)}
              options={currencyOptions}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Profile privacy</div>
        <div className={styles.cardSub}>Control who can see your company profile</div>

        <div className={styles.toggleRow} style={{ marginTop: 10 }}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences?.showEmployeeCount}
              onChange={(e) => handlePreferenceChange('showEmployeeCount', e?.target?.checked)}
            />
            <span className={styles.toggleTrack}></span>
          </label>
          <div className={styles.toggleTxt}>
            <b>Show employee count</b>
            <span>Allow candidates to see the size of your company</span>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences?.showContactInfo}
              onChange={(e) => handlePreferenceChange('showContactInfo', e?.target?.checked)}
            />
            <span className={styles.toggleTrack}></span>
          </label>
          <div className={styles.toggleTxt}>
            <b>Show contact information</b>
            <span>Allow candidates to see your contact details</span>
          </div>
        </div>

        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences?.showHiringHistory}
              onChange={(e) => handlePreferenceChange('showHiringHistory', e?.target?.checked)}
            />
            <span className={styles.toggleTrack}></span>
          </label>
          <div className={styles.toggleTxt}>
            <b>Show hiring history</b>
            <span>Allow candidates to see your hiring history</span>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Notifications</div>
        <div className={styles.cardSub}>Choose how you want to be notified</div>

        <NotificationSection
          title="Candidate activity"
          category="candidates"
          settings={{
            newApplications: { label: 'New candidate applications' },
            profileViews: { label: 'Company profile views' },
            bookmarks: { label: 'Candidates bookmarked your profile' }
          }}
        />

        <NotificationSection
          title="System & account"
          category="system"
          settings={{
            creditLow: { label: 'Low Credits (fewer than 10)' },
            creditPurchase: { label: 'Credits purchase confirmation' },
            accountUpdates: { label: 'Account updates' }
          }}
        />

        <NotificationSection
          title="Marketing"
          category="marketing"
          settings={{
            newsletters: { label: 'Newsletters and news' },
            promotions: { label: 'Promotions and discounts' },
            surveys: { label: 'Surveys and research' }
          }}
        />
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

        <div className={`${styles.dangerRow} ${styles.dangerRowDel}`}>
          <div className={`${styles.dangerTxt} ${styles.del}`}>
            <b>Delete account</b>
            <span>Permanently delete your account and all associated data</span>
          </div>
          <button className={`${styles.btnSm} ${styles.btnSmRed}`} onClick={onDeleteAccount}>
            <Icon name="Trash2" size={14} />Delete account
          </button>
        </div>
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
