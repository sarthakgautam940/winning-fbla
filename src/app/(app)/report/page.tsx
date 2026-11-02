import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportFromQuery } from "./ReportFromQuery";

export const metadata: Metadata = { title: "Results" };

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportFromQuery />
    </Suspense>
  );
}
