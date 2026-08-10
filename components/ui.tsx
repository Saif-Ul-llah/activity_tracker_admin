"use client";

import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className={`bg-surface border border-border rounded-xl p-5 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2">
        {accent && (
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: accent }}
          />
        )}
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-ink mt-1.5 tabular-nums">
        {value}
      </div>
      {sub && <div className="text-xs text-faint mt-0.5">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "crit" | "brand";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-2 text-muted border-border",
    good: "text-good border-good/40 bg-good/10",
    warn: "text-warn border-warn/40 bg-warn/10",
    crit: "text-crit border-crit/40 bg-crit/10",
    brand: "text-brand border-brand/40 bg-brand/10",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tones[tone]}`}
    >
      {children}
    </span>
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
      <div className="py-16 grid place-items-center text-sm text-muted">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  if (error)
    return (
      <div className="py-16 grid place-items-center text-sm text-crit">
        {error}
      </div>
    );
  if (empty)
    return (
      <div className="py-16 grid place-items-center text-sm text-faint">
        {emptyMsg}
      </div>
    );
  return <>{children}</>;
}
