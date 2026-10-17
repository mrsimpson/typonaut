<script setup lang="ts">
// The game: the map of the chapters and the levels, the field with the comets, the ship and its shield, and the result
// with the analysis of what went wrong. The component only shows the state it gets and turns clicks into inputs; it
// remembers the stars and the stardust on the device. It announces what happens for screen readers.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { announce, prefersReducedMotion } from "@lernapps/tooling/a11y";
import { translator, type Messages, type Params } from "@lernapps/tooling/i18n";
import type { Input } from "@lernapps/app-templates/interactive";
import { COURSES, fingerOf, shiftHand } from "../core/course.ts";
import { LEVELS, pace, positionOf, waveOf, type Level, type State } from "../core/index.ts";
import de from "../messages/de.json";
import en from "../messages/en.json";
import Keyboard from "./Keyboard.vue";
import {
  SHIPS,
  bestOf,
  loadProgress,
  loadShip,
  loadSound,
  loadStreak,
  recommended,
  saveResult,
  saveShip,
  saveSound,
  starsOf,
  totalDust,
  touchStreak,
  unlocked,
  type Progress,
} from "./progress.ts";
import { setSound, sounds } from "./sound.ts";

const props = defineProps<{ state: State; lang: string }>();
const emit = defineEmits<{ input: [input: Input] }>();
const t = computed<(key: string, params?: Params) => string>(() =>
  props.lang === "en" ? translator<Messages>(en, "en-GB") : translator<Messages>(de),
);

const progress = ref<Progress>({});
const reduced = ref(false);
const streak = ref(0);
const soundOn = ref(true);
const shipId = ref("classic");
/** In a round Tab must not move the focus to a link: the shell gives no key to a focused link or button. */
const keepFocusOut = (event: KeyboardEvent): void => {
  if (props.state.phase === "play" && event.key === "Tab") event.preventDefault();
};
onMounted(() => {
  progress.value = loadProgress();
  reduced.value = prefersReducedMotion();
  streak.value = loadStreak();
  soundOn.value = loadSound();
  setSound(soundOn.value);
  shipId.value = loadShip();
  document.addEventListener("keydown", keepFocusOut);
  // a returning learner finds the map at the next mission, not at chapter 1
  const next = recommended(progress.value, props.state.course);
  if (props.state.phase === "menu" && props.state.attempt === 0) {
    if (next.chapter !== props.state.chapter) emit("input", { kind: "action", name: "chapter", value: next.chapter });
    if (next.level !== props.state.level) emit("input", { kind: "action", name: "level", value: next.level });
  }
});
onBeforeUnmount(() => document.removeEventListener("keydown", keepFocusOut));
/** Moves the focus off the clicked button, so that the keys 1, 2, 3 and Enter reach the game again. */
const release = (event: Event): void => {
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.blur();
};

const course = computed(() => COURSES[props.state.course]);
const levels = [1, 2, 3, 4] as const;
const mission = computed(() => recommended(progress.value, props.state.course));
const ship = computed(() => SHIPS.find((other) => other.id === shipId.value) ?? SHIPS[0]);
const dustTotal = computed(() => totalDust(progress.value));
const chooseShip = (id: string, event: Event): void => {
  shipId.value = id;
  saveShip(id);
  release(event);
};
const toggleSound = (event: Event): void => {
  soundOn.value = !soundOn.value;
  setSound(soundOn.value);
  saveSound(soundOn.value);
  if (soundOn.value) sounds.key();
  release(event);
};
/** What stands under a planet: the keys of the chapter, short. */
const shortKeys = (chapter: number, keys: string): string =>
  chapter === 1 ? t.value("shortHome") : chapter === 2 ? t.value("shortCaps") : keys.split("").join("");
const routeOf = (courseId: string, chapter: number): string => `${courseId}-${chapter}`;
const chapterTitle = (chapter: number, keys: string): string =>
  chapter === 1 ? t.value("chapterHome") : chapter === 2 ? t.value("chapterCapitals") : keys.split("").join(" ");
