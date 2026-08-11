import React, { useEffect, useMemo, useState } from 'react';
import Icon from 'components/AppIcon';
import Select from 'components/ui/Select';
import { getAutoRenewal, updateAutoRenewal, listPackages, packageToFrontend } from '../creditsApi';
import styles from '../styles/credits.module.scss';

const AutoRenewalSettings = () => {
  const [autoRenewalEnabled, setAutoRenewalEnabled] = useState(false);
  const [thresholdAmount, setThresholdAmount] = useState('10');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [packages, setPackages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([getAutoRenewal(), listPackages()])
      .then(([settings, pkgRows]) => {
        const pkgs = pkgRows.map(packageToFrontend);
        setPackages(pkgs);
        setAutoRenewalEnabled(!!settings.enabled);
        setThresholdAmount(String(settings.thresholdCredits ?? 10));
        setSelectedPackage(settings.packageId || pkgs[0]?.id || '');
        setEmailNotifications(settings.emailNotify !== false);
        setSmsNotifications(!!settings.smsNotify);
      })
      .catch(() => {});
  }, []);

  const packageOptions = packages.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.credits} Credits · €${p.price.toLocaleString('en-US')})`,
  }));
  const selectedPkgObj = useMemo(() => packages.find((p) => p.id === selectedPackage), [packages, selectedPackage]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateAutoRenewal({
        enabled: autoRenewalEnabled,
        thresholdCredits: parseInt(thresholdAmount, 10) || 10,
        packageId: selectedPackage || undefined,
        emailNotify: emailNotifications,
        smsNotify: smsNotifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch {
      // no-op — button returns to its normal state, user can retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.settingsCard}>
      <div className={styles.settingsHead}>
        <Icon name="RefreshCw" size={24} />
        <div>
          <h3>Credits auto-renewal</h3>
          <p>Set up automatic top-ups so you never run out of Credits</p>
        </div>
      </div>

      <div>
        {/* Enable Auto Renewal */}
        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={autoRenewalEnabled}
              onChange={(e) => setAutoRenewalEnabled(e?.target?.checked)}
            />
            <span className={styles.toggleTrack}></span>
          </label>
          <div className={styles.toggleTxt}>
            <b>Enable auto-renewal</b>
            <span>Automatically buy Credits when your balance drops below a set level</span>
          </div>
        </div>

        {autoRenewalEnabled && (
          <div className={styles.subSetting}>
            {/* Threshold Setting */}
            <div>
              <label className={styles.flabel}>Renewal threshold</label>
              <input
                className={styles.finput}
                type="number"
                value={thresholdAmount}
                onChange={(e) => setThresholdAmount(e?.target?.value)}
                placeholder="10"
                min="1"
                max="50"
              />
              <div className={styles.fdesc}>When your Credits balance drops to this number, a new package will be purchased automatically</div>
            </div>

            {/* Package Selection */}
            <div>
              <label className={styles.flabel}>Package for automatic purchase</label>
              <Select value={selectedPackage} onChange={setSelectedPackage} options={packageOptions} />
              <div className={styles.fdesc}>Choose which package you want purchased automatically</div>
            </div>

            {/* Notification Settings */}
            <div>
              <div className={styles.flabel} style={{ marginBottom: 10 }}>Notifications</div>

              <div style={{ display: 'grid', gap: 10 }}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e?.target?.checked)}
                  />
                  <span className={styles.checkTxt}>
                    Email notifications
                    <span>Send an email when an automatic purchase is made</span>
                  </span>
                </label>

                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e?.target?.checked)}
                  />
                  <span className={styles.checkTxt}>
                    SMS notifications
                    <span>Send an SMS when an automatic purchase is made</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className={styles.previewBox}>
              <div style={{ display: 'flex', gap: '.6em' }}>
                <Icon name="Info" size={20} />
                <div>
                  <b style={{ display: 'block', marginBottom: 4 }}>Settings preview:</b>
                  <ul>
                    <li>• When balance drops to {thresholdAmount} Credits</li>
                    <li>• {
                      selectedPkgObj ? `${selectedPkgObj.credits} Credits (€${selectedPkgObj.price.toLocaleString('en-US')})` : '—'
                    } will be purchased automatically</li>
                    <li>• Notifications: {
                      emailNotifications && smsNotifications ? 'Email and SMS' :
                      emailNotifications ? 'Email only' :
                      smsNotifications ? 'SMS only' : 'Disabled'
                    }</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method Info */}
        <div className={styles.noteRow} style={{ marginTop: 24 }}>
          <Icon name="CreditCard" size={20} />
          <div>
            <b style={{ display: 'block', marginBottom: 4, color: '#0B1A2C' }}>Payment method</b>
            Your preference is saved now. Actually charging your card automatically needs a saved payment method — add one on the Payment tab once card checkout is available.
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.setActions}>
          <button className={styles.btnPrimary} onClick={handleSaveSettings} disabled={saving}>
            <Icon name={saved ? 'Check' : 'Save'} size={16} />{saving ? 'Saving…' : saved ? 'Saved' : 'Save settings'}
          </button>

          <button
            className={styles.btnGhost}
            onClick={() => {
              setAutoRenewalEnabled(false);
              setThresholdAmount('10');
              setSelectedPackage(packages[0]?.id || '');
              setEmailNotifications(true);
              setSmsNotifications(false);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoRenewalSettings;
