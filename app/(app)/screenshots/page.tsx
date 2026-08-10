"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, DeviceRow, Shot } from "@/lib/api";
import { Page, PageHeader, RangeKey, rangeFor, Select } from "@/components/Controls";
import { Card, Badge, DataState } from "@/components/ui";
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
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<Shot | null>(null);

  useEffect(() => {
    api.devices().then(setDevices).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .screenshots({ ...rangeFor(range), deviceId: deviceId || undefined, limit: 60 })
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
  }, [range, deviceId]);

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
      </PageHeader>

      <DataState
        loading={loading}
        error={error}
        empty={shots.length === 0}
        emptyMsg="No screenshots captured yet. (On Wayland, screenshots are blocked — use an Xorg session.)"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shots.map((s) => (
            <button
              key={s.id}
              onClick={() => setLightbox(s)}
              className="group text-left bg-surface border border-border rounded-xl overflow-hidden hover:border-brand transition-colors"
            >
              <div className="aspect-video bg-surface-2 overflow-hidden relative">
                {s.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.url}
                    alt="screenshot"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-faint">
                    no preview
                  </div>
                )}
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
            </button>
          ))}
        </div>
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
