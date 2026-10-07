import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import apiClient from './apiClient';
import { setTokenGetter } from './authToken';

const CurrentUserContext = createContext(null);

const ROLE_HOME = {
  CANDIDATE: '/candidate-profile',
  COMPANY: '/candidate-search-dashboard',
  ADMIN: '/admin',
};

/**
 * Where a signed-in user lands. A company whose profile isn't complete yet
 * (backend `company.profileComplete`) goes to its profile settings instead —
 * everything else is locked until the required fields are saved.
 */
export function homePathFor(role, company) {
  if (role === 'COMPANY' && !company?.profileComplete) return '/company-profile-settings';
  return ROLE_HOME[role] || '/';
}

/**
 * Bridges the Clerk session into apiClient (token getter) and loads our own
 * `/auth/me` (Clerk owns identity, our DB owns role/candidate/company — see
 * backend plan decision #6). Every authenticated page reads role/profile
 * from here instead of re-fetching /auth/me itself.
 */
export function CurrentUserProvider({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [state, setState] = useState({ loading: true, user: null, candidate: null, company: null, adminProfile: null });

  useEffect(() => {
    // Register unconditionally, not gated on isSignedIn — that flag lags a
    // render behind the actual Clerk session becoming active (e.g. right
    // after setActive()), which was causing the very next API call
    // (complete-profile) to go out with no Authorization header at all.
    // getToken() itself is safe to call anytime; it just resolves to null
    // when there's no session.
    setTokenGetter(getToken);
  }, [getToken]);

  // `silent` skips the loading flag — RequireAuth renders nothing while
  // loading, so a normal refetch from inside a protected page would unmount
  // and remount that page (losing its state) just to refresh e.g. the
  // company's name in the header after a profile save.
  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!isSignedIn) {
      setState({ loading: false, user: null, candidate: null, company: null, adminProfile: null });
      return;
    }
    if (!silent) setState((prev) => ({ ...prev, loading: true }));
    const { data } = await apiClient.get('/auth/me');
    setState({ loading: false, user: data.user, candidate: data.candidate, company: data.company, adminProfile: data.adminProfile });
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    refetch();
  }, [isLoaded, isSignedIn, refetch]);

  const role = state.user?.role ?? null;

  return (
    <CurrentUserContext.Provider
      value={{
        clerkLoaded: isLoaded,
        isSignedIn: !!isSignedIn,
        loading: !isLoaded || state.loading,
        user: state.user,
        candidate: state.candidate,
        company: state.company,
        adminProfile: state.adminProfile,
        role,
        // Always true for non-company roles, so callers can gate on it without checking role first.
        companyProfileComplete: role !== 'COMPANY' || !!state.company?.profileComplete,
        refetch,
      }}
    >
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  return ctx;
}
