import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { practiceTestLoaders } from "@/generated/loaders";
import { catalog } from "@/lib/catalog";
import { TestRunner } from "@/components/session/TestRunner";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.practiceTests.map((t) => ({ id: t.id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: catalog.practiceTests.find((t) => t.id === id)?.title ?? "Practice test" };
}

export default async function PracticeTestPage({ params }: Params) {
  const { id } = await params;
  if (!practiceTestLoaders[id]) notFound();
  const test = await practiceTestLoaders[id]();
  return <TestRunner kind="test" refId={id} title={`Data Science & AI: ${test.title}`} questions={test.questions} limitMs={test.minutes * 60 * 1000} exitHref="/tests" realistic />;
}
