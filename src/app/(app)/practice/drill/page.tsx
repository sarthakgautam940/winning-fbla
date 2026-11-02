import type { Metadata } from "next";
import { DrillRun } from "./DrillRun";

export const metadata: Metadata = { title: "Speed drill" };

export default function DrillPage() {
  return <DrillRun />;
}
