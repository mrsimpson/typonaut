// The game's logic: words fly as comets on arcs towards the ship; the learner types them before they arrive. The
// first letter picks the oldest comet that starts with it, which stays picked until it is typed. A wrong key, or a
// comet that arrives, takes energy from the shield; a typed comet gives some back and scores stardust. The shield at
// zero loses the level. Pure TypeScript without DOM; the runtime keeps the state and calls start, step and tick
// (@lernapps/app-templates/interactive). Everything random is drawn from the seed.
import type { Input } from "@lernapps/app-templates/interactive";
import { COURSES, difficulty, parseRoute, type Course } from "./course.ts";

export type Phase = "menu" | "play" | "won" | "lost";

/** A word in flight: its arc is fixed by where it starts, the lift of its arc and how long it flies. */
export interface Comet {
  id: number;
  word: string;
  /** Letters typed right so far. */
  typed: number;
  born: number;
  /** Milliseconds from the start of the flight to the ship. */
  flight: number;
  startX: number;
  startY: number;
  lift: number;
}

/** What went wrong with one key: wrong keys typed for it, comets that arrived while it was still to type. */
export interface KeyStat {
  errors: number;
  misses: number;
  /** The wrong characters typed instead, by character. */
  instead: Record<string, number>;
}

export type Last = "menu" | "start" | "pick" | "hit" | "wrong" | "destroyed" | "missed" | "won" | "lost" | "level";

export interface State {
  seed: number;
  route: string;
  course: Course;
  chapter: number;
  phase: Phase;
  /** The level selected in the menu, and played. */
  level: 1 | 2 | 3;
  /** How often a level was started: another round of the same level draws other words. */
  attempt: number;
  rng: number;
  /** Milliseconds since the level started. */
  time: number;
  lastSpawn: number;
  comets: Comet[];
  nextId: number;
  /** The id of the comet being typed, 0 when none. */
  target: number;
  shield: number;
  score: number;
  combo: number;
  bestCombo: number;
  total: number;
  spawned: number;
  destroyed: number;
  missed: number;
  /** Keys typed right and wrong in the level. */
  right: number;
  errors: number;
  stats: Record<string, KeyStat>;
  stars: number;
  last: Last;
  /** The word of the last destroyed or missed comet. */
  word: string;
}

interface LevelSettings {
  total: number;
  maxActive: number;
  /** Milliseconds between two comets at least. */
  gap: number;
  /** Flight time: base plus per letter, in milliseconds; slow on purpose, accuracy comes before speed. */
  base: number;
  perLetter: number;
}

export const LEVELS: Readonly<Record<1 | 2 | 3, LevelSettings>> = {
  1: { total: 10, maxActive: 1, gap: 1500, base: 8000, perLetter: 1000 },
  2: { total: 14, maxActive: 2, gap: 3500, base: 7000, perLetter: 900 },
  3: { total: 18, maxActive: 3, gap: 3000, base: 6000, perLetter: 800 },
};

/** The ship the comets fly to, in percent of the playing field. */
export const SHIP = { x: 50, y: 88 };
const MAX_SHIELD = 100;
const ERROR_COST = 3;
const HIT_GAIN = 4;
const RESPAWN_PAUSE = 800;

/** The next random number from 0 to 1 of the state's stream (mulberry32); it advances `rng` of `state`. */
function random(state: { rng: number }): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let mixed = Math.imul(state.rng ^ (state.rng >>> 15), 1 | state.rng);
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
  return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
}

const pick = <T>(state: { rng: number }, items: readonly T[]): T =>
  items[Math.floor(random(state) * items.length)] as T;

export function start(seed: number, route: string): State {
  const { course, chapter } = parseRoute(route);
  return {
    seed,
    route,
    course,
    chapter,
    phase: "menu",
    level: 1,
    attempt: 0,
    rng: seed >>> 0,
    time: 0,
    lastSpawn: 0,
    comets: [],
    nextId: 1,
    target: 0,
    shield: MAX_SHIELD,
    score: 0,
    combo: 0,
    bestCombo: 0,
    total: 0,
    spawned: 0,
    destroyed: 0,
    missed: 0,
    right: 0,
    errors: 0,
    stats: {},
    stars: 0,
    last: "menu",
    word: "",
  };
}

/** The keys introduced by the chapter, and for a capital chapter the keys of the home row it combines with Shift. */
function chapterKeys(state: State): string {
  return COURSES[state.course].chapters[state.chapter - 1]?.keys ?? "";
}

