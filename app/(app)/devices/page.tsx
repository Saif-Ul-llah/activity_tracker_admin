"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DeviceRow } from "@/lib/api";
import { Page, PageHeader, RefreshButton } from "@/components/Controls";
import { Card, Badge, DataState } from "@/components/ui";
import { ViewToggle, useViewMode } from "@/components/ViewToggle";
import { fmtDuration, relativeTime } from "@/lib/format";

function Monitor({ platform }: { platform: string }) {
  const glyph = platform === "win32" ? "⊞" : platform === "darwin" ? "" : "";
  return (
    <span
      className="inline-grid place-items-center h-9 w-9 rounded-xl shrink-0 text-[15px]"
      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
    >
      {glyph}
    </span>
  );
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useViewMode("devices", "table");

  function load() {
    setLoading(true);
    api
      .devices()
      .then(setDevices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggleRevoke(d: DeviceRow) {
    await api.revokeDevice(d.id, !d.revoked);
    load();
  }

  return (
    <Page>
      <PageHeader title="Devices" subtitle="Registered agents across the fleet">
        <RefreshButton onClick={load} spinning={loading} />
        <ViewToggle mode={view} onChange={setView} />
      </PageHeader>

      {view === "cards" ? (
        <DataState
          loading={loading}
          error={error}
          empty={devices.length === 0}
          emptyMsg="No devices registered yet."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {devices.map((d) => (
              <div
                key={d.id}
                className="bg-surface border border-border rounded-2xl p-4"
                style={{ boxShadow: "var(--shadow)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Monitor platform={d.platform} />
                  <div className="min-w-0">
                    <Link
                      href={`/devices/${d.id}`}
                      className="text-ink font-semibold hover:text-brand truncate block"
                    >
                      {d.name}
                    </Link>
                    <div className="text-[11px] text-faint capitalize">
                      {d.platform} · agent v{d.agentVersion || "?"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {d.degraded?.length ? (
                    <Badge tone="warn" dot>
                      {d.sessionType} · degraded
                    </Badge>
                  ) : (
                    <Badge dot>{d.sessionType}</Badge>
                  )}
                  {d.revoked ? (
                    <Badge tone="crit" dot>
                      Revoked
                    </Badge>
                  ) : (
                    <Badge tone="good" dot>
                      Active
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <div className="text-[11px] text-faint">Active today</div>
                    <div className="text-ink font-semibold tabular-nums">
                      {fmtDuration(d.activeMsToday)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-faint">Last seen</div>
                    <div className="text-ink text-sm">
                      {relativeTime(d.lastSeenAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Link
                    href={`/devices/${d.id}`}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    View activity
                  </Link>
                  <button
                    onClick={() => toggleRevoke(d)}
                    className="text-xs font-medium text-muted hover:text-ink"
                  >
                    {d.revoked ? "Restore" : "Revoke"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DataState>
      ) : (
      <Card bodyClass="!px-0 !pt-0">
        <DataState
          loading={loading}
          error={error}
          empty={devices.length === 0}
          emptyMsg="No devices registered yet."
        >
          <div className="overflow-x-auto">
            <table className="dt">
              <thead>
                <tr>
                  <th>Device</th>
                  <th style={{ width: 170 }}>Platform</th>
                  <th style={{ width: 170 }}>Session</th>
                  <th className="num" style={{ width: 120 }}>
                    Active today
                  </th>
                  <th style={{ width: 120 }}>Last seen</th>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Monitor platform={d.platform} />
                        <div>
                          <Link
                            href={`/devices/${d.id}`}
                            className="text-ink font-medium hover:text-brand"
                          >
                            {d.name}
                          </Link>
                          <div className="text-[11px] text-faint">
                            agent v{d.agentVersion || "?"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">
                      {d.platform} {d.osVersion}
                    </td>
                    <td>
                      {d.degraded?.length ? (
                        <Badge tone="warn" dot>
                          {d.sessionType} · degraded
                        </Badge>
                      ) : (
                        <Badge dot>{d.sessionType}</Badge>
                      )}
                    </td>
                    <td className="num strong">{fmtDuration(d.activeMsToday)}</td>
                    <td className="text-xs text-muted">
                      {relativeTime(d.lastSeenAt)}
                    </td>
                    <td>
                      {d.revoked ? (
                        <Badge tone="crit" dot>
                          Revoked
                        </Badge>
                      ) : (
                        <Badge tone="good" dot>
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="num">
                      <button
                        onClick={() => toggleRevoke(d)}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        {d.revoked ? "Restore" : "Revoke"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </Card>
      )}
    </Page>
  );
}
