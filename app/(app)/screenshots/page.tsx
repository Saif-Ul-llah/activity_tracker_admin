"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, DeviceRow, Shot } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor, Select } from "@/components/Controls";
import { Badge, DataState, Pager } from "@/components/ui";
import { IconTrash } from "@/components/icons";
import { ViewToggle, useViewMode } from "@/components/ViewToggle";
import { fmtDateTime, fmtBytes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function ScreenshotsPage() {
  return (
    <Suspense fallback={<Page>Loading…</Page>}>
      <ScreenshotsInner />
    </Suspense>
  );
}

function ScreenshotsInner() {
  const params = useSearchParams();
  const [deviceId, setDeviceId] = useState(params.get("deviceId") || "");
  const [range, setRange] = useState<RangeKey>("7d");
  const [page, setPage] = useState(1);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Shot | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [view, setView] = useViewMode("screenshots", "cards");
  const LIMIT = 48;

  useEffect(() => {
    api.devices().then(setDevices).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [range, deviceId]);

  function reload() {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .screenshots({
        ...rangeFor(range),
        deviceId: deviceId || undefined,
        page,
        limit: LIMIT,
      })
      .then((d) => {
        if (!alive) return;
        setShots(d.items);
        setTotal(d.total);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }
  useEffect(reload, [range, deviceId, page]);

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} screenshot(s) from R2? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      await api.deleteScreenshots({ ids: Array.from(selected) });
      setSelected(new Set());
      reload();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Screenshots"
        subtitle={`${total.toLocaleString()} captured in range`}
        range={range}
        onRange={setRange}
      >
        <Select value={deviceId} onChange={setDeviceId}>
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <ViewToggle
          mode={view}
          onChange={setView}
          labels={{ table: "List", cards: "Grid" }}
        />
      </PageHeader>

      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-2.5 mb-4">
          <span className="text-sm text-ink font-medium">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-muted hover:text-ink px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-crit hover:opacity-90 disabled:opacity-50"
            >
              <IconTrash size={14} />
              {deleting ? "Deleting…" : "Delete selected"}
            </button>
          </div>
        </div>
      )}

      <DataState
        loading={loading}
        error={error}
        empty={shots.length === 0}
        emptyMsg="No screenshots captured yet. (On Wayland, screenshots are blocked — use an Xorg session.)"
      >
        {view === "table" ? (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow)" }}>
            {shots.map((s) => {
              const isSel = selected.has(s.id);
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 ${
                    isSel ? "bg-surface-2" : "hover:bg-surface-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggle(s.id)}
                    className="accent-brand cursor-pointer"
                  />
                  <button
                    onClick={() => setLightbox(s)}
                    className="h-11 w-20 rounded-md overflow-hidden bg-surface-2 shrink-0"
                  >
                    {s.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink truncate">
                      {fmtDateTime(s.capturedAtUtc)}
                    </div>
                    <div className="text-[11px] text-faint">
                      Display {s.displayIndex}
                      {s.isActiveDisplay ? " · active" : ""}
                    </div>
                  </div>
                  <span className="text-xs text-muted tabular-nums">
                    {fmtBytes(s.bytes)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shots.map((s) => {
            const isSel = selected.has(s.id);
            return (
              <div
                key={s.id}
                className={`group text-left bg-surface border rounded-xl overflow-hidden transition-colors ${
                  isSel ? "border-brand ring-2 ring-brand/30" : "border-border hover:border-brand"
                }`}
              >
                <div className="aspect-video bg-surface-2 overflow-hidden relative">
                  {s.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.url}
                      alt="screenshot"
                      onClick={() => setLightbox(s)}
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-[1.02] transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-faint">
                      no preview
                    </div>
                  )}
                  {/* selection checkbox */}
                  <button
                    onClick={() => toggle(s.id)}
                    className={`absolute top-1.5 right-1.5 h-5 w-5 rounded-md grid place-items-center border transition-colors ${
                      isSel
                        ? "bg-brand border-brand text-white"
                        : "bg-black/40 border-white/40 text-transparent hover:text-white/70"
                    }`}
                    title="Select"
                  >
                    ✓
                  </button>
                  {s.isActiveDisplay && (
                    <span className="absolute top-1.5 left-1.5">
                      <Badge tone="brand">active</Badge>
                    </span>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <div className="text-xs text-ink">
                    {fmtDateTime(s.capturedAtUtc)}
                  </div>
                  <div className="text-[11px] text-faint">
                    Display {s.displayIndex} · {fmtBytes(s.bytes)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {total > LIMIT && (
          <div className="mt-4 bg-surface border border-border rounded-xl">
            <Pager page={page} limit={LIMIT} total={total} onPage={setPage} />
          </div>
        )}
      </DataState>

      {lightbox && lightbox.url && (
        <div
          className="fixed inset-0 bg-black/80 grid place-items-center z-50 p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt="screenshot"
              className="w-full rounded-lg shadow-2xl"
            />
            <div className="text-center text-xs text-white/70 mt-3">
              {fmtDateTime(lightbox.capturedAtUtc)} · Display{" "}
              {lightbox.displayIndex} · {fmtBytes(lightbox.bytes)}
              <button
                onClick={() => setLightbox(null)}
                className="ml-4 underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
