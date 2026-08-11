# Activity Tracker — Admin Panel

Next.js (App Router) admin console for the desktop activity tracker. Monitors the
fleet, shows analytics, browses activity history and screenshot previews, and manages
users.

## Features

- **Overview** — KPI tiles, activity-over-time (stacked bars/area by state), top
  applications, time-by-state donut, and a day×hour activity heatmap.
- **Activity History** — per-segment timeline (app, window/URL, duration, activity %,
  input), filterable by device and date range, **paginated**.
- **Screenshots** — preview grid **or** list view, with a lightbox, multi-select
  **bulk delete**, and pagination (served via short-lived presigned R2 URLs).
- **Browser Tabs** — every open tab per device/browser as **clickable links**
  (cards/list toggle, favicons, active-tab highlight), reported by the browser
  extension. Activity History URLs are clickable too.
- **Devices** — registered agents, session type / degraded flags, last-seen, token
  revoke/restore, and a **single-device detail page** (per-device KPIs, timeline, top
  apps, recent segments, and **clear-history** by time range / app).
- **Storage** — R2 usage vs limit gauge, **pause/resume R2 upload** (agents then keep
  screenshots locally), fleet-wide **screenshot capture-interval** control, and **bulk
  delete** (older-than-7d/30d/all).
- **User Management** — summary stats, **search + role filter**, create users, edit
  role/active, **delete** (row icon, edit modal, or multi-select bulk delete).
- **Events** — agent telemetry (crashes, clock jumps, quota).

Every table/tab has a **List ↔ Cards** view toggle (Grid ↔ List for screenshots),
persisted per page. Charts use a colorblind-safe categorical palette; light/dark aware.

## Setup

```bash
npm install
cp .env.example .env.local   # optional; defaults to the production API
npm run dev                  # http://localhost:3001
```

Sign in with an **ADMIN** or **SUB_ADMIN** account. Public sign-up is disabled — the
first admin is created with the backend's `npm run seed:admin`; other users are created
from within this panel (User Management → New user).

## Configuration

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE` | Backend base URL (defaults to the production Vercel URL) |

## Deploy (Vercel)

Import this repo at vercel.com/new, set `NEXT_PUBLIC_API_BASE`, and deploy. Auth is
a client-side JWT (stored in localStorage) obtained from the backend `/api/login`.

## Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Recharts.
