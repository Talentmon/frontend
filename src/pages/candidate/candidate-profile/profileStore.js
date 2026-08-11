const STORAGE_KEY = 'tc_candidate_profile_v1';

// TODO: replace with a real GET/PATCH against the backend once one exists.
export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can be unavailable (private mode, quota exceeded) — persistence is best-effort
  }
}
