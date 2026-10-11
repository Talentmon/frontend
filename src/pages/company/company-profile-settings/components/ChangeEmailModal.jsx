import React, { useEffect, useRef, useState } from 'react';
import { useReverification, useUser } from '@clerk/clerk-react';
import { isReverificationCancelledError } from '@clerk/clerk-react/errors';
import Icon from 'components/AppIcon';
import { changeLoginEmail } from '../companyApi';
import styles from '../styles/company.module.scss';

const clerkError = (err, fallback) => err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || fallback;
const isVerified = (address) => address?.verification?.status === 'verified';

/**
 * Two steps. Clerk adds the new address and emails it a code — only Clerk can
 * send that, so it runs here in the browser. Then the backend re-checks the
 * password and makes the new address the login (POST /auth/me/email), which
 * also removes the old one and updates the team list (and, for the owner,
 * the company email).
 */
const ChangeEmailModal = ({ isVisible, currentEmail, isOwner, onClose, onChanged }) => {
  const { user } = useUser();
  const [step, setStep] = useState('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pendingAddress = useRef(null);

  // Clerk may ask the user to confirm it's them before adding an address — this shows its own prompt when it does.
  const addEmail = useReverification((clerkUser, email) => clerkUser.createEmailAddress({ email }));

  useEffect(() => {
    pendingAddress.current = address;
  }, [address]);

  useEffect(() => {
    if (isVisible) return undefined;
    // Closed before finishing: don't leave the half-added address on the account.
    pendingAddress.current?.destroy?.().catch(() => {});
    pendingAddress.current = null;
    setStep('email');
    setNewEmail('');
    setCode('');
    setPassword('');
    setAddress(null);
    setError('');
    setNote('');
    return undefined;
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return undefined;
    const handleKeyDown = (e) => {
      if (e?.key === 'Escape' && !busy) onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, busy, onClose]);

  if (!isVisible) return null;

  const sendCode = async (e) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (email === (currentEmail || '').toLowerCase()) {
      setError('That is already your login email.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      // A try that was cut short may have left this address on the account — reuse it.
      let added = user.emailAddresses.find((a) => a.emailAddress.toLowerCase() === email);
      if (!added) added = await addEmail(user, email);
      if (!isVerified(added)) await added.prepareVerification({ strategy: 'email_code' });
      setAddress(added);
      setStep('code');
      setNote('');
    } catch (err) {
      if (!isReverificationCancelledError(err)) setError(clerkError(err, 'Could not send the code — please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setError('');
    try {
      await address.prepareVerification({ strategy: 'email_code' });
      setNote('New code sent.');
    } catch (err) {
      setError(clerkError(err, 'Could not send a new code — please try again.'));
    }
  };

  const pickDifferentAddress = () => {
    address?.destroy?.().catch(() => {});
    setAddress(null);
    setStep('email');
    setCode('');
    setError('');
    setNote('');
  };

  const confirm = async (e) => {
    e.preventDefault();
    if (!isVerified(address) && !code.trim()) {
      setError('Enter the code from the email.');
      return;
    }
    if (!password) {
      setError('Enter your current password.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      let verified = address;
      if (!isVerified(verified)) {
        verified = await address.attemptVerification({ code: code.trim() });
        setAddress(verified);
      }
      const { email } = await changeLoginEmail(verified.id, password);
      pendingAddress.current = null; // it's the login now — nothing to clean up
      setAddress(null);
      await user.reload().catch(() => {});
      onChanged?.(email);
    } catch (err) {
      setError(err?.response?.data?.message || clerkError(err, 'Could not change your email — please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e?.target === e?.currentTarget && !busy) onClose?.(); }}>
      <div className={styles.dmodal} role="dialog" aria-modal="true" aria-labelledby="changeEmailTitle">
        <div className={styles.mHead}>
          <div className={styles.mHeadTop}>
            <div className={`${styles.mIcon} ${styles.mIconGold}`}>
              <Icon name="Mail" size={23} />
            </div>
            <div className={styles.mHtext}>
              <p className={`${styles.mEyebrow} ${styles.mEyebrowGold}`}>Login email</p>
              <h2 className={styles.mTitle} id="changeEmailTitle">Change login email</h2>
            </div>
            <button className={styles.mClose} onClick={onClose} disabled={busy} aria-label="Close">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className={styles.mSub}>
            {step === 'email' ? (
              <>You&apos;ll sign in with the new address. We&apos;ll email it a code to confirm it&apos;s yours.</>
            ) : (
              <>Enter the code we sent to <b>{address?.emailAddress}</b>, then your current password.</>
            )}
          </div>
        </div>

        <div className={styles.mBody}>
          {step === 'email' ? (
            <form onSubmit={sendCode} noValidate>
              <div className={styles.mFields}>
                <div className={styles.field}>
                  <label className={styles.flabel} htmlFor="newLoginEmail">New email</label>
                  <input
                    id="newLoginEmail"
                    className={styles.finput}
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setError(''); }}
                    autoFocus
                  />
                  <span className={styles.fhint}>Now: {currentEmail}</span>
                </div>
              </div>
              {error && <div className={styles.mError}>{error}</div>}
              <div className={styles.mActions}>
                <button type="submit" className={styles.btnPrimary} disabled={busy || !user}>
                  <Icon name="Send" size={16} />{busy ? 'Sending…' : 'Send code'}
                </button>
                <button type="button" className={styles.btnCancel} onClick={onClose} disabled={busy}>Cancel</button>
              </div>
            </form>
          ) : (
            <form onSubmit={confirm} noValidate>
              <div className={styles.mFields}>
                <div className={styles.field}>
                  <label className={styles.flabel} htmlFor="emailCode">Code from the email</label>
                  {isVerified(address) ? (
                    <div className={styles.fhint} style={{ marginTop: 0 }}>Code confirmed.</div>
                  ) : (
                    <input
                      id="emailCode"
                      className={styles.finput}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                      autoFocus
                    />
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.flabel} htmlFor="emailChangePassword">Current password</label>
                  <input
                    id="emailChangePassword"
                    className={styles.finput}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  />
                </div>
              </div>
              <div className={styles.mLinks}>
                {!isVerified(address) ? (
                  <button type="button" className={styles.teamAction} onClick={resendCode} disabled={busy}>Resend code</button>
                ) : <span />}
                <button type="button" className={styles.teamAction} onClick={pickDifferentAddress} disabled={busy}>
                  Use a different address
                </button>
              </div>
              {error && <div className={styles.mError}>{error}</div>}
              {note && !error && <div className={styles.fhint} style={{ margin: '-8px 0 16px' }}>{note}</div>}
              <div className={styles.mActions}>
                <button type="submit" className={styles.btnPrimary} disabled={busy}>
                  <Icon name="Check" size={16} />{busy ? 'Saving…' : 'Change email'}
                </button>
                <button type="button" className={styles.btnCancel} onClick={onClose} disabled={busy}>Cancel</button>
              </div>
            </form>
          )}

          <div className={styles.mFoot}>
            <Icon name="Lock" size={13} />
            {isOwner ? 'The company email changes with it' : 'Your old address stops working for sign-in right away'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeEmailModal;
