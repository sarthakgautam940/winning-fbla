// Shapes of the generated content that the app reads. The build script
// (scripts/build-content.ts) produces these from content/ and validates them.

export type Tier = "core" | "competitive" | "champion";
export type QType = "recall" | "concept" | "scenario" | "calculation" | "code" | "sql" | "visual";
export type Letter = "A" | "B" | "C" | "D";
export type AreaId = "DL" | "PS" | "DA" | "TL" | "AI" | "ML" | "PR" | "PE";
export type Use = "check" | "quiz" | "bank";

export const LETTERS: Letter[] = ["A", "B", "C", "D"];
export const TIERS: Tier[] = ["core", "competitive", "champion"];

export interface Objective {
  id: string;
  text: string;
  area: AreaId;
}

export interface Area {
  id: AreaId;
  name: string;
  items: number;
  objectives: Objective[];
}

export interface Section {
  id: string;
  title: string;
  tier: Tier;
}

export interface LessonInfo {
  id: string;
  unit: string;
  n: number;
  code: string;
  title: string;
  summary: string;
  minutes: number;
  skills: string[];
  objectives: string[];
  sections: Section[];
  checks: string[];
  quiz: string[];
  widgets: string[];
  hasContent: boolean;
}

export interface UnitInfo {
  id: string;
  n: number;
  area: AreaId | null;
  title: string;
  summary: string;
  lessons: string[];
  unitTest: { count: number; minutes: number } | null;
}

export interface SkillInfo {
  id: string;
  n: number;
  name: string;
  unit: string;
  lesson: string;
  area: AreaId | null;
  objectives: string[];
  patterns: string[];
}

export interface QMeta {
  id: string;
  skill: string;
  unit: string;
  lesson: string;
  area: AreaId;
  objective: string;
  tier: Tier;
  type: QType;
  use: Use;
  label: string;
  time: number;
}

export interface Catalog {
  areas: Area[];
  units: UnitInfo[];
  lessons: Record<string, LessonInfo>;
  skills: Record<string, SkillInfo>;
  skillOrder: string[];
  questions: QMeta[];
  practiceTests: { id: string; n: number; title: string; count: number; minutes: number }[];
  flashcardCount: number;
  builtAt: string;
}

// Figure specs (rendered by src/components/figures). Mirrors scripts/lib/schemas.ts.
export type FigureSpec =
  | { type: "histogram"; bins: { from: number; to: number; count: number }[]; xLabel: string; yLabel?: string; caption?: string }
  | {
      type: "bar";
      categories: string[];
      series: { name?: string; values: number[] }[];
      xLabel?: string;
      yLabel?: string;
      horizontal?: boolean;
      stacked?: boolean;
      caption?: string;
    }
  | {
      type: "line";
      series: { name?: string; points: [number, number][] }[];
      xLabel: string;
      yLabel: string;
      yMin?: number;
      yMax?: number;
      caption?: string;
    }
  | {
      type: "scatter";
      series: { name?: string; points: [number, number][] }[];
      xLabel: string;
      yLabel: string;
      line?: { slope: number; intercept: number; label?: string };
      centroids?: [number, number][];
      highlight?: [number, number][];
      caption?: string;
    }
  | {
      type: "boxplot";
      groups: { label: string; min: number; q1: number; median: number; q3: number; max: number; outliers?: number[] }[];
      axisLabel: string;
      caption?: string;
    }
  | { type: "dotplot"; values: number[]; xLabel: string; caption?: string }
  | {
      type: "normal";
      mean?: number;
      sd?: number;
      axis?: "sd" | "z" | "values";
      shade?: { from: number | null; to: number | null }[];
      marks?: number[];
      caption?: string;
    }
  | {
      type: "curve";
      fn: "sigmoid" | "relu" | "leaky-relu" | "tanh" | "step" | "linear" | "parabola" | "exp" | "log";
      xRange: [number, number];
      yRange?: [number, number];
      xLabel?: string;
      yLabel?: string;
      marks?: { x: number; label?: string }[];
      hline?: number;
      caption?: string;
    }
  | { type: "tree"; root: TreeNode; caption?: string }
  | { type: "network"; layers: number[]; labels?: string[]; caption?: string }
  | {
      type: "graph";
      nodes: { id: string; label: string; x: number; y: number }[];
      edges: { from: string; to: string; label?: string }[];
      directed?: boolean;
      caption?: string;
    }
  | { type: "flow"; steps: string[]; cycle?: boolean; caption?: string }
  | { type: "confusion"; tp: number; fp: number; fn: number; tn: number; positive?: string; negative?: string; caption?: string }
  | { type: "venn"; sets: { label: string }[]; center?: string; caption?: string }
  | { type: "nested"; layers: string[]; caption?: string }
  | { type: "pyramid"; levels: string[]; caption?: string }
  | { type: "pie"; slices: { label: string; value: number }[]; caption?: string }
  | { type: "pixels"; grid: number[][]; caption?: string };

export interface TreeNode {
  label: string;
  edge?: string;
  children?: TreeNode[];
}

// Rendered question content. Text fields are HTML produced at build time.
export interface QuestionContent {
  id: string;
  stem: string;
  figure?: FigureSpec;
  options: string[];
  answer: Letter;
  explain: string;
  why: Partial<Record<Letter, string>>;
}

export interface TestQuestion extends QuestionContent {
  area: AreaId;
  objective: string;
  skill: string;
  tier: Tier;
  type: QType;
  time: number;
  tb?: 1 | 2;
}

export interface PracticeTest {
  id: string;
  n: number;
  title: string;
  minutes: number;
  questions: TestQuestion[];
}

export interface UnitTest {
  unit: string;
  title: string;
  minutes: number;
  questions: TestQuestion[];
}

export interface Flashcard {
  id: string;
  term: string;
  back: string;
  skill: string;
  unit: string;
  lesson: string;
  virginia: boolean;
}
