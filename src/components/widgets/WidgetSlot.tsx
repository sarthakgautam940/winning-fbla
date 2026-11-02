"use client";

import dynamic from "next/dynamic";

const loading = () => <div className="my-7 h-72 animate-pulse rounded-[var(--radius-lg)] border border-line bg-surface-2/60" aria-label="Loading interactive" />;

// Widgets load only on the lesson that uses them.
const REGISTRY: Record<string, React.ComponentType> = {
  "base-converter": dynamic(() => import("./data-widgets").then((m) => m.BaseConverter), { loading }),
  "stats-explorer": dynamic(() => import("./data-widgets").then((m) => m.StatsExplorer), { loading }),
  "normal-explorer": dynamic(() => import("./data-widgets").then((m) => m.NormalExplorer), { loading }),
  "bayes-explorer": dynamic(() => import("./data-widgets").then((m) => m.BayesExplorer), { loading }),
  "kmeans-stepper": dynamic(() => import("./ml-widgets").then((m) => m.KMeansStepper), { loading }),
  "threshold-explorer": dynamic(() => import("./ml-widgets").then((m) => m.ThresholdExplorer), { loading }),
  "overfit-explorer": dynamic(() => import("./ml-widgets").then((m) => m.OverfitExplorer), { loading }),
  "gradient-descent": dynamic(() => import("./ml-widgets").then((m) => m.GradientDescent), { loading }),
  "split-calculator": dynamic(() => import("./ml-widgets").then((m) => m.SplitCalculator), { loading }),
  "neuron-playground": dynamic(() => import("./ml-widgets").then((m) => m.NeuronPlayground), { loading }),
  "query-order": dynamic(() => import("./sql-widgets").then((m) => m.QueryOrder), { loading }),
  "join-explorer": dynamic(() => import("./sql-widgets").then((m) => m.JoinExplorer), { loading }),
  "temperature-explorer": dynamic(() => import("./ai-widgets").then((m) => m.TemperatureExplorer), { loading }),
  "bayesnet-calculator": dynamic(() => import("./ai-widgets").then((m) => m.BayesNetCalculator), { loading }),
};

export function WidgetSlot({ name }: { name: string }) {
  const W = REGISTRY[name];
  return W ? <W /> : null;
}
