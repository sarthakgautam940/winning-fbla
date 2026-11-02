"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getLesson } from "@/lib/catalog";
import { lessonPracticeSet } from "@/lib/sets";
import { getProgress, useReady } from "@/lib/progress/store";
import { PracticeRunner } from "@/components/session/PracticeRunner";

export function LessonPractice({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const ready = useReady();
  const lesson = getLesson(lessonId)!;
  // Frozen once the device's progress is available, so the set does not
  // reshuffle while answers are being recorded.
  const ids = useMemo(() => (ready ? lessonPracticeSet(getProgress(), lessonId) : []), [ready, lessonId]);
  if (!ready) return <div className="fixed inset-0 z-40 bg-bg" />;
  return <PracticeRunner ids={ids} title={`Practice: ${lesson.code} ${lesson.title}`} onExit={() => router.push(`/learn/${lesson.unit}/${lesson.id}`)} />;
}
