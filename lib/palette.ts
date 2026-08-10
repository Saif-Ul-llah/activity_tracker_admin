// Validated categorical palette (dataviz skill). Assigned by FIXED order, never
// cycled. Reads the CSS variables so light/dark stay in sync with globals.css.
export const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

// Activity states get a fixed, meaningful color mapping (categorical, not cycled).
export const STATE_COLORS: Record<string, string> = {
  active: "var(--series-3)", // aqua/green — working
  idle: "var(--series-4)", // yellow — away
  paused: "var(--series-1)", // blue — intentionally paused
  locked: "var(--series-7)", // violet — screen locked
  suspended: "var(--text-muted)", // gray — machine asleep
  discarded: "var(--series-8)", // red — discarded idle
};

export const STATE_ORDER = [
  "active",
  "idle",
  "paused",
  "locked",
  "suspended",
  "discarded",
];

export function seriesColor(i: number): string {
  return SERIES[i % SERIES.length];
}
