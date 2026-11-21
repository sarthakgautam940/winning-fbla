import type { Metadata } from "next";
import { Suspense } from "react";
import { ViewQuestion } from "@/components/ViewQuestion";

export const metadata: Metadata = { title: "Question" };

export default function ViewPage() {
  return (
    <Suspense fallback={null}>
      <ViewQuestion />
    </Suspense>
  );
}
