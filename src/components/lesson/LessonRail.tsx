"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { LessonInfo } from "@/lib/content-types";
import { addStudyTime, completeLesson, markSection, useProgress } from "@/lib/progress/store";
import { getLesson, nextLesson } from "@/lib/catalog";
import { cn, LinkButton, ProgressBar, Button } from "@/components/ui/primitives";

// Right-hand outline: shows the sections, marks them as read when they scroll
// past, and counts reading time while the tab is visible and in use.
export function LessonRail({ lesson }: { lesson: LessonInfo }) {
  const progress = useProgress();
  const [current, setCurrent] = useState<string | null>(null);
  const seen = progress.lessons[lesson.id]?.seen ?? [];

  useEffect(() => {
    const heads = [...document.querySelectorAll<HTMLElement>("h2[data-section]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setCurrent(e.target.id);
            markSection(lesson.id, e.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -65% 0px" },
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [lesson.id]);

  // Reading time: counted in 15-second slices while visible and recently active.
  const lastInput = useRef(0);
  useEffect(() => {
    lastInput.current = Date.now();
    const bump = () => (lastInput.current = Date.now());
    const events = ["scroll", "pointerdown", "keydown", "pointermove"];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput.current < 90 * 1000) addStudyTime(15 * 1000);
    }, 15 * 1000);
    return () => {
      clearInterval(t);
      events.forEach((ev) => window.removeEventListener(ev, bump));
    };
  }, []);

  const share = lesson.sections.length ? seen.filter((s) => lesson.sections.some((x) => x.id === s)).length / lesson.sections.length : 0;
  return (
    <nav aria-label="On this page" className="sticky top-8">
      <p className="text-[12.5px] font-medium text-ink-3">On this page</p>
      <ProgressBar value={share} className="mt-2.5" label="Sections read" />
      <ol className="mt-3 flex flex-col gap-0.5 border-l border-line">
        {lesson.sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={cn(
                "-ml-px flex items-start gap-2 border-l-2 py-1.5 pl-3 text-[13px] leading-snug transition-colors",
                current === s.id ? "border-accent font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              <span className="min-w-0 flex-1">{s.title}</span>
              {seen.includes(s.id) ? <Check size={13} className="mt-0.5 shrink-0 text-good" /> : null}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function LessonFooter({ lesson }: { lesson: LessonInfo }) {
  const progress = useProgress();
  const done = !!progress.lessons[lesson.id]?.done;
  const next = nextLesson(lesson.id);
  const quizRuns = Object.values(progress.sessions).filter((s) => s.kind === "quiz" && s.ref === lesson.id);
  const best = quizRuns.length ? Math.max(...quizRuns.map((s) => s.correct / s.total)) : null;
  return (
    <section className="mt-14 rounded-[var(--radius-lg)] border border-line bg-surface px-6 py-6">
      {lesson.quiz.length ? (
        <>
          <p className="text-[13px] text-ink-3">Lesson quiz</p>
          <h2 className="mt-1 text-[20px] font-semibold text-ink">Show what you know</h2>
          <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-ink-2">
            {lesson.quiz.length} questions across every skill in this lesson, timed at test pace. No hints until you submit. Aim for 80 percent; below that, reread the sections behind your misses.
          </p>
          {best !== null ? <p className="tnum mt-2 text-[13.5px] text-ink-2">Best so far: {Math.round(best * 100)}%</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton href={`/learn/${lesson.unit}/${lesson.id}/quiz`} variant="primary">
              {quizRuns.length ? "Retake the quiz" : "Start the quiz"}
            </LinkButton>
            {next ? (
              <LinkButton href={`/learn/${next.unit}/${next.id}`} variant="ghost">
                Next lesson: {next.code}
              </LinkButton>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <h2 className="text-[20px] font-semibold text-ink">{done ? "Lesson complete" : "Finished reading?"}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {!done ? (
              <Button variant="primary" onClick={() => completeLesson(lesson.id)}>
                Mark complete
              </Button>
            ) : null}
            {next ? (
              <LinkButton href={`/learn/${next.unit}/${next.id}`} variant={done ? "primary" : "ghost"}>
                Next: {next.code} {getLesson(next.id)?.title}
              </LinkButton>
            ) : null}
          </div>
        </>
      )}
      {done && lesson.quiz.length ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] text-good">
          <Check size={15} /> Completed
        </p>
      ) : null}
      {!lesson.quiz.length ? null : (
        <p className="mt-4 text-[12.5px] text-ink-3">
          Prefer to drill first? <Link href={`/practice/lesson/${lesson.id}`} className="underline underline-offset-4 hover:text-ink">Practice this lesson&apos;s skills</Link> with instant feedback.
        </p>
      )}
    </section>
  );
}
