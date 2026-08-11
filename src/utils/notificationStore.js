const STORAGE_KEY = 'tc_notifications_v1';
const EVENT_NAME = 'tc-notifications-updated';

// TODO: replace with a real notifications API once one exists.
const DEFAULT_STATE = {
  candidate: [
    { id: 1, type: 'unlock', read: false, title: 'Nordwave unlocked you', desc: 'The company purchased access to your profile.', time: '2 hours ago' },
    { id: 2, type: 'review', read: false, title: 'Leave a review for Levi9', desc: "You were employed there — share your experience.", time: '1 day ago' },
    { id: 3, type: 'unlock', read: true, title: 'Comtrade Group unlocked you', desc: 'The company purchased access to your profile.', time: '3 days ago' },
    { id: 4, type: 'review', read: true, title: 'Leave a review for Banca Intesa', desc: "You were employed there — share your experience.", time: '5 days ago' }
  ],
  company: []
};

let nextId = Date.now();

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { candidate: [...DEFAULT_STATE.candidate], company: [...DEFAULT_STATE.company] };
    const parsed = JSON.parse(raw);
    return {
      candidate: Array.isArray(parsed?.candidate) ? parsed.candidate : [...DEFAULT_STATE.candidate],
      company: Array.isArray(parsed?.company) ? parsed.company : []
    };
  } catch {
    return { candidate: [...DEFAULT_STATE.candidate], company: [...DEFAULT_STATE.company] };
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can be unavailable (private mode, quota exceeded) — persistence is best-effort
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getNotifications(audience) {
  return readState()?.[audience] || [];
}

export function addNotification(audience, { type, title, desc, time }) {
  const state = readState();
  const entry = { id: nextId++, type, title, desc, time, read: false };
  state[audience] = [entry, ...(state?.[audience] || [])];
  writeState(state);
  return entry;
}

export function markRead(audience, id) {
  const state = readState();
  state[audience] = (state?.[audience] || [])?.map((n) => (n?.id === id ? { ...n, read: true } : n));
  writeState(state);
}

export function markAllRead(audience) {
  const state = readState();
  state[audience] = (state?.[audience] || [])?.map((n) => ({ ...n, read: true }));
  writeState(state);
}

export function subscribeNotifications(callback) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
}
