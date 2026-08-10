"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ActivityResp, DeviceRow, Segment } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor, Select } from "@/components/Controls";
import { Card, DataState, StatePill, ActivityMeter, Pager } from "@/components/ui";
import { TopAppsBar } from "@/components/charts";
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
  const [page, setPage] = useState(1);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [data, setData] = useState<ActivityResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  }, [range, deviceId, page]);

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
