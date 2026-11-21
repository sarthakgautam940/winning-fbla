"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Blocks } from "./Content";
import { IconCheck } from "./icons";
import { byId, shortCode, subByKey, subKeyOf } from "@/lib/bank";
import { loadQuestion, type QData } from "@/lib/data";
import { scopeHref } from "@/lib/scope";

// A question with its answer and explanation, for looking something up without
// answering it (nothing here counts toward mastery).
export function ViewQuestion() {
  const id = useSearchParams().get("q") ?? "";
  const meta = byId.get(id);
  const [data, setData] = useState<QData | null>(null);
  useEffect(() => {
    if (!meta) return;
    let alive = true;
    loadQuestion(meta.id).then((q) => alive && setData(q));
    return () => {
      alive = false;
    };
  }, [meta]);
  if (!meta) return <p className="muted">No question with that ID.</p>;
  const sub = subByKey.get(subKeyOf(meta))!;
  return (
    <div style={{ maxWidth: 800 }}>
      <Link href={`/patterns/${sub.key}/`} className="link" style={{ fontSize: 14 }}>
        {sub.n}. {sub.name}
      </Link>
      <div className="qmeta" style={{ marginTop: 18 }}>
        <span className="tile">{shortCode(meta.code)}</span>
        <div className="grow">
          <div className="qsub">{meta.pattern}</div>
          <div className="muted qcat">
            {meta.skill}. College Board ID {meta.id}
          </div>
        </div>
        <Link className="btn btn-sm" href={scopeHref({ kind: "sub", value: sub.key, start: meta.id })}>
          Practice it
        </Link>
      </div>
      {data ? (
        <>
          <Blocks blocks={data.stem} />
          {data.type === "mc" ? (
            <div className="choices">
              {data.choices.map((ch) => (
                <div className="choice-row" key={ch.l}>
                  <div className="choice" data-state={ch.l === data.answer ? "correct" : "dim"} style={{ cursor: "default" }}>
                    <span className="letter">{ch.l === data.answer ? <IconCheck size={16} /> : ch.l}</span>
                    <div className="ccontent">
                      <Blocks blocks={ch.c} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontWeight: 700, fontSize: 17 }}>Accepted answers: {(data.answer as string[]).join(", ")}</p>
          )}
          <section className="feedback" data-ok="1" style={{ marginTop: 28 }}>
            <div className="fb-block" style={{ borderTop: 0 }}>
              <h2 className="h3">Explanation</h2>
              <Blocks blocks={data.rationale} className="qtext rationale" />
            </div>
          </section>
        </>
      ) : (
        <p className="muted">Loading the question</p>
      )}
    </div>
  );
}
