"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ChartNoAxesColumn, ClipboardCheck, Grid2x2Check, House, Layers, Library, Menu, RotateCcw, Settings, X } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { Logo } from "./Logo";
import { ThemeSync } from "./ThemeSync";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> };

const GROUPS: Item[][] = [
  [
    { href: "/home", label: "Home", icon: House },
    { href: "/learn", label: "Learn", icon: BookOpen },
    { href: "/practice", label: "Question Bank", icon: Grid2x2Check },
    { href: "/tests", label: "Practice tests", icon: ClipboardCheck },
    { href: "/flashcards", label: "Flashcards", icon: Layers },
  ],
  [
    { href: "/review", label: "Review", icon: RotateCcw },
    { href: "/progress", label: "Progress", icon: ChartNoAxesColumn },
    { href: "/plan", label: "Plan", icon: CalendarDays },
  ],
  [{ href: "/reference", label: "Reference", icon: Library }],
];

const MOBILE_TABS: Item[] = [GROUPS[0][0], GROUPS[0][1], GROUPS[0][2], GROUPS[0][3]];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

function NavLink({ item, path, onNavigate }: { item: Item; path: string; onNavigate?: () => void }) {
  const active = isActive(path, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-full px-3 text-[14.5px] transition-colors",
        active ? "bg-surface font-semibold text-ink shadow-[0_0_0_1px_var(--line),0_1px_2px_rgba(26,24,20,0.06)]" : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon size={17} strokeWidth={active ? 2.1 : 1.8} />
      {item.label}
    </Link>
  );
}

function NavList({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      {GROUPS.map((g, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {g.map((item) => (
            <NavLink key={item.href} item={item} path={path} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function Profile({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  const active = isActive(path, "/settings");
  return (
    <Link href="/settings" onClick={onNavigate} className={cn("flex shrink-0 items-center gap-3 rounded-[14px] px-2 py-2 transition-colors", active ? "bg-surface shadow-[0_0_0_1px_var(--line),0_1px_2px_rgba(26,24,20,0.06)]" : "hover:bg-surface-2")}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-bg">A</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-ink">Ashwath</span>
        <span className="block text-[12px] text-ink-3">Settings</span>
      </span>
      <Settings size={16} className="text-ink-3" />
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-dvh">
      <ThemeSync />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col bg-bg px-3 pb-3 pt-4 lg:flex">
        <Logo />
        <div className="scrollbar-thin mt-6 min-h-0 flex-1 overflow-y-auto">
          <NavList path={path} />
        </div>
        <Profile path={path} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-bg/90 px-3 backdrop-blur lg:hidden">
        <Logo />
        <button type="button" onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-[10px] text-ink-2 hover:bg-surface-2" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="animate-fade-in absolute inset-0 bg-black/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="animate-fade-up absolute inset-y-0 right-0 flex w-[min(320px,86vw)] flex-col bg-bg px-3 pb-3 pt-3 shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-[10px] text-ink-2 hover:bg-surface-2" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
              <NavList path={path} onNavigate={() => setOpen(false)} />
            </div>
            <Profile path={path} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <main id="main" className="pb-24 lg:pb-12 lg:pl-[244px]">
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-bg/95 shadow-[0_-6px_20px_rgba(26,24,20,0.06)] pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE_TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(path, t.href);
          return (
            <Link key={t.href} href={t.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px]", active ? "text-ink" : "text-ink-3")} aria-current={active ? "page" : undefined}>
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              {t.label === "Practice tests" ? "Tests" : t.label === "Question Bank" ? "Questions" : t.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-ink-3">
          <Menu size={19} strokeWidth={1.8} />
          More
        </button>
      </nav>
    </div>
  );
}
