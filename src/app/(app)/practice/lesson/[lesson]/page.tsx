import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, getLesson } from "@/lib/catalog";
import { LessonPractice } from "./LessonPractice";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(catalog.lessons)
    .filter((l) => l.hasContent && l.skills.length)
    .map((l) => ({ lesson: l.id }));
}

type Params = { params: Promise<{ lesson: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lesson } = await params;
  return { title: `Practice ${getLesson(lesson)?.code ?? ""}` };
}

export default async function LessonPracticePage({ params }: Params) {
  const { lesson } = await params;
  if (!getLesson(lesson)) notFound();
  return <LessonPractice lessonId={lesson} />;
}
