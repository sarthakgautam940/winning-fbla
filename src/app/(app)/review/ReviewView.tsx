"use client";

import { useMemo, useState } from "react";
import { Bookmark, Check, X } from "lucide-react";
import { catalog, getSkill, qmeta } from "@/lib/catalog";
import { metaOf, mistakes } from "@/lib/analytics";
import { toggleSaved, useProgress, useReady } from "@/lib/progress/store";
import { PracticeRunner } from "@/components/session/PracticeRunner";
import { Button, Card, cn, EmptyState, LinkButton, PageHeader, TierBars } from "@/components/ui/primitives";

type Tab = "open" | "fixed" | "saved";

function sourceLabel(qid: string): string {
  const m = qmeta(qid);
  if (m) return `Question ${m.label}`;
  const t = catalog.testMeta[qid];
  if (!t) return "";
  const [kind, ref] = t.src.split(":");
  return kind === "unit" ? `Unit ${catalog.units.find((u) => u.id === ref)?.n} test` : (catalog.practiceTests.find((x) => x.id === ref)?.title ?? "Practice test");
}

export function ReviewView() {
  const p = useProgress();
  const ready = useReady();
  const [tab, setTab] = useState<Tab>("open");
  const [runner, setRunner] = useState<{ ids: string[]; title: string } | null>(null);
  const all = useMemo(() => mistakes(p), [p]);
  const open = all.filter((m) => !m.fixed);
  const fixed = all.filter((m) => m.fixed);
  const saved = Object.entries(p.saved)
    .filter(([, v]) => v.on)
    .sort((a, b) => b[1].at - a[1].at)
    .map(([qid, v]) => ({ qid, at: v.at }));

  const rows = tab === "open" ? open.map((m) => ({ qid: m.qid, at: m.lastAt, wrong: m.wrongCount })) : tab === "fixed" ? fixed.map((m) => ({ qid: m.qid, at: m.lastAt, wrong: m.wrongCount })) : saved.map((s) => ({ qid: s.qid, at: s.at, wrong: 0 }));
  const ids = rows.map((r) => r.qid);

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader
        title="Review"
        description="Every question you have missed, from lessons, quizzes, drills and tests. A mistake moves to Fixed once you answer it correctly. Saved questions are the ones you bookmarked."
        actions={
          ids.length ? (
            <Button variant="primary" onClick={() => setRunner({ ids, title: tab === "open" ? "Open mistakes" : tab === "fixed" ? "Fixed mistakes" : "Saved questions" })}>
              Practice all {ids.length}
            </Button>
          ) : null
        }
      />

      <div className="mb-5 inline-flex rounded-[10px] border border-line bg-surface-2 p-0.5" role="tablist" aria-label="Review lists">
        {(
          [
            ["open", "Mistakes", open.length],
            ["fixed", "Fixed", fixed.length],
            ["saved", "Saved", saved.length],
          ] as [Tab, string, number][]
        ).map(([k, label, n]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-[8px] px-3.5 py-1.5 text-[13.5px] font-medium", tab === k ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-3 hover:text-ink")}>
            {label}
            <span className="tnum ml-1.5 text-ink-3">{ready ? n : ""}</span>
          </button>
        ))}
      </div>

      {!ready ? null : rows.length ? (
        <Card className="divide-y divide-line">
          {rows.map((r) => {
            const m = metaOf(r.qid);
            const skill = m ? getSkill(m.skill) : undefined;
            return (
              <div key={r.qid} className="flex items-center gap-4 px-5 py-3.5">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", tab === "fixed" ? "bg-good-soft text-good" : tab === "open" ? "bg-bad-soft text-bad" : "bg-accent-soft text-accent-ink")}>
                  {tab === "fixed" ? <Check size={14} strokeWidth={2.5} /> : tab === "open" ? <X size={14} strokeWidth={2.5} /> : <Bookmark size={13} />}
                </span>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setRunner({ ids: [r.qid, ...ids.filter((x) => x !== r.qid)], title: "Review" })}>
                  <span className="block truncate text-[14.5px] font-medium text-ink hover:underline hover:underline-offset-4">{skill ? `${skill.n}. ${skill.name}` : r.qid}</span>
                  <span className="block text-[12.5px] text-ink-3">
                    {sourceLabel(r.qid)}
                    {r.wrong > 1 ? `, missed ${r.wrong} times` : ""}
                    {`, ${new Date(r.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                  </span>
                </button>
                {m ? <TierBars tier={m.tier} /> : null}
                {tab === "saved" ? (
                  <button type="button" onClick={() => toggleSaved(r.qid)} className="text-[12.5px] text-ink-3 hover:text-ink">
                    Remove
                  </button>
                ) : null}
              </div>
            );
          })}
        </Card>
      ) : (
        <EmptyState
          title={tab === "open" ? "No open mistakes" : tab === "fixed" ? "Nothing fixed yet" : "No saved questions"}
          body={tab === "open" ? "Missed questions from anywhere in the app collect here so you can fix them." : tab === "fixed" ? "When you get a missed question right later, it moves here." : "Use the bookmark on any question to save it for later."}
          action={tab === "saved" ? <LinkButton href="/practice">Go to practice</LinkButton> : undefined}
        />
      )}

      {runner ? <PracticeRunner ids={runner.ids} title={runner.title} mode="review" onExit={() => setRunner(null)} /> : null}
    </div>
  );
}
