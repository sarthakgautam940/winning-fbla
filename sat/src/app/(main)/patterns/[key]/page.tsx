import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { subByKey, subs } from "@/lib/bank";
import { PatternView } from "@/components/PatternView";

export const dynamicParams = false;

export function generateStaticParams() {
  return subs.map((s) => ({ key: s.key }));
}

type Params = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { key } = await params;
  const s = subByKey.get(key);
  return { title: s ? s.name : "Pattern" };
}

export default async function PatternPage({ params }: Params) {
  const { key } = await params;
  if (!subByKey.has(key)) notFound();
  return <PatternView subKey={key} />;
}
