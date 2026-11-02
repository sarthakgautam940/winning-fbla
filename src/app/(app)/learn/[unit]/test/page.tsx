import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unitTestLoaders } from "@/generated/loaders";
import { catalog, getUnit } from "@/lib/catalog";
import { TestRunner } from "@/components/session/TestRunner";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.units.filter((u) => u.unitTest).map((u) => ({ unit: u.id }));
}

type Params = { params: Promise<{ unit: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { unit } = await params;
  return { title: `Unit ${getUnit(unit)?.n ?? ""} test` };
}

export default async function UnitTestPage({ params }: Params) {
  const { unit } = await params;
  const u = getUnit(unit);
  if (!u || !unitTestLoaders[unit]) notFound();
  const test = await unitTestLoaders[unit]();
  return <TestRunner kind="unit" refId={unit} title={`Unit ${u.n} test: ${u.title}`} questions={test.questions} limitMs={test.minutes * 60 * 1000} exitHref={`/learn/${unit}`} />;
}
