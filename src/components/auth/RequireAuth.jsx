import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../../lib/CurrentUserContext';

/** Wrap a route element to require a signed-in Clerk session and (optionally) one of `roles`. */
const RequireAuth = ({ roles, children }) => {
  const { clerkLoaded, isSignedIn, loading, role } = useCurrentUser();
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

  return children;
};

export default RequireAuth;
