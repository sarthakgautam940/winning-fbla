"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Moon, Sun, Upload } from "lucide-react";
import { catalog } from "@/lib/catalog";
import { exportProgress, importProgress, resetProgress, updateSettings, useProgress, useReady } from "@/lib/progress/store";
import { Button, Card, cn, PageHeader } from "@/components/ui/primitives";

export function SettingsView() {
  const p = useProgress();
  const ready = useReady();
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `winning-fbla-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const res = importProgress(await f.text());
    setMessage(res.message);
    if (file.current) file.current.value = "";
  };

  const lock = async () => {
    await fetch("/api/lock", { method: "POST" });
    router.replace("/");
  };

  const counts = {
    lessons: Object.keys(catalog.lessons).length,
    questions: catalog.questions.length + Object.keys(catalog.testMeta).length,
    cards: catalog.flashcardCount,
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader title="Settings" />

      <section>
        <h2 className="text-[16px] font-semibold text-ink">Appearance</h2>
        <div className="mt-3 inline-flex rounded-[12px] border border-line bg-surface-2 p-1" role="radiogroup" aria-label="Theme">
          {(
            [
              ["light", "Light", Sun],
              ["dark", "Dark", Moon],
            ] as const
          ).map(([v, label, Icon]) => (
            <button key={v} type="button" role="radio" aria-checked={ready && (p.settings.theme === "dark" ? "dark" : "light") === v} onClick={() => updateSettings({ theme: v })} className={cn("flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[14px] font-medium", ready && (p.settings.theme === "dark" ? "dark" : "light") === v ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-3 hover:text-ink")}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[16px] font-semibold text-ink">Your data</h2>
        <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-ink-2">Progress is saved in this browser. To move it to another device, download it here and import it there; imports merge with what is already on that device, so nothing is lost.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={download}>
            <Download size={15} />
            Download progress
          </Button>
          <Button onClick={() => file.current?.click()}>
            <Upload size={15} />
            Import progress
          </Button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} aria-label="Progress file to import" />
        </div>
        {message ? <p className="mt-3 text-[13.5px] text-ink-2">{message}</p> : null}
        <Card className="mt-6 px-5 py-4">
          <p className="text-[14.5px] font-medium text-ink">Reset progress</p>
          <p className="mt-1 text-[13.5px] text-ink-2">Clears every answer, test result, flashcard review and lesson mark on this device. Your competition dates stay.</p>
          {confirmReset ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[13.5px] text-bad">This cannot be undone.</span>
              <Button variant="danger" size="sm" onClick={() => (resetProgress(), setConfirmReset(false), setMessage("Progress was reset."))}>
                Yes, reset everything
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmReset(true)}>
              Reset progress
            </Button>
          )}
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-[16px] font-semibold text-ink">This device</h2>
        <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-ink-2">This browser stays unlocked so you never have to re-enter the code. Lock it if you are on a shared computer.</p>
        <Button className="mt-3" onClick={lock}>
          <LogOut size={15} />
          Lock this device
        </Button>
      </section>

      <section className="mt-10 border-t border-line pt-6 text-[13px] leading-relaxed text-ink-3">
        <p>
          Winning FBLA, built for Ashwath for the 2026-2027 FBLA Data Science &amp; AI event: {counts.lessons} lessons, {counts.questions.toLocaleString()} questions, {counts.cards} flashcards. An independent study tool, not affiliated with or endorsed by FBLA.
        </p>
      </section>
    </div>
  );
}
