"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import type { AreaId, QuestionContent, TestQuestion } from "@/lib/content-types";
import { areaName, catalog, getLesson, getSkill, nextLesson } from "@/lib/catalog";
import { metaOf, readinessBand } from "@/lib/analytics";
import { loadQuestions } from "@/lib/questions";
import { practiceTestLoaders } from "@/generated/loaders";
import { useProgress, useReady } from "@/lib/progress/store";
import type { SessionRecord } from "@/lib/progress/types";
import { Figure } from "@/components/figures/Figure";
import { Options } from "@/components/question/Options";
import { Explanation } from "@/components/question/Explanation";
import { Button, Card, cn, EmptyState, LinkButton, ProgressBar, Rich } from "@/components/ui/primitives";
import { PracticeRunner } from "./PracticeRunner";

const KIND_LABEL: Record<SessionRecord["kind"], string> = { quiz: "Lesson quiz", unit: "Unit test", test: "Practice test", drill: "Speed drill", practice: "Practice set" };

function minutes(ms: number) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Report({ sessionId }: { sessionId: string }) {
  const progress = useProgress();
  const ready = useReady();
  const session = progress.sessions[sessionId];
  const [content, setContent] = useState<Record<string, QuestionContent> | null>(null);
  const [tb, setTb] = useState<Record<string, 1 | 2>>({});
  const [filter, setFilter] = useState<"all" | "wrong" | "blank" | "flagged">("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [retry, setRetry] = useState<string[] | null>(null);

  useEffect(() => {
    if (!session) return;
    let alive = true;
    loadQuestions(session.questions).then((c) => alive && setContent(c));
    if (session.kind === "test") {
      practiceTestLoaders[session.ref]?.().then((t) => {
        if (!alive) return;
        const map: Record<string, 1 | 2> = {};
        for (const q of t.questions as TestQuestion[]) if (q.tb) map[q.id] = q.tb;
        setTb(map);
      });
    }
    return () => {
      alive = false;
    };
  }, [session]);

  const rows = useMemo(() => {
    if (!session) return [];
    return session.questions.map((id, i) => {
      const c = session.answers[id] ?? null;
      const q = content?.[id];
      return { id, n: i + 1, chosen: c, ok: !!q && c === q.answer, blank: !c, flagged: session.flags?.[id] !== undefined, meta: metaOf(id) };
    });
  }, [session, content]);

  if (!ready) return <div className="h-96" />;
  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <EmptyState title="This result is not on this device" body="Results are saved in the browser where you took the test." action={<LinkButton href="/progress">Go to Progress</LinkButton>} />
      </div>
    );
  }

  const pct = session.total ? session.correct / session.total : 0;
  const scaled = Math.round(pct * 100);
  const band = session.kind === "test" ? readinessBand(scaled) : null;
  const wrongIds = rows.filter((r) => !r.ok).map((r) => r.id);

  // Breakdown: by area for full tests, by skill otherwise.
  const groups = new Map<string, { label: string; correct: number; total: number; weight?: number }>();
  for (const r of rows) {
    if (!r.meta) continue;
    const k = session.kind === "test" ? r.meta.area : r.meta.skill;
    const label = session.kind === "test" ? areaName(r.meta.area as AreaId) : (getSkill(r.meta.skill)?.name ?? r.meta.skill);
    const g = groups.get(k) ?? { label, correct: 0, total: 0, weight: session.kind === "test" ? catalog.areas.find((a) => a.id === r.meta!.area)?.items : undefined };
    g.total += 1;
    if (r.ok) g.correct += 1;
    groups.set(k, g);
  }
  const tb1 = rows.filter((r) => tb[r.id] === 1);
  const tb2 = rows.filter((r) => tb[r.id] === 2);

  const lesson = session.kind === "quiz" ? getLesson(session.ref) : undefined;
  const next = lesson ? nextLesson(lesson.id) : undefined;
  const shown = rows.filter((r) => (filter === "all" ? true : filter === "wrong" ? !r.ok && !r.blank : filter === "blank" ? r.blank : r.flagged));
  const avgSec = session.ms / Math.max(1, session.total) / 1000;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <p className="text-[13.5px] text-ink-3">
        {KIND_LABEL[session.kind]}
        <span className="mx-2 text-line-strong">/</span>
        {new Date(session.finishedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
      </p>
      <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.02em] text-ink">{session.title}</h1>

      <div className="mt-7 grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr]">
        <Card className="px-5 py-5">
          <p className="text-[13px] text-ink-3">Score</p>
          <p className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.03em] text-ink">
            {session.correct}
            <span className="text-[24px] font-medium text-ink-3"> / {session.total}</span>
          </p>
          <p className="tnum mt-2 text-[14px] text-ink-2">{scaled}% correct</p>
        </Card>
        <Card className="px-5 py-5">
          <p className="text-[13px] text-ink-3">Time used</p>
          <p className="tnum mt-1 text-[28px] font-semibold text-ink">{minutes(session.ms)}</p>
          <p className="tnum mt-1 text-[13.5px] text-ink-2">
            {session.limitMs ? `of ${minutes(session.limitMs)}. ` : ""}
            {avgSec.toFixed(0)} s per question{session.kind === "test" || session.kind === "unit" ? " (target 30)" : ""}
          </p>
        </Card>
        <Card className="px-5 py-5">
          {band ? (
            <>
              <p className="text-[13px] text-ink-3">Where this score sits</p>
              <p className="mt-1 text-[18px] font-semibold text-ink">{band.label}</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">{band.note}</p>
            </>
          ) : (
            <>
              <p className="text-[13px] text-ink-3">Mastery target</p>
              <p className="mt-1 text-[28px] font-semibold text-ink">80%</p>
              <p className="mt-1 text-[13.5px] text-ink-2">{pct >= 0.8 ? "Met. Move on, and revisit the misses below." : "Not yet. Reread the sections behind your misses, then retry them."}</p>
            </>
          )}
        </Card>
      </div>

      {band ? <p className="mt-2 text-[12.5px] text-ink-3">FBLA publishes no cut scores. These ranges are this app&apos;s guidance.</p> : null}

      {session.kind === "test" && tb1.length ? (
        <Card className="mt-4 px-5 py-4">
          <p className="text-[14px] font-semibold text-ink">Tiebreakers</p>
          <p className="mt-1 text-[13.5px] text-ink-2">
            Ties at nationals are broken by 10 preselected questions, then 20 more, then completion time. On this test&apos;s equivalent sets you scored{" "}
            <span className="tnum font-semibold text-ink">
              {tb1.filter((r) => r.ok).length} of {tb1.length}
            </span>{" "}
            and{" "}
            <span className="tnum font-semibold text-ink">
              {tb2.filter((r) => r.ok).length} of {tb2.length}
            </span>
            .
          </p>
        </Card>
      ) : null}

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-ink">{session.kind === "test" ? "By area" : "By skill"}</h2>
        <Card className="mt-3 flex flex-col gap-0.5 p-2">
          {[...groups.values()]
            .sort((a, b) => a.correct / a.total - b.correct / b.total)
            .map((g) => (
              <div key={g.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-5 py-3 sm:grid-cols-[1fr_180px_auto]">
                <p className="text-[14.5px] text-ink">{g.label}</p>
                <ProgressBar value={g.correct / g.total} tone={g.correct / g.total >= 0.8 ? "good" : "ink"} className="order-3 col-span-2 sm:order-none sm:col-span-1" />
                <p className="tnum text-right text-[14px] text-ink-2">
                  {g.correct}/{g.total}
                </p>
              </div>
            ))}
        </Card>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        {wrongIds.length ? (
          <Button variant="primary" onClick={() => setRetry(wrongIds)}>
            Practice the {wrongIds.length} you missed
          </Button>
        ) : null}
        {lesson ? <LinkButton href={`/learn/${lesson.unit}/${lesson.id}`}>Back to the lesson</LinkButton> : null}
        {next ? <LinkButton href={`/learn/${next.unit}/${next.id}`}>Next: {next.code} {next.title}</LinkButton> : null}
        {session.kind === "unit" ? <LinkButton href={`/learn/${session.ref}`}>Back to the unit</LinkButton> : null}
        {session.kind === "test" ? <LinkButton href="/tests">All practice tests</LinkButton> : null}
        {session.kind === "drill" ? <LinkButton href="/practice">Back to practice</LinkButton> : null}
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-ink">Review every question</h2>
          <div className="inline-flex rounded-[10px] border border-line bg-surface-2 p-0.5" role="tablist">
            {(
              [
                ["all", `All ${rows.length}`],
                ["wrong", `Wrong ${rows.filter((r) => !r.ok && !r.blank).length}`],
                ["blank", `Blank ${rows.filter((r) => r.blank).length}`],
                ...(rows.some((r) => r.flagged) ? [["flagged", `Flagged ${rows.filter((r) => r.flagged).length}`]] : []),
              ] as [typeof filter, string][]
            ).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)} className={cn("rounded-[8px] px-3 py-1.5 text-[13px] font-medium", filter === k ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-3 hover:text-ink")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {shown.map((r) => {
            const q = content?.[r.id];
            const isOpen = open[r.id] ?? false;
            return (
              <Card key={r.id} className="overflow-hidden">
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [r.id]: !isOpen }))} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2/60" aria-expanded={isOpen}>
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white", r.ok ? "bg-good-fill" : r.blank ? "bg-line-strong" : "bg-bad-fill")} aria-label={r.ok ? "Correct" : r.blank ? "Blank" : "Incorrect"}>
                    {r.ok ? <Check size={13} strokeWidth={3} /> : r.blank ? <Minus size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
                  </span>
                  <span className="tnum w-8 shrink-0 text-[13px] font-semibold text-ink-3">{r.n}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink-2">{r.meta ? (getSkill(r.meta.skill)?.name ?? "") : ""}</span>
                  <span className="hidden text-[13px] text-ink-3 sm:inline">
                    {r.blank ? "blank" : `you: ${r.chosen}`}
                    {q ? `, answer: ${q.answer}` : ""}
                  </span>
                  <ChevronDown size={16} className={cn("shrink-0 text-ink-3 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && q ? (
                  <div className="px-4 pb-5 pt-4 sm:px-6">
                    <Rich html={q.stem} className="q-stem" />
                    {q.figure ? <Figure spec={q.figure} /> : null}
                    <div className="mt-4">
                      <Options name={`Question ${r.n}`} options={q.options} selected={r.chosen} answer={q.answer} />
                    </div>
                    {session.flags?.[r.id] !== undefined ? <p className="mt-3 text-[13px] text-ink-3">Your flag: {session.flags[r.id] || "(no comment)"}</p> : null}
                    <Explanation q={q} chosen={r.chosen} className="mt-4" />
                  </div>
                ) : null}
              </Card>
            );
          })}
          {!shown.length ? <p className="text-[14px] text-ink-3">Nothing in this view.</p> : null}
        </div>
      </section>

      {retry ? <PracticeRunner ids={retry} title={`Missed from ${session.title}`} mode="review" onExit={() => setRetry(null)} /> : null}
    </div>
  );
}
