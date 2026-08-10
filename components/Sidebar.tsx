"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, currentUser } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Overview", icon: "▣" },
  { href: "/activity", label: "Activity History", icon: "≣" },
  { href: "/screenshots", label: "Screenshots", icon: "▢" },
  { href: "/devices", label: "Devices", icon: "⬚" },
  { href: "/users", label: "User Management", icon: "◑" },
  { href: "/events", label: "Events", icon: "!" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const u = currentUser();
    setEmail(u?.role ? `${u.role}` : "");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tracker_theme", next ? "dark" : "light");
  }

  function signOut() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <div className="h-7 w-7 rounded-lg bg-brand" />
        <div>
          <div className="text-sm font-semibold text-ink leading-tight">
            Activity Tracker
          </div>
          <div className="text-[11px] text-faint">Admin console</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span className="w-4 text-center opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface-2"
        >
          <span className="w-4 text-center">{dark ? "☾" : "☀"}</span>
          {dark ? "Dark" : "Light"} theme
        </button>
        <div className="px-3 pt-1 pb-2 text-[11px] text-faint">
          Signed in as {email || "admin"}
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface-2"
        >
          <span className="w-4 text-center">⏻</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
