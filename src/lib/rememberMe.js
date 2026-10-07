// "Remember me" on top of Clerk, which has no per-sign-in option for it —
// its session simply lasts for the instance-wide lifetime set in the Clerk
// dashboard. For a sign-in *without* "Remember me" we leave two markers:
//  - a persistent flag in localStorage saying "this login is browser-session only"
//  - a session cookie (no Expires/Max-Age), which the browser drops when it closes
// On the next app start, flag present + cookie gone = the browser was closed
// since that login, so CurrentUserProvider signs the user out.
// A cookie rather than sessionStorage because sessionStorage is per tab: a
// second tab opened by typing the URL would look like a fresh browser start
// and sign the user out everywhere.

const SESSION_ONLY_KEY = 'tm_session_only';
const ALIVE_COOKIE = 'tm_session_alive';

function setAliveCookie() {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ALIVE_COOKIE}=1; path=/; SameSite=Lax${secure}`;
}

function hasAliveCookie() {
  return document.cookie.split('; ').some((c) => c.startsWith(`${ALIVE_COOKIE}=`));
}

/** Call right before activating a new session (sign-in or sign-up). */
export function setRememberLogin(remember) {
  try {
    if (remember) {
      localStorage.removeItem(SESSION_ONLY_KEY);
    } else {
      localStorage.setItem(SESSION_ONLY_KEY, '1');
      setAliveCookie();
    }
  } catch {
    // Storage blocked (private mode, site data disabled) — falls back to
    // Clerk's default, i.e. behaves as if "Remember me" was checked.
  }
}

/** True when the current Clerk session came from a non-remembered login and the browser has been closed since. */
export function isExpiredSessionOnlyLogin() {
  try {
    return localStorage.getItem(SESSION_ONLY_KEY) === '1' && !hasAliveCookie();
  } catch {
    return false;
  }
}

export function clearRememberLogin() {
  try {
    localStorage.removeItem(SESSION_ONLY_KEY);
  } catch {
    // see setRememberLogin
  }
  document.cookie = `${ALIVE_COOKIE}=; path=/; Max-Age=0`;
}
