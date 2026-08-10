"use client";

import { useEffect, useState } from "react";
import { api, Storage } from "@/lib/api";
import { Page, PageHeader } from "@/components/Controls";
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
    body: { before?: number; all?: boolean };
  }>(null);

  function load() {
    setLoading(true);
    api
      .storage()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

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
      <PageHeader title="Storage" subtitle="Cloudflare R2 usage and controls" />

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
