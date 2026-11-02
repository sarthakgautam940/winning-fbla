import catalogJson from "@/generated/catalog.json";
import type { AreaId, Catalog, LessonInfo, QMeta, SkillInfo, Tier, UnitInfo } from "./content-types";

export const catalog = catalogJson as unknown as Catalog;

const qmetaById = new Map<string, QMeta>(catalog.questions.map((q) => [q.id, q]));

export function qmeta(id: string): QMeta | undefined {
  return qmetaById.get(id);
}

export function getUnit(id: string): UnitInfo | undefined {
  return catalog.units.find((u) => u.id === id);
}

export function getLesson(id: string): LessonInfo | undefined {
  return catalog.lessons[id];
}

export function getSkill(id: string): SkillInfo | undefined {
  return catalog.skills[id];
}

export function lessonsOf(unitId: string): LessonInfo[] {
  return (getUnit(unitId)?.lessons ?? []).map((id) => catalog.lessons[id]).filter(Boolean);
}

export function allLessons(): LessonInfo[] {
  return catalog.units.flatMap((u) => lessonsOf(u.id));
}

export function areaName(id: AreaId): string {
  return catalog.areas.find((a) => a.id === id)?.name ?? id;
}

export function areaItems(id: AreaId): number {
  return catalog.areas.find((a) => a.id === id)?.items ?? 0;
}

export const contentUnits = (): UnitInfo[] => catalog.units.filter((u) => u.area !== null);

export function lessonHref(lesson: LessonInfo): string {
  return `/learn/${lesson.unit}/${lesson.id}`;
}

export function questionsOfSkill(skillId: string): QMeta[] {
  return catalog.questions.filter((q) => q.skill === skillId);
}

export const TIER_LABEL: Record<Tier, string> = {
  core: "Core",
  competitive: "Competitive",
  champion: "Champion",
};

export const TIER_RANK: Record<Tier, number> = { core: 1, competitive: 2, champion: 3 };

export function nextLesson(lessonId: string): LessonInfo | undefined {
  const all = allLessons();
  const i = all.findIndex((l) => l.id === lessonId);
  return i >= 0 ? all[i + 1] : undefined;
}

export function previousLesson(lessonId: string): LessonInfo | undefined {
  const all = allLessons();
  const i = all.findIndex((l) => l.id === lessonId);
  return i > 0 ? all[i - 1] : undefined;
}
