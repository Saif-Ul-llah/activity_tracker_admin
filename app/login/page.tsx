"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken, decode } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { accessToken } = await login(email.trim(), password);
      const claims = decode(accessToken);
      if (!claims || (claims.role !== "ADMIN" && claims.role !== "SUB_ADMIN")) {
        setError("This account is not an administrator.");
        setLoading(false);
        return;
      }
      setToken(accessToken);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-surface border border-border rounded-xl p-8 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-brand" />
          <h1 className="text-lg font-semibold text-ink">Activity Tracker</h1>
        </div>
        <p className="text-sm text-muted mb-6">Admin sign in</p>

        <label className="block text-xs text-muted mb-1">Email</label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink text-sm outline-none focus:border-brand"
        />
        <label className="block text-xs text-muted mb-1">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 px-3 py-2 rounded-lg bg-surface-2 border border-border text-ink text-sm outline-none focus:border-brand"
        />

        {error && <p className="text-sm text-crit mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
