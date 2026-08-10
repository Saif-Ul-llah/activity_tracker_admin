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
      <Card>
        <DataState
          loading={loading}
          error={error}
          empty={!data || data.items.length === 0}
          emptyMsg="No events reported in this range."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-faint border-b border-border">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Device</th>
                  <th className="py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((e) => (
                  <tr
                    key={e._id}
                    className="border-b border-border/60 hover:bg-surface-2"
                  >
                    <td className="py-2 pr-4 text-muted text-xs whitespace-nowrap">
                      {fmtDateTime(e.atUtc)}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge tone={TONE[e.type] || "neutral"}>{e.type}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-muted text-xs font-mono">
                      {e.deviceId.slice(-8)}
                    </td>
                    <td className="py-2 text-muted text-xs font-mono max-w-[360px] truncate">
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
