"use client";

import { useEffect, useState } from "react";
import { api, UserRow } from "@/lib/api";
import { Page, PageHeader } from "@/components/Controls";
import { Card, Badge, DataState, Avatar } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/icons";
import { fmtDateTime } from "@/lib/format";
import { currentUser } from "@/lib/auth";

const ROLES = ["ADMIN", "SUB_ADMIN", "DISTRIBUTOR", "INSTALLER", "CUSTOMER"];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");

  const selfId = currentUser()?.id;
  // Rows that may be selected/deleted (never your own account).
  const selectableIds = users.filter((u) => u.id !== selfId).map((u) => u.id);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDelBusy(true);
    setDelErr("");
    try {
      await api.deleteUser(deleting.id);
      setDeleting(null);
      load();
    } catch (e: any) {
      setDelErr(e.message);
    } finally {
      setDelBusy(false);
    }
  }

  async function bulkDelete() {
    setBulkBusy(true);
    setBulkMsg("");
    const ids = Array.from(selected);
    const results = await Promise.allSettled(ids.map((id) => api.deleteUser(id)));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - ok;
    setBulkMsg(
      `Deleted ${ok} user(s)${failed ? `, ${failed} failed` : ""}.`
    );
    setSelected(new Set());
    setBulkConfirm(false);
    setBulkBusy(false);
    load();
  }

  function load() {
    setLoading(true);
    api
      .users()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <Page>
      <PageHeader
        title="User Management"
        subtitle="Employees, roles, and access"
      >
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <IconPlus size={15} />
          New user
        </button>
      </PageHeader>

      {(selected.size > 0 || bulkMsg) && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-2.5 mb-4">
          <span className="text-sm text-ink font-medium">
            {selected.size > 0 ? `${selected.size} selected` : bulkMsg}
          </span>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted hover:text-ink px-2 py-1"
              >
                Clear
              </button>
              <button
                onClick={() => setBulkConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-crit hover:opacity-90"
              >
                <IconTrash size={14} />
                Delete selected
              </button>
            </div>
          )}
        </div>
      )}

      <Card bodyClass="!px-0 !pt-0">
        <DataState
          loading={loading}
          error={error}
          empty={users.length === 0}
          emptyMsg="No users yet."
        >
          <div className="overflow-x-auto">
            <table className="dt">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="accent-brand cursor-pointer align-middle"
                      title="Select all"
                    />
                  </th>
                  <th>Name</th>
                  <th style={{ width: 130 }}>Role</th>
                  <th className="num" style={{ width: 90 }}>
                    Devices
                  </th>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 140 }}>Joined</th>
                  <th className="num" style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={selected.has(u.id) ? "bg-surface-2" : ""}>
                    <td>
                      {u.id === selfId ? (
                        <span className="text-[10px] text-faint">you</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggle(u.id)}
                          className="accent-brand cursor-pointer align-middle"
                        />
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} id={u.id} />
                        <div className="min-w-0">
                          <div className="text-ink font-medium truncate">
                            {u.fullName}
                          </div>
                          <div className="text-xs text-faint truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={u.role === "ADMIN" ? "brand" : "neutral"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="num strong">{u.deviceCount}</td>
                    <td>
                      {u.isActive ? (
                        <Badge tone="good" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge tone="crit" dot>
                          Disabled
                        </Badge>
                      )}
                    </td>
                    <td className="text-xs text-faint">
                      {fmtDateTime(u.createdAt)}
                    </td>
                    <td className="num">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(u)}
                          className="text-xs font-medium text-brand hover:underline px-1.5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setDelErr("");
                            setDeleting(u);
                          }}
                          title="Delete user"
                          className="p-1.5 rounded-lg text-faint hover:text-crit hover:bg-crit/10 transition-colors"
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataState>
      </Card>

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {bulkConfirm && (
        <Modal
          title={`Delete ${selected.size} user(s)?`}
          onClose={() => !bulkBusy && setBulkConfirm(false)}
        >
          <p className="text-sm text-muted">
            This permanently removes {selected.size} user(s) and all of their
            devices, activity, and screenshots (including R2 objects). This cannot
            be undone.
          </p>
          <div className="flex gap-2 mt-5">
            <button
              onClick={bulkDelete}
              disabled={bulkBusy}
              className="flex-1 py-2 rounded-lg bg-crit text-white text-sm font-semibold disabled:opacity-50"
            >
              {bulkBusy ? "Deleting…" : `Delete ${selected.size} permanently`}
            </button>
            <button
              onClick={() => setBulkConfirm(false)}
              disabled={bulkBusy}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={`Delete ${deleting.email}?`}
          onClose={() => !delBusy && setDeleting(null)}
        >
          <p className="text-sm text-muted">
            This permanently removes <strong>{deleting.fullName}</strong>, their{" "}
            {deleting.deviceCount} device(s), and all of their activity and
            screenshots (including R2 objects). This cannot be undone.
          </p>
          {delErr && <p className="text-xs text-crit mt-3">{delErr}</p>}
          <div className="flex gap-2 mt-5">
            <button
              onClick={confirmDelete}
              disabled={delBusy}
              className="flex-1 py-2 rounded-lg bg-crit text-white text-sm font-semibold disabled:opacity-50"
            >
              {delBusy ? "Deleting…" : "Delete permanently"}
            </button>
            <button
              onClick={() => setDeleting(null)}
              disabled={delBusy}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </Page>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-ink mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink text-sm outline-none focus:border-brand";
const labelCls = "block text-xs text-muted mb-1 mt-3";

function CreateUserModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "INSTALLER",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setErr("");
    setBusy(true);
    try {
      await api.createUser(form);
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="New user" onClose={onClose}>
      <label className={labelCls}>Full name</label>
      <input
        className={inputCls}
        value={form.fullName}
        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
      />
      <label className={labelCls}>Email</label>
      <input
        className={inputCls}
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <label className={labelCls}>Password</label>
      <input
        className={inputCls}
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <label className={labelCls}>Phone</label>
      <input
        className={inputCls}
        value={form.phoneNumber}
        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
      />
      <label className={labelCls}>Role</label>
      <select
        className={inputCls}
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {err && <p className="text-xs text-crit mt-3">{err}</p>}
      <div className="flex gap-2 mt-5">
        <button
          onClick={save}
          disabled={busy}
          className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create user"}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-border text-sm text-muted"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [fullName, setFullName] = useState(user.fullName);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function save() {
    setErr("");
    setBusy(true);
    try {
      await api.updateUser(user.id, { fullName, role, isActive });
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  async function remove() {
    setErr("");
    setBusy(true);
    try {
      await api.deleteUser(user.id);
      onSaved();
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
      setConfirmDel(false);
    }
  }

  return (
    <Modal title={`Edit ${user.email}`} onClose={onClose}>
      <label className={labelCls}>Full name</label>
      <input
        className={inputCls}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <label className={labelCls}>Role</label>
      <select
        className={inputCls}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 mt-4 text-sm text-ink">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Account active
      </label>
      {err && <p className="text-xs text-crit mt-3">{err}</p>}

      {confirmDel ? (
        <div className="mt-5 p-3 rounded-xl border border-crit/30 bg-crit/10">
          <p className="text-xs text-ink mb-3">
            Permanently delete <strong>{user.email}</strong> and all of their
            devices, activity, and screenshots (incl. R2 objects)? This cannot be
            undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={remove}
              disabled={busy}
              className="flex-1 py-2 rounded-lg bg-crit text-white text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Yes, delete everything"}
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              disabled={busy}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted"
            >
              Keep
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mt-5">
            <button
              onClick={save}
              disabled={busy}
              className="flex-1 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={() => setConfirmDel(true)}
            className="w-full mt-2 py-2 rounded-lg text-sm font-medium text-crit hover:bg-crit/10 transition-colors"
          >
            Delete user
          </button>
        </>
      )}
    </Modal>
  );
}
