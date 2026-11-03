import Link from "next/link";
import type { Tier } from "@/lib/content-types";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

// Ink pills for primary actions, white pills with a hairline for secondary ones.
// The vermilion accent is for the one action a page exists to start.
const VARIANT: Record<Variant, string> = {
  primary: "bg-ink text-bg hover:bg-ink/85 disabled:opacity-40",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink-3 disabled:opacity-50",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink disabled:opacity-40",
  accent: "bg-accent text-white hover:brightness-95 disabled:opacity-40",
  danger: "bg-surface text-bad border border-bad-line hover:bg-bad-soft",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13.5px] gap-1.5",
  md: "h-10 px-5 text-[14.5px] gap-2",
  lg: "h-12 px-6 text-[15.5px] gap-2",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition-[background-color,border-color,color,filter] duration-150 disabled:cursor-not-allowed",
    VARIANT[variant],
    SIZE[size],
    extra,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({ href, variant = "secondary", size = "md", className, children, ...rest }: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]", className)} {...rest}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "ink", label }: { value: number; className?: string; tone?: "accent" | "good" | "ink"; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const fill = tone === "good" ? "bg-good-fill" : tone === "accent" ? "bg-accent" : "bg-ink";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// Difficulty as three small rising bars: one for core, two for competitive, three for champion.
export function TierBars({ tier, className }: { tier: Tier; className?: string }) {
  const n = tier === "core" ? 1 : tier === "competitive" ? 2 : 3;
  return (
    <span className={cn("inline-flex items-end gap-[2px]", className)} aria-label={`${tier} difficulty`} role="img">
      {[0, 1, 2].map((i) => (
        <span key={i} className={cn("w-[3px] rounded-[1px]", i < n ? "bg-ink-2" : "bg-line-strong")} style={{ height: 5 + i * 3 }} />
      ))}
    </span>
  );
}

export function TierLabel({ tier }: { tier: Tier }) {
  const label = tier === "core" ? "Core" : tier === "competitive" ? "Competitive" : "Champion";
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3">
      <TierBars tier={tier} />
      {label}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block h-3.5 w-px bg-line-strong align-middle", className)} />;
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2 text-[13.5px] font-medium text-ink-3">{eyebrow}</div> : null}
        <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.03em] text-ink sm:text-[34px]">{title}</h1>
        {description ? <p className="mt-2.5 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

// A section heading with an optional quiet action on the right.
export function SectionTitle({ title, action, className }: { title: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3.5 flex items-baseline justify-between gap-4", className)}>
      <h2 className="text-[19px] font-bold tracking-[-0.015em] text-ink">{title}</h2>
      {action ? <div className="shrink-0 text-[14px] font-medium text-ink-2">{action}</div> : null}
    </div>
  );
}

// One bordered strip of headline numbers, split by hairlines.
export function StatStrip({ stats, className }: { stats: { label: string; value: React.ReactNode; note?: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn("grid overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)] sm:grid-cols-2", stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3", className)}>
      {stats.map((s) => (
        <div key={s.label} className="border-line px-5 py-5 [&:not(:first-child)]:border-t sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(even)]:border-l lg:border-t-0 lg:[&:not(:first-child)]:border-l">
          <p className="text-[13.5px] font-medium text-ink-3">{s.label}</p>
          <p className="tnum mt-1.5 text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">{s.value}</p>
          {s.note ? <p className="mt-2 text-[13px] leading-snug text-ink-3">{s.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, body, action, icon }: { title: string; body?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface px-6 py-12 text-center shadow-[var(--shadow-card)]">
      {icon ? <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-2">{icon}</div> : null}
      <p className="text-[17px] font-semibold text-ink">{title}</p>
      {body ? <p className="mx-auto mt-1.5 max-w-md text-[14.5px] leading-relaxed text-ink-2">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Rich({ html, className, as: Tag = "div" }: { html: string; className?: string; as?: "div" | "span" }) {
  return <Tag className={cn("rich", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
