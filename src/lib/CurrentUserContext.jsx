import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import apiClient from './apiClient';
import { setTokenGetter } from './authToken';

const CurrentUserContext = createContext(null);

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

  const refetch = useCallback(async () => {
    if (!isSignedIn) {
      setState({ loading: false, user: null, candidate: null, company: null, adminProfile: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
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
