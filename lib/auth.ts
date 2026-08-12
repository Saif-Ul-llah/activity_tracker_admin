// Minimal client-side auth: JWT in localStorage, decoded for role/identity.
const TOKEN_KEY = "tracker_admin_token";
const REFRESH_KEY = "tracker_admin_refresh";

export interface JwtClaims {
  id: string;
  role: string;
  exp?: number;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_KEY, token);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}
export function setTokens(accessToken: string, refreshToken?: string) {
  setToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
}
export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function decode(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      )
    );
    return json as JwtClaims;
  } catch {
    return null;
  }
}

// Returns the decoded claims of the current access token. NOTE: it intentionally does
// NOT log the user out when the access token is expired — an expired access token with
// a valid refresh token is still a live session (the API layer silently refreshes it).
// Clearing here caused the "auto-logout after a few minutes idle" bug.
export function currentUser(): JwtClaims | null {
  const t = getToken();
  if (!t) return null;
  return decode(t);
}

export function isTokenExpired(): boolean {
  const c = currentUser();
  return !!(c?.exp && c.exp * 1000 < Date.now());
}

// Treat the user as having a session if they hold an access token OR a refresh token
// with an admin role. The refresh token (7 days) outlives the access token (1 hour),
// so an idle admin stays signed in and the next request transparently refreshes.
export function isAdmin(): boolean {
  const c = currentUser();
  if (c?.role === "ADMIN" || c?.role === "SUB_ADMIN") return true;
  // Access token gone/undecodable but a refresh token exists → still a session.
  if (getRefreshToken()) return true;
  return false;
}
