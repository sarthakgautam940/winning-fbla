"use client";

import { useMemo, useState } from "react";
import { Button, cn } from "@/components/ui/primitives";
import { round } from "@/lib/stats";
import { Segmented, Slider, Stat, WidgetFrame } from "./frame";

const COLORS = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

// ------------------------------------------------------------ k-means stepper

type P = [number, number];
const KM_POINTS: P[] = [
  [1, 1.5], [1.8, 2.6], [2.5, 1.2], [2.2, 2.2], [1.2, 2.9], [3, 2],
  [7.2, 2.4], [8.5, 3.5], [7.8, 3.9], [8.9, 2.2], [7, 3.2], [9.2, 3],
  [4.2, 7.5], [5.5, 8.6], [5, 7.2], [6, 7.9], [4.6, 8.8], [5.8, 7],
];
const KM_START: P[] = [
  [1, 8],
  [2, 7.5],
  [9, 8],
];

const dist2 = (a: P, b: P) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

export function KMeansStepper() {
  const [centroids, setCentroids] = useState<P[]>(KM_START);
  const [assign, setAssign] = useState<number[] | null>(null);
  const [phase, setPhase] = useState<"assign" | "update">("assign");
  const [iter, setIter] = useState(0);
  const [converged, setConverged] = useState(false);

  const step = () => {
    if (phase === "assign") {
      const next = KM_POINTS.map((p) => {
        let best = 0;
        centroids.forEach((c, k) => {
          if (dist2(p, c) < dist2(p, centroids[best])) best = k;
        });
        return best;
      });
      if (assign && next.every((v, i) => v === assign[i])) setConverged(true);
      setAssign(next);
      setPhase("update");
    } else if (assign) {
      setCentroids(
        centroids.map((c, k) => {
          const members = KM_POINTS.filter((_, i) => assign[i] === k);
          if (!members.length) return c;
          return [members.reduce((s, p) => s + p[0], 0) / members.length, members.reduce((s, p) => s + p[1], 0) / members.length];
        }),
      );
      setIter((n) => n + 1);
      setPhase("assign");
    }
  };
  const reset = () => {
    setCentroids(KM_START);
    setAssign(null);
    setPhase("assign");
    setIter(0);
    setConverged(false);
  };
  const wcss = assign ? KM_POINTS.reduce((s, p, i) => s + dist2(p, centroids[assign[i]]), 0) : null;
  const X = (v: number) => 30 + (v / 10) * 460;
  const Y = (v: number) => 250 - (v / 10) * 230;
  return (
    <WidgetFrame title="k-means, one step at a time" hint="k = 3">
      <svg viewBox="0 0 520 270" className="w-full" role="img" aria-label="k-means clustering plot">
        {[0, 2, 4, 6, 8, 10].map((t) => (
          <g key={t}>
            <line x1={X(0)} x2={X(10)} y1={Y(t)} y2={Y(t)} stroke="var(--grid)" />
            <text x={X(0) - 8} y={Y(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)">
              {t}
            </text>
          </g>
        ))}
        {assign
          ? KM_POINTS.map((p, i) => <line key={`l${i}`} x1={X(p[0])} y1={Y(p[1])} x2={X(centroids[assign[i]][0])} y2={Y(centroids[assign[i]][1])} stroke={COLORS[assign[i]]} strokeOpacity={0.25} />)
          : null}
        {KM_POINTS.map((p, i) => (
          <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={5.5} fill={assign ? COLORS[assign[i]] : "var(--ink-3)"} stroke="var(--surface)" strokeWidth={2} />
        ))}
        {centroids.map((c, k) => (
          <g key={k} transform={`translate(${X(c[0])} ${Y(c[1])})`} style={{ transition: "transform 500ms ease" }}>
            <path d="M-8,-8L8,8M8,-8L-8,8" stroke="var(--surface)" strokeWidth={7} strokeLinecap="round" />
            <path d="M-8,-8L8,8M8,-8L-8,8" stroke={COLORS[k]} strokeWidth={3} strokeLinecap="round" />
          </g>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-ink-2">
          {converged
            ? "Converged: assignments stopped changing."
            : phase === "assign"
              ? "Next: assign every point to its nearest centroid."
              : "Next: move each centroid to the mean of its points."}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={step} disabled={converged}>
            {phase === "assign" ? "Assign points" : "Move centroids"}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Iterations completed" value={iter} />
        <Stat label="Within-cluster sum of squares" value={wcss === null ? "assign first" : round(wcss, 2)} />
      </div>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ threshold explorer

const SCORES: { s: number; pos: boolean }[] = [
  ...[0.95, 0.88, 0.81, 0.74, 0.66, 0.58, 0.41, 0.29].map((s) => ({ s, pos: true })),
  ...[0.86, 0.69, 0.55, 0.47, 0.38, 0.33, 0.26, 0.21, 0.15, 0.12, 0.08, 0.04].map((s) => ({ s, pos: false })),
];

export function ThresholdExplorer() {
  const [t, setT] = useState(0.5);
  const tp = SCORES.filter((x) => x.pos && x.s >= t).length;
  const fn = SCORES.filter((x) => x.pos && x.s < t).length;
  const fp = SCORES.filter((x) => !x.pos && x.s >= t).length;
  const tn = SCORES.filter((x) => !x.pos && x.s < t).length;
  const precision = tp + fp ? tp / (tp + fp) : NaN;
  const recall = tp / (tp + fn);
  const f1 = precision + recall && Number.isFinite(precision) ? (2 * precision * recall) / (precision + recall) : NaN;
  const X = (v: number) => 20 + v * 480;
  return (
    <WidgetFrame title="Moving the decision threshold" hint="20 emails scored by a spam model">
      <svg viewBox="0 0 520 110" className="w-full" role="img" aria-label="Scores with threshold">
        <rect x={X(t)} y={10} width={X(1) - X(t)} height={76} fill="var(--accent-soft)" />
        <text x={X(1) - 4} y={22} textAnchor="end" fontSize={11} fill="var(--ink-3)">
          predicted spam
        </text>
        <line x1={X(0)} x2={X(1)} y1={86} y2={86} stroke="var(--axis)" />
        {SCORES.map((x, i) => (
          <circle key={i} cx={X(x.s)} cy={x.pos ? 44 : 68} r={6} fill={x.pos ? "var(--series-2)" : "var(--series-1)"} stroke="var(--surface)" strokeWidth={2} />
        ))}
        <line x1={X(t)} x2={X(t)} y1={6} y2={90} stroke="var(--ink)" strokeWidth={2} />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text key={v} x={X(v)} y={104} textAnchor="middle" fontSize={11} fill="var(--ink-3)">
            {v}
          </text>
        ))}
      </svg>
      <p className="mt-1 flex gap-4 text-[12px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--series-2)]" /> actually spam (top row)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--series-1)]" /> actually not spam
        </span>
      </p>
      <div className="mt-3">
        <Slider label="Threshold (flag as spam if score ≥ threshold)" value={t} min={0.02} max={0.98} step={0.01} onChange={setT} format={(v) => v.toFixed(2)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="TP / FP" value={`${tp} / ${fp}`} />
        <Stat label="FN / TN" value={`${fn} / ${tn}`} />
        <Stat label="Precision" value={Number.isFinite(precision) ? round(precision, 3) : "undefined"} strong />
        <Stat label="Recall" value={round(recall, 3)} strong />
        <Stat label="Accuracy" value={round((tp + tn) / SCORES.length, 3)} />
        <Stat label="F1" value={Number.isFinite(f1) ? round(f1, 3) : "undefined"} />
      </div>
      <p className="mt-3 text-[13px] text-ink-2">Raise the threshold and precision tends to rise while recall falls. Lower it and the reverse happens.</p>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ overfitting

const OF_X = [0.2, 0.6, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.8, 4.2, 4.6, 5.0, 5.4];
const OF_NOISE = [0.28, -0.31, 0.12, -0.18, 0.35, -0.08, 0.22, -0.34, 0.05, 0.3, -0.25, 0.14, -0.2, 0.27];
const truth = (x: number) => Math.sin(1.2 * x) + 0.3 * x;
const OF_POINTS = OF_X.map((x, i) => ({ x, y: truth(x) + OF_NOISE[i], test: i % 4 === 1 }));

function fitPoly(xs: number[], ys: number[], degree: number): number[] {
  const n = degree + 1;
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) A[r][c] = xs.reduce((s, x) => s + (x / 6) ** (r + c), 0);
    A[r][n] = xs.reduce((s, x, i) => s + ys[i] * (x / 6) ** r, 0);
  }
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    [A[col], A[piv]] = [A[piv], A[col]];
    const d = A[col][col] || 1e-12;
    for (let c = col; c <= n; c++) A[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col];
      for (let c = col; c <= n; c++) A[r][c] -= f * A[col][c];
    }
  }
  return A.map((row) => row[n]);
}

