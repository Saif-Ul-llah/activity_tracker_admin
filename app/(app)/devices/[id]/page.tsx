"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, Overview, DeviceRow, ActivityResp, Segment } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor } from "@/components/Controls";
import {
  Card,
  Kpi,
  Badge,
  DataState,
  StatePill,
  ActivityMeter,
} from "@/components/ui";
import { ActivityTimeline, TopAppsBar, StateDonut } from "@/components/charts";
import { IconClock, IconMoon, IconScreenshot, IconChevron } from "@/components/icons";
import { fmtDuration, fmtDateTime, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [range, setRange] = useState<RangeKey>("7d");
  const [device, setDevice] = useState<DeviceRow | null>(null);
  const [ov, setOv] = useState<Overview | null>(null);
  const [act, setAct] = useState<ActivityResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    // Device meta comes from the fleet list (no per-id endpoint needed).
    api.devices().then((d) => setDevice(d.find((x) => x.id === id) || null)).catch(() => {});
  }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const r = { ...rangeFor(range), deviceId: id };
    Promise.all([api.overview(r), api.activity({ ...r, limit: 50 })])
      .then(([o, a]) => {
        if (!alive) return;
        setOv(o);
        setAct(a);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, range, refreshTick]);

  const k = ov?.kpis;

  return (
    <Page>
      <div className="flex items-center gap-2 text-sm text-muted mb-3">
        <Link href="/devices" className="hover:text-ink">
          Devices
        </Link>
        <IconChevron size={14} className="text-faint" />
        <span className="text-ink">{device?.name || "Device"}</span>
      </div>

      <PageHeader
        title={device?.name || "Device"}
        subtitle={
          device
            ? `${device.platform} · agent v${device.agentVersion || "?"}`
            : "Loading…"
        }
        range={range}
        onRange={setRange}
      />

      {device && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <Meta label="Session">
              {device.degraded?.length ? (
                <Badge tone="warn" dot>
                  {device.sessionType} · degraded
                </Badge>
              ) : (
                <Badge dot>{device.sessionType}</Badge>
              )}
            </Meta>
            <Meta label="Status">
              {device.revoked ? (
                <Badge tone="crit" dot>
                  Revoked
                </Badge>
              ) : (
                <Badge tone="good" dot>
                  Active
                </Badge>
              )}
            </Meta>
            <Meta label="Last seen">
              <span className="text-ink text-sm">
                {relativeTime(device.lastSeenAt)}
              </span>
            </Meta>
            <Meta label="OS">
              <span className="text-ink text-sm capitalize">
                {device.platform} {device.osVersion}
              </span>
            </Meta>
            {device.degraded?.length > 0 && (
              <Meta label="Limitations">
                <span className="text-xs text-warn">
                  {device.degraded.join(", ")}
                </span>
              </Meta>
            )}
          </div>
        </Card>
      )}

      <DataState loading={loading} error={error}>
        {k && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Kpi
                label="Active time"
                value={fmtDuration(k.activeMs)}
                sub={`${k.avgActivityPercent}% avg activity`}
                accent="var(--series-3)"
                icon={<IconClock size={18} />}
              />
              <Kpi
                label="Idle time"
                value={fmtDuration(k.idleMs)}
                accent="var(--series-4)"
                icon={<IconMoon size={18} />}
              />
              <Kpi
                label="Segments"
                value={k.segmentCount.toLocaleString()}
                accent="var(--series-1)"
              />
              <Kpi
                label="Screenshots"
                value={k.screenshotCount.toLocaleString()}
                accent="var(--series-5)"
                icon={<IconScreenshot size={18} />}
              />
            </div>

            {k.segmentCount === 0 ? (
              <Card>
                <div className="py-14 text-center text-sm text-faint">
                  No activity from this device in the selected range.
                </div>
              </Card>
            ) : (
              <>
                <Card title="Activity over time" className="mb-4">
                  <ActivityTimeline data={ov.timeline} unit={ov.range.unit} />
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  <Card title="Top applications" className="lg:col-span-2">
                    <TopAppsBar data={ov.topApps} />
                  </Card>
                  <Card title="Time by state">
                    <StateDonut data={ov.stateBreakdown} />
                  </Card>
                </div>

                {act && (
                  <Card
                    title="Recent segments"
                    subtitle={`${act.total.toLocaleString()} total`}
                    bodyClass="!px-0"
                  >
                    <div className="overflow-x-auto">
                      <table className="dt">
                        <thead>
                          <tr>
                            <th style={{ width: 150 }}>Started</th>
                            <th style={{ width: 110 }}>State</th>
                            <th style={{ width: 160 }}>App</th>
                            <th>Window / URL</th>
                            <th className="num" style={{ width: 100 }}>
                              Duration
                            </th>
                            <th className="num" style={{ width: 130 }}>
                              Activity
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {act.segments.map((s: Segment) => (
                            <tr key={s._id}>
                              <td className="whitespace-nowrap text-xs text-muted">
                                {fmtDateTime(s.startedAtUtc)}
                              </td>
                              <td>
                                <StatePill state={s.state} />
                              </td>
                              <td className="strong">
                                {s.app?.name || (
                                  <span className="text-faint font-normal">
                                    unknown
                                  </span>
                                )}
                              </td>
                              <td className="max-w-0 truncate text-muted">
                                {s.window?.url || s.window?.title || (
                                  <span className="text-faint">—</span>
                                )}
                              </td>
                              <td className="num strong">
                                {fmtDuration(s.durationMs)}
                              </td>
                              <td className="num">
                                {s.state === "active" ? (
                                  <ActivityMeter percent={s.activityPercent} />
                                ) : (
                                  <span className="text-faint">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </DataState>

      {device && (
        <ClearHistory
          deviceId={id}
          apps={(act?.byApp ?? []).map((a) => a.app)}
          onCleared={() => setRefreshTick((t) => t + 1)}
        />
      )}
    </Page>
  );
}

function ClearHistory({
  deviceId,
  apps,
  onCleared,
}: {
  deviceId: string;
  apps: string[];
  onCleared: () => void;
}) {
  const DAY = 86400000;
  const [span, setSpan] = useState<"all" | "7" | "30">("all");
  const [app, setApp] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true);
    setMsg("");
    try {
      const body: {
        deviceId: string;
        app?: string;
        to?: number;
      } = { deviceId };
      if (app) body.app = app;
      if (span === "7") body.to = Date.now() - 7 * DAY;
      if (span === "30") body.to = Date.now() - 30 * DAY;
      const res = await api.clearActivity(body);
      setMsg(`Cleared ${res.deleted.toLocaleString()} activity segments.`);
      setConfirm(false);
      onCleared();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const label =
    (app ? `"${app}" ` : "") +
    (span === "all"
      ? "activity history"
      : `activity older than ${span} days`);

  return (
    <Card
      title="Clear history"
      subtitle="Permanently delete this device's activity segments"
      className="mt-4 border-crit/20"
    >
      {msg && <p className="text-sm text-brand mb-3">{msg}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-faint mb-1">
            Time range
          </label>
          <select
            value={span}
            onChange={(e) => setSpan(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-surface-2 border border-border text-sm text-ink outline-none"
          >
            <option value="all">All history</option>
            <option value="7">Older than 7 days</option>
            <option value="30">Older than 30 days</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-faint mb-1">
            App
          </label>
          <select
            value={app}
            onChange={(e) => setApp(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-2 border border-border text-sm text-ink outline-none min-w-[160px]"
          >
            <option value="">All apps</option>
            {apps.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {confirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={run}
              disabled={busy}
              className="px-3.5 py-2 rounded-xl bg-crit text-white text-xs font-semibold disabled:opacity-50"
            >
              {busy ? "Clearing…" : `Confirm — delete ${label}`}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="px-3 py-2 rounded-xl border border-border text-xs text-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-crit border border-crit/30 bg-crit/10 hover:bg-crit/20 transition-colors"
          >
            Clear {label}
          </button>
        )}
      </div>
    </Card>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-faint mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
