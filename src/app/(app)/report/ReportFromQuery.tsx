"use client";

import { useSearchParams } from "next/navigation";
import { Report } from "@/components/session/Report";

export function ReportFromQuery() {
  const id = useSearchParams().get("s") ?? "";
  return <Report sessionId={id} />;
}
