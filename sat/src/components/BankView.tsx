"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconBookmark, IconCheck, IconX } from "./icons";
import { byId, sections, shortCode, type SectionKey, type Sub } from "@/lib/bank";
import { TARGET } from "@/lib/engine";
import { scopeHref } from "@/lib/scope";
import { useHydrated, useStore, type State } from "@/lib/store";

function level(state: State, id: string) {
  return Math.min(state.q[id]?.c ?? 0, TARGET);
}

function subLevel(state: State, sub: Sub) {
  const total = sub.qs.length * TARGET;
  const got = sub.qs.reduce((a, id) => a + level(state, id), 0);
  return Math.round((got / total) * TARGET);
}

export function BankView() {
  const state = useStore();
  const ready = useHydrated();
  const [sec, setSec] = useState<SectionKey>("math");
  const section = sections.find((s) => s.key === sec)!;
  const st = useMemo(() => (ready ? state : ({ q: {} } as State)), [ready, state]);

  const counts = useMemo(() => {
    let mastered = 0;
    let started = 0;
    let missed = 0;
    let marked = 0;
    for (const [id, p] of Object.entries(st.q)) {
      if (!byId.has(id)) continue;
      if (p.c >= TARGET) mastered++;
      else if (p.n > 0) started++;
      if (p.w > 0) missed++;
      if (p.bm) marked++;
    }
    return { mastered, started, missed, marked };
  }, [st]);

  return (
    <div className="bank">
      <header className="bank-head">
        <div>
          <h1 className="title">Question bank</h1>
          <p className="subtitle">
            {counts.mastered} of 481 mastered, {counts.started} in progress. A tile darkens with each correct answer and turns solid at 5 of 5.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Section">
          <button aria-pressed={sec === "math"} onClick={() => setSec("math")}>
            Math
          </button>
          <button aria-pressed={sec === "rw"} onClick={() => setSec("rw")}>
            Reading and Writing
          </button>
        </div>
      </header>

      <div className="bank-grid">
        <aside className="bank-rail">
          <Link href={scopeHref({ kind: "bookmarked" })} className="rail-item">
            <IconBookmark size={17} /> Bookmarked <span className="tnum muted">{counts.marked}</span>
          </Link>
          <Link href={scopeHref({ kind: "missed" })} className="rail-item">
            <IconX size={17} /> Missed <span className="tnum muted">{counts.missed}</span>
          </Link>
          <div className="rail-label">Topics</div>
          {section.categories.map((c) => {
            const ids = c.subs.flatMap((s) => s.qs);
            const m = ids.filter((id) => level(st, id) >= TARGET).length;
            return (
              <a key={c.name} href={`#${slug(sec, c.name)}`} className="rail-item">
                <span className="grow">{c.name}</span>
                <span className="tnum muted">
                  {m}/{ids.length}
                </span>
              </a>
            );
          })}
          <Link href={scopeHref({ kind: "section", value: sec })} className="btn btn-sm" style={{ marginTop: 16 }}>
            Practice all {sec === "math" ? "Math" : "Reading and Writing"}
          </Link>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
            Press Ctrl+Shift+F to jump to a question by number.
          </p>
        </aside>

        <div className="bank-main">
          {section.categories.map((c) => (
            <section key={c.name} id={slug(sec, c.name)} className="cat">
              <div className="cat-head">
                <h2 className="h3">{c.name}</h2>
                <Link className="link" href={scopeHref({ kind: "category", value: `${sec}:${c.name}` })}>
                  Practice this topic
                </Link>
              </div>
              {c.subs.map((s) => (
                <div key={s.key} className="sub-row">
                  <Link href={`/patterns/${s.key}/`} className="sub-name">
                    {s.name}
                  </Link>
                  <Link href={scopeHref({ kind: "sub", value: s.key })} className="tile big" data-m={subLevel(st, s)} title={`Practice all of pattern ${s.n}`}>
                    {s.n}
                  </Link>
                  <div className="sub-tiles">
                    {s.qs.map((id) => {
                      const q = byId.get(id)!;
                      const p = st.q[id];
                      const m = level(st, id);
                      return (
                        <Link
                          key={id}
                          href={scopeHref({ kind: "sub", value: s.key, start: id })}
                          className="tile"
                          data-m={m}
                          title={`${q.code}: ${q.pattern}${p ? `. ${m} of ${TARGET} correct${p.w ? `, missed ${p.w}` : ""}` : ""}`}
                        >
                          {shortCode(q.code)}
                          {m >= TARGET ? (
                            <span className="badge">
                              <IconCheck size={11} strokeWidth={3} />
                            </span>
                          ) : p?.lw ? (
                            <span className="badge miss">
                              <IconX size={11} strokeWidth={3} />
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ))}
          <div className="legend" style={{ marginTop: 28 }}>
            <span>
              <i style={{ background: "var(--m0)" }} />
              Not started
            </span>
            <span>
              <i style={{ background: "var(--m2)" }} />
              In progress
            </span>
            <span>
              <i style={{ background: "var(--m4)" }} />4 of 5
            </span>
            <span>
              <i style={{ background: "var(--m5)" }} />
              Mastered
            </span>
            <span>
              <i style={{ background: "var(--bad)", borderColor: "var(--bad)", borderRadius: 99 }} />
              Missed last time
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function slug(sec: string, name: string) {
  return `${sec}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
