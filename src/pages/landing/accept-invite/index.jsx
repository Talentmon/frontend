import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClerk, useSignUp } from '@clerk/clerk-react';
import apiClient from '../../../lib/apiClient';
import { homePathFor, useCurrentUser } from '../../../lib/CurrentUserContext';
import { setRememberLogin } from '../../../lib/rememberMe';
import '../login/styles.scss';

function firstClerkError(err, fallback) {
  return err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || fallback;
}

function isAlreadySignedInError(err) {
  return /already signed in/i.test(firstClerkError(err, ''));
}

/**
 * Landing page for a team invite link. Clerk sends the invitee here with
 * `__clerk_ticket` appended to the redirect URL the backend chose
 * (`/accept-invite?invite=<member id>`); signing up with that ticket verifies
 * the email on the spot, so there's no code step. The email itself is fixed —
 * it's the address the owner invited.
 */
const AcceptInvite = () => {
  const navigate = useNavigate();
  const clerk = useClerk();
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('invite');
  const ticket = searchParams.get('__clerk_ticket');
  const clerkStatus = searchParams.get('__clerk_status');
  const { signUp, isLoaded: signUpLoaded, setActive } = useSignUp();
  const { isSignedIn, loading: currentUserLoading, user, role, company, refetch } = useCurrentUser();

  const [preview, setPreview] = useState(null); // { status: 'pending'|'expired'|'accepted'|'invalid', companyName?, email? }
  const [errors, setErrors] = useState({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!inviteId) {
      setPreview({ status: 'invalid' });
      return;
    }
    apiClient
      .get(`/auth/invites/${inviteId}`)
      .then((r) => setPreview(r.data))
      .catch(() => setPreview({ status: 'invalid' }));
  }, [inviteId]);

  const signedInAsInvitee = isSignedIn && !!user && !!preview?.email && user.email?.toLowerCase() === preview.email.toLowerCase();

  // Already joined (this page's own submit, or /auth/me finishing the join) — straight in.
  useEffect(() => {
    if (!currentUserLoading && signedInAsInvitee && role === 'COMPANY' && company) {
      navigate(homePathFor(role, company), { replace: true });
    }
  }, [currentUserLoading, signedInAsInvitee, role, company, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNote('');
    const els = e.target.elements;
    const fullName = els.fullName?.value?.trim() || '';
    const password = els.password?.value || '';
    const confirmPassword = els.confirmPassword?.value || '';

    const nextErrors = {};
    if (!fullName) nextErrors.fullName = 'This field is required.';
    if (!password) nextErrors.password = 'This field is required.';
    else if (password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) nextErrors.confirmPassword = 'Passwords do not match.';
    if (!els.terms?.checked) nextErrors.terms = 'You must accept the Terms and Conditions.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const [firstName, ...rest] = fullName.split(' ');
      const result = await signUp.create({
        strategy: 'ticket',
        ticket,
        password,
        firstName,
        lastName: rest.join(' ') || undefined,
      });
      if (result.status !== 'complete') {
        setNote('Could not finish creating your account — please ask the account owner to resend the invite.');
        return;
      }
      setRememberLogin(true);
      try {
        await setActive({ session: result.createdSessionId });
      } catch (activateErr) {
        if (!isAlreadySignedInError(activateErr)) throw activateErr;
      }
      try {
        await apiClient.post('/auth/accept-invite', { inviteId });
      } catch (err) {
        // 409 = /auth/me already joined them in the background — that's the goal anyway.
        if (err?.response?.status !== 409) throw err;
      }
      await refetch();
      // The redirect effect above takes it from here.
    } catch (err) {
      setNote(err?.response?.data?.message || firstClerkError(err, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderBody = () => {
    if (!preview || currentUserLoading) {
      return <p className="form-note show">Loading your invite…</p>;
    }

    if (isSignedIn && !signedInAsInvitee) {
      return (
        <>
          <div className="card-head">
            <h2>You&apos;re signed in as someone else</h2>
            <p>
              This invite is for <b>{preview.email || 'another address'}</b>, but you&apos;re signed in as <b>{user?.email}</b>.
              Sign out, then open the invite link again.
            </p>
          </div>
          <button type="button" className="btn-submit" onClick={() => clerk.signOut()}>
            <span>Sign out</span>
          </button>
        </>
      );
    }

    if (preview.status === 'accepted') {
      return (
        <>
          <div className="card-head">
            <h2>Invite already accepted</h2>
            <p>You&apos;re already on the {preview.companyName} team — just log in.</p>
          </div>
          <button type="button" className="btn-submit" onClick={() => navigate('/login')}>
            <span>Log in</span>
          </button>
        </>
      );
    }

    if (preview.status === 'expired') {
      return (
        <div className="card-head">
          <h2>This invite has expired</h2>
          <p>Invite links are valid for 7 days. Ask the {preview.companyName} account owner to send you a new one.</p>
        </div>
      );
    }

    if (preview.status !== 'pending' || !ticket || clerkStatus === 'sign_in') {
      return (
        <div className="card-head">
          <h2>This invite link isn&apos;t valid</h2>
          <p>
            {clerkStatus === 'sign_in'
              ? 'This email already has a Talentmon account, and each person can belong to only one company.'
              : 'Open the link straight from your invite email, or ask the account owner to send a new one.'}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="card-head">
          <h2>Join {preview.companyName}</h2>
          <p>You&apos;ve been invited to the {preview.companyName} hiring team on Talentmon. Set your name and password to get started.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="ctrl">
              <input id="email" name="email" type="email" value={preview.email} readOnly disabled />
            </div>
          </div>

          <div className={`field${errors.fullName ? ' invalid' : ''}`}>
            <label htmlFor="fullName">Full name</label>
            <div className="ctrl">
              <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Marko Petrović" required />
            </div>
            {errors.fullName ? (
              <span className="field-hint error">{errors.fullName}</span>
            ) : (
              <span className="field-hint">Your teammates see this next to what you unlock and save.</span>
            )}
          </div>

          <div className={`field${errors.password ? ' invalid' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="ctrl">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

          <div className={`field${errors.confirmPassword ? ' invalid' : ''}`}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="ctrl">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                required
              />
            </div>
            {errors.confirmPassword ? (
              <span className="field-hint error">{errors.confirmPassword}</span>
            ) : (
              <span className="field-hint">Type it again — pasting is disabled here.</span>
            )}
          </div>

          <div className={`field terms-field${errors.terms ? ' invalid' : ''}`}>
            <label className="remember">
              <input type="checkbox" name="terms" />
              <span className="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"><path d="M20 6 9 17l-5-5" /></svg></span>
              I agree to the <a href="/terms-of-service" target="_blank" rel="noreferrer">Terms</a> and <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>.
            </label>
            {errors.terms && <span className="field-hint error">{errors.terms}</span>}
          </div>

          <div id="clerk-captcha" />

          <button type="submit" className="btn-submit" disabled={submitting || !signUpLoaded}>
            <span>{submitting ? 'Please wait…' : `Join ${preview.companyName}`}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <p className={`form-note${note ? ' show' : ''}`}>{note}</p>
        </form>
      </>
    );
  };

  return (
    <div className="auth-page" data-role="hr">
      <Helmet>
        <title>Join your team · Talentmon</title>
      </Helmet>
      <div className="auth">
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
            <div className="role-block on">
              <span className="aside-eyebrow">Team invite</span>
              <h1>Hire <span className="u">together</span>.</h1>
              <p>One company profile, one shared credit balance — and everyone on the team signs in with their own account.</p>
              <ul className="aside-list">
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>Search and unlock candidates</li>
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>See what your teammates already unlocked</li>
                <li><span className="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg></span>Buy credits on the company card</li>
              </ul>
            </div>
          </div>
        </aside>

        <main className="auth-main">
          <div className="auth-topbar">
            <a href="/landing-page" className="brand">
              <span className="mark">
                <img src="/assets/images/talentmon.png" alt="Talentmon" />
              </span>
              <span>Talent<b>mon</b></span>
            </a>
          </div>
          <div className="auth-card">{renderBody()}</div>
        </main>
      </div>
    </div>
  );
};

export default AcceptInvite;
