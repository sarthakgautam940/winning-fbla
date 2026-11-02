"use client";

import { useState } from "react";
import { Button, cn } from "@/components/ui/primitives";
import { SCHOOL, table, type Cell } from "@/lib/sample-db";
import { MiniTable, Segmented, WidgetFrame } from "./frame";

// ------------------------------------------------------------ query order

const students = table(SCHOOL, "students");
type Row = Record<string, Cell>;
const rows: Row[] = students.rows.map((r) => Object.fromEntries(students.columns.map((c, i) => [c, r[i]])));

const QUERY = [
  "SELECT grade, AVG(gpa) AS avg_gpa",
  "FROM students",
  "WHERE gpa IS NOT NULL",
  "GROUP BY grade",
  "HAVING COUNT(*) >= 2",
  "ORDER BY avg_gpa DESC",
  "LIMIT 2;",
];

interface Stage {
  clause: string;
  line: number; // index into QUERY
  note: string;
  columns: string[];
  data: (string | number | null)[][];
}

function buildStages(): Stage[] {
  const all = rows;
  const filtered = all.filter((r) => r.gpa !== null);
  const groups = new Map<number, Row[]>();
  for (const r of filtered) {
    const g = r.grade as number;
    groups.set(g, [...(groups.get(g) ?? []), r]);
  }
  const grouped = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  const having = grouped.filter(([, rs]) => rs.length >= 2);
  const selected = having.map(([g, rs]) => ({ grade: g, avg: rs.reduce((s, r) => s + (r.gpa as number), 0) / rs.length }));
  const ordered = [...selected].sort((a, b) => b.avg - a.avg);
  const limited = ordered.slice(0, 2);
  return [
    { clause: "FROM", line: 1, note: "Start with every row of the table.", columns: students.columns, data: students.rows },
    { clause: "WHERE", line: 2, note: "Keep rows where gpa is not NULL. Isla's row drops out.", columns: students.columns, data: filtered.map((r) => students.columns.map((c) => r[c])) },
    {
      clause: "GROUP BY",
      line: 3,
      note: "Form one group per grade. Each group will become one output row.",
      columns: ["grade", "rows in group", "gpa values"],
      data: grouped.map(([g, rs]) => [g, rs.length, rs.map((r) => r.gpa).join(", ")]),
    },
    {
      clause: "HAVING",
      line: 4,
      note: "Keep groups with at least 2 rows. Grade 9 has only one student, so it is removed.",
      columns: ["grade", "rows in group", "gpa values"],
      data: having.map(([g, rs]) => [g, rs.length, rs.map((r) => r.gpa).join(", ")]),
    },
    { clause: "SELECT", line: 0, note: "Compute the output columns, including the alias avg_gpa.", columns: ["grade", "avg_gpa"], data: selected.map((s) => [s.grade, Number(s.avg.toFixed(4))]) },
    { clause: "ORDER BY", line: 5, note: "Sort by avg_gpa, highest first. ORDER BY can use the alias because SELECT already ran.", columns: ["grade", "avg_gpa"], data: ordered.map((s) => [s.grade, Number(s.avg.toFixed(4))]) },
    { clause: "LIMIT", line: 6, note: "Keep the first 2 rows. This is the final result.", columns: ["grade", "avg_gpa"], data: limited.map((s) => [s.grade, Number(s.avg.toFixed(4))]) },
  ];
}

const STAGES = buildStages();