/** A short run of keys for level 1: the new keys of the chapter, mixed with the keys of the first chapter. */
function sequence(state: State): string {
  const { chapters } = COURSES[state.course];
  const home = (chapters[0]?.keys ?? "").split("");
  const fresh = chapterKeys(state).split("");
  const length = 2 + Math.floor(random(state) * 3);
  if (state.chapter === 1) return Array.from({ length }, () => pick(state, home)).join("");
  if (state.chapter === 2) {
    const letters = Array.from({ length }, () => pick(state, home));
    return (letters[0] ?? "").toUpperCase() + letters.slice(1).join("");
  }
  const chars = Array.from({ length }, () => pick(state, [...fresh, ...home]));
  chars[Math.floor(random(state) * length)] = pick(state, fresh);
  return chars.join("");
}

/** The words of the chapters from `from` to `to` (1-based, inclusive). */
function wordsOf(state: State, from: number, to: number): string[] {
  return COURSES[state.course].chapters.slice(Math.max(0, from - 1), to).flatMap((chapter) => chapter.words);
}

/** The next word of a level 2 or 3 comet: mostly the new words of the chapter, some from the chapters before. */
function nextWord(state: State): string {
  const own = wordsOf(state, state.chapter, state.chapter);
  const before = state.chapter > 1 ? wordsOf(state, 1, state.chapter - 1) : own;
  const earlier = wordsOf(state, Math.max(1, state.chapter - 1), Math.max(1, state.chapter - 1));
  let source: string[];
  if (state.level === 2) source = random(state) < 0.7 ? own : before;
  else {
    const roll = random(state);
    source = roll < 0.4 ? own : roll < 0.6 ? earlier : [...before, ...own];
  }
  return pick(state, source.length > 0 ? source : own);
}

/** A word for a new comet that does not start like one in flight, when the lists let it. */
function wordForComet(state: State): string {
  for (let tries = 0; ; tries++) {
    const word = state.level === 1 ? sequence(state) : nextWord(state);
    const taken = state.comets.some((comet) => comet.word[0] === word[0]);
    if (!taken || tries >= 8) return word;
  }
}

function spawn(state: State): void {
  const word = wordForComet(state);
  const settings = LEVELS[state.level];
  const ramp = 1 - 0.2 * (state.spawned / settings.total);
  const chapterFactor = 1 - 0.01 * (state.chapter - 1);
  const fromLeft = random(state) < 0.5;
  state.comets.push({
    id: state.nextId,
    word,
    typed: 0,
    born: state.time,
    flight: Math.round((settings.base + settings.perLetter * word.length) * ramp * chapterFactor),
    startX: (fromLeft ? 10 : 90) + (random(state) - 0.5) * 8,
    startY: 40 + random(state) * 20,
    lift: 15 + random(state) * 10,
  });
  state.nextId += 1;
  state.spawned += 1;
  state.lastSpawn = state.time;
}

/** Where a comet is at `time`, in percent of the playing field, and how far it is on its way from 0 to 1. */
export function positionOf(comet: Comet, time: number): { x: number; y: number; progress: number } {
  const progress = Math.min(1, Math.max(0, (time - comet.born) / comet.flight));
  return {
    x: comet.startX + (SHIP.x - comet.startX) * progress,
    y: comet.startY + (SHIP.y - comet.startY) * progress - comet.lift * 4 * progress * (1 - progress),
    progress,
  };
}

function begin(state: State, level: 1 | 2 | 3): State {
  const attempt = state.attempt + 1;
  return {
    ...start(state.seed, state.route),
    phase: "play",
    level,
    attempt,
    rng: (state.seed * 31 + level * 1009 + attempt * 7919) >>> 0,
    total: LEVELS[level].total,
    last: "start",
  };
}

const blank = (): KeyStat => ({ errors: 0, misses: 0, instead: {} });

function finish(state: State, phase: "won" | "lost"): void {
  state.phase = phase;
  state.comets = [];
  state.target = 0;
  state.last = phase;
  if (phase === "won") {
    const accuracy = state.right / Math.max(1, state.right + state.errors);
    state.stars = accuracy >= 0.97 && state.missed === 0 ? 3 : accuracy >= 0.9 ? 2 : 1;
  }
}

/** Takes energy from the shield; the level is lost when none is left. */
function damage(state: State, cost: number): void {
  state.shield = Math.max(0, state.shield - cost);
  if (state.shield === 0) finish(state, "lost");
}

/** The comet to be typed with the key: the one picked, else the oldest that starts with it. */
function aim(state: State, key: string): Comet | undefined {
  const target = state.comets.find((comet) => comet.id === state.target);
  if (target !== undefined) return target;
  return state.comets.find((comet) => comet.word[0] === key);
}

