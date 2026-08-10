"use client";

import { ReactNode } from "react";
import { DAY_MS } from "@/lib/format";

export type RangeKey = "today" | "7d" | "30d";

export function rangeFor(key: RangeKey): { from: number; to: number } {
  const now = Date.now();
  if (key === "today") {
    const d = new Date();
    const from = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return { from, to: now };
  }
  if (key === "30d") return { from: now - 30 * DAY_MS, to: now };
  return { from: now - 7 * DAY_MS, to: now };
}

export function PageHeader({
  title,
  subtitle,
  range,
  onRange,
  children,
}: {
  title: string;
  subtitle?: string;
  range?: RangeKey;
  onRange?: (r: RangeKey) => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ink tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {range && onRange && (
          <div
            className="inline-flex rounded-xl border border-border bg-surface p-1"
            style={{ boxShadow: "var(--shadow)" }}
          >
            {(["today", "7d", "30d"] as RangeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => onRange(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  range === k
                    ? "bg-brand text-white shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {k === "today" ? "Today" : k === "7d" ? "7 days" : "30 days"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Styled select to match the range tabs.
export function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl bg-surface border border-border text-xs font-medium text-ink outline-none cursor-pointer hover:border-border-strong transition-colors"
      style={{ boxShadow: "var(--shadow)" }}
    >
      {children}
    </select>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="px-7 py-7 max-w-[1360px] mx-auto">{children}</div>;
}
