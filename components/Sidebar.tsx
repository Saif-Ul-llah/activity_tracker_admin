"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, currentUser } from "@/lib/auth";
import {
  IconOverview,
  IconActivity,
  IconScreenshot,
  IconDevice,
  IconUsers,
  IconBell,
  IconStorage,
  IconGlobe,
  IconSun,
  IconMoon,
  IconLogout,
} from "./icons";

const NAV = [
  { href: "/", label: "Overview", Icon: IconOverview },
  { href: "/activity", label: "Activity History", Icon: IconActivity },
  { href: "/screenshots", label: "Screenshots", Icon: IconScreenshot },
  { href: "/browser-tabs", label: "Browser Tabs", Icon: IconGlobe },
  { href: "/devices", label: "Devices", Icon: IconDevice },
  { href: "/storage", label: "Storage", Icon: IconStorage },
  { href: "/users", label: "User Management", Icon: IconUsers },
  { href: "/events", label: "Events", Icon: IconBell },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setRole(currentUser()?.role || "");
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
    <aside className="w-[248px] shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-border">
        <div
          className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
          style={{
            background:
              "linear-gradient(135deg, var(--series-1), var(--series-7))",
          }}
        >
          A
        </div>
        <div>
          <div className="text-sm font-semibold text-ink leading-tight tracking-tight">
            Activity Tracker
          </div>
          <div className="text-[11px] text-faint">Admin console</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-wider text-faint font-semibold">
          Monitor
        </div>
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors relative ${
                active
                  ? "text-brand bg-brand/10"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r bg-brand" />
              )}
              <item.Icon
                size={18}
                className={active ? "text-brand" : "text-faint group-hover:text-ink"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-0.5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          {dark ? (
            <IconMoon size={18} className="text-faint" />
          ) : (
            <IconSun size={18} className="text-faint" />
          )}
          {dark ? "Dark" : "Light"} theme
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-muted hover:bg-surface-2 hover:text-ink transition-colors"
        >
          <IconLogout size={18} className="text-faint" />
          Sign out
        </button>
        <div className="flex items-center gap-2.5 px-3 pt-2 mt-1">
          <span className="h-7 w-7 rounded-full bg-brand/15 text-brand grid place-items-center text-[11px] font-semibold">
            {role.slice(0, 2) || "AD"}
          </span>
          <div className="min-w-0">
            <div className="text-xs text-ink font-medium truncate">Signed in</div>
            <div className="text-[11px] text-faint truncate">{role || "ADMIN"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
