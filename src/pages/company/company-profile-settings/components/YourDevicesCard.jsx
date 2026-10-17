import React, { useCallback, useEffect, useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { formatDistanceToNow } from 'date-fns';
import Icon from 'components/AppIcon';
import styles from '../styles/company.module.scss';

const deviceTitle = (activity) => {
  const browser = activity?.browserName || 'Unknown browser';
  return activity?.deviceType ? `${browser} on ${activity.deviceType}` : browser;
};

const deviceMeta = (activity) =>
  [[activity?.city, activity?.country].filter(Boolean).join(', '), activity?.ipAddress].filter(Boolean).join(' · ');

/**
 * The signed-in person's own active sessions (Clerk keeps them per user, so
 * an owner never sees a recruiter's devices or the other way round), with a
 * sign-out per device. `refreshKey` reloads the list — e.g. after a password
 * change that signed the other devices out.
 */
const YourDevicesCard = ({ fireToast, refreshKey }) => {
  const clerk = useClerk();
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const currentId = clerk.session?.id;

  const load = useCallback(async () => {
    setError('');
    try {
      const all = await clerk.user.getSessions();
      const active = all
        .filter((s) => s.status === 'active')
        .sort((a, b) => (a.id === currentId ? -1 : b.id === currentId ? 1 : new Date(b.lastActiveAt) - new Date(a.lastActiveAt)));
      setSessions(active);
    } catch {
      setError('Could not load your devices — please refresh.');
    }
  }, [clerk, currentId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const signOut = async (session) => {
    setBusyId(session.id);
    try {
      await session.revoke();
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      fireToast?.(`Signed out of ${deviceTitle(session.latestActivity)}`);
    } catch {
      fireToast?.('Could not sign out that device — please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const others = (sessions || []).filter((s) => s.id !== currentId);

  const signOutOthers = async () => {
    setBusyId('all');
    try {
      await Promise.all(others.map((s) => s.revoke()));
      fireToast?.(`Signed out of ${others.length} other ${others.length === 1 ? 'device' : 'devices'}`);
      await load();
    } catch {
      fireToast?.('Some devices could not be signed out — please try again.');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Your devices</div>
      <div className={styles.cardSub}>Where you&apos;re signed in with this login — only you see this list. Sign out anything you don&apos;t recognise.</div>

      {error && <p className={styles.devNote}>{error}</p>}
      {!error && sessions === null && <p className={styles.devNote}>Loading…</p>}

      {sessions && (
        <ul className={styles.devList}>
          {sessions.map((s) => {
            const current = s.id === currentId;
            const activity = s.latestActivity;
            return (
              <li key={s.id} className={styles.devRow}>
                <span className={styles.devIcon}>
                  <Icon name={activity?.isMobile ? 'Smartphone' : 'Monitor'} size={18} />
                </span>
                <div className={styles.devMain}>
                  <div className={styles.devTitle}>
                    {deviceTitle(activity)}
                    {current && <span className={styles.devBadge}>This device</span>}
                  </div>
                  <div className={styles.devMeta}>
                    {deviceMeta(activity) || 'Location unknown'}
                    {' · '}
                    {current ? 'Active now' : `Active ${formatDistanceToNow(new Date(s.lastActiveAt), { addSuffix: true })}`}
                  </div>
                </div>
                {!current && (
                  <button type="button" className={styles.btnSm} disabled={!!busyId} onClick={() => signOut(s)}>
                    {busyId === s.id ? 'Signing out…' : 'Sign out'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {others.length > 1 && (
        <button type="button" className={`${styles.btnSm} ${styles.devAll}`} disabled={!!busyId} onClick={signOutOthers}>
          <Icon name="LogOut" size={14} />
          {busyId === 'all' ? 'Signing out…' : 'Sign out of all other devices'}
        </button>
      )}
    </div>
  );
};

export default YourDevicesCard;
