"use client";

import Link from "next/link";
import { useState } from "react";
import { sections, type SectionKey } from "@/lib/bank";
import { TARGET } from "@/lib/engine";
import { useHydrated, useStore, type State } from "@/lib/store";

export function PatternsView() {
  const state = useStore();
  const ready = useHydrated();
  const [sec, setSec] = useState<SectionKey>("math");
  const st = ready ? state : ({ q: {} } as State);
  const section = sections.find((s) => s.key === sec)!;
  return (
    <div>
      <div className="bank-head">
        <div>
          <h1 className="title">Patterns</h1>
          <p className="subtitle">Every question type in the bank, with how to solve it fast and the trap to avoid. 77 in Math, 50 in Reading and Writing.</p>
        </div>
        <div className="seg" role="group" aria-label="Section">
          <button aria-pressed={sec === "math"} onClick={() => setSec("math")}>
            Math
          </button>
          <button aria-pressed={sec === "rw"} onClick={() => setSec("rw")}>
            Reading and Writing
          </button>
        </div>
      </div>
      {section.categories.map((c) => (
        <section key={c.name} className="section" style={{ marginTop: 30 }}>
          <h2 className="h2">{c.name}</h2>
          <div className="rows">
            {c.subs.map((s) => {
              const m = s.qs.filter((id) => (st.q[id]?.c ?? 0) >= TARGET).length;
              const reps = s.qs.reduce((a, id) => a + Math.min(st.q[id]?.c ?? 0, TARGET), 0);
              return (
                <Link key={s.key} href={`/patterns/${s.key}/`} className="row">
                  <span className="tile" data-m={Math.round((reps / (s.qs.length * TARGET)) * TARGET)} style={{ minWidth: 44, height: 36 }}>
                    {s.n}
                  </span>
                  <span className="grow" style={{ fontWeight: 600 }}>
                    {s.name}
                  </span>
                  <span className="muted tnum" style={{ fontSize: 14 }}>
                    {m} / {s.qs.length} mastered
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
