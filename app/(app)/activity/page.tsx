"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ActivityResp, DeviceRow, Segment } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor } from "@/components/Controls";
import { Card, Badge, DataState } from "@/components/ui";
import { TopAppsBar } from "@/components/charts";
import { STATE_COLORS } from "@/lib/palette";
import { fmtDuration, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  return (
    <Suspense fallback={<Page>Loading…</Page>}>
      <ActivityInner />
    </Suspense>
  );
}

function ActivityInner() {
  const params = useSearchParams();
  const [deviceId, setDeviceId] = useState(params.get("deviceId") || "");
  const [range, setRange] = useState<RangeKey>("7d");
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [data, setData] = useState<ActivityResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.devices().then(setDevices).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .activity({ ...rangeFor(range), deviceId: deviceId || undefined, limit: 100 })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range, deviceId]);

  return (
    <Page>
      <PageHeader
        title="Activity History"
        subtitle="Per-segment timeline of tracked work"
        range={range}
        onRange={setRange}
      >
        <select
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-ink outline-none"
        >
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </PageHeader>

      <DataState loading={loading} error={error}>
        {data && (
          <>
            {data.byApp.length > 0 && (
              <Card title="Applications used" className="mb-4">
                <TopAppsBar data={data.byApp} />
              </Card>
            )}

            <Card
              title="Segments"
              subtitle={`${data.total.toLocaleString()} total · showing latest ${data.segments.length}`}
            >
              <DataState
                loading={false}
                empty={data.segments.length === 0}
                emptyMsg="No activity segments in this range."
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-faint border-b border-border">
                        <th className="py-2 pr-4 font-medium">Started</th>
                        <th className="py-2 pr-4 font-medium">State</th>
                        <th className="py-2 pr-4 font-medium">App</th>
                        <th className="py-2 pr-4 font-medium">Window / URL</th>
                        <th className="py-2 pr-4 font-medium">Duration</th>
                        <th className="py-2 pr-4 font-medium">Activity</th>
                        <th className="py-2 font-medium">Input</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.segments.map((s: Segment) => (
                        <tr
                          key={s._id}
                          className="border-b border-border/60 hover:bg-surface-2"
                        >
                          <td className="py-2 pr-4 text-muted text-xs whitespace-nowrap">
                            {fmtDateTime(s.startedAtUtc)}
                          </td>
                          <td className="py-2 pr-4">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  background:
                                    STATE_COLORS[s.state] || "var(--text-muted)",
                                }}
                              />
                              <span className="text-ink text-xs capitalize">
                                {s.state}
                              </span>
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-ink">
                            {s.app?.name || (
                              <span className="text-faint italic">unknown</span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-muted text-xs max-w-[240px] truncate">
                            {s.window?.url || s.window?.title || "—"}
                          </td>
                          <td className="py-2 pr-4 text-ink tabular-nums text-xs">
                            {fmtDuration(s.durationMs)}
                          </td>
                          <td className="py-2 pr-4">
                            {s.state === "active" ? (
                              <ActivityBar percent={s.activityPercent} />
                            ) : (
                              <span className="text-faint text-xs">—</span>
                            )}
                          </td>
                          <td className="py-2 text-muted text-xs tabular-nums">
                            {s.input
                              ? `${s.input.keyCount}k ${s.input.mouseClickCount}c`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DataState>
            </Card>
          </>
        )}
      </DataState>
    </Page>
  );
}

function ActivityBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, percent)}%`,
            background: "var(--series-3)",
          }}
        />
      </div>
      <span className="text-xs text-muted tabular-nums">{percent}%</span>
    </div>
  );
}
