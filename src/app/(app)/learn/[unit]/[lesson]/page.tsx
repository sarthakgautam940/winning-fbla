import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lessonLoaders, questionLoaders } from "@/generated/loaders";
import { catalog, getLesson, getSkill, getUnit, qmeta } from "@/lib/catalog";
import type { QMeta, QuestionContent } from "@/lib/content-types";
import { LessonBody } from "@/components/lesson/LessonBody";
import { LessonFooter, LessonRail } from "@/components/lesson/LessonRail";
import { Divider } from "@/components/ui/primitives";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(catalog.lessons)
    .filter((l) => l.hasContent)
    .map((l) => ({ unit: l.unit, lesson: l.id }));
}

type Params = { params: Promise<{ unit: string; lesson: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lesson } = await params;
  const l = getLesson(lesson);
  return { title: l ? `${l.code} ${l.title}` : "Lesson" };
}

export default async function LessonPage({ params }: Params) {
  const { unit, lesson: id } = await params;
  const lesson = getLesson(id);
  const u = getUnit(unit);
  if (!lesson || !u || lesson.unit !== unit || !lessonLoaders[id]) notFound();
  const [{ hast }, bank] = await Promise.all([lessonLoaders[id](), questionLoaders[unit]()]);
  const questions: Record<string, QuestionContent> = {};
  const metas: Record<string, QMeta> = {};
  for (const qid of lesson.checks) {
    if (bank[qid]) questions[qid] = bank[qid];
    const m = qmeta(qid);
    if (m) metas[qid] = m;
  }
  const area = catalog.areas.find((a) => a.id === u.area);
  return (
    <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 px-5 pb-10 pt-8 sm:px-8 lg:pt-12 xl:grid-cols-[minmax(0,1fr)_220px]">
      <article className="min-w-0 max-w-[740px]">
        <nav aria-label="Breadcrumb" className="text-[13.5px] text-ink-3">
          <Link href="/learn" className="hover:text-ink">
            Learn
          </Link>
          <span className="mx-2 text-line-strong">/</span>
          <Link href={`/learn/${u.id}`} className="hover:text-ink">
            Unit {u.n}: {u.title}
          </Link>
        </nav>
        <h1 className="mt-3 text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[38px]">
          <span className="mr-3 text-ink-3">{lesson.code}</span>
          {lesson.title}
        </h1>
        <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">{lesson.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-3">
          <span>{lesson.minutes} minutes</span>
          {lesson.checks.length ? (
            <>
              <Divider />
              <span>{lesson.checks.length} checks</span>
            </>
          ) : null}
          {lesson.quiz.length ? (
            <>
              <Divider />
              <span>{lesson.quiz.length}-question quiz</span>
            </>
          ) : null}
          {area ? (
            <>
              <Divider />
              <span>
                {area.name}: {area.items} of 100 test questions
              </span>
            </>
          ) : null}
        </div>
        {lesson.skills.length ? (
          <details className="mt-5 rounded-[12px] border border-line bg-surface px-4 py-3 text-[14px] [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer list-none font-medium text-ink-2 hover:text-ink">What this lesson covers on the test</summary>
            <ul className="mt-3 flex flex-col gap-1.5 text-ink-2">
              {lesson.objectives.map((o) => {
                const obj = catalog.areas.flatMap((a) => a.objectives).find((x) => x.id === o);
                return obj ? (
                  <li key={o}>
                    <span className="font-medium text-ink">Objective {o}:</span> {obj.text}
                  </li>
                ) : null;
              })}
              <li className="pt-1 text-ink-3">
                Question types: {lesson.skills.map((s) => `${getSkill(s)?.n}. ${getSkill(s)?.name}`).join("; ")}
              </li>
            </ul>
          </details>
        ) : null}
        <div className="mt-8">
          <LessonBody hast={hast} questions={questions} metas={metas} />
        </div>
        <LessonFooter lesson={lesson} />
      </article>
      <aside className="hidden xl:block">
        <LessonRail lesson={lesson} />
      </aside>
    </div>
  );
}
