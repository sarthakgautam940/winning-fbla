"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./gate.module.css";

const CODE_LENGTH = 7;
const HELLO = "Hello there.";
const WELCOME = "Welcome Ashwath!";

type Status = "idle" | "checking" | "wrong" | "right";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

export function Gate() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // Each sequence captures a run id; bumping the id cancels every older run,
  // so a re-run (React's development double effect, or unmount) never leaves
  // two animations fighting over the same state.
  const run = useRef(0);
  const liveFor = (id: number) => () => run.current === id;

  const [lit, setLit] = useState(false);
  const [headline, setHeadline] = useState({ full: HELLO, shown: "", caret: false, out: false });
  const [boxesIn, setBoxesIn] = useState(false);
  const [settled, setSettled] = useState(false);
  const [promptIn, setPromptIn] = useState(false);
  const [digits, setDigits] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [collapse, setCollapse] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const typeOut = useCallback(async (text: string, speed: number, live: () => boolean) => {
    setHeadline({ full: text, shown: "", caret: true, out: false });
    for (let i = 1; i <= text.length; i++) {
      if (!live()) return;
      setHeadline((h) => ({ ...h, shown: text.slice(0, i) }));
      const ch = text[i - 1];
      await sleep(speed + Math.round((Math.random() - 0.5) * speed * 0.6) + (ch === " " ? speed * 0.4 : 0));
    }
  }, []);

  // Opening sequence.
  useEffect(() => {
    const live = liveFor(++run.current);
    const reduced = prefersReducedMotion();
    (async () => {
      if (reduced) {
        setLit(true);
        setHeadline({ full: HELLO, shown: HELLO, caret: false, out: false });
        setBoxesIn(true);
        setSettled(true);
        setPromptIn(true);
        inputRef.current?.focus({ preventScroll: true });
        return;
      }
      await sleep(250);
      if (!live()) return;
      setLit(true);
      await sleep(1000);
      if (!live()) return;
      await typeOut(HELLO, 82, live);
      if (!live()) return;
      await sleep(520);
      if (!live()) return;
      setHeadline((h) => ({ ...h, caret: false }));
      await sleep(260);
      if (!live()) return;
      setBoxesIn(true);
      await sleep(CODE_LENGTH * 75 + 420);
      if (!live()) return;
      setSettled(true);
      setPromptIn(true);
      inputRef.current?.focus({ preventScroll: true });
    })();
    return () => {
      run.current += 1;
    };
  }, [typeOut]);

  const fail = useCallback(async (text: string) => {
    const live = liveFor(run.current);
    setStatus("wrong");
    setMessage(text);
    if ("vibrate" in navigator) navigator.vibrate?.(35);
    await sleep(460);
    if (!live()) return;
    setDigits("");
    await sleep(2100);
    if (!live()) return;
    setStatus((s) => (s === "wrong" ? "idle" : s));
    setMessage(null);
  }, []);

  const succeed = useCallback(async () => {
    const live = liveFor(run.current);
    const reduced = prefersReducedMotion();
    setStatus("right");
    setMessage(null);
    await sleep(reduced ? 0 : 420);
    setCollapse(true);
    setPromptIn(false);
    setHeadline((h) => ({ ...h, out: true }));
    await sleep(reduced ? 0 : 620);
    if (!live()) return;
    if (reduced) setHeadline({ full: WELCOME, shown: WELCOME, caret: false, out: false });
    else await typeOut(WELCOME, 64, live);
    await sleep(reduced ? 300 : 1000);
    if (!live()) return;
    setHeadline((h) => ({ ...h, caret: false }));
    setLeaving(true);
    try {
      sessionStorage.setItem("wf-just-unlocked", "1");
    } catch {
      // storage can be unavailable; the welcome fade is optional
    }
    await sleep(reduced ? 50 : 720);
    router.replace(safeNext());
  }, [router, typeOut]);

  const submit = useCallback(
    async (code: string) => {
      setStatus("checking");
      try {
        const res = await fetch("/api/unlock", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (res.ok) {
          await succeed();
        } else if (res.status === 429) {
          await fail("Too many tries. Wait a few minutes, then try again.");
        } else {
          await fail("That code isn't right.");
        }
      } catch {
        await fail("Can't reach the server. Check your connection.");
      }
    },
    [fail, succeed],
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === "checking" || status === "right") return;
    const value = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (status === "wrong") {
      setStatus("idle");
      setMessage(null);
    }
    setDigits(value);
    if (value.length === CODE_LENGTH) void submit(value);
  };

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });

  const center = (CODE_LENGTH - 1) / 2;
  const ready = promptIn && status !== "right";
  const boxClass = [
    styles.boxes,
    boxesIn ? styles.boxesIn : "",
    settled ? styles.settled : "",
    ready && status === "idle" && digits.length === 0 ? styles.breathing : "",
    status === "wrong" ? styles.wrong : "",
    status === "checking" ? styles.checking : "",
    status === "right" ? styles.right : "",
    collapse ? styles.collapse : "",
  ].join(" ");

  return (
    <main className={`${styles.root} ${lit ? styles.lit : ""} ${leaving ? styles.leaving : ""}`} onClick={focusInput}>
      <div className={styles.light} aria-hidden />
      <div className={styles.stack}>
        <h1 className={`${styles.headline} ${headline.out ? styles.headlineOut : ""}`} aria-label={headline.full}>
          <span aria-hidden>{headline.shown}</span>
          {headline.caret ? <span className={styles.caret} aria-hidden /> : null}
        </h1>

        <div className={boxClass} aria-hidden>
          {Array.from({ length: CODE_LENGTH }, (_, i) => {
            const filled = i < digits.length;
            const active = ready && status === "idle" && i === digits.length;
            return (
              <div
                key={i}
                className={`${styles.box} ${filled ? styles.filled : ""} ${active ? styles.active : ""}`}
                style={{ "--i": i, "--d": Math.abs(i - center) } as React.CSSProperties}
              >
                {filled ? (
                  <span key={`${i}-${digits[i]}`} className={styles.digit}>
                    {digits[i]}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className={`${styles.prompt} ${promptIn ? styles.promptIn : ""} ${message ? styles.promptError : ""}`} aria-live="polite">
          {message ?? (status === "checking" ? "Checking..." : "Enter code to continue.")}
        </p>

        <input
          ref={inputRef}
          className={styles.input}
          value={digits}
          onChange={onChange}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={CODE_LENGTH}
          aria-label="Access code"
          disabled={!boxesIn || status === "right"}
          spellCheck={false}
        />
      </div>
      <div className={styles.leave} aria-hidden />
    </main>
  );
}
