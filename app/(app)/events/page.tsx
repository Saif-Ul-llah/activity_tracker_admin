"use client";

import { useEffect, useState } from "react";
import { api, EventsResp } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor } from "@/components/Controls";
import { Card, Badge, DataState } from "@/components/ui";
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
  const [data, setData] = useState<EventsResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .events({ ...rangeFor(range), limit: 100 })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range]);

  return (
    <Page>
      <PageHeader
        title="Events"
        subtitle="Agent telemetry — crashes, clock jumps, quota"
        range={range}
        onRange={setRange}
      />
      <Card bodyClass="!px-0 !pt-0">
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
        </DataState>
      </Card>
    </Page>
  );
}