const newKeys = computed(() =>
  [...(course.value.chapters[props.state.chapter - 1]?.keys ?? "")].filter((char) => char !== " "),
);
const keysTitle = computed(() =>
  chapterTitle(props.state.chapter, course.value.chapters[props.state.chapter - 1]?.keys ?? ""),
);
const bestStars = (chapter: number): number =>
  Math.max(...(progress.value[routeOf(props.state.course, chapter)]?.stars ?? [0]));
const dustOf = (route: string): number => progress.value[route]?.dust ?? 0;
const start = (): void => emit("input", { kind: "action", name: "start" });
const pick = (chapter: number, event: Event): void => {
  emit("input", { kind: "action", name: "chapter", value: chapter });
  release(event);
};
/** The start page of the app in the language of this page, and this page in the other language. */
const startPage = computed(() => "../");
const otherLanguage = computed(() => ({
  lang: props.lang === "en" ? "de" : "en",
  href: `${props.lang === "en" ? "../../app/" : "../en/app/"}#${props.state.course}`,
}));
/** True on a device with only touch input: the game is for a physical keyboard, a note says so. */
const needsKeyboard = ref(false);
const canFullscreen = ref(false);
let switchFullscreen: () => void = () => undefined;
onMounted(() => {
  canFullscreen.value = document.fullscreenEnabled;
  needsKeyboard.value =
    !window.matchMedia("(any-pointer: fine)").matches && window.matchMedia("(any-pointer: coarse)").matches;
  switchFullscreen = () => {
    if (document.fullscreenElement !== null) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };
});
const toggleFullscreen = (event: Event): void => {
  release(event);
  switchFullscreen();
};
const choose = (level: Level, event: Event): void => {
  emit("input", { kind: "action", name: "level", value: level });
  release(event);
};

/** The key to type next: of the picked comet, else of the oldest one. */
const aimChar = computed(() => {
  const { comets, target } = props.state;
  const comet = comets.find((other) => other.id === target) ?? comets[0];
  return comet?.word[comet.typed] ?? "";
});
const finger = computed(() => {
  const found = fingerOf(course.value.layout, aimChar.value);
  return found === undefined ? "" : t.value(`finger.${found}`);
});
const shiftSide = computed(() => shiftHand(course.value.layout, aimChar.value) ?? "");
const hint = computed(() => {
  if (aimChar.value === "") return "";
  const key = t.value("hint", { key: aimChar.value, finger: finger.value });
  return shiftSide.value === "" ? key : `${key} ${t.value("hintShift", { hand: t.value(`shift.${shiftSide.value}`) })}`;
});

/** The keys the chapter and the chapters before it introduced, as keys of the keyboard. */
const knownKeys = computed(() =>
  course.value.chapters
    .slice(0, props.state.chapter)
    .flatMap((chapter) => chapter.keys.toLowerCase().split(""))
    .map((char) => course.value.layout.shifted[char] ?? char)
    .join(""),
);
const legend = computed(() => ["lp", "lr", "lm", "li", "thumb"].map((id) => t.value(`legend.${id}`)));
/** Earlier places of a comet on its arc, to draw its tail. */
const tail = (id: number): { x: number; y: number; n: number }[] => {
  const comet = props.state.comets.find((other) => other.id === id);
  if (comet === undefined) return [];
  return [1, 2, 3, 4, 5]
    .filter((n) => props.state.time - n * 160 >= comet.born)
    .map((n) => ({ ...positionOf(comet, props.state.time - n * 160), n }));
};

/** What the green button of a won level does: the next level, after level 3 the next chapter. */
const nextLabel = computed(() =>
  props.state.level < 3
    ? t.value("nextLevel", { level: props.state.level + 1 })
    : t.value("nextChapter", { chapter: props.state.chapter + 1 }),
);
const hasNextChapter = computed(() => props.state.chapter < course.value.chapters.length);

