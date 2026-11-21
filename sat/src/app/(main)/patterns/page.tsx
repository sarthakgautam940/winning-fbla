import type { Metadata } from "next";
import { PatternsView } from "@/components/PatternsView";

export const metadata: Metadata = { title: "Patterns" };

export default function PatternsPage() {
  return <PatternsView />;
}
