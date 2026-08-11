import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import apiClient from '../../../lib/apiClient';
import { useCurrentUser } from '../../../lib/CurrentUserContext';
import './styles.scss';

const ROLE_HOME = {
  CANDIDATE: '/candidate-profile',
  COMPANY: '/candidate-search-dashboard',
  ADMIN: '/admin',
};

function firstClerkError(err, fallback) {
  return err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || fallback;
}

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, isLoaded: signInLoaded, setActive: setActiveSignIn } = useSignIn();
  const { signUp, isLoaded: signUpLoaded, setActive: setActiveSignUp } = useSignUp();
  const { isSignedIn, loading: currentUserLoading, role, refetch } = useCurrentUser();

  const [uiRole, setRole] = useState('hr'); // 'hr' | 'candidate' — matches existing UI naming
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingRole, setPendingRole] = useState(null); // role picked at signup, applied after verification

  useEffect(() => {
    const t = searchParams?.get('tab');
    setRole(t === 'candidate' ? 'candidate' : 'hr');
    const m = searchParams?.get('mode');
    if (m === 'signup' || m === 'login') setMode(m);
  }, [searchParams]);

  // Already signed in with a completed profile — no reason to see the login form.
  useEffect(() => {
    if (!currentUserLoading && isSignedIn && role) {
      navigate(ROLE_HOME[role] || '/', { replace: true });
    }
  }, [currentUserLoading, isSignedIn, role, navigate]);

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

  const finishWithRole = async (chosenRole) => {
    try {
      await apiClient.post('/auth/complete-profile', { role: chosenRole });
    } catch (err) {
      // 409 = role was already set by an earlier attempt (e.g. a retry after
      // the "already signed in" race below) — treat as already-done, not an error.
      if (err?.response?.status !== 409) throw err;
    }
    await refetch();
    navigate(ROLE_HOME[chosenRole] || '/');
  };

  function isAlreadySignedInError(err) {
    return /already signed in/i.test(firstClerkError(err, ''));
  }

  const handleLoginSubmit = async (email, password) => {
    if (!signInLoaded) throw new Error('Still loading — please try again in a moment.');
    try {
      const result = await signIn.create({ identifier: email, password });
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

  const handleSignupSubmit = async (fullName, email, password) => {
    if (!signUpLoaded) throw new Error('Still loading — please try again in a moment.');
    const [firstName, ...rest] = fullName.split(' ');
    await signUp.create({ emailAddress: email, password, firstName, lastName: rest.join(' ') || undefined });
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
        await handleLoginSubmit(email, password);
      } catch (err) {
        setNote(firstClerkError(err, 'Invalid email or password.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ---- signup ----
    const fullName = els.fullName?.value?.trim() || '';
    const confirmPassword = els.confirmPassword?.value || '';
    const termsAccepted = !!els.terms?.checked;

    const nextErrors = {};
    if (!fullName) nextErrors.fullName = 'This field is required.';
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
      await handleSignupSubmit(fullName, email, password);
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
      await finishWithRole(pendingRole);
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
              <button
                type="button"
                className="btn-submit"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await finishWithRole(uiRole === 'hr' ? 'COMPANY' : 'CANDIDATE');
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
            {step === 'verify' ? (
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </button>
                  <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
                </form>
                <div className="card-foot">
                  <span>Didn&apos;t get it? <button type="button" className="link-btn" onClick={handleResendCode}>Resend code →</button></span>
                </div>
              </>
            ) : (
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
                  {mode === 'signup' && (
                    <div className={`field${errors.fullName ? ' invalid' : ''}`}>
                      <label htmlFor="fullName">Full name</label>
                      <div className="ctrl">
                        <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Jovana Kovacevic" required />
                      </div>
                      {errors.fullName && <span className="field-hint error">{errors.fullName}</span>}
                    </div>
                  )}

                  <div className={`field${errors.email ? ' invalid' : ''}`}>
                    <label htmlFor="email">Email</label>
                    <div className="ctrl">
                      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@email.com" required />
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
                      <button
                        type="button"
                        className={`pw-toggle${showPassword ? ' on' : ''}`}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        <svg className="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                        <svg className="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 7 10 7a14 14 0 0 1-2.3 3M6.6 6.6A14 14 0 0 0 2 13s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1M3 3l18 18" /></svg>
                      </button>
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
                        <button
                          type="button"
                          className={`pw-toggle${showConfirmPassword ? ' on' : ''}`}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowConfirmPassword((v) => !v)}
                        >
                          <svg className="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                          <svg className="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 7 10 7a14 14 0 0 1-2.3 3M6.6 6.6A14 14 0 0 0 2 13s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1M3 3l18 18" /></svg>
                        </button>
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
                        <input type="checkbox" />
                        <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M20 6 9 17l-5-5" /></svg></span>
                        Remember me
                      </label>
                      <a href="#forgot" className="forgot">Forgot password?</a>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
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
