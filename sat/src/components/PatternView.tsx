"use client";

import Link from "next/link";
import { byId, sectionName, shortCode, subByKey, teach } from "@/lib/bank";
import { TARGET } from "@/lib/engine";
import { scopeHref } from "@/lib/scope";
import { useHydrated, useStore, type State } from "@/lib/store";
import { IconBulb } from "./icons";

export function PatternView({ subKey }: { subKey: string }) {
  const state = useStore();
  const ready = useHydrated();
  const st = ready ? state : ({ q: {} } as State);
  const sub = subByKey.get(subKey)!;
  const note = teach[subKey];
  const mastered = sub.qs.filter((id) => (st.q[id]?.c ?? 0) >= TARGET).length;
  return (
    <div style={{ maxWidth: 820 }}>
      <Link href="/patterns/" className="link" style={{ fontSize: 14 }}>
        All patterns
      </Link>
      <h1 className="title" style={{ marginTop: 18 }}>
        {sub.n}. {sub.name}
      </h1>
      <p className="subtitle">
        {sectionName(sub.section)}, {sub.category}. {sub.qs.length} {sub.qs.length === 1 ? "question" : "questions"}, {mastered} mastered.
      </p>
      <div className="today-actions">
        <Link className="btn" href={scopeHref({ kind: "sub", value: subKey })}>
          Practice this pattern
        </Link>
      </div>

      <section className="card section teach" style={{ marginTop: 30 }}>
        <h2 className="h3" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <IconBulb size={18} /> How to solve it
        </h2>
        <p>{note.what}</p>
        <ol>
          {note.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
        {note.desmos ? (
          <p>
            <strong>Desmos:</strong> {note.desmos}
          </p>
        ) : null}
        <p style={{ marginBottom: 0 }}>
          <strong>Trap:</strong> {note.trap}
        </p>
      </section>

      <section className="section">
        <h2 className="h2">Questions</h2>
        <div className="rows">
          {sub.qs.map((id) => {
            const q = byId.get(id)!;
            const p = st.q[id];
            const c = Math.min(p?.c ?? 0, TARGET);
            return (
              <div key={id} className="row" style={{ padding: 0 }}>
              <Link href={scopeHref({ kind: "sub", value: subKey, start: id })} className="row grow" style={{ margin: 0 }}>
                <span className="tile" data-m={c}>
                  {shortCode(q.code)}
                </span>
                <span className="grow">
                  <span style={{ fontWeight: 600 }}>{q.pattern}</span>
                  <span className="muted" style={{ display: "block", fontSize: 13 }}>
                    {q.skill}. {q.type === "spr" ? "Student-produced response" : "Multiple choice"}. College Board ID {q.id}
                  </span>
                </span>
                <span className="muted tnum" style={{ fontSize: 13.5, textAlign: "right" }}>
                  {p?.n ? `${c} of ${TARGET}` : "New"}
                  {p?.w ? <span style={{ display: "block" }}>missed {p.w}</span> : null}
                </span>
              </Link>
              <Link href={`/view/?q=${id}`} className="link" style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>
                Answer and explanation
              </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
