// Thin client for the tracker backend admin API. Attaches the stored JWT and
// normalizes the { status, data } envelope. All calls are client-side.
import { getToken, clearAuth } from "./auth";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://activity-tracker-backend-gdad.vercel.app";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "Session expired");
  }
  if (!res.ok) {
    throw new ApiError(res.status, json?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export function login(email: string, password: string) {
  return call<{ accessToken: string; refreshToken?: string }>("/api/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

// ── Query types ──────────────────────────────────────────────────────────────
export interface Range {
  from?: number;
  to?: number;
  userId?: string;
  deviceId?: string;
  page?: number;
  limit?: number;
}
function qs(r: Range = {}): string {
  const p = new URLSearchParams();
  Object.entries(r).forEach(([k, v]) => v !== undefined && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Admin endpoints ──────────────────────────────────────────────────────────
export const api = {
  overview: (r?: Range) => call<Overview>(`/api/admin/overview${qs(r)}`),
  users: () => call<UserRow[]>(`/api/admin/users`),
  createUser: (b: NewUser) =>
    call<UserRow>(`/api/admin/users`, { method: "POST", body: b }),
  updateUser: (id: string, b: Partial<NewUser> & { isActive?: boolean }) =>
    call<UserRow>(`/api/admin/users/${id}`, { method: "PATCH", body: b }),
  deleteUser: (id: string) =>
    call<{ user: number; devices: number; segments: number; screenshots: number; events: number }>(
      `/api/admin/users/${id}`,
      { method: "DELETE" }
    ),
  clearActivity: (b: {
    deviceId?: string;
    userId?: string;
    app?: string;
    from?: number;
    to?: number;
    all?: boolean;
  }) =>
    call<{ deleted: number }>(`/api/admin/activity/delete`, {
      method: "POST",
      body: b,
    }),
  devices: () => call<DeviceRow[]>(`/api/admin/devices`),
  revokeDevice: (id: string, revoked: boolean) =>
    call<{ id: string; revoked: boolean }>(`/api/admin/devices/${id}/revoke`, {
      method: "POST",
      body: { revoked },
    }),
  activity: (r?: Range) => call<ActivityResp>(`/api/admin/activity${qs(r)}`),
  screenshots: (r?: Range) => call<ScreenshotResp>(`/api/admin/screenshots${qs(r)}`),
  events: (r?: Range) => call<EventsResp>(`/api/admin/events${qs(r)}`),
  storage: () => call<Storage>(`/api/admin/storage`),
  updateGlobalSettings: (b: { screenshotUploadEnabled?: boolean; r2LimitBytes?: number }) =>
    call<{ screenshotUploadEnabled: boolean; r2LimitBytes: number }>(
      `/api/admin/settings`,
      { method: "PATCH", body: b }
    ),
  deleteScreenshots: (b: {
    ids?: string[];
    deviceId?: string;
    before?: number;
    all?: boolean;
  }) =>
    call<{ deleted: number; freedFromR2: number }>(
      `/api/admin/screenshots/delete`,
      { method: "POST", body: b }
    ),
};

// ── Response shapes ──────────────────────────────────────────────────────────
export interface Overview {
  range: { from: string; to: string; unit: "hour" | "day" };
  kpis: {
    activeMs: number;
    idleMs: number;
    trackedMs: number;
    avgActivityPercent: number;
    activeDevices: number;
    deviceCount: number;
    userCount: number;
    screenshotCount: number;
    segmentCount: number;
  };
  stateBreakdown: { state: string; durationMs: number; count: number }[];
  topApps: { app: string; durationMs: number; keyCount: number; mouseClicks: number }[];
  timeline: { bucket: string; state: string; durationMs: number }[];
  heatmap: { dow: number; hour: number; durationMs: number }[];
}
export interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  deviceCount: number;
}
export interface NewUser {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: string;
}
export interface DeviceRow {
  id: string;
  userId: string;
  name: string;
  platform: string;
  osVersion: string;
  sessionType: string;
  degraded: string[];
  agentVersion: string;
  revoked: boolean;
  lastSeenAt?: string;
  activeMsToday: number;
}
export interface Segment {
  _id: string;
  deviceId: string;
  userId: string;
  startedAtUtc: string;
  endedAtUtc: string;
  durationMs: number;
  state: string;
  app?: { name?: string };
  window?: { title?: string; url?: string; urlSource?: string };
  activityPercent: number;
  input?: { keyCount: number; mouseClickCount: number; mouseMoveCount: number };
}
export interface ActivityResp {
  segments: Segment[];
  total: number;
  page: number;
  limit: number;
  byApp: { app: string; durationMs: number }[];
  byState: { state: string; durationMs: number; count: number }[];
  byHour: { bucket: string; state: string; durationMs: number }[];
}
export interface Shot {
  id: string;
  deviceId: string;
  userId: string;
  capturedAtUtc: string;
  displayIndex: number;
  isActiveDisplay: boolean;
  bytes: number;
  objectKey: string;
  url: string | null;
}
export interface ScreenshotResp {
  items: Shot[];
  total: number;
  page: number;
  limit: number;
}
export interface Storage {
  usedBytes: number;
  screenshotCount: number;
  limitBytes: number;
  usedPercent: number;
  screenshotUploadEnabled: boolean;
  byDay: { day: string; bytes: number; count: number }[];
}
export interface EventsResp {
  items: {
    _id: string;
    deviceId: string;
    type: string;
    atUtc: string;
    data?: Record<string, unknown>;
  }[];
  total: number;
}
