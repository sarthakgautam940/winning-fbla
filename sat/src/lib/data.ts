"use client";

// Loads one question's content (public/data/q/<id>.json) and caches it.

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export type Inline =
  | { t: string; f?: string }
  | { m: string; w: number; h: number; vw: number; vh: number; va?: number }
  | { k: string }
  | { img: string; w: number; h: number; va: number }
  | { br: 1 };

export type Block =
  | { k: "p"; c: Inline[]; al?: "c" | "r"; ind?: number; li?: 1 }
  | { k: "fig"; svg: string; w: number; h: number; vw: number; vh: number; alt?: string };

export type QData = {
  id: string;
  code: string;
  type: "mc" | "spr";
  stem: Block[];
  choices: { l: string; c: Block[] }[];
  answer: string | string[];
  rationale: Block[];
};

const cache = new Map<string, Promise<QData>>();

function fixPaths(q: QData): QData {
  const fix = (s: string) => s.replaceAll('href="/img/', `href="${BASE}/data/img/`);
  const blocks = (bs: Block[]) => bs.map((b) => (b.k === "fig" ? { ...b, svg: fix(b.svg) } : b));
  return { ...q, stem: blocks(q.stem), choices: q.choices.map((c) => ({ ...c, c: blocks(c.c) })), rationale: blocks(q.rationale) };
}

export function loadQuestion(id: string): Promise<QData> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`${BASE}/data/q/${id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`question ${id}: ${r.status}`);
        return r.json() as Promise<QData>;
      })
      .then(fixPaths);
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}
