"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DeviceRow } from "@/lib/api";
import { Page, PageHeader } from "@/components/Controls";
import { Card, Badge, DataState } from "@/components/ui";
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
      <PageHeader title="Devices" subtitle="Registered agents across the fleet" />
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
                            href={`/activity?deviceId=${d.id}`}
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
    </Page>
  );
}
