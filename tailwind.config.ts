import type { Config } from "tailwindcss";

// Colors are driven by CSS variables (see globals.css) so light/dark stay in sync.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-hover": "var(--surface-hover)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: "var(--text-primary)",
        muted: "var(--text-secondary)",
        faint: "var(--text-muted)",
        brand: "var(--series-1)",
        good: "var(--status-good)",
        warn: "var(--status-warning)",
        crit: "var(--status-critical)",
      },
      borderRadius: { xl: "0.9rem" },
    },
  },
  plugins: [],
};

export default config;
