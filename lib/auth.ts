// Minimal client-side auth: JWT in localStorage, decoded for role/identity.
const TOKEN_KEY = "tracker_admin_token";

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
export function clearAuth() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
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

export function currentUser(): JwtClaims | null {
  const t = getToken();
  if (!t) return null;
  const c = decode(t);
  if (c?.exp && c.exp * 1000 < Date.now()) {
    clearAuth();
    return null;
  }
  return c;
}

export function isAdmin(): boolean {
  const c = currentUser();
  return c?.role === "ADMIN" || c?.role === "SUB_ADMIN";
}