const accuracy = computed(() => {
  const { right, errors } = props.state;
  return Math.round((100 * right) / Math.max(1, right + errors));
});
/** The keys with the most mistakes, with the finger and the keys typed instead. */
const trouble = computed(() =>
  Object.entries(props.state.stats)
    .map(([key, stat]) => ({ key, ...stat, total: stat.errors + stat.misses }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((entry) => {
      const found = fingerOf(course.value.layout, entry.key);
      const instead = Object.entries(entry.instead)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([typed]) => typed)
        .join(" ");
      return {
        key: entry.key,
        text: t.value("trouble", { key: entry.key, errors: entry.errors, misses: entry.misses }),
        instead: instead === "" ? "" : t.value("instead", { keys: instead }),
        finger: found === undefined ? "" : t.value(`finger.${found}`),
      };
    }),
);

const shipPlace = { left: "50%", top: "88%" };
const cometStyle = (id: number): Record<string, string> => {
  const comet = props.state.comets.find((other) => other.id === id);
  if (comet === undefined) return {};
  const { x, y } = positionOf(comet, props.state.time);
  return { left: `${x}%`, top: `${y}%` };
};

/** The last round's news for the result screen: a new record, the old one, a ship that opened. */
const news = ref<{ record: boolean; before: number; ship: string }>({ record: false, before: 0, ship: "" });
const banner = ref("");
let bannerTimer: ReturnType<typeof setTimeout> | undefined;
const show = (text: string): void => {
  banner.value = text;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => (banner.value = ""), 1300);
};
onBeforeUnmount(() => clearTimeout(bannerTimer));
const wave = computed(() => waveOf(props.state.spawned));
const speed = computed(() => Math.round((props.state.right * 60_000) / Math.max(1000, props.state.time)));

watch(
  () => [props.state.right, props.state.errors, props.state.destroyed, props.state.missed, props.state.phase] as const,
  ([right, errors, destroyed, missed, phase], [lastRight, lastErrors, lastDestroyed, lastMissed, lastPhase]) => {
    if (errors > lastErrors) sounds.error();
    else if (destroyed > lastDestroyed) sounds.hit(props.state.combo);
    else if (right > lastRight) sounds.key();
    if (missed > lastMissed) sounds.miss();
    if (phase !== lastPhase && phase === "won") sounds.win();
    if (phase !== lastPhase && phase === "lost") sounds.lose();
  },
);
watch(
  () => props.state.combo,
  (combo) => {
    if (combo > 0 && combo % 5 === 0) {
      sounds.milestone();
      show(t.value("comboBanner", { combo }));
    }
  },
);
watch(wave, (now, before) => {
  if (props.state.phase === "play" && props.state.level === 4 && now > before) {
    sounds.milestone();
    show(t.value("waveBanner", { wave: now }));
  }
});

watch(
  () =>
    [
      props.state.phase,
      props.state.last,
      props.state.destroyed,
      props.state.missed,
      props.state.level,
      props.state.chapter,
    ] as const,
  () => {
    const { state } = props;
    const params = {
      level: state.level,
      chapter: state.chapter,
      word: state.word,
      shield: state.shield,
      stars: state.stars,
      score: state.score,
    };
    if (state.phase === "won" || state.phase === "lost") {
      const route = routeOf(state.course, state.chapter);
      const before = bestOf(progress.value, route, state.level);
      const dustBefore = totalDust(progress.value);
      progress.value = saveResult(route, state.level, state.stars, state.score);
      streak.value = touchStreak();
      const opened = SHIPS.find((other) => other.dust > dustBefore && other.dust <= totalDust(progress.value));
      news.value = { record: before > 0 && state.score > before, before, ship: opened?.id ?? "" };
      announce(t.value(state.phase === "lost" && state.level === 4 ? "lostCollector" : state.phase, params));
    } else if (["menu", "level", "chapter", "start", "destroyed", "missed"].includes(state.last)) {
      announce(
        t.value(state.last === "start" ? "startAnnounce" : state.last === "chapter" ? "menu" : state.last, params),
      );
    }
  },
);
</script>

