import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import apiClient from '../../../lib/apiClient';
import { homePathFor, useCurrentUser } from '../../../lib/CurrentUserContext';
import { setRememberLogin } from '../../../lib/rememberMe';
import './styles.scss';

function firstClerkError(err, fallback) {
  return err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || fallback;
}

const PwToggle = ({ on, onClick }) => (
  <button
    type="button"
    className={`pw-toggle${on ? ' on' : ''}`}
    aria-label={on ? 'Hide password' : 'Show password'}
    onClick={onClick}
  >
    <svg className="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
    <svg className="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 7 10 7a14 14 0 0 1-2.3 3M6.6 6.6A14 14 0 0 0 2 13s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1M3 3l18 18" /></svg>
  </button>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();
  const { isSignedIn, loading: currentUserLoading, role, company, refetch } = useCurrentUser();

  const [uiRole, setRole] = useState('hr'); // 'hr' | 'candidate' — matches existing UI naming
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState('form'); // 'form' | 'verify' | 'login-code' | 'reset-request' | 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingRole, setPendingRole] = useState(null); // role picked at signup, applied after verification
  const [pendingCompanyName, setPendingCompanyName] = useState(''); // company signups only, sent with the role
  const [almostCompanyName, setAlmostCompanyName] = useState(''); // "Almost there" screen's own Company name input
  const [resetEmail, setResetEmail] = useState(''); // forgot-password flow
  const [resetCode, setResetCode] = useState('');
  const [secondFactor, setSecondFactor] = useState(null); // { emailAddressId, email } while a login waits for its emailed code
  const [loginCode, setLoginCode] = useState('');
  const emailRef = useRef(null);

  useEffect(() => {
    const t = searchParams?.get('tab');
    setRole(t === 'candidate' ? 'candidate' : 'hr');
    const m = searchParams?.get('mode');
    if (m === 'signup' || m === 'login') setMode(m);
  }, [searchParams]);

  // Already signed in with a completed profile — no reason to see the login form.
  useEffect(() => {
    if (!currentUserLoading && isSignedIn && role) {
      navigate(homePathFor(role, company), { replace: true });
    }
  }, [currentUserLoading, isSignedIn, role, company, navigate]);

  const switchMode = (m) => {
    setMode(m);
    setStep('form');
    setNote('');
    setErrors({});
  };

  const switchRole = (r) => {
    setRole(r);
    setMode('login');
    setStep('form');
    setNote('');
    setErrors({});
  };

  const finishWithRole = async (chosenRole, companyName) => {
    try {
      await apiClient.post('/auth/complete-profile', {
        role: chosenRole,
        ...(chosenRole === 'COMPANY' ? { companyName } : {}),
      });
    } catch (err) {
      // 409 = role was already set by an earlier attempt (e.g. a retry after
      // the "already signed in" race below) — treat as already-done, not an error.
      if (err?.response?.status !== 409) throw err;
    }
    await refetch();
    // A brand-new company profile is never complete yet, so this sends a
    // company straight to its profile settings.
    navigate(homePathFor(chosenRole, null));
  };

  function isAlreadySignedInError(err) {
    return /already signed in/i.test(firstClerkError(err, ''));
  }

  // Clerk's Client Trust: a password login from a browser it hasn't seen
  // before also needs a code emailed to the account. Sends that code and
  // opens the code step; false if the account needs a factor we don't offer.
  const startEmailSecondFactor = async (attempt) => {
    const factor = attempt.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
    if (!factor) return false;
    await signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
    setSecondFactor({ emailAddressId: factor.emailAddressId, email: factor.safeIdentifier });
    setLoginCode('');
    setNote('');
    setStep('login-code');
    return true;
  };

  const handleLoginSubmit = async (email, password, remember) => {
    if (!signInLoaded) throw new Error('Still loading — please try again in a moment.');
    // Before the session goes active — CurrentUserProvider checks it as soon as isSignedIn flips.
    setRememberLogin(remember);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'needs_second_factor' && (await startEmailSecondFactor(result))) return;
      if (result.status !== 'complete') {
        setNote('Additional verification is required for this account.');
        return;
      }
      await setActiveSignIn({ session: result.createdSessionId });
      // useCurrentUser() picks up the new session and the effect above navigates once role loads.
    } catch (err) {
      if (!isAlreadySignedInError(err)) throw err;
      // A session from an earlier step (e.g. a signup that didn't finish
      // redirecting) is still active — just re-sync our state instead of
      // erroring; the auto-redirect effect takes it from here.
      await refetch();
    }
  };

  // `name` is the candidate's full name, or the company name for a company
  // signup — a company account is the company itself, not a person, so no
  // personal name goes to Clerk for it (the company name goes to our backend
  // with the role instead, after verification).
  const handleSignupSubmit = async (name, email, password) => {
    if (!signUpLoaded) throw new Error('Still loading — please try again in a moment.');
    if (uiRole === 'hr') {
      await signUp.create({ emailAddress: email, password });
      setPendingCompanyName(name);
    } else {
      const [firstName, ...rest] = name.split(' ');
      await signUp.create({ emailAddress: email, password, firstName, lastName: rest.join(' ') || undefined });
    }
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    setPendingRole(uiRole === 'hr' ? 'COMPANY' : 'CANDIDATE');
    setStep('verify');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setNote('');
    const els = e.target.elements;
    const email = els.email?.value?.trim().toLowerCase() || '';
    const password = els.password?.value || '';

    if (mode === 'login') {
      const nextErrors = {};
      if (!email) nextErrors.email = 'This field is required.';
      if (!password) nextErrors.password = 'This field is required.';
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      setSubmitting(true);
      try {
        await handleLoginSubmit(email, password, !!els.remember?.checked);
      } catch (err) {
        setNote(firstClerkError(err, 'Invalid email or password.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ---- signup ----
    const nameField = uiRole === 'hr' ? 'companyName' : 'fullName';
    const name = els[nameField]?.value?.trim() || '';
    const confirmPassword = els.confirmPassword?.value || '';
    const termsAccepted = !!els.terms?.checked;

    const nextErrors = {};
    if (!name) nextErrors[nameField] = 'This field is required.';
    if (!email) nextErrors.email = 'This field is required.';
    else if (!email.includes('@')) nextErrors.email = 'Enter a valid email.';
    if (!password) nextErrors.password = 'This field is required.';
    else if (password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.';
    if (!termsAccepted) nextErrors.terms = 'You must accept the Terms and Conditions.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNote('Please fix the highlighted fields.');
      return;
    }

    setSubmitting(true);
    try {
      await handleSignupSubmit(name, email, password);
    } catch (err) {
      setNote(firstClerkError(err, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e?.preventDefault();
    if (!signUpLoaded || !verifyCode) return;
    setNote('');
    setSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verifyCode });
      if (result.status !== 'complete') {
        setNote('That code did not work — check it and try again.');
        return;
      }
      // The signup form has no "Remember me" — a fresh account stays signed in.
      setRememberLogin(true);
      if (result.createdSessionId) {
        try {
          await setActiveSignUp({ session: result.createdSessionId });
        } catch (activateErr) {
          // Clerk sometimes activates the session automatically as part of
          // completing verification — a redundant setActive() throws
          // "already signed in" here, which is fine to ignore.
          if (!isAlreadySignedInError(activateErr)) throw activateErr;
        }
      }
      await finishWithRole(pendingRole, pendingCompanyName);
    } catch (err) {
      setNote(firstClerkError(err, 'That code did not work — check it and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUpLoaded) return;
    setNote('');
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setNote('New code sent.');
    } catch (err) {
      setNote(firstClerkError(err, 'Could not resend the code.'));
    }
  };

  const handleLoginCodeSubmit = async (e) => {
    e?.preventDefault();
    if (!signInLoaded || !loginCode) return;
    setNote('');
    setSubmitting(true);
    try {
      const result = await signIn.attemptSecondFactor({ strategy: 'email_code', code: loginCode });
      if (result.status !== 'complete') {
        setNote('That code did not work — check it and try again.');
        return;
      }
      await setActiveSignIn({ session: result.createdSessionId });
      // Same as a normal login: the redirect effect above takes it from here.
    } catch (err) {
      setNote(firstClerkError(err, 'That code did not work — check it and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendLoginCode = async () => {
    if (!signInLoaded || !secondFactor) return;
    setNote('');
    try {
      await signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: secondFactor.emailAddressId });
      setLoginCode('');
      setNote('New code sent.');
    } catch (err) {
      setNote(firstClerkError(err, 'Could not resend the code.'));
    }
  };

  // ---- forgot password ----
  // Clerk emails a 6-digit code; the code + a new password then sign the
  // person straight in, and every other device is signed out.
  const openForgotPassword = () => {
    setResetEmail(emailRef.current?.value?.trim() || '');
    setResetCode('');
    setNote('');
    setErrors({});
    setStep('reset-request');
  };

  const sendResetCode = (email) => signIn.create({ strategy: 'reset_password_email_code', identifier: email });

  const handleResetRequest = async (e) => {
    e?.preventDefault();
    if (!signInLoaded) return;
    const email = resetEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrors({ resetEmail: email ? 'Enter a valid email.' : 'This field is required.' });
      return;
    }
    setErrors({});
    setNote('');
    setSubmitting(true);
    try {
      await sendResetCode(email);
      setResetEmail(email);
      setResetCode('');
      setStep('reset');
    } catch (err) {
      setNote(firstClerkError(err, 'Could not send the reset code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e?.preventDefault();
    if (!signInLoaded) return;
    setNote('');
    const els = e.target.elements;
    const password = els.newPassword?.value || '';
    const confirmPassword = els.confirmNewPassword?.value || '';

    const nextErrors = {};
    if (!resetCode) nextErrors.resetCode = 'This field is required.';
    if (!password) nextErrors.newPassword = 'This field is required.';
    else if (password.length < 8) nextErrors.newPassword = 'Use at least 8 characters.';
    if (!confirmPassword) nextErrors.confirmNewPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) nextErrors.confirmNewPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      // An accepted code is spent — if Clerk then rejected the new password
      // (e.g. found in a data breach), a retry only resends the password.
      let result = signIn.status === 'needs_new_password'
        ? signIn
        : await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code: resetCode });
      if (result.status === 'needs_new_password') {
        result = await signIn.resetPassword({ password, signOutOfOtherSessions: true });
      }
      if (result.status === 'needs_second_factor') {
        setRememberLogin(!!els.remember?.checked);
        if (await startEmailSecondFactor(result)) return;
      }
      if (result.status !== 'complete') {
        switchMode('login');
        setNote('Your password was changed — log in with it to continue.');
        return;
      }
      setRememberLogin(!!els.remember?.checked);
      await setActiveSignIn({ session: result.createdSessionId });
      // Same as a normal login: the redirect effect above takes it from here.
    } catch (err) {
      setNote(firstClerkError(err, 'Could not reset your password — check the code and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendResetCode = async () => {
    if (!signInLoaded) return;
    setNote('');
    try {
      await sendResetCode(resetEmail);
      setResetCode('');
      setNote('New code sent.');
    } catch (err) {
      setNote(firstClerkError(err, 'Could not resend the code.'));
    }
  };

  // Signed in via Clerk but the account never picked a role (e.g. closed the
  // tab mid-signup before verification). Let them finish without re-entering
  // a password — the Clerk session already exists.
  if (!currentUserLoading && isSignedIn && !role) {
    return (
      <div className="auth-page" data-role={uiRole}>
        <div className="auth">
          <main className="auth-main">
            <div className="auth-card">
              <div className="card-head">
                <h2>Almost there</h2>
                <p>Your account exists — just pick how you&apos;ll use Talentmon.</p>
              </div>
              <div className="tabs" role="tablist" aria-label="Choose account type">
                <span className={`tab-ind${uiRole === 'hr' ? ' to-hr' : ''}`} aria-hidden="true" />
                <button type="button" className={`tab${uiRole === 'candidate' ? ' on' : ''}`} role="tab" onClick={() => setRole('candidate')}>Candidate</button>
                <button type="button" className={`tab${uiRole === 'hr' ? ' on' : ''}`} role="tab" onClick={() => setRole('hr')}>Company</button>
              </div>
              {uiRole === 'hr' && (
                <div className={`field${errors.almostCompanyName ? ' invalid' : ''}`}>
                  <label htmlFor="almostCompanyName">Company name</label>
                  <div className="ctrl">
                    <input
                      id="almostCompanyName"
                      type="text"
                      autoComplete="organization"
                      placeholder="Acme d.o.o."
                      value={almostCompanyName}
                      onChange={(e) => {
                        setAlmostCompanyName(e.target.value);
                        setErrors((prev) => ({ ...prev, almostCompanyName: undefined }));
                      }}
                    />
                  </div>
                  {errors.almostCompanyName && <span className="field-hint error">{errors.almostCompanyName}</span>}
                </div>
              )}
              <button
                type="button"
                className="btn-submit"
                disabled={submitting}
                onClick={async () => {
                  const companyName = almostCompanyName.trim();
                  if (uiRole === 'hr' && !companyName) {
                    setErrors((prev) => ({ ...prev, almostCompanyName: 'This field is required.' }));
                    return;
                  }
                  setSubmitting(true);
                  try {
                    await finishWithRole(uiRole === 'hr' ? 'COMPANY' : 'CANDIDATE', companyName);
                  } catch (err) {
                    setNote(firstClerkError(err, 'Something went wrong.'));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <span>Continue</span>
              </button>
              <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" data-role={uiRole}>
      <Helmet>
        <title>Log in · Talentmon</title>
      </Helmet>

      <div className="auth">
        {/* ===== ASIDE ===== */}
        <aside className="auth-aside">
          <div className="aside-brand">
            <a href="/landing-page" className="brand">
              <span className="mark">
                <img src="/assets/images/talentmon.png" alt="Talentmon" />
              </span>
              <span>Talent<b>mon</b></span>
            </a>
          </div>

          <div className="aside-body">
            <div className={`role-block${uiRole === 'hr' ? ' on' : ''}`}>
              <span className="aside-eyebrow">For HR &amp; companies</span>
              <h1>Find <span className="u">top talent</span>.</h1>
              <p>Jump back into your search — browse pre-screened candidates, check your credits, and unlock the matches that fit.</p>
              <ul className="aside-list">
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>Search without posting a job</li>
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>Pay only when you unlock a match</li>
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>Candidates ranked by match score</li>
              </ul>
            </div>

            <div className={`role-block${uiRole === 'candidate' ? ' on' : ''}`}>
              <span className="aside-eyebrow">For candidates</span>
              <h1>Get <span className="u">discovered</span>.</h1>
              <p>Pick up where you left off — refresh your profile, set your availability, and let the right companies come to you.</p>
              <ul className="aside-list">
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>One profile, instant standardized CV</li>
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>You control who can see you</li>
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>See who&apos;s viewed and saved you</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <main className="auth-main">
          <div className="auth-topbar">
            <a href="/landing-page" className="brand">
              <span className="mark">
                <img src="/assets/images/talentmon.png" alt="Talentmon" />
              </span>
              <span>Talent<b>mon</b></span>
            </a>
            <a href="/landing-page" className="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Site
            </a>
          </div>

          <div className="auth-top">
            <a href="/landing-page" className="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              Back to site
            </a>
          </div>

          <div className="auth-card">
            {step === 'verify' && (
              <>
                <div className="card-head">
                  <h2>Check your email</h2>
                  <p>We sent a 6-digit code to confirm your address.</p>
                </div>
                <form onSubmit={handleVerifySubmit} noValidate>
                  <div className="field">
                    <label htmlFor="verifyCode">Verification code</label>
                    <div className="ctrl">
                      <input
                        id="verifyCode"
                        name="verifyCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.trim())}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-submit" disabled={submitting || !signUpLoaded}>
                    <span>Confirm &amp; continue</span>
                    <ArrowIcon />
                  </button>
                  <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
                </form>
                <div className="card-foot">
                  <span>Didn&apos;t get it? <button type="button" className="link-btn" onClick={handleResendCode}>Resend code →</button></span>
                </div>
              </>
            )}

            {step === 'login-code' && (
              <>
                <div className="card-head">
                  <h2>Check your email</h2>
                  <p>You&apos;re logging in from a new device or browser, so we sent a 6-digit code to {secondFactor?.email} to make sure it&apos;s you.</p>
                </div>
                <form onSubmit={handleLoginCodeSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="loginCode">Verification code</label>
                    <div className="ctrl">
                      <input
                        id="loginCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={loginCode}
                        onChange={(e) => setLoginCode(e.target.value.trim())}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-submit" disabled={submitting || !signInLoaded || !loginCode}>
                    <span>{submitting ? 'Please wait…' : 'Confirm & log in'}</span>
                    <ArrowIcon />
                  </button>
                  <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
                </form>
                <div className="card-foot">
                  <span>
                    Didn&apos;t get it? <button type="button" className="link-btn" onClick={handleResendLoginCode}>Resend code →</button>
                    {' · '}
                    <button type="button" className="link-btn" onClick={() => switchMode('login')}>Back to log in</button>
                  </span>
                </div>
              </>
            )}

            {step === 'reset-request' && (
              <>
                <div className="card-head">
                  <h2>Reset your password</h2>
                  <p>Enter your account email and we&apos;ll send you a 6-digit code.</p>
                </div>
                <form onSubmit={handleResetRequest} noValidate>
                  <div className={`field${errors.resetEmail ? ' invalid' : ''}`}>
                    <label htmlFor="resetEmail">Email</label>
                    <div className="ctrl">
                      <input
                        id="resetEmail"
                        type="email"
                        autoComplete="email"
                        placeholder="you@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    {errors.resetEmail && <span className="field-hint error">{errors.resetEmail}</span>}
                  </div>
                  <button type="submit" className="btn-submit" disabled={submitting || !signInLoaded}>
                    <span>{submitting ? 'Please wait…' : 'Send code'}</span>
                    <ArrowIcon />
                  </button>
                  <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
                </form>
                <div className="card-foot">
                  <span>Remembered it? <button type="button" className="link-btn" onClick={() => switchMode('login')}>Back to log in →</button></span>
                </div>
              </>
            )}

            {step === 'reset' && (
              <>
                <div className="card-head">
                  <h2>Set a new password</h2>
                  <p>We sent a 6-digit code to {resetEmail}.</p>
                </div>
                <form onSubmit={handleResetSubmit} noValidate>
                  <div className={`field${errors.resetCode ? ' invalid' : ''}`}>
                    <label htmlFor="resetCode">Code from the email</label>
                    <div className="ctrl">
                      <input
                        id="resetCode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.trim())}
                        required
                      />
                    </div>
                    {errors.resetCode && <span className="field-hint error">{errors.resetCode}</span>}
                  </div>

                  <div className={`field${errors.newPassword ? ' invalid' : ''}`}>
                    <label htmlFor="newPassword">New password</label>
                    <div className="ctrl">
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                      />
                      <PwToggle on={showPassword} onClick={() => setShowPassword((v) => !v)} />
                    </div>
                    {errors.newPassword && <span className="field-hint error">{errors.newPassword}</span>}
                  </div>

                  <div className={`field${errors.confirmNewPassword ? ' invalid' : ''}`}>
                    <label htmlFor="confirmNewPassword">Confirm new password</label>
                    <div className="ctrl">
                      <input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        onPaste={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        required
                      />
                      <PwToggle on={showConfirmPassword} onClick={() => setShowConfirmPassword((v) => !v)} />
                    </div>
                    {errors.confirmNewPassword ? (
                      <span className="field-hint error">{errors.confirmNewPassword}</span>
                    ) : (
                      <span className="field-hint">Type it again — pasting is disabled here.</span>
                    )}
                  </div>

                  <div className="row-between">
                    <label className="remember">
                      <input type="checkbox" name="remember" />
                      <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M20 6 9 17l-5-5" /></svg></span>
                      Remember me
                    </label>
                    <button type="button" className="forgot" onClick={() => switchMode('login')}>Back to log in</button>
                  </div>

                  <button type="submit" className="btn-submit" disabled={submitting || !signInLoaded}>
                    <span>{submitting ? 'Please wait…' : 'Save password & log in'}</span>
                    <ArrowIcon />
                  </button>
                  <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
                </form>
                <div className="card-foot">
                  <span>Didn&apos;t get it? <button type="button" className="link-btn" onClick={handleResendResetCode}>Resend code →</button></span>
                </div>
              </>
            )}

            {step === 'form' && (
              <>
                {/* TABS */}
                <div className="tabs" role="tablist" aria-label="Choose account type">
                  <span className={`tab-ind${uiRole === 'hr' ? ' to-hr' : ''}`} aria-hidden="true" />
                  <button
                    type="button"
                    className={`tab${uiRole === 'candidate' ? ' on' : ''}`}
                    role="tab"
                    aria-selected={uiRole === 'candidate'}
                    onClick={() => switchRole('candidate')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                    Candidate
                  </button>
                  <button
                    type="button"
                    className={`tab${uiRole === 'hr' ? ' on' : ''}`}
                    role="tab"
                    aria-selected={uiRole === 'hr'}
                    onClick={() => switchRole('hr')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    Company
                  </button>
                </div>

                {/* HEADING */}
                <div className="card-head">
                  {mode === 'signup' ? (
                    uiRole === 'hr' ? (
                      <>
                        <h2>Create your account</h2>
                        <p>Set up your hiring dashboard.</p>
                      </>
                    ) : (
                      <>
                        <h2>Create your account</h2>
                        <p>Set up your candidate profile.</p>
                      </>
                    )
                  ) : uiRole === 'hr' ? (
                    <>
                      <h2>Welcome back</h2>
                      <p>Log in to your hiring dashboard.</p>
                    </>
                  ) : (
                    <>
                      <h2>Welcome back</h2>
                      <p>Log in to manage your profile.</p>
                    </>
                  )}
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} noValidate>
                  {mode === 'signup' && uiRole === 'hr' && (
                    <div className={`field${errors.companyName ? ' invalid' : ''}`}>
                      <label htmlFor="companyName">Company name</label>
                      <div className="ctrl">
                        <input key="companyName" id="companyName" name="companyName" type="text" autoComplete="organization" placeholder="Acme d.o.o." required />
                      </div>
                      {errors.companyName && <span className="field-hint error">{errors.companyName}</span>}
                    </div>
                  )}

                  {mode === 'signup' && uiRole === 'candidate' && (
                    <div className={`field${errors.fullName ? ' invalid' : ''}`}>
                      <label htmlFor="fullName">Full name</label>
                      <div className="ctrl">
                        <input key="fullName" id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Jovana Kovacevic" required />
                      </div>
                      {errors.fullName && <span className="field-hint error">{errors.fullName}</span>}
                    </div>
                  )}

                  <div className={`field${errors.email ? ' invalid' : ''}`}>
                    <label htmlFor="email">Email</label>
                    <div className="ctrl">
                      <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" placeholder="you@email.com" required />
                    </div>
                    {errors.email && <span className="field-hint error">{errors.email}</span>}
                  </div>

                  <div className={`field${errors.password ? ' invalid' : ''}`}>
                    <label htmlFor="password">Password</label>
                    <div className="ctrl">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        placeholder="••••••••"
                        required
                      />
                      <PwToggle on={showPassword} onClick={() => setShowPassword((v) => !v)} />
                    </div>
                    {errors.password && <span className="field-hint error">{errors.password}</span>}
                  </div>

                  {mode === 'signup' && (
                    <div className={`field${errors.confirmPassword ? ' invalid' : ''}`}>
                      <label htmlFor="confirmPassword">Confirm password</label>
                      <div className="ctrl">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          onPaste={(e) => e.preventDefault()}
                          onDrop={(e) => e.preventDefault()}
                          onCopy={(e) => e.preventDefault()}
                          required
                        />
                        <PwToggle on={showConfirmPassword} onClick={() => setShowConfirmPassword((v) => !v)} />
                      </div>
                      {errors.confirmPassword ? (
                        <span className="field-hint error">{errors.confirmPassword}</span>
                      ) : (
                        <span className="field-hint">Type it again — pasting is disabled here.</span>
                      )}
                    </div>
                  )}

                  {mode === 'login' && (
                    <div className="row-between">
                      <label className="remember">
                        <input type="checkbox" name="remember" />
                        <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M20 6 9 17l-5-5" /></svg></span>
                        Remember me
                      </label>
                      <button type="button" className="forgot" onClick={openForgotPassword}>Forgot password?</button>
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div className={`field terms-field${errors.terms ? ' invalid' : ''}`}>
                      <label className="remember">
                        <input type="checkbox" name="terms" />
                        <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M20 6 9 17l-5-5" /></svg></span>
                        I agree to the <a href="#terms" onClick={(e) => e.stopPropagation()}>Terms</a> and <a href="#privacy" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
                      </label>
                      {errors.terms && <span className="field-hint error">{errors.terms}</span>}
                    </div>
                  )}

                  {mode === 'signup' && <div id="clerk-captcha" />}

                  <button type="submit" className="btn-submit" disabled={submitting || (mode === 'login' ? !signInLoaded : !signUpLoaded)}>
                    <span>
                      {submitting
                        ? 'Please wait…'
                        : mode === 'signup'
                          ? (uiRole === 'hr' ? 'Create account' : 'Create profile')
                          : (uiRole === 'hr' ? 'Log in to dashboard' : 'Log in to my profile')}
                    </span>
                    <ArrowIcon />
                  </button>
                  <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
                </form>

                {/* FOOTER */}
                <div className="card-foot">
                  {mode === 'signup' ? (
                    <span>Already have an account? <button type="button" className="link-btn" onClick={() => switchMode('login')}>Log in →</button></span>
                  ) : uiRole === 'hr' ? (
                    <span>New to Talentmon? <button type="button" className="link-btn" onClick={() => switchMode('signup')}>Make account →</button></span>
                  ) : (
                    <span>Don&apos;t have a profile yet? <button type="button" className="link-btn" onClick={() => switchMode('signup')}>Create one free →</button></span>
                  )}
                </div>

                {mode === 'login' && (
                  <p className="legal">By continuing you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
