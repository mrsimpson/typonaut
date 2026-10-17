// The courses of src/data (one per language and keyboard layout): types, the lookup of a route in them, the finger of
// a key and the difficulty of a word. Pure TypeScript without DOM.
import de from "../data/de.json" with { type: "json" };
import en from "../data/en.json" with { type: "json" };

/** Where the keys are: rows to draw, the keys that need Shift (typed char → key), the finger of each key. */
export interface Layout {
  rows: string[];
  shifted: Record<string, string>;
  fingers: Record<string, string>;
}

/** A chapter: the keys it introduces and the words that can be typed with the keys known by then. */
export interface Chapter {
  id: number;
  keys: string;
  words: string[];
}

export interface CourseData {
  lang: string;
  layout: Layout;
  chapters: Chapter[];
}

export type Course = "de" | "en";

export const COURSES: Readonly<Record<Course, CourseData>> = { de, en };

/** The course and chapter of a route id: `de` or `en` (the chapter is chosen in the map), also `de-3` for a given chapter. */
export function parseRoute(route: string): { course: Course; chapter: number } {
  const [lang, number] = route.split("-");
  const course: Course = lang === "en" ? "en" : "de";
  const chapter = Number(number);
  const count = COURSES[course].chapters.length;
  return { course, chapter: Number.isInteger(chapter) && chapter >= 1 && chapter <= count ? chapter : 1 };
}

/** The finger that types `char` (`lp` left little finger, `li` left index, ... `rp` right little finger). */
export function fingerOf(layout: Layout, char: string): string | undefined {
  const base = layout.shifted[char] ?? char.toLowerCase();
  return layout.fingers[base];
}

/** The hand opposite to the one that types `char`: it presses Shift for a capital or a shifted key. */
export function shiftHand(layout: Layout, char: string): "l" | "r" | undefined {
  const finger = fingerOf(layout, char);
  if (finger === undefined) return undefined;
  const shifted = char !== char.toLowerCase() || layout.shifted[char] !== undefined;
  return shifted ? (finger.startsWith("l") ? "r" : "l") : undefined;
}

/** How hard a word is: its length, a new key counts three times, a capital or a shifted key twice. */
export function difficulty(word: string, newKeys: string): number {
  let value = 0;
  for (const char of word) {
    value += 1;
    if (newKeys.toLowerCase().includes(char.toLowerCase())) value += 2;
    if (char !== char.toLowerCase()) value += 1;
  }
  return value;
}
