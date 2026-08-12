"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ActivityResp, DeviceRow, Segment } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor, Select, RefreshButton } from "@/components/Controls";
import { Card, DataState, StatePill, ActivityMeter, Pager } from "@/components/ui";
import { ViewToggle, useViewMode } from "@/components/ViewToggle";
import { TopAppsBar } from "@/components/charts";
import { IconExternalLink } from "@/components/icons";
import { fmtDuration, fmtDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

// A segment's window/URL cell: a real clickable link when the browser extension
// captured a URL for the focused tab, otherwise the plain window title.
function WindowCell({ window: w }: { window?: Segment["window"] }) {
  const url = w?.url;
  if (url && /^https?:\/\//i.test(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 text-brand hover:underline max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate">{w?.title || url}</span>
        <IconExternalLink size={13} className="shrink-0 opacity-60 group-hover:opacity-100" />
      </a>
    );
  }
  return <>{w?.title || <span className="text-faint">—</span>}</>;
}

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
  const [page, setPage] = useState(1);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [data, setData] = useState<ActivityResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useViewMode("activity", "table");
  const [refreshKey, setRefreshKey] = useState(0);
  const LIMIT = 50;

  useEffect(() => {
    api.devices().then(setDevices).catch(() => {});
  }, []);

  // Reset to page 1 when filters change.
  useEffect(() => setPage(1), [range, deviceId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .activity({
        ...rangeFor(range),
        deviceId: deviceId || undefined,
        page,
        limit: LIMIT,
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range, deviceId, page, refreshKey]);

  return (
    <Page>
      <PageHeader
        title="Activity History"
        subtitle="Per-segment timeline of tracked work"
        range={range}
        onRange={setRange}
      >
        <Select value={deviceId} onChange={setDeviceId}>
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <RefreshButton onClick={() => setRefreshKey((k) => k + 1)} spinning={loading} />
        <ViewToggle mode={view} onChange={setView} />
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
              subtitle={`${data.total.toLocaleString()} total`}
              bodyClass="!px-0 !pb-0"
            >
              <DataState
                loading={false}
                empty={data.segments.length === 0}
                emptyMsg="No activity segments in this range."
              >
                {view === "cards" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 px-5 pb-5">
                    {data.segments.map((s: Segment) => (
                      <div
                        key={s._id}
                        className="border border-border rounded-xl p-3.5 bg-surface-2/40"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <StatePill state={s.state} />
                          <span className="text-xs text-faint">
                            {fmtDateTime(s.startedAtUtc)}
                          </span>
                        </div>
                        <div className="text-ink font-medium truncate">
                          {s.app?.name || (
                            <span className="text-faint font-normal">unknown</span>
                          )}
                        </div>
                        <div className="text-xs text-muted truncate mb-3">
                          <WindowCell window={s.window} />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink font-semibold tabular-nums">
                            {fmtDuration(s.durationMs)}
                          </span>
                          {s.state === "active" && (
                            <ActivityMeter percent={s.activityPercent} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                        <th className="num" style={{ width: 90 }}>
                          Input
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.segments.map((s: Segment) => (
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
                            <WindowCell window={s.window} />
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
                          <td className="num text-xs text-muted">
                            {s.input
                              ? `${s.input.keyCount}⌨ ${s.input.mouseClickCount}🖱`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </DataState>
              <Pager
                page={page}
                limit={LIMIT}
                total={data.total}
                onPage={setPage}
              />
            </Card>
          </>
        )}
      </DataState>
    </Page>
  );
}
