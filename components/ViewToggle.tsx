"use client";

import { useEffect, useState } from "react";
import { IconList, IconGrid } from "./icons";

export type ViewMode = "table" | "cards";

// Per-page view preference, persisted to localStorage.
export function useViewMode(key: string, def: ViewMode = "table"): [
  ViewMode,
  (m: ViewMode) => void
] {
  const [mode, setMode] = useState<ViewMode>(def);
  useEffect(() => {
    const stored = localStorage.getItem(`view_${key}`) as ViewMode | null;
    if (stored === "table" || stored === "cards") setMode(stored);
  }, [key]);
  const set = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(`view_${key}`, m);
  };
  return [mode, set];
}

export function ViewToggle({
  mode,
  onChange,
  labels = { table: "List", cards: "Cards" },
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  labels?: { table: string; cards: string };
}) {
  return (
    <div
      className="inline-flex rounded-xl border border-border bg-surface p-1"
      style={{ boxShadow: "var(--shadow)" }}
    >
      <button
        onClick={() => onChange("table")}
        title={labels.table}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          mode === "table" ? "bg-brand text-white" : "text-muted hover:text-ink"
        }`}
      >
        <IconList size={15} />
      </button>
      <button
        onClick={() => onChange("cards")}
        title={labels.cards}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          mode === "cards" ? "bg-brand text-white" : "text-muted hover:text-ink"
        }`}
      >
        <IconGrid size={15} />
      </button>
    </div>
  );
}
