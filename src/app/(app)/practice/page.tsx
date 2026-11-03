import type { Metadata } from "next";
import { PracticeView } from "./PracticeView";

export const metadata: Metadata = { title: "Question Bank" };

export default function PracticePage() {
  return <PracticeView />;
}
