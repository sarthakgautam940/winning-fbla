import Link from "next/link";

// The mark: a W drawn as one line that ends higher than it starts, capped by a
// gold point, like the latest value on a rising chart. Two colors: ink and gold.
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M3.4 15.2 9.6 24.8 15.8 15.4 22 24.8 27.6 8.2" fill="none" stroke="var(--ink)" strokeWidth="3.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27.6" cy="8.2" r="3.6" fill="var(--gold)" />
    </svg>
  );
}

export function Logo({ href = "/home" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-[12px] px-2 py-1" aria-label="Winning FBLA home">
      <LogoMark />
      <span className="leading-none">
        <span className="block text-[16px] font-extrabold tracking-[-0.035em] text-ink">Winning FBLA</span>
        <span className="mt-1 block text-[12px] font-medium text-ink-3">Data Science &amp; AI</span>
      </span>
    </Link>
  );
}
