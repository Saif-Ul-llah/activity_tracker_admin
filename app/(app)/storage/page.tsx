"use client";

import { useEffect, useState } from "react";
import { api, Storage, DeviceRow } from "@/lib/api";
import { Page, PageHeader, RefreshButton, Select } from "@/components/Controls";
import { Card, Kpi, Badge, DataState } from "@/components/ui";
import { IconStorage, IconScreenshot, IconTrash } from "@/components/icons";
import { fmtBytes } from "@/lib/format";

export default function StoragePage() {
  const [data, setData] = useState<Storage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<null | {
    label: string;
    body: {
      before?: number;
      all?: boolean;
      deviceId?: string;
      from?: number;
      to?: number;
    };
  }>(null);
  const [interval, setIntervalSec] = useState<number>(15);

  // Scoped delete (by device and/or date range).
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [scDevice, setScDevice] = useState("");
  const [scFrom, setScFrom] = useState("");
  const [scTo, setScTo] = useState("");
  useEffect(() => {
    api.devices().then(setDevices).catch(() => {});
  }, []);

  const scFromMs = scFrom ? Date.parse(scFrom + "T00:00:00.000Z") : undefined;
  const scToMs = scTo ? Date.parse(scTo + "T23:59:59.999Z") : undefined;
  const scRangeInvalid =
    scFromMs !== undefined && scToMs !== undefined && scFromMs > scToMs;
  const scNoScope = !scDevice && !scFromMs && !scToMs;
  const scDeviceName = scDevice
    ? devices.find((d) => d.id === scDevice)?.name ?? "the selected device"
    : "all devices";

  function queueScopedDelete() {
    if (scNoScope || scRangeInvalid) return;
    const range =
      scFrom || scTo
        ? ` (${scFrom || "start"} → ${scTo || "now"})`
        : " (all time)";
    setConfirmDelete({
      label: `screenshots for ${scDeviceName}${range}`,
      body: { deviceId: scDevice || undefined, from: scFromMs, to: scToMs },
    });
  }

  function load() {
    setLoading(true);
    api
      .storage()
      .then((d) => {
        setData(d);
        setIntervalSec(d.screenshotIntervalSec || 15);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function saveInterval() {
    setBusy(true);
    try {
      const clamped = Math.min(3600, Math.max(3, Math.round(interval) || 15));
      await api.updateGlobalSettings({ screenshotIntervalSec: clamped });
      setIntervalSec(clamped);
      setMsg(
        `Screenshot interval set to ${clamped}s — agents apply it on their next capture cycle.`
      );
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleUpload() {
    if (!data) return;
    setBusy(true);
    try {
      await api.updateGlobalSettings({
        screenshotUploadEnabled: !data.screenshotUploadEnabled,
      });
      setMsg(
        data.screenshotUploadEnabled
          ? "Upload paused — agents will keep screenshots on the local machine."
          : "Upload resumed — agents will upload queued screenshots."
      );
      load();
    } finally {
      setBusy(false);
    }
  }

  async function runDelete() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const res = await api.deleteScreenshots(confirmDelete.body);
      setMsg(
        `Deleted ${res.deleted.toLocaleString()} screenshots (${res.freedFromR2.toLocaleString()} objects removed from R2).`
      );
      setConfirmDelete(null);
      load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const DAY = 86400000;

  return (
    <Page>
      <PageHeader title="Storage" subtitle="Cloudflare R2 usage and controls">
        <RefreshButton onClick={load} spinning={loading} />
      </PageHeader>

      <DataState loading={loading} error={error}>
        {data && (
          <>
            {msg && (
              <div className="mb-4 text-sm text-brand bg-brand/10 border border-brand/20 rounded-xl px-4 py-2.5">
                {msg}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Usage gauge */}
              <Card className="lg:col-span-2" title="R2 storage used">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-3xl font-semibold text-ink tabular-nums">
                      {fmtBytes(data.usedBytes)}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      of {fmtBytes(data.limitBytes)} limit ·{" "}
                      {data.screenshotCount.toLocaleString()} screenshots
                    </div>
                  </div>
                  <div
                    className="text-2xl font-semibold tabular-nums"
                    style={{
                      color:
                        data.usedPercent >= 90
                          ? "var(--status-critical)"
                          : data.usedPercent >= 70
                          ? "var(--status-warning)"
                          : "var(--status-good)",
                    }}
                  >
                    {data.usedPercent}%
                  </div>
                </div>
                <div className="h-3 rounded-full bg-surface-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(2, data.usedPercent)}%`,
                      background:
                        data.usedPercent >= 90
                          ? "var(--status-critical)"
                          : data.usedPercent >= 70
                          ? "var(--status-warning)"
                          : "var(--series-1)",
                    }}
                  />
                </div>
              </Card>

              {/* Upload toggle */}
              <Card title="Screenshot upload">
                <div className="flex items-center gap-2 mb-3">
                  {data.screenshotUploadEnabled ? (
                    <Badge tone="good" dot>
                      Uploading to R2
                    </Badge>
                  ) : (
                    <Badge tone="warn" dot>
                      Paused (saving locally)
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted mb-4 leading-relaxed">
                  When paused, agents keep new screenshots on the local machine and
                  upload them once you resume — useful when nearing the R2 limit.
                </p>
                <button
                  onClick={toggleUpload}
                  disabled={busy}
                  className={`w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors ${
                    data.screenshotUploadEnabled
                      ? "bg-warn/15 text-warn hover:bg-warn/25"
                      : "bg-good/15 text-good hover:bg-good/25"
                  }`}
                >
                  {data.screenshotUploadEnabled
                    ? "Pause R2 upload"
                    : "Resume R2 upload"}
                </button>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <Kpi
                label="Objects stored"
                value={data.screenshotCount.toLocaleString()}
                accent="var(--series-5)"
                icon={<IconScreenshot size={18} />}
              />
              <Kpi
                label="Used"
                value={fmtBytes(data.usedBytes)}
                accent="var(--series-1)"
                icon={<IconStorage size={18} />}
              />
              <Kpi
                label="Limit"
                value={fmtBytes(data.limitBytes)}
                accent="var(--series-3)"
              />
            </div>

            {/* Capture interval */}
            <Card
              title="Screenshot capture interval"
              subtitle="How often every agent takes a screenshot (applies fleet-wide, live)"
              className="mb-4"
            >
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-[11px] text-faint mb-1.5">
                    Interval (seconds)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={3}
                      max={3600}
                      value={interval}
                      onChange={(e) => setIntervalSec(Number(e.target.value))}
                      className="w-28 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink tabular-nums outline-none focus:border-brand transition-colors"
                    />
                    <span className="text-xs text-faint">
                      = 1 shot every{" "}
                      {interval >= 60
                        ? `${(interval / 60).toFixed(interval % 60 ? 1 : 0)} min`
                        : `${interval || 0}s`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[10, 15, 30, 60, 300].map((p) => (
                    <button
                      key={p}
                      onClick={() => setIntervalSec(p)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        interval === p
                          ? "bg-brand text-white border-brand"
                          : "text-muted border-border hover:bg-surface-2 hover:text-ink"
                      }`}
                    >
                      {p >= 60 ? `${p / 60}m` : `${p}s`}
                    </button>
                  ))}
                </div>
                <button
                  onClick={saveInterval}
                  disabled={busy || interval === data.screenshotIntervalSec}
                  className="ml-auto px-4 py-2 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-40 transition-colors"
                >
                  {busy ? "Saving…" : "Save interval"}
                </button>
              </div>
              <p className="text-[11px] text-faint mt-3 leading-relaxed">
                Lower = more screenshots and more R2 storage. Shorter than 3s is not
                allowed. Current fleet default:{" "}
                <span className="text-muted font-medium tabular-nums">
                  {data.screenshotIntervalSec}s
                </span>
                .
              </p>
            </Card>

            {/* Bulk delete */}
            <Card
              title="Free up space"
              subtitle="Bulk-delete screenshots from R2 and the database"
            >
              <div className="flex flex-wrap gap-2">
                <DeleteBtn
                  onClick={() =>
                    setConfirmDelete({
                      label: "older than 7 days",
                      body: { before: Date.now() - 7 * DAY },
                    })
                  }
                >
                  Delete older than 7 days
                </DeleteBtn>
                <DeleteBtn
                  onClick={() =>
                    setConfirmDelete({
                      label: "older than 30 days",
                      body: { before: Date.now() - 30 * DAY },
                    })
                  }
                >
                  Delete older than 30 days
                </DeleteBtn>
                <DeleteBtn
                  danger
                  onClick={() =>
                    setConfirmDelete({
                      label: "ALL screenshots",
                      body: { all: true },
                    })
                  }
                >
                  Delete all screenshots
                </DeleteBtn>
              </div>

              {/* Scoped delete: by device and/or date range */}
              <div className="mt-5 pt-5 border-t border-border">
                <div className="text-xs font-semibold text-ink mb-1">
                  Delete by device or date range
                </div>
                <p className="text-[11px] text-faint mb-3">
                  Pick a device, a date range, or both. Dates are inclusive (UTC).
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-faint mb-1">
                      Device
                    </label>
                    <Select value={scDevice} onChange={setScDevice}>
                      <option value="">All devices</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-faint mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={scFrom}
                      onChange={(e) => setScFrom(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-faint mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={scTo}
                      onChange={(e) => setScTo(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-ink outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <button
                    onClick={queueScopedDelete}
                    disabled={scNoScope || scRangeInvalid}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-crit border border-crit/30 bg-crit/10 hover:bg-crit/20 disabled:opacity-40 transition-colors"
                  >
                    <IconTrash size={15} />
                    Delete
                  </button>
                </div>
                {scRangeInvalid && (
                  <p className="text-xs text-crit mt-2">
                    “From” must be before “To”.
                  </p>
                )}
                {scNoScope && (
                  <p className="text-[11px] text-faint mt-2">
                    Choose a device and/or a date range to enable delete.
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </DataState>

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4"
          onClick={() => !busy && setConfirmDelete(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md"
            style={{ boxShadow: "var(--shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3 text-crit">
              <IconTrash size={20} />
              <h3 className="text-base font-semibold text-ink">
                Delete {confirmDelete.label}?
              </h3>
            </div>
            <p className="text-sm text-muted mb-5">
              This permanently removes the matching screenshots from Cloudflare R2
              and the database. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={runDelete}
                disabled={busy}
                className="flex-1 py-2 rounded-xl bg-crit text-white text-sm font-semibold disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={busy}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

function DeleteBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
        danger
          ? "text-crit border-crit/30 bg-crit/10 hover:bg-crit/20"
          : "text-muted border-border hover:bg-surface-2 hover:text-ink"
      }`}
    >
      <IconTrash size={15} />
      {children}
    </button>
  );
}