const evalPoly = (coef: number[], x: number) => coef.reduce((s, c, k) => s + c * (x / 6) ** k, 0);

const OF_TRAIN = OF_POINTS.filter((p) => !p.test);
const OF_TEST = OF_POINTS.filter((p) => p.test);
const OF_FITS = Array.from({ length: 9 }, (_, i) => {
  const coef = fitPoly(OF_TRAIN.map((p) => p.x), OF_TRAIN.map((p) => p.y), i + 1);
  const mse = (pts: typeof OF_TRAIN) => pts.reduce((s, p) => s + (evalPoly(coef, p.x) - p.y) ** 2, 0) / pts.length;
  return { coef, trainMse: mse(OF_TRAIN), testMse: mse(OF_TEST) };
});

export function OverfitExplorer() {
  const [degree, setDegree] = useState(3);
  const cur = OF_FITS[degree - 1];
  const X = (v: number) => 30 + (v / 5.6) * 470;
  const Y = (v: number) => 120 - v * 38;
  const path: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = 0.1 + (5.4 * i) / 200;
    const y = Math.max(-1.6, Math.min(3.6, evalPoly(cur.coef, x)));
    path.push(`${i ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`);
  }
  const label = degree <= 1 ? "Underfitting: too simple to follow the curve." : degree >= 7 ? "Overfitting: it threads the training points and misses new ones." : "A reasonable fit: low error on data it has not seen.";
  return (
    <WidgetFrame title="Model complexity and overfitting" hint="Polynomial fit, 10 training points">
      <svg viewBox="0 0 520 240" className="w-full" role="img" aria-label={`Polynomial of degree ${degree}`}>
        <line x1={X(0)} x2={X(5.6)} y1={Y(0)} y2={Y(0)} stroke="var(--grid)" />
        <path d={path.join("")} fill="none" stroke="var(--series-1)" strokeWidth={2.2} />
        {OF_POINTS.map((p, i) => (
          <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={5.5} fill={p.test ? "var(--surface)" : "var(--series-2)"} stroke={p.test ? "var(--ink)" : "var(--surface)"} strokeWidth={2} />
        ))}
      </svg>
      <p className="mt-1 flex gap-4 text-[12px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--series-2)]" /> training point
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-ink" /> test point
        </span>
      </p>
      <div className="mt-3">
        <Slider label="Polynomial degree (model complexity)" value={degree} min={1} max={9} step={1} onChange={setDegree} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Training error (MSE)" value={round(cur.trainMse, 3)} />
        <Stat label="Test error (MSE)" value={round(cur.testMse, 3)} strong />
      </div>
      <p className="mt-3 text-[13.5px] text-ink-2">{label}</p>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ gradient descent

export function GradientDescent() {
  const [lr, setLr] = useState(0.1);
  const [start, setStart] = useState(-2);
  const [steps, setSteps] = useState(0);
  const loss = (w: number) => (w - 3) ** 2 + 1;
  const path = useMemo(() => {
    const out = [start];
    for (let i = 0; i < steps; i++) out.push(out[i] - lr * 2 * (out[i] - 3));
    return out;
  }, [lr, start, steps]);
  const w = path[path.length - 1];
  const diverging = Math.abs(w - 3) > 12;
  const X = (v: number) => 30 + ((v + 4) / 14) * 470;
  const Y = (v: number) => 220 - Math.min(v, 60) * 3.3;
  const curve: string[] = [];
  for (let i = 0; i <= 140; i++) {
    const v = -4 + (14 * i) / 140;
    curve.push(`${i ? "L" : "M"}${X(v).toFixed(1)},${Y(loss(v)).toFixed(1)}`);
  }
  const inView = (v: number) => v >= -4 && v <= 10;
  return (
    <WidgetFrame title="Gradient descent on a simple loss" hint="Loss = (w − 3)² + 1, minimum at w = 3">
      <svg viewBox="0 0 520 240" className="w-full" role="img" aria-label="Gradient descent path">
        <path d={curve.join("")} fill="none" stroke="var(--series-1)" strokeWidth={2} />
        <line x1={30} x2={500} y1={Y(0)} y2={Y(0)} stroke="var(--axis)" />
        {path.slice(1).map((v, i) =>
          inView(v) && inView(path[i]) ? <line key={`s${i}`} x1={X(path[i])} y1={Y(loss(path[i]))} x2={X(v)} y2={Y(loss(v))} stroke="var(--series-2)" strokeWidth={1.5} /> : null,
        )}
        {path.map((v, i) => (inView(v) ? <circle key={i} cx={X(v)} cy={Y(loss(v))} r={i === path.length - 1 ? 6 : 4} fill="var(--series-2)" stroke="var(--surface)" strokeWidth={2} /> : null))}
        {[-4, -2, 0, 2, 4, 6, 8, 10].map((t) => (
          <text key={t} x={X(t)} y={236} textAnchor="middle" fontSize={11} fill="var(--ink-3)">
            {t}
          </text>
        ))}
      </svg>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Slider label="Learning rate" value={lr} min={0.01} max={1.1} step={0.01} onChange={(v) => (setLr(v), setSteps(0))} format={(v) => v.toFixed(2)} />
        <Slider label="Starting w" value={start} min={-4} max={10} step={0.5} onChange={(v) => (setStart(v), setSteps(0))} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => setSteps((s) => s + 1)} disabled={diverging}>
          Take a step
        </Button>
        <Button size="sm" onClick={() => setSteps((s) => s + 10)} disabled={diverging}>
          Take 10 steps
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSteps(0)}>
          Reset
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Steps" value={steps} />
        <Stat label="Current w" value={diverging ? "diverged" : round(w, 4)} strong />
        <Stat label="Loss" value={diverging ? "growing" : round(loss(w), 4)} />
      </div>
      <p className={cn("mt-3 text-[13.5px]", lr > 1 ? "text-bad" : "text-ink-2")}>
        {lr > 1
          ? "This learning rate overshoots more each step, so the loss grows: the run diverges."
          : lr > 0.5
            ? "Large steps overshoot the minimum and bounce from side to side before settling."
            : lr < 0.05
              ? "Tiny steps are safe but slow: it takes many steps to reach the minimum."
              : "Each step moves downhill, opposite the gradient, by learning rate times slope."}
      </p>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ split calculator

const gini = (a: number, b: number) => {
  const n = a + b;
  if (!n) return 0;
  return 1 - (a / n) ** 2 - (b / n) ** 2;
};
const entropy = (a: number, b: number) => {
  const n = a + b;
  if (!n) return 0;
  return [a, b].reduce((s, c) => (c ? s - (c / n) * Math.log2(c / n) : s), 0);
};

function CountInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[13px] text-ink-2">
      {label}
      <input type="number" min={0} max={999} value={value} onChange={(e) => onChange(Math.max(0, Math.min(999, Math.round(Number(e.target.value) || 0))))} className="tnum h-8 w-16 rounded-[8px] border border-line bg-surface px-2 text-right text-ink outline-none focus:border-accent" />
    </label>
  );
}