export function QueryOrder() {
  const [i, setI] = useState(0);
  const st = STAGES[i];
  return (
    <WidgetFrame title="How a query actually runs" hint="Logical processing order on the school database">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,300px)_1fr]">
        <div>
          <pre className="rounded-[10px] border border-line bg-[var(--code-bg)] p-3 font-mono text-[12.5px] leading-[1.75]">
            {QUERY.map((ln, k) => (
              <div key={k} className={cn("rounded px-1.5 transition-colors", k === st.line ? "bg-accent-soft font-semibold text-ink" : "text-ink-3")}>
                {ln}
              </div>
            ))}
          </pre>
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {STAGES.map((s, k) => (
              <li key={s.clause}>
                <button type="button" onClick={() => setI(k)} className={cn("rounded-[8px] border px-2 py-1 text-[12px] font-medium", k === i ? "border-accent bg-accent-soft text-ink" : k < i ? "border-line text-ink-2" : "border-line text-ink-3")}>
                  {k + 1}. {s.clause}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="min-w-0">
          <p className="text-[14px] text-ink">
            <span className="font-semibold">
              Step {i + 1}, {st.clause}.
            </span>{" "}
            <span className="text-ink-2">{st.note}</span>
          </p>
          <MiniTable className="mt-3" columns={st.columns} rows={st.data} />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setI((k) => Math.max(0, k - 1))} disabled={i === 0}>
              Back
            </Button>
            <Button size="sm" variant="primary" onClick={() => setI((k) => Math.min(STAGES.length - 1, k + 1))} disabled={i === STAGES.length - 1}>
              Next step
            </Button>
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ join explorer

const clubs = table(SCHOOL, "clubs");
const LEFT = rows.slice(0, 6).map((r) => ({ name: r.name as string, club_id: r.club_id as number | null }));
const RIGHT = clubs.rows.map((r) => ({ club_id: r[0] as number, club_name: r[1] as string }));

type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL";

function runJoin(type: JoinType) {
  const out: { name: string | null; s_club: number | null; c_club: number | null; club_name: string | null; kind: "match" | "left" | "right" }[] = [];
  const matchedRight = new Set<number>();
  for (const s of LEFT) {
    const hits = RIGHT.filter((c) => s.club_id !== null && c.club_id === s.club_id);
    hits.forEach((c) => matchedRight.add(c.club_id));
    if (hits.length) hits.forEach((c) => out.push({ name: s.name, s_club: s.club_id, c_club: c.club_id, club_name: c.club_name, kind: "match" }));
    else if (type === "LEFT" || type === "FULL") out.push({ name: s.name, s_club: s.club_id, c_club: null, club_name: null, kind: "left" });
  }
  if (type === "RIGHT" || type === "FULL") {
    for (const c of RIGHT) if (!matchedRight.has(c.club_id)) out.push({ name: null, s_club: null, c_club: c.club_id, club_name: c.club_name, kind: "right" });
  }
  if (type === "RIGHT") out.sort((a, b) => (a.c_club ?? 0) - (b.c_club ?? 0));
  return out;
}

export function JoinExplorer() {
  const [type, setType] = useState<JoinType>("INNER");
  const result = runJoin(type);
  const unmatchedLeft = result.filter((r) => r.kind === "left").length;
  const unmatchedRight = result.filter((r) => r.kind === "right").length;
  return (
    <WidgetFrame title="Joins, row by row" hint="First six students joined to clubs">
      <Segmented
        label="Join type"
        value={type}
        onChange={setType}
        options={[
          { value: "INNER", label: "INNER" },
          { value: "LEFT", label: "LEFT" },
          { value: "RIGHT", label: "RIGHT" },
          { value: "FULL", label: "FULL OUTER" },
        ]}
      />
      <pre className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-[var(--code-bg)] p-3 font-mono text-[12.5px] text-ink">
        {`SELECT s.name, s.club_id, c.club_id, c.club_name\nFROM students AS s\n${type === "FULL" ? "FULL OUTER" : type} JOIN clubs AS c ON s.club_id = c.club_id;`}
      </pre>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-ink-3">students (left)</p>
          <MiniTable columns={["name", "club_id"]} rows={LEFT.map((s) => [s.name, s.club_id])} highlight={(i) => (LEFT[i].club_id === null && type !== "LEFT" && type !== "FULL" ? "dim" : null)} />
          <p className="mb-1.5 mt-3 text-[12.5px] font-medium text-ink-3">clubs (right)</p>
          <MiniTable columns={["club_id", "club_name"]} rows={RIGHT.map((c) => [c.club_id, c.club_name])} highlight={(i) => (!LEFT.some((s) => s.club_id === RIGHT[i].club_id) && type !== "RIGHT" && type !== "FULL" ? "dim" : null)} />
        </div>
        <div>
          <p className="mb-1.5 text-[12.5px] font-medium text-ink-3">
            Result: {result.length} rows
            {unmatchedLeft ? `, ${unmatchedLeft} left-only` : ""}
            {unmatchedRight ? `, ${unmatchedRight} right-only` : ""}
          </p>
          <MiniTable
            columns={["s.name", "s.club_id", "c.club_id", "c.club_name"]}
            rows={result.map((r) => [r.name, r.s_club, r.c_club, r.club_name])}
            highlight={(i) => (result[i].kind === "match" ? null : "bad")}
          />
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            {type === "INNER"
              ? "Only rows with a match on both sides. Students with no club and clubs with no students disappear."
              : type === "LEFT"
                ? "Every student appears. Where no club matches, the club columns are NULL."
                : type === "RIGHT"
                  ? "Every club appears. Chess has no members, so its student columns are NULL. Students with no club disappear."
                  : "Everything from both sides: matches, plus unmatched rows from each side padded with NULL."}
          </p>
        </div>
      </div>
    </WidgetFrame>
  );
}
