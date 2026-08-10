"use client";

import { useEffect, useState } from "react";
import { api, EventsResp } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor } from "@/components/Controls";
import { Card, Badge, DataState, Pager } from "@/components/ui";
import { ViewToggle, useViewMode } from "@/components/ViewToggle";
import { fmtDateTime } from "@/lib/format";

const TONE: Record<string, "neutral" | "warn" | "crit"> = {
  clock_jump: "warn",
  quota_evicted: "warn",
  quota_blocked: "warn",
  crash: "crit",
  degraded_mode: "neutral",
};

export default function EventsPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EventsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useViewMode("events", "table");
  const LIMIT = 50;

  useEffect(() => setPage(1), [range]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .events({ ...rangeFor(range), page, limit: LIMIT })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range, page]);

  return (
    <Page>
      <PageHeader
        title="Events"
        subtitle="Agent telemetry — crashes, clock jumps, quota"
        range={range}
        onRange={setRange}
      >
        <ViewToggle mode={view} onChange={setView} />
      </PageHeader>

      {view === "cards" ? (
        <DataState
          loading={loading}
          error={error}
          empty={!data || data.items.length === 0}
          emptyMsg="No events reported in this range."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {data?.items.map((e) => (
              <div
                key={e._id}
                className="bg-surface border border-border rounded-2xl p-4"
                style={{ boxShadow: "var(--shadow)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge tone={TONE[e.type] || "neutral"} dot>
                    {e.type}
                  </Badge>
                  <span className="text-xs text-faint">
                    {fmtDateTime(e.atUtc)}
                  </span>
                </div>
                <div className="text-[11px] text-faint font-mono mb-2">
                  device {e.deviceId.slice(-8)}
                </div>
                {e.data && Object.keys(e.data).length > 0 && (
                  <pre className="text-[11px] text-muted font-mono bg-surface-2 rounded-lg p-2 overflow-x-auto">
                    {JSON.stringify(e.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 bg-surface border border-border rounded-xl">
            <Pager
              page={page}
              limit={LIMIT}
              total={data?.total ?? 0}
              onPage={setPage}
            />
          </div>
        </DataState>
      ) : (
      <Card bodyClass="!px-0 !pt-0 !pb-0">
        <DataState
          loading={loading}
          error={error}
          empty={!data || data.items.length === 0}
          emptyMsg="No events reported in this range."
        >
          <div className="overflow-x-auto">
            <table className="dt">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Time</th>
                  <th style={{ width: 160 }}>Type</th>
                  <th style={{ width: 130 }}>Device</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((e) => (
                  <tr key={e._id}>
                    <td className="text-xs text-muted whitespace-nowrap">
                      {fmtDateTime(e.atUtc)}
                    </td>
                    <td>
                      <Badge tone={TONE[e.type] || "neutral"} dot>
                        {e.type}
                      </Badge>
                    </td>
                    <td className="text-xs text-muted font-mono">
                      {e.deviceId.slice(-8)}
                    </td>
                    <td className="max-w-0 truncate text-xs text-muted font-mono">
                      {e.data ? JSON.stringify(e.data) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={page}
            limit={LIMIT}
            total={data?.total ?? 0}
            onPage={setPage}
          />
        </DataState>
      </Card>
      )}
    </Page>
  );
}
