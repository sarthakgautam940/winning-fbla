import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-[13.5px] text-ink-3">404</p>
      <h1 className="mt-2 text-[24px] font-semibold text-ink">That page does not exist</h1>
      <Link href="/home" className="mt-6 rounded-[10px] bg-ink px-4 py-2.5 text-[14.5px] font-medium text-bg hover:opacity-90">
        Go home
      </Link>
    </main>
  );
}