function typeKey(state: State, key: string): State {
  const next = structuredClone(state);
  const comet = aim(next, key);
  if (comet === undefined) {
    // nothing starts with the key: a mistake against the first letter of the oldest comet, if one is in flight
    const oldest = next.comets[0];
    if (oldest === undefined) return state;
    return mistake(next, oldest.word[0] ?? "", key);
  }
  const expected = comet.word[comet.typed] ?? "";
  if (key !== expected) return mistake(next, expected, key, comet);
  next.target = comet.id;
  comet.typed += 1;
  next.right += 1;
  if (comet.typed < comet.word.length) {
    next.last = comet.typed === 1 ? "pick" : "hit";
    return next;
  }
  const factor = 1 + 0.1 * Math.min(next.combo, 10);
  next.score += Math.round(difficulty(comet.word, chapterKeys(next)) * 10 * factor);
  next.combo += 1;
  next.bestCombo = Math.max(next.bestCombo, next.combo);
  next.destroyed += 1;
  next.shield = Math.min(MAX_SHIELD, next.shield + HIT_GAIN);
  next.comets = next.comets.filter((other) => other.id !== comet.id);
  next.target = 0;
  next.word = comet.word;
  next.last = "destroyed";
  if (next.spawned === next.total && next.comets.length === 0) finish(next, "won");
  return next;
}

function mistake(state: State, expected: string, typed: string, comet?: Comet): State {
  const stat = (state.stats[expected] ??= blank());
  stat.errors += 1;
  stat.instead[typed] = (stat.instead[typed] ?? 0) + 1;
  state.errors += 1;
  state.combo = 0;
  state.last = "wrong";
  if (comet !== undefined) state.word = comet.word;
  damage(state, ERROR_COST);
  return state;
}

/** Whether `input` is the key `name` or the action of that name: the key Enter and the button do the same. */
const asks = (input: Input, key: string, action: string): boolean =>
  (input.kind === "key" && input.key === key) || (input.kind === "action" && input.name === action);

export function step(state: State, input: Input): State {
  if (state.phase === "play") {
    if (asks(input, "Escape", "menu"))
      return { ...start(state.seed, state.route), level: state.level, attempt: state.attempt };
    if (input.kind !== "key" || input.key.length !== 1 || input.key === " ") return state;
    return typeKey(state, input.key);
  }
  if (input.kind === "action" && input.name === "level") {
    const level = Number(input.value);
    if (level !== 1 && level !== 2 && level !== 3) return state;
    return { ...state, level, last: "level" };
  }
  if (state.phase === "menu") {
    if (input.kind === "key" && ["1", "2", "3"].includes(input.key)) {
      return { ...state, level: Number(input.key) as 1 | 2 | 3, last: "level" };
    }
    return asks(input, "Enter", "start") ? begin(state, state.level) : state;
  }
  // won or lost
  const menu = (level: 1 | 2 | 3): State => ({
    ...start(state.seed, state.route),
    level,
    attempt: state.attempt,
  });
  if (input.kind === "action" && input.name === "next") return menu(Math.min(3, state.level + 1) as 1 | 2 | 3);
  if (asks(input, "Escape", "menu")) return menu(state.level);
  if (state.phase === "won" && asks(input, "Enter", "start")) return menu(Math.min(3, state.level + 1) as 1 | 2 | 3);
  if (asks(input, "Enter", "start") || (input.kind === "action" && input.name === "again"))
    return begin(state, state.level);
  return state;
}

export function tick(state: State, dt: number): State {
  if (state.phase !== "play") return state;
  const next = structuredClone(state);
  next.time += dt;
  const settings = LEVELS[next.level];
  for (const comet of [...next.comets]) {
    if (next.time - comet.born < comet.flight) continue;
    const stat = (next.stats[comet.word[comet.typed] ?? comet.word[0] ?? ""] ??= blank());
    stat.misses += 1;
    next.missed += 1;
    next.combo = 0;
    next.word = comet.word;
    next.last = "missed";
    next.comets = next.comets.filter((other) => other.id !== comet.id);
    if (next.target === comet.id) next.target = 0;
    damage(next, 10 + 2 * comet.word.length);
    if (next.phase !== "play") return next;
  }
  const waited = next.time - next.lastSpawn;
  const ready = next.comets.length === 0 ? waited >= RESPAWN_PAUSE : waited >= settings.gap;
  if (next.spawned < next.total && next.comets.length < settings.maxActive && ready) spawn(next);
  else if (next.spawned === next.total && next.comets.length === 0) finish(next, "won");
  return next;
}
