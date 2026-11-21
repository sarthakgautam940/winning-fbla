"use client";

import { useRef, useState } from "react";
import { DEFAULT_SETTINGS, replaceState, resetState, update, useHydrated, useStore, type State } from "@/lib/store";

export function SettingsView() {
  const state = useStore();
  const ready = useHydrated();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  if (!ready) return <div style={{ minHeight: 400 }} />;
  const s = state.settings;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sat-bank-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text()) as State;
      if (parsed.v !== 1 || typeof parsed.q !== "object" || !Array.isArray(parsed.log)) throw new Error("not a progress file");
      replaceState(parsed);
      setMsg(`Imported ${Object.keys(parsed.q).length} questions of progress and ${parsed.log.length} answers.`);
    } catch {
      setMsg("That file isn't a SAT Bank progress file.");
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 className="title">Settings</h1>
      <p className="subtitle">Dates drive the daily targets. Progress is saved in this browser; export a backup now and then.</p>

      <section className="section">
        <h2 className="h2">Schedule</h2>
        <div className="form-row">
          <label htmlFor="test">Test date</label>
          <input id="test" type="date" className="field" value={s.testDate} onChange={(e) => e.target.value && update((d) => void (d.settings.testDate = e.target.value))} />
        </div>
        <div className="form-row">
          <label htmlFor="learn">
            Finish mastering by
            <span className="muted">After this day come two hardening days and a light review day.</span>
          </label>
          <input id="learn" type="date" className="field" value={s.learnUntil} onChange={(e) => e.target.value && update((d) => void (d.settings.learnUntil = e.target.value))} />
        </div>
        <div className="form-row">
          <label htmlFor="goal">
            Daily target
            <span className="muted">Leave empty to let the plan set it from what is left.</span>
          </label>
          <input
            id="goal"
            type="number"
            min={1}
            className="field"
            placeholder="Automatic"
            value={s.dailyGoal ?? ""}
            onChange={(e) => update((d) => void (d.settings.dailyGoal = e.target.value ? Math.max(1, Number(e.target.value)) : null))}
          />
        </div>
        <div className="form-row">
          <label htmlFor="timer">Show the timer during practice</label>
          <input id="timer" type="checkbox" className="check" checked={!s.hideTimer} onChange={(e) => update((d) => void (d.settings.hideTimer = !e.target.checked))} />
        </div>
        {s.testDate !== DEFAULT_SETTINGS.testDate || s.learnUntil !== DEFAULT_SETTINGS.learnUntil ? (
          <button className="link" onClick={() => update((d) => void Object.assign(d.settings, { testDate: DEFAULT_SETTINGS.testDate, learnUntil: DEFAULT_SETTINGS.learnUntil }))}>
            Reset to December 5 and December 1
          </button>
        ) : null}
      </section>

      <section className="section">
        <h2 className="h2">Backup</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {Object.keys(state.q).length} questions with progress, {state.log.length.toLocaleString()} answers saved.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={exportData}>
            Export progress
          </button>
          <button className="btn btn-ghost" onClick={() => file.current?.click()}>
            Import progress
          </button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
        {msg ? <p style={{ marginTop: 12 }}>{msg}</p> : null}
      </section>

      <section className="section">
        <h2 className="h2">Start over</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Clears every answer and all mastery in this browser. Export first if you might want it back.
        </p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm("Erase all progress in this browser?")) {
              resetState();
              setMsg("Progress erased.");
            }
          }}
        >
          Erase all progress
        </button>
      </section>
    </div>
  );
}
