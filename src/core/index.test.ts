import { describe, expect, test } from "vite-plus/test";
import { COURSES } from "./course.ts";
import { LEVELS, SHIP, positionOf, start, step, tick, type State } from "./index.ts";

const press = (state: State, ...keys: string[]): State =>
  keys.reduce((current, key) => step(current, { kind: "key", key }), state);

/** Starts level 1 of a route and lets time pass until the first comet is in flight. */
function firstComet(route: string, seed: number, level: 1 | 2 | 3 = 1): State {
  let state = press(start(seed, route), String(level), "Enter");
  while (state.comets.length === 0) state = tick(state, 20);
  return state;
}

describe("the game", () => {
  test("starts in the map of the chapter of the route", () => {
    const state = start(1, "en-6");
    expect(state).toMatchObject({ course: "en", chapter: 6, phase: "menu", level: 1 });
  });

  test("the same seed, route and inputs give the same states", () => {
    const play = (): State => {
      let state = firstComet("de-4", 11, 2);
      for (let i = 0; i < 400; i++) state = tick(state, 20);
      return press(state, "x", "y");
    };
    expect(play()).toEqual(play());
  });

  test("another try of a level starts a new round with its own random stream", () => {
    const lost = press(firstComet("de-4", 11, 2), ...Array.from({ length: 40 }, () => "#"));
    expect(lost.phase).toBe("lost");
    const again = step(lost, { kind: "action", name: "again" });
    expect(again).toMatchObject({ phase: "play", attempt: 2, shield: 100, errors: 0, level: 2 });
    expect(again.rng).not.toBe(lost.rng);
  });

  test("the first letter picks the oldest comet that starts with it and the pick stays", () => {
    let state = firstComet("de-4", 3, 3);
    while (state.comets.length < 2) state = tick(state, 20);
    const [older, younger] = state.comets;
    if (older === undefined || younger === undefined) throw new Error("two comets expected");
    const picked = press(state, younger.word[0] ?? "");
    expect(picked.target).toBe(younger.id);
    const older1 = older.word[0] ?? "";
    if (older1 !== younger.word[1]) expect(press(picked, older1).errors).toBe(1);
  });

  test("a typed word scores by its difficulty and a wrong key ends the combo", () => {
    const state = firstComet("de-1", 1);
    const word = state.comets[0]?.word ?? "";
    const wrong = press(state, "x");
    expect(wrong).toMatchObject({ errors: 1, shield: 97, combo: 0 });
    const done = press(state, ...word.split(""));
    expect(done).toMatchObject({ destroyed: 1, combo: 1, last: "destroyed" });
    expect(done.score).toBe(word.length * 30);
  });

  test("a comet that arrives takes energy and counts as missed", () => {
    let state = firstComet("de-1", 1);
    const word = state.comets[0]?.word ?? "";
    const flight = state.comets[0]?.flight ?? 0;
    for (let time = 0; time < flight; time += 20) state = tick(state, 20);
    expect(state.missed).toBe(1);
    expect(state.shield).toBe(100 - (8 + word.length));
    expect(state.last).toBe("missed");
  });

  test("an empty shield loses the level, and the stats name the key that went wrong", () => {
    const state = press(firstComet("de-1", 1), ...Array.from({ length: 34 }, () => "x"));
    expect(state).toMatchObject({ phase: "lost", shield: 0, stars: 0 });
    const first = state.stats[Object.keys(state.stats)[0] ?? ""];
    expect(first?.errors).toBe(34);
  });

  test("a level with no mistake is won with three stars", () => {
    let state = press(start(1, "en-1"), "Enter");
    while (state.phase === "play") {
      state = tick(state, 20);
      const comet = state.comets[0];
      if (comet !== undefined) state = press(state, ...comet.word.split(""));
    }
    expect(state).toMatchObject({ phase: "won", stars: 3, destroyed: LEVELS[1].total, errors: 0 });
  });

  test("keys that are no letters change nothing, and Escape leads back to the map", () => {
    const state = firstComet("de-1", 1);
    expect(press(state, "Shift")).toBe(state);
    const space = press(state, " ");
    expect(space).toEqual(state);
    expect(space).not.toBe(state);
    expect(press(state, "Escape").phase).toBe("menu");
  });

  test("a comet flies on an arc that ends at the ship", () => {
    const comet = firstComet("de-1", 1).comets[0];
    if (comet === undefined) throw new Error("a comet expected");
    const end = positionOf(comet, comet.born + comet.flight);
    expect(end).toMatchObject({ x: SHIP.x, y: SHIP.y, progress: 1 });
    const middle = positionOf(comet, comet.born + comet.flight / 2);
    expect(middle.y).toBeLessThan((comet.startY + SHIP.y) / 2);
  });
});

describe("every chapter of both courses", () => {
  const routes = Object.entries(COURSES).flatMap(([course, data]) =>
    data.chapters.map((chapter) => `${course}-${chapter.id}`),
  );

  test.each(routes)("%s can be won on every level by typing each comet", (route) => {
    for (const level of [1, 2, 3] as const) {
      let state = press(start(7, route), String(level), "Enter");
      for (let ticks = 0; state.phase === "play" && ticks < 20000; ticks++) {
        state = tick(state, 20);
        const comet = state.comets[0];
        if (comet !== undefined) state = press(state, ...comet.word.split(""));
      }
      expect(state, `${route} level ${level}`).toMatchObject({
        phase: "won",
        stars: 3,
        destroyed: LEVELS[level].total,
      });
    }
  });

  test("a burst of stardust stays for a short time and then goes", () => {
    let state = firstComet("de-1", 1);
    state = press(state, ...(state.comets[0]?.word.split("") ?? []));
    expect(state.bursts).toHaveLength(1);
    for (let i = 0; i < 50; i++) state = tick(state, 20);
    expect(state.bursts).toHaveLength(0);
  });
});
