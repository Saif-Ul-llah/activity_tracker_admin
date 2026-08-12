"use client";

import { useEffect, useMemo, useState } from "react";
import { api, BrowserSnapshotRow } from "@/lib/api";
import { Page, PageHeader, RefreshButton } from "@/components/Controls";
import { Card, Badge, DataState } from "@/components/ui";
import { ViewToggle, useViewMode } from "@/components/ViewToggle";
import { IconGlobe, IconExternalLink } from "@/components/icons";
import { relativeTime } from "@/lib/format";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Favicon with a graceful fallback to a globe glyph when the icon is missing/blocked.
function Favicon({ url, fav }: { url: string; fav?: string }) {
  const [broken, setBroken] = useState(false);
  if (fav && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={fav}
        alt=""
        width={16}
        height={16}
        className="rounded-sm shrink-0"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="shrink-0 text-faint" title={domainOf(url)}>
      <IconGlobe size={15} />
    </span>
  );
}

function TabLink({
  url,
  title,
  fav,
  active,
}: {
  url: string;
  title: string;
  fav?: string;
  active?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors"
    >
      {active ? (
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: "var(--status-good)" }}
          title="Active tab"
        />
      ) : (
        <span className="h-2 w-2 rounded-full shrink-0 bg-transparent" />
      )}
      <Favicon url={url} fav={fav} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-ink truncate">
          {title || domainOf(url)}
        </span>
        <span className="block text-[11px] text-faint truncate">{url}</span>
      </span>
      <IconExternalLink
        size={14}
        className="text-transparent group-hover:text-brand shrink-0"
      />
    </a>
  );
}

function BrowserBadge({ browser }: { browser: string }) {
  return (
    <Badge tone="brand" dot>
      <span className="capitalize">{browser}</span>
    </Badge>
  );
}

export default function BrowserTabsPage() {
  const [rows, setRows] = useState<BrowserSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useViewMode("browser-tabs", "cards");

  function load() {
    setLoading(true);
    api
      .browserTabs()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  // Group snapshots by device for display.
  const groups = useMemo(() => {
    const m = new Map<string, { name: string; user: string; snaps: BrowserSnapshotRow[] }>();
    for (const r of rows) {
      const g = m.get(r.deviceId) ?? { name: r.deviceName, user: r.userName, snaps: [] };
      g.snaps.push(r);
      m.set(r.deviceId, g);
    }
    return [...m.entries()];
  }, [rows]);

  const totalTabs = rows.reduce((a, r) => a + r.tabCount, 0);

  return (
    <Page>
      <PageHeader
        title="Browser Tabs"
        subtitle={
          rows.length
            ? `${totalTabs} open tabs across ${groups.length} device${
                groups.length === 1 ? "" : "s"
              }`
            : "Open tabs reported by the browser extension"
        }
      >
        <RefreshButton onClick={load} spinning={loading} />
        <ViewToggle mode={view} onChange={setView} />
      </PageHeader>

      <DataState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyMsg="No tabs reported yet. Install the browser extension (resources/browser-extension) on a tracked device — tabs appear here within a minute."
      >
        <div className="space-y-6">
          {groups.map(([deviceId, g]) => (
            <div key={deviceId}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-ink">{g.name}</h2>
                {g.user && <span className="text-xs text-faint">· {g.user}</span>}
              </div>

              <div
                className={
                  view === "cards"
                    ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3"
                    : "space-y-3"
                }
              >
                {g.snaps.map((s) => (
                  <Card key={s.id} bodyClass="!p-0">
                    <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
                      <div className="flex items-center gap-2">
                        <BrowserBadge browser={s.browser} />
                        <span className="text-xs text-faint tabular-nums">
                          {s.tabCount} tab{s.tabCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <span className="text-[11px] text-faint">
                        {relativeTime(s.updatedAt)}
                      </span>
                    </div>
                    <div className="px-1.5 pb-2 max-h-[420px] overflow-y-auto">
                      {s.tabs.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-faint">
                          No http(s) tabs open.
                        </div>
                      ) : (
                        // Active tab first, then the rest.
                        [...s.tabs]
                          .sort((a, b) => Number(b.active) - Number(a.active))
                          .map((t, i) => (
                            <TabLink
                              key={i}
                              url={t.url}
                              title={t.title}
                              fav={t.favIconUrl}
                              active={t.active}
                            />
                          ))
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DataState>
    </Page>
  );
}
