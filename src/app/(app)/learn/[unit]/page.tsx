import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalog, getUnit } from "@/lib/catalog";
import { UnitView } from "./UnitView";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.units.map((u) => ({ unit: u.id }));
}

type Params = { params: Promise<{ unit: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { unit } = await params;
  const u = getUnit(unit);
  return { title: u ? `Unit ${u.n}: ${u.title}` : "Unit" };
}

export default async function UnitPage({ params }: Params) {
  const { unit } = await params;
  if (!getUnit(unit)) notFound();
  return <UnitView unitId={unit} />;
}
