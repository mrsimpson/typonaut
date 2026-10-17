// What the app remembers on the device: stars per level, the best score and the stardust per chapter, under the route of
// the chapter; the days in a row the learner played, the ship chosen and whether sound is on. The level selected and the
// state of a round are not kept.
import { createStorage } from "@lernapps/tooling/storage";
import { COURSES, type Course } from "../core/course.ts";
import type { Level } from "../core/index.ts";

/** Stars of the three levels (0 to 3 each), the best score of each of the four levels and the stardust collected. */
export interface ChapterProgress {
  stars: [number, number, number];
  best?: number[];
  dust: number;
}

export type Progress = Record<string, ChapterProgress>;

/** The last day played (YYYY-MM-DD) and the days in a row up to it. */
export interface Streak {
  last: string;
  count: number;
}

const storage = createStorage("typonaut");

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isProgress = (value: unknown): value is Progress => isObject(value);
const isStreak = (value: unknown): value is Streak =>
  isObject(value) && typeof value["last"] === "string" && typeof value["count"] === "number";

export function loadProgress(): Progress {
  return storage.load("progress", isProgress) ?? {};
}

/** Adds the result of a round: the best stars and score of each level count, the stardust of every round is collected. */
export function saveResult(route: string, level: Level, stars: number, dust: number): Progress {
  const progress = loadProgress();
  const chapter: ChapterProgress = progress[route] ?? { stars: [0, 0, 0], dust: 0 };
  if (level < 4) chapter.stars[level - 1] = Math.max(chapter.stars[level - 1] ?? 0, stars);
  chapter.best = [0, 1, 2, 3].map((index) =>
    index === level - 1 ? Math.max(chapter.best?.[index] ?? 0, dust) : (chapter.best?.[index] ?? 0),
  );
  chapter.dust += dust;
  progress[route] = chapter;
  storage.save("progress", progress);
  return progress;
}

/** Stars of a level, 0 when it was not played. */
export const starsOf = (progress: Progress, route: string, level: Level): number =>
  progress[route]?.stars[level - 1] ?? 0;

/** The best score of a level, 0 when it was not played. */
export const bestOf = (progress: Progress, route: string, level: Level): number =>
  progress[route]?.best?.[level - 1] ?? 0;

/** All stardust of all chapters: what opens the ships. */
export const totalDust = (progress: Progress): number =>
  Object.values(progress).reduce((sum, chapter) => sum + chapter.dust, 0);

const routeOf = (course: Course, chapter: number): string => `${course}-${chapter}`;

/** The first level 1 to 3 without a star, chapter by chapter: where to go next. When all are done: the collector. */
export function recommended(progress: Progress, course: Course): { chapter: number; level: Level } {
  const count = COURSES[course].chapters.length;
  for (let chapter = 1; chapter <= count; chapter++) {
    for (const level of [1, 2, 3] as const) {
      if (starsOf(progress, routeOf(course, chapter), level) === 0) return { chapter, level };
    }
  }
  return { chapter: count, level: 4 };
}

/** A chapter opens with a star on levels 1 and 2 of the one before. The others stay in the fog, but can be played. */
export const unlocked = (progress: Progress, course: Course, chapter: number): boolean =>
  chapter <= 1 ||
  (starsOf(progress, routeOf(course, chapter - 1), 1) > 0 && starsOf(progress, routeOf(course, chapter - 1), 2) > 0);

const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** The days in a row, as of today: a streak that was not continued yesterday or today is over. */
export function loadStreak(now = new Date()): number {
  const streak = storage.load("streak", isStreak);
  if (streak === undefined) return 0;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return streak.last === dayKey(now) || streak.last === dayKey(yesterday) ? streak.count : 0;
}

/** Counts today as played; returns the days in a row. */
export function touchStreak(now = new Date()): number {
  const streak = storage.load("streak", isStreak);
  const today = dayKey(now);
  if (streak !== undefined && streak.last === today) return streak.count;
  const count = loadStreak(now) + 1;
  storage.save("streak", { last: today, count });
  return count;
}

/** A ship, opened with the stardust of all rounds. */
export interface Ship {
  id: string;
  dust: number;
  body: string;
  window: string;
  flame: string;
}

export const SHIPS: readonly Ship[] = [
  { id: "classic", dust: 0, body: "#e8ecff", window: "#6c7bd9", flame: "#ffd166" },
  { id: "rocket", dust: 400, body: "#ff9aa8", window: "#7a1f3d", flame: "#ffd166" },
  { id: "comet", dust: 1200, body: "#7be0c3", window: "#0b4d4a", flame: "#5ce1e6" },
  { id: "nova", dust: 3000, body: "#ffd166", window: "#a1318a", flame: "#ff6ad5" },
  { id: "phantom", dust: 6000, body: "#b39cff", window: "#ffffff", flame: "#ff6ad5" },
];

export const loadShip = (): string =>
  storage.load("ship", (value): value is string => typeof value === "string") ?? "classic";
export const saveShip = (id: string): void => void storage.save("ship", id);
export const loadSound = (): boolean =>
  storage.load("sound", (value): value is boolean => typeof value === "boolean") ?? true;
export const saveSound = (on: boolean): void => void storage.save("sound", on);