export function SplitCalculator() {
  const [l, setL] = useState({ yes: 8, no: 2 });
  const [r, setR] = useState({ yes: 2, no: 8 });
  const p = { yes: l.yes + r.yes, no: l.no + r.no };
  const nL = l.yes + l.no;
  const nR = r.yes + r.no;
  const n = nL + nR || 1;
  const gP = gini(p.yes, p.no);
  const gW = (nL / n) * gini(l.yes, l.no) + (nR / n) * gini(r.yes, r.no);
  const eP = entropy(p.yes, p.no);
  const eW = (nL / n) * entropy(l.yes, l.no) + (nR / n) * entropy(r.yes, r.no);
  return (
    <WidgetFrame title="Scoring a split" hint="Class counts in each child node">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-line p-3">
          <p className="mb-2 text-[13px] font-medium text-ink">Parent (combined)</p>
          <p className="tnum text-[13px] text-ink-2">
            {p.yes} yes, {p.no} no
          </p>
          <p className="tnum mt-2 text-[12.5px] text-ink-3">
            Gini {round(gP, 3)}, entropy {round(eP, 3)}
          </p>
        </div>
        {[
          { name: "Left child", v: l, set: setL },
          { name: "Right child", v: r, set: setR },
        ].map((c) => (
          <div key={c.name} className="rounded-[10px] border border-line p-3">
            <p className="mb-2 text-[13px] font-medium text-ink">{c.name}</p>
            <div className="flex flex-col gap-1.5">
              <CountInput label="Yes" value={c.v.yes} onChange={(v) => c.set({ ...c.v, yes: v })} />
              <CountInput label="No" value={c.v.no} onChange={(v) => c.set({ ...c.v, no: v })} />
            </div>
            <p className="tnum mt-2 text-[12.5px] text-ink-3">
              Gini {round(gini(c.v.yes, c.v.no), 3)}, entropy {round(entropy(c.v.yes, c.v.no), 3)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Weighted Gini after split" value={round(gW, 3)} />
        <Stat label="Gini decrease" value={round(gP - gW, 3)} strong />
        <Stat label="Weighted entropy after split" value={round(eW, 3)} />
        <Stat label="Information gain" value={round(eP - eW, 3)} strong />
      </div>
      <p className="mt-3 text-[13px] text-ink-2">A tree picks the split with the largest drop in impurity. Pure children (all yes or all no) have Gini 0 and entropy 0.</p>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ neuron playground

const ACT = {
  step: (z: number) => (z >= 0 ? 1 : 0),
  sigmoid: (z: number) => 1 / (1 + Math.exp(-z)),
  relu: (z: number) => Math.max(0, z),
  tanh: (z: number) => Math.tanh(z),
};

export function NeuronPlayground() {
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(0.5);
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(-1.2);
  const [b, setB] = useState(0.3);
  const [act, setAct] = useState<keyof typeof ACT>("sigmoid");
  const z = w1 * x1 + w2 * x2 + b;
  const out = ACT[act](z);
  return (
    <WidgetFrame title="One artificial neuron" hint="output = activation(w1·x1 + w2·x2 + b)">
      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider label="Input x1" value={x1} min={-2} max={2} step={0.1} onChange={setX1} />
          <Slider label="Weight w1" value={w1} min={-3} max={3} step={0.1} onChange={setW1} />
          <Slider label="Input x2" value={x2} min={-2} max={2} step={0.1} onChange={setX2} />
          <Slider label="Weight w2" value={w2} min={-3} max={3} step={0.1} onChange={setW2} />
          <Slider label="Bias b" value={b} min={-3} max={3} step={0.1} onChange={setB} />
          <div>
            <p className="mb-1.5 text-[13px] text-ink-2">Activation</p>
            <Segmented
              label="Activation function"
              value={act}
              onChange={setAct}
              options={[
                { value: "step", label: "Step" },
                { value: "sigmoid", label: "Sigmoid" },
                { value: "relu", label: "ReLU" },
                { value: "tanh", label: "tanh" },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Stat label="Weighted sum z" value={round(z, 3)} sub={`${round(w1, 1)}(${round(x1, 1)}) + ${round(w2, 1)}(${round(x2, 1)}) + ${round(b, 1)}`} />
          <Stat label={`Output, ${act}(z)`} value={round(out, 4)} strong />
          <p className="text-[12.5px] leading-relaxed text-ink-3">
            {act === "sigmoid" ? "Sigmoid squashes any z into 0 to 1." : act === "tanh" ? "tanh squashes z into −1 to 1." : act === "relu" ? "ReLU passes positive z and zeroes out negative z." : "Step outputs 1 when z ≥ 0, else 0."}
          </p>
        </div>
      </div>
    </WidgetFrame>
  );
}
