"use client";

import { useEffect, useState } from "react";
import { api, Overview } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor, RefreshButton } from "@/components/Controls";
import { Card, Kpi, DataState } from "@/components/ui";
import {
  ActivityTimeline,
  TopAppsBar,
  StateDonut,
  Heatmap,
} from "@/components/charts";
import {
  IconClock,
  IconMoon,
  IconMonitor,
  IconScreenshot,
} from "@/components/icons";
import { fmtDuration } from "@/lib/format";

export default function OverviewPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .overview(rangeFor(range))
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range, refreshKey]);

  const k = data?.kpis;
  const noData = !!data && k?.segmentCount === 0;

  return (
    <Page>
      <PageHeader
        title="Overview"
        subtitle="Fleet-wide activity and analytics"
        range={range}
        onRange={setRange}
      >
        <RefreshButton onClick={() => setRefreshKey((k) => k + 1)} spinning={loading} />
      </PageHeader>

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
                label="Active devices"
                value={String(k.activeDevices)}
                sub={`of ${k.deviceCount} total`}
                accent="var(--series-1)"
                icon={<IconMonitor size={18} />}
              />
              <Kpi
                label="Screenshots"
                value={k.screenshotCount.toLocaleString()}
                sub={`${k.segmentCount.toLocaleString()} segments`}
                accent="var(--series-5)"
                icon={<IconScreenshot size={18} />}
              />
            </div>

            {noData ? (
              <Card>
                <div className="py-16 text-center text-sm text-faint">
                  No activity recorded in this range yet. Once agents run and
                  upload, charts will appear here.
                </div>
              </Card>
            ) : (
              <>
                <Card
                  title="Activity over time"
                  subtitle={`Bucketed by ${data.range.unit}, split by state`}
                  className="mb-4"
                >
                  <ActivityTimeline data={data.timeline} unit={data.range.unit} />
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                  <Card title="Top applications" className="lg:col-span-2">
                    <TopAppsBar data={data.topApps} />
                  </Card>
                  <Card title="Time by state">
                    <StateDonut data={data.stateBreakdown} />
                  </Card>
                </div>

                <Card
                  title="When work happens"
                  subtitle="Active time by day of week and hour (UTC)"
                >
                  <Heatmap data={data.heatmap} />
                </Card>
              </>
            )}
          </>
        )}
      </DataState>
    </Page>
  );
}
