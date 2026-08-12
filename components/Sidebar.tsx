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
  IconMenu,
  IconClose,
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

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--series-1), var(--series-7))",
        }}
      >
        A
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink leading-tight tracking-tight truncate">
          Activity Tracker
        </div>
        <div className="text-[11px] text-faint">Admin console</div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(false); // mobile drawer

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setRole(currentUser()?.role || "");
  }, []);

  // Close the drawer whenever the route changes (a nav link was tapped).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
    <>
      {/* Mobile top bar (hidden on lg+) */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-14 z-30 bg-surface border-b border-border flex items-center justify-between px-4">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="h-9 w-9 grid place-items-center rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
        >
          <IconMenu size={20} />
        </button>
      </header>

      {/* Backdrop when drawer is open */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — static on lg+, off-canvas drawer below lg */}
      <aside
        className={`w-[248px] shrink-0 border-r border-border bg-surface flex flex-col
          fixed inset-y-0 left-0 z-50 transition-transform duration-200
          lg:static lg:z-auto lg:translate-x-0 lg:h-screen lg:sticky lg:top-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-5 h-16 flex items-center justify-between gap-2.5 border-b border-border">
          <Brand />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden h-8 w-8 grid place-items-center rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <IconClose size={18} />
          </button>
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
    </>
  );
}
