"use client";

import { ReactNode } from "react";
import { STATE_COLORS } from "@/lib/palette";

export function Card({
  children,
  className = "",
  title,
  subtitle,
  actions,
  bodyClass = "",
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  bodyClass?: string;
}) {
  return (
    <section
      className={`bg-surface border border-border rounded-2xl ${className}`}
      style={{ boxShadow: "var(--shadow)" }}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-1">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-ink tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={title ? `px-5 pb-5 pt-3 ${bodyClass}` : `p-5 ${bodyClass}`}>
        {children}
      </div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className="bg-surface border border-border rounded-2xl p-4 relative overflow-hidden"
      style={{ boxShadow: "var(--shadow)" }}
    >
      {accent && (
        <span
          className="absolute left-0 top-0 h-full w-[3px]"
          style={{ background: accent }}
        />
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted font-medium">{label}</span>
        {icon && <span className="text-faint">{icon}</span>}
      </div>
      <div className="text-[26px] leading-tight font-semibold text-ink mt-2 tabular-nums tracking-tight">
        {value}
      </div>
      {sub && <div className="text-xs text-faint mt-1">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  dot,
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "crit" | "brand";
  dot?: boolean;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-muted border-border",
    good: "text-good border-good/30 bg-good/10",
    warn: "text-warn border-warn/30 bg-warn/10",
    crit: "text-crit border-crit/30 bg-crit/10",
    brand: "text-brand border-brand/30 bg-brand/10",
  };
  const dotColor: Record<string, string> = {
    neutral: "var(--text-muted)",
    good: "var(--status-good)",
    warn: "var(--status-warning)",
    crit: "var(--status-critical)",
    brand: "var(--series-1)",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone]}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor[tone] }}
        />
      )}
      {children}
    </span>
  );
}

// State pill with the canonical state color dot.
export function StatePill({ state }: { state: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: STATE_COLORS[state] || "var(--text-muted)" }}
      />
      <span className="text-ink text-[13px] capitalize">{state}</span>
    </span>
  );
}

// Colored initials avatar, deterministic hue from a key.
export function Avatar({ name, id }: { name: string; id?: string }) {
  const initials = (name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue = [...(id || name || "x")].reduce((a, c) => a + c.charCodeAt(0), 0) % 8;
  return (
    <span
      className="inline-grid place-items-center h-8 w-8 rounded-full text-[11px] font-semibold shrink-0"
      style={{
        background: `color-mix(in oklab, var(--series-${hue + 1}) 18%, transparent)`,
        color: `var(--series-${hue + 1})`,
      }}
    >
      {initials}
    </span>
  );
}

export function ActivityMeter({ percent }: { percent: number }) {
  const color =
    percent >= 60
      ? "var(--status-good)"
      : percent >= 30
      ? "var(--status-warning)"
      : "var(--status-serious)";
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-14 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, percent)}%`, background: color }}
        />
      </div>
      <span className="text-xs text-muted tabular-nums w-9 text-right">
        {percent}%
      </span>
    </div>
  );
}

export function DataState({
  loading,
  error,
  empty,
  emptyMsg = "No data for this range.",
  children,
}: {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMsg?: string;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div className="py-20 grid place-items-center">
        <div className="h-5 w-5 rounded-full border-2 border-border border-t-brand animate-spin" />
      </div>
    );
  if (error)
    return (
      <div className="py-20 grid place-items-center text-sm text-crit">
        {error}
      </div>
    );
  if (empty)
    return (
      <div className="py-20 grid place-items-center gap-1 text-center">
        <div className="text-sm text-muted">{emptyMsg}</div>
      </div>
    );
  return <>{children}</>;
}
