import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { questionLoaders } from "@/generated/loaders";
import { catalog, getLesson } from "@/lib/catalog";
import { shuffle } from "@/lib/questions";
import { TestRunner } from "@/components/session/TestRunner";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(catalog.lessons)
    .filter((l) => l.hasContent && l.quiz.length)
    .map((l) => ({ unit: l.unit, lesson: l.id }));
}

type Params = { params: Promise<{ unit: string; lesson: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lesson } = await params;
  return { title: `Quiz ${getLesson(lesson)?.code ?? ""}` };
}

function seed(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 2147483647;
  return h;
}

export default async function QuizPage({ params }: Params) {
  const { unit, lesson: id } = await params;
  const lesson = getLesson(id);
  if (!lesson || lesson.unit !== unit || !lesson.quiz.length) notFound();
  const bank = await questionLoaders[unit]();
  const questions = shuffle(lesson.quiz, seed(id))
    .map((qid) => bank[qid])
    .filter(Boolean);
  return (
    <TestRunner
      kind="quiz"
      refId={id}
      lessonId={id}
      title={`Quiz: ${lesson.code} ${lesson.title}`}
      questions={questions}
      limitMs={questions.length * 45 * 1000}
      exitHref={`/learn/${unit}/${id}`}
    />
  );
}
