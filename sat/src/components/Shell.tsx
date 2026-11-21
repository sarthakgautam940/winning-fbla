"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBook, IconChart, IconGrid, IconSettings, IconToday } from "./icons";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { dayKey, daysBetween, formatDay } from "@/lib/dates";

const NAV = [
  { href: "/", label: "Today", icon: IconToday },
  { href: "/bank/", label: "Question bank", icon: IconGrid },
  { href: "/patterns/", label: "Patterns", icon: IconBook },
  { href: "/stats/", label: "Stats", icon: IconChart },
  { href: "/settings/", label: "Settings", icon: IconSettings },
];

export function Logo() {
  // four question tiles, one mastered
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <rect x="1.5" y="1.5" width="10" height="10" rx="3" fill="#111" />
      <rect x="14.5" y="1.5" width="10" height="10" rx="3" fill="none" stroke="#111" strokeWidth="2" />
      <rect x="1.5" y="14.5" width="10" height="10" rx="3" fill="none" stroke="#111" strokeWidth="2" />
      <rect x="14.5" y="14.5" width="10" height="10" rx="3" fill="none" stroke="#111" strokeWidth="2" />
    </svg>
  );
}

function active(path: string, href: string) {
  if (href === "/") return path === "/";
  return path.startsWith(href.replace(/\/$/, ""));
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const state = useStore();
  const now = useNow();
  const ready = now > 0;
  const days = ready ? daysBetween(dayKey(now), state.settings.testDate) : 0;
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand">
          <Logo />
          SAT Bank
        </Link>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="nav-item" aria-current={active(path, href) ? "page" : undefined}>
            <Icon />
            {label}
          </Link>
        ))}
        <div className="side-foot">
          {ready ? (
            <>
              <div className="big tnum">{days > 0 ? days : 0}</div>
              <div className="muted" style={{ fontSize: 14 }}>
                {days === 1 ? "day" : "days"} until the SAT, {formatDay(state.settings.testDate, { month: "short", day: "numeric" })}
              </div>
            </>
          ) : null}
          <div className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
            Press Ctrl+Shift+F to jump to any question.
          </div>
        </div>
      </aside>
      <nav className="topnav" aria-label="Main">
        {NAV.map(({ href, label }) => (
          <Link key={href} href={href} className="nav-item" aria-current={active(path, href) ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <main className="main">
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
