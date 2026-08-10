"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DeviceRow } from "@/lib/api";
import { Page, PageHeader } from "@/components/Controls";
import { Card, Badge, DataState } from "@/components/ui";
import { fmtDuration, relativeTime } from "@/lib/format";

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
      <Card>
        <DataState
          loading={loading}
          error={error}
          empty={devices.length === 0}
          emptyMsg="No devices registered yet."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-faint border-b border-border">
                  <th className="py-2 pr-4 font-medium">Device</th>
                  <th className="py-2 pr-4 font-medium">Platform</th>
                  <th className="py-2 pr-4 font-medium">Session</th>
                  <th className="py-2 pr-4 font-medium">Active today</th>
                  <th className="py-2 pr-4 font-medium">Last seen</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-border/60 hover:bg-surface-2"
                  >
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/activity?deviceId=${d.id}`}
                        className="text-ink font-medium hover:text-brand"
                      >
                        {d.name}
                      </Link>
                      <div className="text-[11px] text-faint">
                        v{d.agentVersion || "?"}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-muted">
                      {d.platform} {d.osVersion}
                    </td>
                    <td className="py-2.5 pr-4">
                      {d.degraded?.length ? (
                        <Badge tone="warn">{d.sessionType} · degraded</Badge>
                      ) : (
                        <Badge>{d.sessionType}</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-ink tabular-nums">
                      {fmtDuration(d.activeMsToday)}
                    </td>
                    <td className="py-2.5 pr-4 text-muted text-xs">
                      {relativeTime(d.lastSeenAt)}
                    </td>
                    <td className="py-2.5 pr-4">
                      {d.revoked ? (
                        <Badge tone="crit">Revoked</Badge>
                      ) : (
                        <Badge tone="good">Active</Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => toggleRevoke(d)}
                        className="text-xs text-brand hover:underline"
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
