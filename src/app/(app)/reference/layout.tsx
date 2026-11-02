import { ReferenceNav } from "./ReferenceNav";

export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <h1 className="text-[30px] font-semibold tracking-[-0.025em] text-ink">Reference</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">The rules of the event, every formula on one sheet, every term, and how each official objective maps to the course.</p>
      <ReferenceNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
