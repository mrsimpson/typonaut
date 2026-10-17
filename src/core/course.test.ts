import { describe, expect, test } from "vite-plus/test";
import { COURSES, difficulty, fingerOf, parseRoute, shiftHand, type Course } from "./course.ts";

const courses = Object.keys(COURSES) as Course[];

/** The keys typed with Shift: capitals of known letters from chapter 2 on, and the shifted keys of the layout. */
function known(course: Course, chapter: number): Set<string> {
  const data = COURSES[course];
  const keys = new Set<string>();
  data.chapters.slice(0, chapter).forEach((entry) => {
    for (const key of entry.keys) keys.add(key.toLowerCase());
  });
  if (chapter >= 2) for (const key of [...keys]) keys.add(key.toUpperCase());
  return keys;
}

describe.each(courses)("course %s", (course) => {
  const data = COURSES[course];

  test("has twelve chapters in order", () => {
    expect(data.chapters.map((chapter) => chapter.id)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  test("every word uses only keys introduced up to its chapter", () => {
    for (const chapter of data.chapters) {
      const allowed = known(course, chapter.id);
      for (const word of chapter.words) {
        const unknown = [...word].filter((char) => !allowed.has(char));
        expect(unknown, `${word} in chapter ${chapter.id}`).toEqual([]);
      }
    }
  });

  test("every word of a chapter has no duplicate and is short enough to read", () => {
    for (const chapter of data.chapters) {
      expect(new Set(chapter.words).size).toBe(chapter.words.length);
      for (const word of chapter.words) expect(word.length).toBeLessThanOrEqual(12);
    }
  });

  test("every chapter has words to play", () => {
    for (const chapter of data.chapters)
      expect(chapter.words.length, `chapter ${chapter.id}`).toBeGreaterThanOrEqual(7);
  });

  test("every key of every chapter has a finger", () => {
    for (const chapter of data.chapters) {
      for (const key of chapter.keys) {
        expect(fingerOf(data.layout, key), `${key} in chapter ${chapter.id}`).toBeDefined();
      }
    }
  });

  test("the keyboard shows every key that has a finger", () => {
    const drawn = new Set(data.layout.rows.join("").split(""));
    for (const key of Object.keys(data.layout.fingers)) expect(drawn.has(key), key).toBe(true);
  });
});

describe("routes and keys", () => {
  test("a route names a course and a chapter, the first of German for an unknown one", () => {
    expect(parseRoute("en-7")).toEqual({ course: "en", chapter: 7 });
    expect(parseRoute("de-12")).toEqual({ course: "de", chapter: 12 });
    expect(parseRoute("fr-99")).toEqual({ course: "de", chapter: 1 });
  });

  test("a capital is typed with the Shift key of the other hand", () => {
    const { layout } = COURSES.de;
    expect(fingerOf(layout, "A")).toBe("lp");
    expect(shiftHand(layout, "A")).toBe("r");
    expect(shiftHand(layout, "ö")).toBeUndefined();
    expect(shiftHand(layout, "?")).toBe("l");
  });

  test("new keys, capitals and longer words are harder", () => {
    expect(difficulty("as", "gh")).toBe(2);
    expect(difficulty("ag", "gh")).toBe(4);
    expect(difficulty("As", "gh")).toBe(3);
  });
});
