"use client";

import { useEffect, useRef, useState } from "react";

// The Desmos graphing calculator, the same one built into the digital SAT. It loads on first
// open and keeps its expressions for the whole session, as it does on test day.

declare global {
  interface Window {
    Desmos?: { GraphingCalculator: (el: HTMLElement, opts?: Record<string, unknown>) => DesmosCalc };
  }
}
type DesmosCalc = { destroy: () => void; resize: () => void; setBlank: () => void };

const SRC = "https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Desmos) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("Desmos did not load"));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export function DesmosPanel({ visible }: { visible: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const calc = useRef<DesmosCalc | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible || calc.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !host.current || !window.Desmos) return;
        calc.current = window.Desmos.GraphingCalculator(host.current, {
          keypad: true,
          expressionsCollapsed: false,
          settingsMenu: true,
          zoomButtons: true,
          border: false,
        });
      })
      .catch(() => setError(true));
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (visible) calc.current?.resize();
  }, [visible]);

  useEffect(() => () => calc.current?.destroy(), []);

  return (
    <div className="desmos" style={{ display: visible ? "flex" : "none" }} data-noadvance>
      {error ? (
        <p className="muted" style={{ padding: 20 }}>
          The calculator needs an internet connection to load. You can also open{" "}
          <a href="https://www.desmos.com/calculator" target="_blank" rel="noreferrer">
            desmos.com/calculator
          </a>
          .
        </p>
      ) : (
        <div ref={host} style={{ flex: 1, minHeight: 0 }} />
      )}
    </div>
  );
}
