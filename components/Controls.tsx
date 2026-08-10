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
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {range && onRange && (
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {(["today", "7d", "30d"] as RangeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => onRange(k)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  range === k
                    ? "bg-brand text-white"
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

export function Page({ children }: { children: ReactNode }) {
  return <div className="p-6 max-w-[1400px] mx-auto">{children}</div>;
}