<template>
  <section class="game" :aria-label="t('game')">
    <div class="screen" :class="{ playing: state.phase === 'play' }">
      <template v-if="state.phase === 'menu'">
        <header class="marquee">
          <h2 class="logo">TYPONAUT</h2>
          <p class="tagline">{{ t(`course.${state.course}`) }}</p>
          <a class="switch" :href="`#${state.course === 'de' ? 'en' : 'de'}`">{{
            t(`switchTo.${state.course === "de" ? "en" : "de"}`)
          }}</a>
        </header>
        <p v-if="needsKeyboard" class="notice" role="note">{{ t("needsKeyboard") }}</p>
        <p v-if="streak > 0" class="streak">{{ t("streak", { days: streak }) }}</p>

        <nav class="planets" :aria-label="t('chapters')">
          <button
            v-for="chapter in course.chapters"
            :key="chapter.id"
            type="button"
            class="planet"
            :class="{
              fog: !unlocked(progress, state.course, chapter.id),
              next: chapter.id === mission.chapter && mission.level < 4,
            }"
            :aria-current="chapter.id === state.chapter ? 'true' : undefined"
            :style="{ '--hue': `${(chapter.id * 47) % 360}` }"
            @click="pick(chapter.id, $event)"
          >
            <span class="globe">{{ chapter.id }}</span>
            <span class="short" aria-hidden="true">{{ shortKeys(chapter.id, chapter.keys) }}</span>
            <span class="stars" :aria-label="t('stars', { n: bestStars(chapter.id) })">{{
              "★".repeat(bestStars(chapter.id)) || "·"
            }}</span>
            <span class="sr-only">{{ t("chapter", { chapter: chapter.id }) }}</span>
          </button>
        </nav>

        <section class="briefing" :aria-label="t('chapterTitle', { chapter: state.chapter, keys: keysTitle })">
          <p class="stage">{{ t("chapter", { chapter: state.chapter }) }}</p>
          <p class="keycaps" aria-hidden="true">
            <span v-for="(key, index) in newKeys" :key="index" class="cap">{{ key }}</span>
          </p>
          <p v-if="state.chapter < 3" class="keys-title">{{ keysTitle }}</p>
          <p class="record">{{ t("record", { dust: dustOf(routeOf(state.course, state.chapter)) }) }}</p>
          <p v-if="mission.level < 4 && mission.chapter === state.chapter && mission.level === state.level" class="go">
            {{ t("nextMission") }}
          </p>
        </section>

        <div class="stages" role="group" :aria-label="t('levels')">
          <button
            v-for="level in levels"
            :key="level"
            type="button"
            class="stage-button"
            :class="{ chosen: level === state.level }"
            :aria-pressed="level === state.level"
            @click="choose(level, $event)"
          >
            <span class="stage-number">{{ level }}</span>
            <span class="stage-name">{{ t(`level${level}`) }}</span>
            <span v-if="level < 4" class="stars">{{
              "★".repeat(starsOf(progress, routeOf(state.course, state.chapter), level)) || "☆☆☆"
            }}</span>
            <span v-else class="stars">{{
              t("bestScore", { score: bestOf(progress, routeOf(state.course, state.chapter), 4) })
            }}</span>
          </button>
        </div>
        <p class="info">
          {{ state.level === 4 ? t("levelInfoCollector") : t("levelInfo", { words: LEVELS[state.level].total }) }}
        </p>
        <button type="button" class="start" @click="start">{{ t("startButton") }}</button>
        <p class="small">{{ t("keysHelp") }}</p>
        <div class="hangar" role="group" :aria-label="t('hangar')">
          <button
            v-for="other in SHIPS"
            :key="other.id"
            type="button"
            class="hangar-ship"
            :class="{ chosen: other.id === shipId }"
            :disabled="other.dust > dustTotal"
            :aria-pressed="other.id === shipId"
            :title="other.dust > dustTotal ? t('shipLocked', { dust: other.dust }) : t(`ship.${other.id}`)"
            @click="chooseShip(other.id, $event)"
          >
            <svg viewBox="0 0 24 32" width="20" height="26" aria-hidden="true">
              <path d="M12 1 L21 24 L12 19 L3 24 Z" :fill="other.body" />
              <circle cx="12" cy="12" r="3" :fill="other.window" />
              <path d="M9 22 L12 30 L15 22 Z" :fill="other.flame" />
            </svg>
            <span class="sr-only">{{ t(`ship.${other.id}`) }}</span>
          </button>
          <span class="small">{{ t("dustTotal", { dust: dustTotal }) }}</span>
        </div>
        <nav class="meta" :aria-label="t('more')">
          <a :href="startPage">{{ t("info") }}</a>
          <a :href="otherLanguage.href" :lang="otherLanguage.lang">{{ t(`uiLanguage.${otherLanguage.lang}`) }}</a>
          <button type="button" class="link" :aria-pressed="soundOn" @click="toggleSound">
            {{ t(soundOn ? "soundOn" : "soundOff") }}
          </button>
          <button v-if="canFullscreen" type="button" class="link" @click="toggleFullscreen">
            {{ t("fullscreen") }}
          </button>
        </nav>
      </template>

      <template v-else-if="state.phase === 'play'">
        <div class="hud" aria-hidden="true">
          <span v-if="state.level === 4">
            {{ t("whereCollector", { chapter: state.chapter, wave: wave }) }} ·
            {{ t("pace", { pace: pace(state.spawned).toFixed(1) }) }}
          </span>
          <span v-else>{{ t("where", { chapter: state.chapter, level: state.level }) }}</span>
          <span>{{ t("score", { score: state.score }) }} · {{ t("combo", { combo: state.combo }) }}</span>
        </div>
        <div class="field" :class="{ hurt: state.last === 'missed' && !reduced }" aria-hidden="true">
          <template v-for="comet in state.comets" :key="`tail-${comet.id}`">
            <span
              v-for="dot in tail(comet.id)"
              :key="dot.n"
              class="dot"
              :style="{ left: `${dot.x}%`, top: `${dot.y}%`, opacity: 0.6 - dot.n * 0.1 }"
            ></span>
          </template>
          <span
            v-for="comet in state.comets"
            :key="comet.id"
            class="comet"
            :class="{
              picked: comet.id === state.target,
              wrong: comet.id === state.target && state.last === 'wrong' && !reduced,
            }"
            :style="cometStyle(comet.id)"
          >
            <span v-for="(char, index) in comet.word.split('')" :key="index" :class="{ done: index < comet.typed }">{{
              char
            }}</span>
          </span>
          <span
            v-for="burst in state.bursts"
            :key="burst.id"
            class="burst"
            :class="{ still: reduced }"
            :style="{ left: `${burst.x}%`, top: `${burst.y}%` }"
            >✦ +{{ burst.points }}</span
          >
          <p v-if="banner !== ''" class="banner" :class="{ still: reduced }">{{ banner }}</p>
          <svg class="ship" :style="shipPlace" viewBox="0 0 24 32" width="28" height="38">
            <path d="M12 1 L21 24 L12 19 L3 24 Z" :fill="ship?.body" />
            <circle cx="12" cy="12" r="3" :fill="ship?.window" />
            <path d="M9 22 L12 30 L15 22 Z" :fill="ship?.flame" />
          </svg>
        </div>
        <div class="shield" aria-hidden="true">
          <div class="bar"><div class="fill" :style="{ width: `${state.shield}%` }"></div></div>
          <span>{{ t("shield", { shield: state.shield }) }}</span>
        </div>
        <p v-if="state.level < 3" class="hint" aria-hidden="true">{{ hint || "\u00a0" }}</p>
        <Keyboard
          v-if="state.level === 1"
          :layout="course.layout"
          :next="aimChar"
          :shift-keys="shiftSide"
          :known="knownKeys"
          :legend="legend"
          :wrong="state.last === 'wrong' ? state.lastKey : ''"
          :wrong-count="state.errors"
        />
        <p class="small">{{ t("escape") }}</p>
      </template>

      <template v-else>
        <h2 class="result">
          {{ state.level === 4 ? t("collectorTitle") : t(state.phase === "won" ? "wonTitle" : "lostTitle") }}
        </h2>
        <p v-if="news.record" class="record-news">{{ t("newRecord", { before: news.before }) }}</p>
        <p v-if="state.level === 4" class="small">{{ t("collectorText") }}</p>
        <p v-else-if="state.phase === 'lost'">{{ t("lostText") }}</p>
        <p v-else class="stars big">{{ "★".repeat(state.stars) }}{{ "☆".repeat(3 - state.stars) }}</p>
        <p v-if="state.phase === 'won'" class="small">{{ t("starsInfo") }}</p>
        <p v-if="state.level === 4">
          {{ t("summaryCollector", { destroyed: state.destroyed, wave, accuracy, score: state.score }) }}
        </p>
        <p v-else>
          {{ t("summary", { destroyed: state.destroyed, total: state.total, accuracy, score: state.score }) }}
        </p>
        <p class="small">{{ t("speed", { speed }) }}</p>
        <p v-if="news.ship !== ''" class="record-news">{{ t("shipOpened", { ship: t(`ship.${news.ship}`) }) }}</p>
        <p v-if="streak > 0" class="small">{{ t("streak", { days: streak }) }}</p>
        <template v-if="trouble.length > 0">
          <h3>{{ t("troubleTitle") }}</h3>
          <ul class="trouble">
            <li v-for="entry in trouble" :key="entry.key">
              <span class="char">{{ entry.key }}</span>
              <span>{{ entry.text }} {{ entry.instead }} {{ entry.finger }}</span>
            </li>
          </ul>
        </template>
        <p v-else>{{ t("noTrouble") }}</p>
        <div class="buttons">
          <button
            v-if="state.phase === 'won' && (state.level < 3 || hasNextChapter)"
            type="button"
            class="primary"
            @click="emit('input', { kind: 'action', name: 'next' })"
          >
            {{ nextLabel }}
          </button>
          <button
            type="button"
            :class="{ primary: state.phase !== 'won' }"
            @click="emit('input', { kind: 'action', name: 'again' })"
          >
            {{ t("again") }}
          </button>
          <button type="button" @click="emit('input', { kind: 'action', name: 'menu' })">{{ t("map") }}</button>
        </div>
      </template>
    </div>
  </section>
