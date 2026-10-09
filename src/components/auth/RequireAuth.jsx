import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../lib/CurrentUserContext';
import NoCompanyAccess from './NoCompanyAccess';

/**
 * Wrap a route element to require a signed-in Clerk session and (optionally)
 * one of `roles`. `requireCompleteProfile` additionally keeps a company with
 * an unfinished profile on its profile settings (the backend enforces the
 * same gate on the APIs these pages call).
 */
const RequireAuth = ({ roles, requireCompleteProfile = false, children }) => {
  const { clerkLoaded, isSignedIn, loading, role, company, companyProfileComplete } = useCurrentUser();
  const location = useLocation();

  if (!clerkLoaded || loading) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role) {
    // Signed in via Clerk but never finished POST /auth/complete-profile
    // (e.g. closed the tab mid-signup) — send back to pick a role.
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // A company login with no active team seat (removed from the team).
  if (role === 'COMPANY' && !company) {
    return <NoCompanyAccess />;
  }

  if (requireCompleteProfile && !companyProfileComplete) {
    return <Navigate to="/company-profile-settings" replace />;
  }

  return children;
};

export default RequireAuth;
