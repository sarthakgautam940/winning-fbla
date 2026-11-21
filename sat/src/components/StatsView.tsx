"use client";

import Link from "next/link";
import { sections, sectionName, shortCode, subByKey, subKeyOf } from "@/lib/bank";
import { scopeHref } from "@/lib/scope";
import { breakdown, daily, mostMissed, pct, weakest, type Agg } from "@/lib/stats";
import { formatDay, formatDuration } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";

function secs(a: Agg) {
  return a.attempts ? `${Math.round(a.ms / a.attempts / 1000)} s` : "";
}

export function StatsView() {
  const state = useStore();
  const now = useNow();
  if (!now) return <div style={{ minHeight: 400 }} />;
  const b = breakdown(state);
  const days = daily(state, 14, now);
  const weak = weakest(b, 10);
  const missed = mostMissed(state, 10);
  const max = Math.max(1, ...days.map((d) => d.attempts));
  const acc = pct(b.all.correct, b.all.attempts);
  const first = pct(b.all.firstCorrect, b.all.firstTried);

  return (
    <div>
      <h1 className="title">Stats</h1>
      <p className="subtitle">
        {b.all.attempts
          ? `${b.all.attempts.toLocaleString()} answers, ${acc}% correct, ${formatDuration(b.all.ms)} of practice.`
          : "Nothing answered yet. Every number here fills in as you practice."}
      </p>

      <div className="strip section">
        <div>
          <div className="label">Mastered</div>
          <div className="value">{b.all.mastered}</div>
          <div className="note">of {b.all.total}</div>
        </div>
        <div>
          <div className="label">First-try accuracy</div>
          <div className="value">{first === null ? "None yet" : `${first}%`}</div>
          <div className="note">your real test-day signal</div>
        </div>
        <div>
          <div className="label">All answers</div>
          <div className="value">{acc === null ? "None yet" : `${acc}%`}</div>
          <div className="note">{b.all.correct.toLocaleString()} correct</div>
        </div>
        <div>
          <div className="label">Time per answer</div>
          <div className="value">{secs(b.all) || "None yet"}</div>
          <div className="note">average</div>
        </div>
      </div>

      <section className="section">
        <h2 className="h2">Last 14 days</h2>
        <svg className="chart" viewBox="0 -18 700 208" role="img" aria-label="Answers per day for the last 14 days">
          {days.map((d, i) => {
            const x = 10 + i * 49;
            const h = (d.attempts / max) * 140;
            const hc = (d.correct / max) * 140;
            return (
              <g key={d.day}>
                <rect x={x} y={150 - h} width={34} height={h} rx={5} fill="var(--soft-2)" />
                <rect x={x} y={150 - hc} width={34} height={hc} rx={5} fill="var(--ink)" />
                {d.attempts ? (
                  <text x={x + 17} y={144 - h} textAnchor="middle" fontSize="12" fill="var(--ink-2)" className="tnum">
                    {d.correct}
                  </text>
                ) : null}
                <text x={x + 17} y={172} textAnchor="middle" fontSize="11.5" fill="var(--ink-3)">
                  {formatDay(d.day, { month: "numeric", day: "numeric" })}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="legend">
          <span>
            <i style={{ background: "var(--ink)" }} />
            Correct
          </span>
          <span>
            <i style={{ background: "var(--soft-2)", borderColor: "var(--line-strong)" }} />
            All answers
          </span>
        </div>
      </section>

      {sections.map((s) => (
        <section key={s.key} className="section">
          <h2 className="h2">{s.name}</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Mastered</th>
                <th>First try</th>
                <th>All answers</th>
                <th>Per answer</th>
              </tr>
            </thead>
            <tbody>
              {s.categories.map((c) => {
                const a = b.category.get(`${s.key}:${c.name}`)!;
                return (
                  <tr key={c.name}>
                    <td>
                      <Link href={scopeHref({ kind: "category", value: `${s.key}:${c.name}` })}>{c.name}</Link>
                    </td>
                    <td className="tnum">
                      {a.mastered} / {a.total}
                    </td>
                    <td className="tnum">{pct(a.firstCorrect, a.firstTried) ?? ""}{a.firstTried ? "%" : ""}</td>
                    <td className="tnum">{pct(a.correct, a.attempts) ?? ""}{a.attempts ? "%" : ""}</td>
                    <td className="tnum">{secs(a)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}

      <div className="two-col section" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section>
          <h2 className="h2">Weakest patterns</h2>
          {weak.length ? (
            <div className="rows">
              {weak.map((w) => (
                <Link key={w.key} href={`/patterns/${w.key}/`} className="row">
                  <span className="grow">
                    <span style={{ fontWeight: 600 }}>
                      {subByKey.get(w.key)!.n}. {w.name}
                    </span>
                    <span className="muted" style={{ display: "block", fontSize: 13 }}>
                      {sectionName(w.section)}, {w.agg.firstTried} tried
                    </span>
                  </span>
                  <span className="tnum" style={{ fontWeight: 700 }}>
                    {w.firstAcc}%
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">No data yet.</p>
          )}
        </section>
        <section>
          <h2 className="h2">Most missed questions</h2>
          {missed.length ? (
            <div className="rows">
              {missed.map(({ q, w, n, c }) => (
                <Link key={q.id} href={scopeHref({ kind: "sub", value: subKeyOf(q), start: q.id })} className="row">
                  <span className="tile" data-m={Math.min(c, 5)}>
                    {shortCode(q.code)}
                  </span>
                  <span className="grow" style={{ fontSize: 14.5 }}>
                    {q.pattern}
                  </span>
                  <span className="muted tnum" style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>
                    {w} of {n} missed
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">Nothing missed yet.</p>
          )}
          {missed.length ? (
            <Link className="btn btn-ghost btn-sm" href={scopeHref({ kind: "missed" })} style={{ marginTop: 12 }}>
              Practice missed questions
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
