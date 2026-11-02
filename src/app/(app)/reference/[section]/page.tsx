import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { referenceLoaders } from "@/generated/loaders";
import flashcards from "@/generated/flashcards.json";
import { catalog, getLesson, getSkill } from "@/lib/catalog";
import type { Flashcard } from "@/lib/content-types";
import { SCHOOL, SHOP, formatCell, type Table } from "@/lib/sample-db";
import { LessonBody } from "@/components/lesson/LessonBody";
import { Card } from "@/components/ui/primitives";
import { GlossaryList } from "./GlossaryList";

const TITLES: Record<string, string> = { event: "The event", formulas: "Formula sheet", glossary: "Glossary", objectives: "Objectives map", databases: "Sample databases", sources: "Sources" };

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(TITLES).map((section) => ({ section }));
}

type Params = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section } = await params;
  return { title: TITLES[section] ?? "Reference" };
}

function DbTable({ t }: { t: Table }) {
  return (
    <div className="mb-6">
      <p className="mb-2 font-mono text-[13.5px] font-semibold text-ink">
        {t.name}
        <span className="ml-2 font-sans text-[12.5px] font-normal text-ink-3">
          key: {t.key.join(", ")}
          {t.notes ? `; ${Object.values(t.notes).join("; ")}` : ""}
        </span>
      </p>
      <div className="overflow-x-auto rounded-[10px] border border-line">
        <table className="w-full border-collapse text-[13px] tnum">
          <thead>
            <tr className="bg-surface-2">
              {t.columns.map((c) => (
                <th key={c} className="border-b border-line px-3 py-1.5 text-left font-mono font-semibold text-ink-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-b-0">
                {r.map((v, j) => (
                  <td key={j} className={v === null ? "px-3 py-1.5 italic text-ink-3" : "px-3 py-1.5 text-ink"}>
                    {formatCell(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ReferenceSection({ params }: Params) {
  const { section } = await params;
  if (!TITLES[section]) notFound();

  if (section === "glossary") {
    const cards = (flashcards as Flashcard[]).map((c) => ({ id: c.id, term: c.term, back: c.back, lesson: c.lesson, unit: c.unit, code: getLesson(c.lesson)?.code ?? "" }));
    return <GlossaryList cards={cards} />;
  }

  if (section === "databases") {
    return (
      <div>
        <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-ink-2">Lessons and questions use these two small databases so you can reason about query results by hand. Every SQL result shown in the course was produced by running the query against exactly these rows.</p>
        <h2 className="mb-3 text-[18px] font-semibold text-ink">school</h2>
        {SCHOOL.map((t) => (
          <DbTable key={t.name} t={t} />
        ))}
        <h2 className="mb-3 mt-10 text-[18px] font-semibold text-ink">shop</h2>
        {SHOP.map((t) => (
          <DbTable key={t.name} t={t} />
        ))}
      </div>
    );
  }

  if (section === "objectives") {
    return (
      <div className="flex flex-col gap-8">
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-2">Every official objective, quoted from the 2026-2027 guidelines, with the lessons that teach it and the number of practice questions behind it.</p>
        {catalog.areas.map((a) => (
          <section key={a.id}>
            <h2 className="text-[17px] font-semibold text-ink">
              {a.name} <span className="font-normal text-ink-3">({a.items} test items)</span>
            </h2>
            <Card className="mt-3 divide-y divide-line">
              {a.objectives.map((o) => {
                const lessons = Object.values(catalog.lessons).filter((l) => l.objectives.includes(o.id));
                const qCount = catalog.questions.filter((q) => q.objective === o.id).length;
                const skills = catalog.skillOrder.filter((s) => catalog.skills[s].objectives.includes(o.id));
                return (
                  <div key={o.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_220px]">
                    <div>
                      <p className="text-[14.5px] text-ink">
                        <span className="mr-2 font-semibold text-ink-3">{o.id}</span>
                        {o.text}
                      </p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">Question types: {skills.map((s) => `${getSkill(s)?.n} ${getSkill(s)?.name}`).join("; ")}</p>
                    </div>
                    <div className="text-[13px]">
                      {lessons.map((l) => (
                        <Link key={l.id} href={`/learn/${l.unit}/${l.id}`} className="block text-accent-ink hover:underline hover:underline-offset-4">
                          {l.code} {l.title}
                        </Link>
                      ))}
                      <p className="tnum mt-1 text-ink-3">{qCount} practice questions</p>
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>
        ))}
      </div>
    );
  }

  const loader = referenceLoaders[section];
  if (!loader) notFound();
  const { hast } = await loader();
  return (
    <div className="max-w-[760px]">
      <LessonBody hast={hast} questions={{}} metas={{}} />
    </div>
  );
}
