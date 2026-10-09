import React from 'react';
import { useClerk } from '@clerk/clerk-react';
import '../../pages/landing/login/styles.scss';

/**
 * A company account whose team seat was removed. Normally unreachable —
 * removing a member deletes their login — but if that Clerk call failed the
 * session can still exist, and every company API now refuses it.
 */
const NoCompanyAccess = () => {
  const clerk = useClerk();

  return (
    <div className="auth-page" data-role="hr">
      <div className="auth" style={{ gridTemplateColumns: '1fr' }}>
        <main className="auth-main">
          <div className="auth-card">
            <div className="card-head">
              <h2>No access</h2>
              <p>You&apos;re no longer a member of this company&apos;s team. Ask the account owner to invite you again.</p>
            </div>
            <button type="button" className="btn-submit" onClick={() => clerk.signOut({ redirectUrl: '/' })}>
              <span>Sign out</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NoCompanyAccess;
