// What the app remembers on the device: stars per level and stardust per chapter, under the route of the chapter. The
// level selected and the state of a round are not kept.
import { createStorage } from "@lernapps/tooling/storage";

/** Stars of the three levels (0 to 3 each) and the stardust collected in the chapter. */
export interface ChapterProgress {
  stars: [number, number, number];
  dust: number;
}

export type Progress = Record<string, ChapterProgress>;

const storage = createStorage("typonaut");

const isProgress = (value: unknown): value is Progress =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function loadProgress(): Progress {
  return storage.load("progress", isProgress) ?? {};
}

/** Adds the result of a round: the best stars of each level count, the stardust of every round is collected. */
export function saveResult(route: string, level: 1 | 2 | 3, stars: number, dust: number): Progress {
  const progress = loadProgress();
  const chapter: ChapterProgress = progress[route] ?? { stars: [0, 0, 0], dust: 0 };
  chapter.stars[level - 1] = Math.max(chapter.stars[level - 1] ?? 0, stars);
  chapter.dust += dust;
  progress[route] = chapter;
  storage.save("progress", progress);
  return progress;
}

/** Stars of a level, 0 when it was not played. */
export const starsOf = (progress: Progress, route: string, level: 1 | 2 | 3): number =>
  progress[route]?.stars[level - 1] ?? 0;
