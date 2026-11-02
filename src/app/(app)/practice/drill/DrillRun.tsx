"use client";

import { useEffect, useState } from "react";
import type { QuestionContent } from "@/lib/content-types";
import { buildDrill } from "@/lib/sets";
import { loadQuestions } from "@/lib/questions";
import { getProgress } from "@/lib/progress/store";
import { TestRunner } from "@/components/session/TestRunner";

// A fresh 20-question set each time, timed at the real test's pace.
export function DrillRun() {
  const [questions, setQuestions] = useState<QuestionContent[] | null>(null);

  useEffect(() => {
    let alive = true;
    const active = getProgress().active["drill:drill"];
    const ids = active ? active.questions : buildDrill(getProgress());
    loadQuestions(ids).then((c) => {
      if (alive) setQuestions(ids.map((id) => c[id]).filter(Boolean));
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!questions) return <div className="fixed inset-0 z-40 bg-bg" />;
  return <TestRunner kind="drill" refId="drill" title="Speed drill" questions={questions} limitMs={10 * 60 * 1000} exitHref="/practice" />;
}
