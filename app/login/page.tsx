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
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-6">
          <div
            className="h-14 w-14 rounded-2xl grid place-items-center text-white font-bold text-xl mb-3"
            style={{
              background:
                "linear-gradient(135deg, var(--series-1), var(--series-7))",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            A
          </div>
          <h1 className="text-lg font-semibold text-ink tracking-tight">
            Activity Tracker
          </h1>
          <p className="text-sm text-muted mt-0.5">Sign in to the admin console</p>
        </div>

        <form
          onSubmit={submit}
          className="bg-surface border border-border rounded-2xl p-7"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <label className="block text-xs font-medium text-muted mb-1.5">
            Email
          </label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-ink text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-faint"
          />
          <label className="block text-xs font-medium text-muted mb-1.5">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full mb-1 px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border text-ink text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-faint"
          />

          {error && <p className="text-sm text-crit mt-3 mb-1">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-xs text-faint mt-5">
          Admins only · access is role-restricted
        </p>
      </div>
    </div>
  );
}
