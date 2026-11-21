import type { Metadata } from "next";
import { Suspense } from "react";
import { Runner } from "@/components/Runner";

export const metadata: Metadata = { title: "Practice" };

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <Runner />
    </Suspense>
  );
}
