"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { fmtDuration } from "@/lib/format";
import { STATE_COLORS, STATE_ORDER, seriesColor } from "@/lib/palette";

// ── Shared tooltip (token-colored, never series-colored text) ─────────────────
function TipBox({
  label,
  rows,
}: {
  label?: string;
  rows: { name: string; value: string; color?: string }[];
}) {
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      {label && <div className="text-faint mb-1">{label}</div>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          {r.color && (
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: r.color }}
            />
          )}
          <span className="text-muted">{r.name}</span>
          <span className="text-ink font-medium ml-auto tabular-nums">
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function bucketLabel(iso: string, unit: "hour" | "day"): string {
  const d = new Date(iso);
  return unit === "hour"
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", month: "short", day: "numeric" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Activity timeline (stacked area by state) ─────────────────────────────────
export function ActivityTimeline({
  data,
  unit,
}: {
  data: { bucket: string; state: string; durationMs: number }[];
  unit: "hour" | "day";
}) {
  // Pivot to one row per bucket with a column per state.
  const byBucket = new Map<string, any>();
  for (const d of data) {
    const row = byBucket.get(d.bucket) || { bucket: d.bucket };
    row[d.state] = (row[d.state] || 0) + d.durationMs;
    byBucket.set(d.bucket, row);
  }
  const rows = Array.from(byBucket.values()).sort(
    (a, b) => +new Date(a.bucket) - +new Date(b.bucket)
  );
  const states = STATE_ORDER.filter((s) => data.some((d) => d.state === s));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="bucket"
          tickFormatter={(v) => bucketLabel(v, unit)}
          minTickGap={40}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => fmtDuration(v)}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TipBox
                label={bucketLabel(String(label), unit)}
                rows={payload
                  .filter((p) => p.value)
                  .map((p) => ({
                    name: String(p.name),
                    value: fmtDuration(Number(p.value)),
                    color: String(p.color),
                  }))}
              />
            ) : null
          }
        />
        <Legend iconType="circle" iconSize={8} />
        {states.map((s) => (
          <Area
            key={s}
            type="monotone"
            dataKey={s}
            name={s}
            stackId="1"
            stroke={STATE_COLORS[s]}
            fill={STATE_COLORS[s]}
            fillOpacity={0.55}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Top apps (horizontal bar) ─────────────────────────────────────────────────
export function TopAppsBar({
  data,
}: {
  data: { app: string; durationMs: number }[];
}) {
  const rows = data.slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 34)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => fmtDuration(v)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="app"
          width={110}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TipBox
                label={String(payload[0].payload.app)}
                rows={[
                  {
                    name: "Active time",
                    value: fmtDuration(Number(payload[0].value)),
                    color: "var(--series-1)",
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="durationMs" fill="var(--series-1)" radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── State breakdown (donut) ───────────────────────────────────────────────────
export function StateDonut({
  data,
}: {
  data: { state: string; durationMs: number }[];
}) {
  const rows = data.filter((d) => d.durationMs > 0);
  const total = rows.reduce((a, b) => a + b.durationMs, 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={rows}
          dataKey="durationMs"
          nameKey="state"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          stroke="var(--surface)"
          strokeWidth={2}
        >
          {rows.map((r) => (
            <Cell key={r.state} fill={STATE_COLORS[r.state] || "var(--text-muted)"} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TipBox
                rows={[
                  {
                    name: String(payload[0].name),
                    value: `${fmtDuration(Number(payload[0].value))} (${Math.round(
                      (Number(payload[0].value) / total) * 100
                    )}%)`,
                    color: STATE_COLORS[String(payload[0].name)],
                  },
                ]}
              />
            ) : null
          }
        />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Activity heatmap (day-of-week × hour) ─────────────────────────────────────
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function Heatmap({
  data,
}: {
  data: { dow: number; hour: number; durationMs: number }[];
}) {
  const grid = new Map<string, number>();
  let max = 0;
  for (const d of data) {
    grid.set(`${d.dow}-${d.hour}`, d.durationMs);
    max = Math.max(max, d.durationMs);
  }
  const cell = (dow1: number, hour: number) => {
    const v = grid.get(`${dow1}-${hour}`) || 0;
    const t = max ? v / max : 0;
    // Single-hue sequential ramp (blue), light→dark by intensity.
    return {
      bg:
        t === 0
          ? "var(--surface-2)"
          : `color-mix(in oklab, var(--series-1) ${Math.round(
              15 + t * 85
            )}%, var(--surface))`,
      v,
    };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="flex">
          <div className="w-10" />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-faint">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {DOW.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="w-10 text-[10px] text-faint pr-1 text-right">
              {label}
            </div>
            {Array.from({ length: 24 }).map((_, h) => {
              const c = cell(i + 1, h);
              return (
                <div
                  key={h}
                  title={`${label} ${h}:00 — ${fmtDuration(c.v)}`}
                  className="flex-1 aspect-square m-[1px] rounded-[3px]"
                  style={{ background: c.bg }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