</template>

<style>
.interactive-routes {
  display: none;
}

body:has(.game) {
  overflow: hidden;
}
</style>

<style scoped>
.game {
  box-sizing: border-box;
  position: fixed;
  z-index: 1000;
  inset: 0;
  padding: 1rem;
  overflow-y: auto;
  border: 3px solid #5ce1e6;
  background:
    radial-gradient(circle at 12% 18%, #ffffff 0, #ffffff 1px, transparent 2px),
    radial-gradient(circle at 78% 10%, #ffffff 0, #ffffff 1px, transparent 2px),
    radial-gradient(circle at 90% 70%, #ffffff 0, #ffffff 1px, transparent 2px),
    radial-gradient(circle at 30% 85%, #ffffff 0, #ffffff 1px, transparent 2px), #0b1030;
  box-shadow:
    0 0 1.2rem #5ce1e655,
    inset 0 0 2rem #0006;
  color: #e8ecff;
  font-family: ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace;
  letter-spacing: 0.02em;
}

h2,
h3 {
  margin: 0.25rem 0 0.5rem;
}

a {
  color: #ffd166;
}

.screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 60rem;
  min-height: 100%;
  margin: 0 auto;
}

/* in a round the field takes what the rest leaves, so that nothing has to scroll */
.screen.playing {
  height: 100%;
  justify-content: flex-start;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.2rem;
  margin: 0.4rem 0;
  font-size: 0.85rem;
}

button.link {
  padding: 0;
  border: 0;
  background: none;
  color: #ffd166;
  font: inherit;
  text-decoration: underline;
}

.marquee {
  text-align: center;
}

.logo {
  margin: 0;
  color: #5ce1e6;
  font-size: clamp(2rem, 9vw, 2.8rem);
  letter-spacing: 0.25em;
  text-shadow:
    0 0 0.6rem #5ce1e6aa,
    0.12em 0.12em 0 #ff6ad5;
}

.tagline {
  margin: 0.2rem 0;
  color: #ff6ad5;
  font-weight: 700;
  text-transform: uppercase;
}

.switch {
  font-size: 0.85rem;
}

.planets {
  display: grid;
  grid-template-columns: repeat(6, auto);
  justify-content: center;
  gap: 0.2rem 1.1rem;
  margin: 0.4rem 0;
}

.planet {
  padding: 0;
  border: 0;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  color: #ffd166;
  text-decoration: none;
}

.globe {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, hsl(var(--hue) 85% 80%), hsl(var(--hue) 70% 50%));
  box-shadow: 0 0 0.6rem hsl(var(--hue) 80% 60% / 0.5);
  color: #0b1030;
  font-weight: 800;
  font-size: 1.1rem;
}

.planet[aria-current="true"] .globe {
  outline: 3px solid #ffffff;
  outline-offset: 3px;
  transform: scale(1.18);
}

.planet:hover .globe,
.planet:focus-visible .globe {
  transform: scale(1.1);
}

.stars {
  min-height: 1.1rem;
  color: #ffd166;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
}

.briefing {
  margin: 0.5rem 0;
  text-align: center;
}

.stage {
  margin: 0;
  color: #b8c0f0;
  text-transform: uppercase;
}

.keycaps {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.4rem 0;
}

.cap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.6rem;
  height: 2.6rem;
  padding: 0 0.3rem;
  border: 2px solid #ffd166;
  border-bottom-width: 5px;
  border-radius: 0.5rem;
  background: #1c2557;
  color: #ffd166;
  font-size: 1.5rem;
  font-weight: 800;
}

.keys-title {
  margin: 0.2rem 0;
  font-weight: 700;
}

.record {
  margin: 0.2rem 0;
  color: #ffd166;
  font-size: 0.9rem;
}

.stages,
.buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  margin: 0.5rem 0;
}

