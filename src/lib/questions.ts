import { practiceTestLoaders, questionLoaders, unitTestLoaders } from "@/generated/loaders";
import { catalog, qmeta } from "./catalog";
import type { QuestionContent } from "./content-types";

// Loads question content for any mix of bank, unit-test and practice-test ids,
// fetching only the chunks those ids live in.
export async function loadQuestions(ids: string[]): Promise<Record<string, QuestionContent>> {
  const bankUnits = new Set<string>();
  const testSrcs = new Set<string>();
  for (const id of ids) {
    const m = qmeta(id);
    if (m) bankUnits.add(m.unit);
    else if (catalog.testMeta[id]) testSrcs.add(catalog.testMeta[id].src);
  }
  const parts: Record<string, QuestionContent>[] = await Promise.all([
    ...[...bankUnits].map((u) => questionLoaders[u]?.() ?? Promise.resolve({})),
    ...[...testSrcs].map(async (src) => {
      const [kind, ref] = src.split(":");
      const t = kind === "unit" ? await unitTestLoaders[ref]?.() : await practiceTestLoaders[ref]?.();
      return Object.fromEntries((t?.questions ?? []).map((q) => [q.id, q]));
    }),
  ]);
  const all: Record<string, QuestionContent> = Object.assign({}, ...parts);
  const out: Record<string, QuestionContent> = {};
  for (const id of ids) if (all[id]) out[id] = all[id];
  return out;
}

export function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = [...arr];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
