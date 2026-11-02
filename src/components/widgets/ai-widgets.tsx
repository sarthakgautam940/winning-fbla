"use client";

import { useState } from "react";
import { cn } from "@/components/ui/primitives";
import { round } from "@/lib/stats";
import { Slider, Stat, WidgetFrame } from "./frame";

// ------------------------------------------------------------ temperature

const TOKENS = [
  { t: "mat", logit: 4.0 },
  { t: "floor", logit: 3.2 },
  { t: "sofa", logit: 2.6 },
  { t: "roof", logit: 1.4 },
  { t: "moon", logit: 0.2 },
];

export function TemperatureExplorer() {
  const [temp, setTemp] = useState(1);
  const scaled = TOKENS.map((x) => x.logit / temp);
  const max = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);
  const top = Math.max(...probs);
  return (
    <WidgetFrame title="Temperature reshapes the next-token odds" hint={'Prompt: "The cat sat on the"'}>
      <div className="flex flex-col gap-2.5">
        {TOKENS.map((x, i) => (
          <div key={x.t} className="grid grid-cols-[64px_1fr_64px] items-center gap-3">
            <span className="font-mono text-[13.5px] text-ink">{x.t}</span>
            <div className="h-3 overflow-hidden rounded-full bg-surface-3">
              <div className={cn("h-full rounded-full transition-[width] duration-300", probs[i] === top ? "bg-accent" : "bg-[var(--series-1)] opacity-60")} style={{ width: `${probs[i] * 100}%` }} />
            </div>
            <span className="tnum text-right text-[13px] text-ink-2">{round(probs[i] * 100, 1)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Slider label="Temperature" value={temp} min={0.1} max={2} step={0.05} onChange={setTemp} format={(v) => v.toFixed(2)} />
      </div>
      <p className="mt-3 text-[13.5px] text-ink-2">
        {temp < 0.4
          ? "Low temperature sharpens the distribution: the model almost always picks the top token, so outputs are focused and repeatable."
          : temp > 1.3
            ? "High temperature flattens the distribution: unlikely tokens get real chances, so outputs are more varied and more error-prone."
            : "Around 1, the model samples from its learned probabilities as they are."}
      </p>
      <p className="mt-2 text-[12.5px] text-ink-3">Probabilities come from softmax(logit / temperature). The ranking never changes; only how peaked it is.</p>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ bayes net

// Cloudy -> Sprinkler, Cloudy -> Rain, Sprinkler -> WetGrass, Rain -> WetGrass.
const P_C = 0.5;
const P_S_given_C: Record<string, number> = { T: 0.1, F: 0.5 };
const P_R_given_C: Record<string, number> = { T: 0.8, F: 0.2 };
const P_W_given_SR: Record<string, number> = { TT: 0.99, TF: 0.9, FT: 0.9, FF: 0.0 };

type TF = "T" | "F";

function Toggle({ label, value, onChange }: { label: string; value: TF; onChange: (v: TF) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2">
      <span className="text-[13.5px] text-ink">{label}</span>
      <div className="inline-flex rounded-[8px] border border-line bg-surface-2 p-0.5">
        {(["T", "F"] as TF[]).map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={value === v} className={cn("rounded-[6px] px-2.5 py-0.5 text-[12.5px] font-semibold", value === v ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-3")}>
            {v === "T" ? "true" : "false"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BayesNetCalculator() {
  const [c, setC] = useState<TF>("T");
  const [s, setS] = useState<TF>("F");
  const [r, setR] = useState<TF>("T");
  const [w, setW] = useState<TF>("T");
  const pc = c === "T" ? P_C : 1 - P_C;
  const ps = s === "T" ? P_S_given_C[c] : 1 - P_S_given_C[c];
  const pr = r === "T" ? P_R_given_C[c] : 1 - P_R_given_C[c];
  const pw = w === "T" ? P_W_given_SR[s + r] : 1 - P_W_given_SR[s + r];
  const joint = pc * ps * pr * pw;
  const name = (v: TF, n: string) => (v === "T" ? n : `¬${n}`);
  return (
    <WidgetFrame title="Joint probability from a Bayesian network" hint="Cloudy, Sprinkler, Rain, WetGrass">
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <svg viewBox="0 0 300 200" className="w-full" role="img" aria-label="Bayesian network diagram">
            <defs>
              <marker id="bn-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0,0L10,5L0,10z" fill="var(--ink-2)" />
              </marker>
            </defs>
            {[
              [150, 38, 70, 100],
              [150, 38, 230, 100],
              [70, 118, 145, 166],
              [230, 118, 155, 166],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-2)" strokeWidth={1.5} markerEnd="url(#bn-arrow)" />
            ))}
            {[
              { x: 150, y: 24, t: "Cloudy" },
              { x: 70, y: 112, t: "Sprinkler" },
              { x: 230, y: 112, t: "Rain" },
              { x: 150, y: 180, t: "WetGrass" },
            ].map((n) => (
              <g key={n.t}>
                <rect x={n.x - 44} y={n.y - 15} width={88} height={30} rx={15} fill="var(--surface)" stroke="var(--series-1)" strokeWidth={1.6} />
                <text x={n.x} y={n.y + 4.5} textAnchor="middle" fontSize={12.5} fontWeight={500} fill="var(--ink)">
                  {n.t}
                </text>
              </g>
            ))}
          </svg>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-ink-2">
            <p className="rounded-[8px] bg-surface-2 px-2.5 py-1.5">P(C) = 0.5</p>
            <p className="rounded-[8px] bg-surface-2 px-2.5 py-1.5">P(S | C) = 0.1, P(S | ¬C) = 0.5</p>
            <p className="rounded-[8px] bg-surface-2 px-2.5 py-1.5">P(R | C) = 0.8, P(R | ¬C) = 0.2</p>
            <p className="rounded-[8px] bg-surface-2 px-2.5 py-1.5">P(W | S,R): 0.99, 0.9, 0.9, 0</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Toggle label="Cloudy" value={c} onChange={setC} />
          <Toggle label="Sprinkler" value={s} onChange={setS} />
          <Toggle label="Rain" value={r} onChange={setR} />
          <Toggle label="WetGrass" value={w} onChange={setW} />
          <div className="tnum mt-2 rounded-[10px] bg-surface-2 px-3.5 py-3 text-[13.5px] leading-relaxed text-ink">
            P({name(c, "C")}, {name(s, "S")}, {name(r, "R")}, {name(w, "W")})
            <br />= P({name(c, "C")}) × P({name(s, "S")} | {name(c, "C")}) × P({name(r, "R")} | {name(c, "C")}) × P({name(w, "W")} | {name(s, "S")}, {name(r, "R")})
            <br />= {round(pc, 2)} × {round(ps, 2)} × {round(pr, 2)} × {round(pw, 2)}
            <br />= <span className="font-semibold">{round(joint, 5)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Numbers in the network's tables" value="9" sub="1 + 2 + 2 + 4" />
            <Stat label="Numbers in a full joint table" value="15" sub="2⁴ − 1" />
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
}
