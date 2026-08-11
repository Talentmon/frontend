// Bridges Clerk's session token into the axios interceptor, which lives
// outside the React tree and can't call the useAuth() hook directly.
let tokenGetter = null;

export function setTokenGetter(fn) {
  tokenGetter = fn;
}

export async function getClerkToken() {
  if (!tokenGetter) return null;
  try {
    return await tokenGetter();
  } catch {
    return null;
  }
}
