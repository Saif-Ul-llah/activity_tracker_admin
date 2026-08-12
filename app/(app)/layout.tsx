"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { isAdmin } from "@/lib/auth";

// Client-side auth guard for the whole authenticated section.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/login");
    } else {
      setOk(true);
    }
  }, [router]);

  if (!ok) return <div className="min-h-screen bg-bg" />;

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      {/* pt-14 clears the fixed mobile top bar; removed at lg where the sidebar is inline. */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
