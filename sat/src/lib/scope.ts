import { TARGET } from "./engine";
import { questions, sections, subByKey, subKeyOf, type QMeta } from "./bank";
import { phaseOf } from "./plan";
import { dayKey } from "./dates";
import type { Scope, State } from "./store";
import type { Mode } from "./progress";

// Which questions a session draws from, in priority order.

export function scopeFromParams(p: URLSearchParams): Scope {
  const kind = (p.get("s") ?? "plan") as Scope["kind"];
  const value = p.get("v") ?? undefined;
  const start = p.get("q") ?? undefined;
  return { kind, value, start, label: scopeLabel(kind, value) };
}

export function scopeHref(scope: Pick<Scope, "kind" | "value" | "start">): string {
  const p = new URLSearchParams();
  p.set("s", scope.kind);
  if (scope.value) p.set("v", scope.value);
  if (scope.start) p.set("q", scope.start);
  return `/practice/?${p.toString()}`;
}

export function scopeLabel(kind: Scope["kind"], value?: string): string {
  switch (kind) {
    case "plan":
      return "Today's session";
    case "section":
      return value === "rw" ? "All Reading and Writing" : "All Math";
    case "category":
      return value?.split(":")[1] ?? "Category";
    case "sub": {
      const s = value ? subByKey.get(value) : undefined;
      return s ? `${s.n}. ${s.name}` : "Pattern";
    }
    case "missed":
      return "Missed questions";
    case "bookmarked":
      return "Bookmarked";
    case "harden":
      return "Final hardening";
    default:
      return "Practice";
  }
}

export function modeOf(scope: Scope, state: State): Mode {
  if (scope.kind === "harden") return "harden";
  if (scope.kind === "plan") {
    const ph = phaseOf(dayKey(Date.now()), state.settings);
    if (ph === "harden" || ph === "review") return "harden";
  }
  return "learn";
}

/** Interleave Math and Reading and Writing patterns so a long session alternates subjects. */
function curriculumOrder(): QMeta[] {
  const lanes = sections.map((s) => s.categories.flatMap((c) => c.subs));
  const out: QMeta[] = [];
  const byId = new Map(questions.map((q) => [q.id, q]));
  const n = Math.max(...lanes.map((l) => l.length));
  for (let i = 0; i < n; i++) {
    for (const lane of lanes) {
      const sub = lane[i];
      if (sub) for (const id of sub.qs) out.push(byId.get(id)!);
    }
  }
  return out;
}

const ORDER = curriculumOrder();

export function poolFor(scope: Scope, state: State): string[] {
  const p = (id: string) => state.q[id];
  const inProgress = (q: QMeta) => (p(q.id)?.n ?? 0) > 0 && (p(q.id)?.c ?? 0) < TARGET;
  const byRecentMiss = (a: QMeta, b: QMeta) => (p(b.id)?.lw ?? 0) - (p(a.id)?.lw ?? 0) || (p(a.id)?.t ?? 0) - (p(b.id)?.t ?? 0);
  let list: QMeta[];
  switch (scope.kind) {
    case "section":
      list = ORDER.filter((q) => q.section === scope.value);
      break;
    case "category":
      list = ORDER.filter((q) => `${q.section}:${q.category}` === scope.value);
      break;
    case "sub":
      list = ORDER.filter((q) => subKeyOf(q) === scope.value);
      break;
    case "missed":
      list = ORDER.filter((q) => (p(q.id)?.w ?? 0) > 0).sort((a, b) => (p(b.id)?.w ?? 0) - (p(a.id)?.w ?? 0));
      break;
    case "bookmarked":
      list = ORDER.filter((q) => p(q.id)?.bm);
      break;
    case "harden":
      list = ORDER.filter((q) => (p(q.id)?.c ?? 0) >= TARGET && !p(q.id)?.h).sort((a, b) => (p(b.id)?.w ?? 0) - (p(a.id)?.w ?? 0));
      break;
    case "custom":
      list = (scope.value ?? "").split(",").map((id) => questions.find((q) => q.id === id)).filter((q): q is QMeta => !!q);
      break;
    default: {
      // Today's session: finish what is in progress, then new questions in curriculum order.
      const mode = modeOf(scope, state);
      const started = ORDER.filter(inProgress).sort(byRecentMiss);
      if (mode === "harden") {
        const toCheck = ORDER.filter((q) => (p(q.id)?.c ?? 0) >= TARGET && !p(q.id)?.h).sort((a, b) => (p(b.id)?.w ?? 0) - (p(a.id)?.w ?? 0));
        list = [...started, ...toCheck, ...ORDER.filter((q) => !p(q.id) || p(q.id)!.n === 0)];
      } else {
        list = [...started, ...ORDER.filter((q) => !p(q.id) || p(q.id)!.n === 0)];
      }
    }
  }
  if (scope.kind !== "plan" && scope.kind !== "missed" && scope.kind !== "harden") {
    // inside a chosen set, finish started questions first
    list = [...list.filter(inProgress), ...list.filter((q) => !inProgress(q))];
  }
  const ids = list.map((q) => q.id);
  if (scope.start && ids.includes(scope.start)) return [scope.start, ...ids.filter((id) => id !== scope.start)];
  return ids;
}
