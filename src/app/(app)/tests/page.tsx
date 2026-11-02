import type { Metadata } from "next";
import { TestsView } from "./TestsView";

export const metadata: Metadata = { title: "Practice tests" };

export default function TestsPage() {
  return <TestsView />;
}