button {
  padding: 0.5rem 1rem;
  border: 2px solid #8f9bdc;
  border-radius: 0.5rem;
  background: #1c2557;
  color: #e8ecff;
  font: inherit;
  cursor: pointer;
}

.stage-button {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0 0.6rem;
  flex: 1 1 9rem;
  max-width: 13rem;
  border-color: #5ce1e6;
  text-align: left;
}

.stage-button .stars {
  grid-column: 2;
}

.stage-number {
  grid-row: span 2;
  font-size: 2rem;
  font-weight: 800;
  color: #5ce1e6;
}

.stage-button.chosen {
  border-color: #ffd166;
  background: #2a2f6b;
  box-shadow: 0 0 0.8rem #ffd16688;
}

.info {
  margin: 0.3rem 0;
  text-align: center;
}

.notice {
  max-width: 32rem;
  font-size: 0.9rem;
  margin: 0.6rem auto;
  padding: 0.6rem 0.9rem;
  border: 2px solid #ff6ad5;
  border-radius: 0.6rem;
  background: #2a1646;
  text-align: center;
}

.start {
  display: block;
  margin: 0.5rem auto;
  padding: 0.7rem 2.5rem;
  border: 3px solid #ffd166;
  border-radius: 2rem;
  background: #ff6ad5;
  box-shadow:
    0 0.25rem 0 #a1318a,
    0 0 1rem #ff6ad588;
  color: #0b1030;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  animation: glow 2.4s ease-in-out infinite alternate;
}

