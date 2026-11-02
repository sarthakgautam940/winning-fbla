import type { Metadata } from "next";
import { LearnOverview } from "./LearnOverview";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <LearnOverview />;
}
