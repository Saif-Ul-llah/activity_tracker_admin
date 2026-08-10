# Activity Tracker — Admin Panel

Next.js (App Router) admin console for the desktop activity tracker. Monitors the
fleet, shows analytics, browses activity history and screenshot previews, and manages
users.

## Features

- **Overview** — KPI tiles, activity-over-time (stacked area by state), top
  applications, time-by-state donut, and a day×hour activity heatmap.
- **Activity History** — per-segment timeline with app, window/URL, duration,
  activity %, and input counts; filterable by device and date range.
- **Screenshots** — grid of previews (served via short-lived presigned R2 URLs) with a
  lightbox.
- **Devices** — registered agents, session type / degraded flags, last-seen, and
  token revoke/restore.
- **User Management** — list employees, create users, edit role, enable/disable.
- **Events** — agent telemetry (crashes, clock jumps, quota).

Charts use a colorblind-safe categorical palette and are light/dark aware.

## Setup

```bash
npm install
cp .env.example .env.local   # optional; defaults to the production API
npm run dev                  # http://localhost:3001
```

Sign in with an **ADMIN** or **SUB_ADMIN** account from the backend.

## Configuration

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE` | Backend base URL (defaults to the production Vercel URL) |

## Deploy (Vercel)

Import this repo at vercel.com/new, set `NEXT_PUBLIC_API_BASE`, and deploy. Auth is
a client-side JWT (stored in localStorage) obtained from the backend `/api/login`.

## Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Recharts.