@keyframes glow {
  to {
    box-shadow:
      0 0.25rem 0 #a1318a,
      0 0 1.6rem #ff6ad5cc;
  }
}

@media (prefers-reduced-motion: reduce) {
  .start,
  .planet.next .globe {
    animation: none;
  }
}

@media (max-width: 420px) {
  .planets {
    gap: 0.6rem 0.4rem;
  }

  .globe {
    width: 2.3rem;
    height: 2.3rem;
  }
}

.primary {
  border-color: #4cc9a7;
  background: #4cc9a7;
  color: #0b1030;
  font-weight: 700;
}

.small {
  color: #b8c0f0;
  font-size: 0.85rem;
  text-align: center;
}

.hud {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.field {
  position: relative;
  flex: 1 1 8rem;
  min-height: 8rem;
  margin: 0.5rem 0;
  border-radius: 0.5rem;
  background:
    radial-gradient(circle at 15% 20%, #ffffff 0, #ffffff 1px, transparent 2px),
    radial-gradient(circle at 70% 12%, #ffffff 0, #ffffff 1px, transparent 2px),
    radial-gradient(circle at 85% 60%, #ffffff 0, #ffffff 1px, transparent 2px),
    radial-gradient(circle at 35% 75%, #ffffff 0, #ffffff 1px, transparent 2px), #0a0f28;
  overflow: hidden;
}

.comet {
  position: absolute;
  padding: 0.1rem 0.5rem;
  border-radius: 1rem;
  background: #26305f;
  font:
    1.4rem/1.3 ui-monospace,
    monospace;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.comet.picked {
  outline: 2px solid #ffd166;
  background: #3a4585;
}

.dot {
  position: absolute;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #8f9bdc;
  transform: translate(-50%, -50%);
}

.field.hurt {
  animation: hurt 0.8s ease-out;
}

@keyframes hurt {
  from {
    box-shadow: inset 0 0 2rem #b04a5a;
  }
}

.comet .done {
  color: #ffd166;
}

.comet.wrong {
  animation: wobble 0.3s;
}

@keyframes wobble {
  25% {
    transform: translate(-52%, -50%);
  }

  75% {
    transform: translate(-48%, -50%);
  }
}

.burst {
  position: absolute;
  color: #ffd166;
  font-weight: 700;
  transform: translate(-50%, -50%);
  animation: rise 0.9s ease-out forwards;
}

.burst.still {
  animation: none;
}

@keyframes rise {
  to {
    opacity: 0;
    transform: translate(-50%, -150%);
  }
}

.ship {
  position: absolute;
  font-size: 2rem;
  transform: translate(-50%, -50%);
}

.shield {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.bar {
  flex: 0 1 14rem;
  height: 0.9rem;
  border-radius: 0.45rem;
  background: #26305f;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: #4cc9a7;
}

.hint {
  min-height: 1.5em;
  margin: 0.5rem 0;
  font-weight: 600;
}

.banner {
  position: absolute;
  top: 18%;
  left: 50%;
  margin: 0;
  color: #ffd166;
  font-size: clamp(1.4rem, 5vw, 2.6rem);
  font-weight: 800;
  letter-spacing: 0.1em;
  text-shadow: 0 0 1rem #ffd166aa;
  transform: translateX(-50%);
  animation: pop 1.3s ease-out forwards;
  pointer-events: none;
}

.banner.still {
  animation: none;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.6);
  }

  20% {
    opacity: 1;
    transform: translateX(-50%) scale(1.15);
  }

  to {
    opacity: 0;
    transform: translateX(-50%) scale(1);
  }
}

.streak {
  margin: 0.2rem 0;
  color: #ff9d5c;
  font-weight: 700;
  text-align: center;
}

.short {
  margin-top: 0.25rem;
  color: #b8c0f0;
  font-size: 0.7rem;
  line-height: 1;
}

.planet.fog .globe {
  filter: saturate(0.5) brightness(0.8);
}

.planet.next .globe {
  animation: beacon 1.6s ease-in-out infinite;
}

@keyframes beacon {
  50% {
    box-shadow: 0 0 1.4rem 0.2rem #ffffffcc;
  }
}

.go {
  margin: 0.2rem 0;
  color: #4cc9a7;
  font-weight: 700;
}

.hangar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.4rem 0;
}

.hangar-ship {
  padding: 0.25rem 0.5rem;
}

.hangar-ship:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.hangar-ship.chosen {
  border-color: #ffd166;
  background: #2a2f6b;
}

.record-news {
  color: #ffd166;
  font-size: 1.2rem;
  font-weight: 800;
}

.big {
  font-size: 2rem;
}

.trouble {
  padding: 0;
  list-style: none;
}

.trouble li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.4rem 0;
}

.char {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: #26305f;
  color: #ffd166;
  font:
    1.4rem/1 ui-monospace,
    monospace;
}
</style>
