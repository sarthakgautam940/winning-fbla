"use client";

import { useMemo, useState } from "react";
import { Lock, RotateCcw, Search, Shuffle, Zap } from "lucide-react";
import { catalog, getSkill, lessonsOf } from "@/lib/catalog";
import type { Tier } from "@/lib/content-types";
import { latestResult, skillStats } from "@/lib/analytics";
import { buildReview, skillSet } from "@/lib/sets";
import { useProgress, useReady } from "@/lib/progress/store";
import { PracticeRunner } from "@/components/session/PracticeRunner";
import { Button, Card, cn, LinkButton, PageHeader, TierBars } from "@/components/ui/primitives";

type Status = "all" | "new" | "missed" | "correct";

export function PracticeView() {
  const p = useProgress();
  const ready = useReady();
  const [unit, setUnit] = useState<string>("all");
  const [status, setStatus] = useState<Status>("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [query, setQuery] = useState("");
  const [runner, setRunner] = useState<{ ids: string[]; title: string } | null>(null);

  const latest = useMemo(() => latestResult(p), [p]);
  const stats = useMemo(() => skillStats(p), [p]);
  const quizTaken = useMemo(() => new Set(Object.values(p.sessions).filter((s) => s.kind === "quiz").map((s) => s.ref)), [p]);

  const units = catalog.units.filter((u) => u.area);
  const q = query.trim().toLowerCase();

  const visible = units
    .filter((u) => unit === "all" || u.id === unit)
    .map((u) => ({
      unit: u,
      skills: lessonsOf(u.id)
        .flatMap((l) => l.skills)
        .map((sid) => {
          const s = getSkill(sid)!;
          const qs = catalog.questions.filter((x) => x.skill === sid && (tier === "all" || x.tier === tier));
          const shown = qs.filter((x) => {
            const r = latest.get(x.id);
            return status === "all" || (status === "new" && r === undefined) || (status === "missed" && r === false) || (status === "correct" && r === true);
          });
          return { s, qs, shown };
        })
        .filter((row) => row.shown.length && (!q || row.s.name.toLowerCase().includes(q) || String(row.s.n) === q)),
    }))
    .filter((g) => g.skills.length);

  const openSkill = (sid: string, first?: string) => {
    const ids = skillSet(p, sid);
    const order = first ? [first, ...ids.filter((x) => x !== first)] : ids;
    setRunner({ ids: order, title: `Skill ${getSkill(sid)?.n}: ${getSkill(sid)?.name}` });
  };

  const totalSolved = catalog.questions.filter((x) => latest.get(x.id) === true).length;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader
        title="Practice"
        description="Every question type on the test, organized by skill. Tiles go from Core to Champion within each skill. Green means your latest answer was right; red means it was wrong."
        actions={ready ? <span className="tnum text-[14px] text-ink-2">{totalSolved} of {catalog.questions.length} solved</span> : null}
      />

      <Card className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <ModeCard
          icon={<Zap size={18} />}
          title="Speed drill"
          body="20 questions in 10 minutes from what you have studied. Timed like the real test, scored at the end."
          action={
            <LinkButton href="/practice/drill" variant="primary" size="sm">
              Start drill
            </LinkButton>
          }
        />
        <ModeCard
          icon={<RotateCcw size={18} />}
          title="Mixed review"
          body="Your missed questions first, then weak skills, then older material to keep it fresh. Instant feedback."
          action={
            <Button
              size="sm"
              onClick={() => {
                const ids = buildReview(p);
                if (ids.length) setRunner({ ids, title: "Mixed review" });
              }}
            >
              Start review
            </Button>
          }
        />
        <ModeCard
          icon={<Shuffle size={18} />}
          title="Random set"
          body="Ten questions drawn from the filters below. Good for a quick warm-up."
          action={
            <Button
              size="sm"
              onClick={() => {
                const pool = visible.flatMap((g) => g.skills.flatMap((r) => r.shown)).filter((x) => x.use !== "quiz" || quizTaken.has(x.lesson));
                const ids = [...pool].sort(() => Math.random() - 0.5).slice(0, 10).map((x) => x.id);
                if (ids.length) setRunner({ ids, title: "Random set" });
              }}
            >
              Start set
            </Button>
          }
        />
      </Card>

      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a skill" aria-label="Find a skill" className="h-10 w-full rounded-full border border-line-strong bg-surface pl-9 pr-4 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-ink" />
          </label>
          <nav aria-label="Units" className="mt-4 flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {[{ id: "all", n: 0, title: "All units" }, ...units].map((u) => {
              const qs = u.id === "all" ? catalog.questions : catalog.questions.filter((x) => x.unit === u.id);
              const solved = qs.filter((x) => latest.get(x.id) === true).length;
              return (
                <button key={u.id} type="button" onClick={() => setUnit(u.id)} className={cn("flex shrink-0 items-center justify-between gap-3 rounded-full px-3.5 py-2 text-left text-[13.5px] transition-colors", unit === u.id ? "bg-surface font-semibold text-ink shadow-[0_0_0_1px_var(--line),0_1px_2px_rgba(26,24,20,0.06)]" : "font-medium text-ink-2 hover:bg-surface-2")}>
                  <span className="whitespace-nowrap lg:whitespace-normal">{u.id === "all" ? u.title : `${u.n}. ${u.title}`}</span>
                  <span className="tnum text-[12px] text-ink-3">{ready ? `${solved}/${qs.length}` : qs.length}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            <Filter label="Show" value={status} onChange={setStatus} options={[["all", "All"], ["new", "Not tried"], ["missed", "Missed"], ["correct", "Correct"]]} />
            <Filter label="Difficulty" value={tier} onChange={setTier} options={[["all", "All"], ["core", "Core"], ["competitive", "Competitive"], ["champion", "Champion"]]} />
          </div>
        </aside>

        <div className="min-w-0">
          {visible.map((g) => (
            <section key={g.unit.id} className="mb-10">
              <h2 className="mb-2 border-b border-line pb-2.5 text-[15px] font-bold tracking-[-0.01em] text-ink">
                Unit {g.unit.n}: {g.unit.title}
              </h2>
              <div className="flex flex-col">
                {g.skills.map(({ s, qs, shown }) => {
                  const st = stats[s.id];
                  const solved = qs.filter((x) => latest.get(x.id) === true).length;
                  return (
                    <div key={s.id} id={`skill-${s.id}`} className="grid scroll-mt-8 grid-cols-1 gap-3 border-b border-line py-4 last:border-b-0 md:grid-cols-[230px_minmax(0,1fr)]">
                      <div>
                        <button type="button" onClick={() => openSkill(s.id)} className="text-left">
                          <span className="tnum mr-1.5 text-[13px] font-semibold text-ink-3">{s.n}</span>
                          <span className="text-[14.5px] font-medium text-ink hover:underline hover:underline-offset-4">{s.name}</span>
                        </button>
                        <p className="tnum mt-1 text-[12.5px] text-ink-3">
                          {ready ? `${solved}/${qs.length} solved` : `${qs.length} questions`}
                          {ready && st?.level === "mastered" ? ", mastered" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {shown.map((x) => {
                          const r = ready ? latest.get(x.id) : undefined;
                          const locked = x.use === "quiz" && !quizTaken.has(x.lesson);
                          return (
                            <button
                              key={x.id}
                              type="button"
                              disabled={locked}
                              onClick={() => openSkill(s.id, x.id)}
                              title={locked ? "Unlocks after you take this lesson's quiz" : `${x.label}: ${x.tier}`}
                              aria-label={`Question ${x.label}, ${x.tier}${r === true ? ", correct" : r === false ? ", missed" : ""}${locked ? ", locked until the lesson quiz" : ""}`}
                              className={cn(
                                "relative flex h-11 w-14 flex-col items-center justify-center gap-1 rounded-[10px] border text-[12.5px] font-bold shadow-[0_2px_0_var(--line)] transition-[transform,background-color,border-color] duration-150 hover:-translate-y-px",
                                locked && "cursor-not-allowed border-dashed border-line text-ink-3 shadow-none hover:translate-y-0",
                                !locked && r === undefined && "border-line-strong bg-surface text-ink-2 hover:border-ink-3",
                                !locked && r === true && "border-good-line bg-good-soft text-good",
                                !locked && r === false && "border-bad-line bg-bad-soft text-bad",
                              )}
                            >
                              <span className="tnum leading-none">{x.label}</span>
                              {locked ? <Lock size={10} /> : <TierBars tier={x.tier} className="scale-75" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          {!visible.length ? <p className="text-[14.5px] text-ink-2">No questions match these filters.</p> : null}
        </div>
      </div>

      {runner ? <PracticeRunner ids={runner.ids} title={runner.title} onExit={() => setRunner(null)} /> : null}
    </div>
  );
}

function ModeCard({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col px-6 py-5">
      <p className="flex items-center gap-2 text-[15.5px] font-semibold text-ink">
        <span className="text-ink-2">{icon}</span>
        {title}
      </p>
      <p className="mt-1.5 flex-1 text-[13.5px] leading-snug text-ink-2">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function Filter<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div>
      <p className="mb-1.5 text-[12.5px] font-medium text-ink-3">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v} className={cn("rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors", value === v ? "border-ink bg-ink text-bg" : "border-line-strong bg-surface text-ink-2 hover:border-ink-3")}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
