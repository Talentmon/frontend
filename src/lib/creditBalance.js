import { useEffect, useState } from 'react';
import { getBalance } from 'pages/company/credit-management/creditsApi';
import { LOW_BALANCE_EVENT, LOW_CREDIT_BALANCE } from 'utils/formatCredits';

// The company's Credit balance, shared by everything that shows it: the top bar, the Credits page,
// Search and Bookmarked. A purchase or an unlock anywhere updates all of them at once.
// Teammates buy and spend from the same balance in their own browsers, so while the tab is visible it
// is re-read every minute, and right away when the user comes back to the tab.
const CHANGE_EVENT = 'credits:balance';
const REFRESH_MS = 60 * 1000;

let state = {
  balance: 0,
  lowBalanceThreshold: LOW_CREDIT_BALANCE,
  // null until the balance loads, false for a new company that has never had Credits.
  hasCreditHistory: null,
};
let inFlight = null;

const publish = (patch) => {
  state = { ...state, ...patch };
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

/** Re-reads the balance from the server. Calls made while one is in flight share it. */
export function refreshCreditBalance() {
  if (!inFlight) {
    inFlight = getBalance()
      .then((d) => publish({
        balance: d.balance,
        hasCreditHistory: d.hasCreditHistory,
        lowBalanceThreshold: d.lowBalanceThreshold ?? LOW_CREDIT_BALANCE,
      }))
      .catch(() => {})
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

/** After an unlock: the new balance, or a function of the current one. */
export function setCreditBalance(next) {
  publish({ balance: typeof next === 'function' ? next(state.balance) : next });
}

// The alert level is set on the Credits page's Settings tab.
window.addEventListener(LOW_BALANCE_EVENT, (e) => publish({ lowBalanceThreshold: e.detail }));

// Only while something on the page shows the balance, and only while the tab is visible.
let watchers = 0;
let timer = null;
const refreshIfVisible = () => {
  if (document.visibilityState === 'visible') refreshCreditBalance();
};
const startWatching = () => {
  timer = setInterval(refreshIfVisible, REFRESH_MS);
  document.addEventListener('visibilitychange', refreshIfVisible);
  window.addEventListener('focus', refreshIfVisible);
};
const stopWatching = () => {
  clearInterval(timer);
  document.removeEventListener('visibilitychange', refreshIfVisible);
  window.removeEventListener('focus', refreshIfVisible);
};

/** `{ balance, lowBalanceThreshold, hasCreditHistory }`, re-read from the server whenever a component using it mounts. */
export function useCreditBalance() {
  const [snapshot, setSnapshot] = useState(state);
  useEffect(() => {
    const onChange = () => setSnapshot(state);
    window.addEventListener(CHANGE_EVENT, onChange);
    onChange();
    refreshCreditBalance();
    watchers += 1;
    if (watchers === 1) startWatching();
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      watchers -= 1;
      if (watchers === 0) stopWatching();
    };
  }, []);
  return snapshot;
}
