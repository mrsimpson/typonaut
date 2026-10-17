<script setup lang="ts">
// The game: the map of the chapters and the levels, the field with the comets, the ship and its shield, and the result
// with the analysis of what went wrong. The component only shows the state it gets and turns clicks into inputs; it
// remembers the stars and the stardust on the device. It announces what happens for screen readers.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { announce, prefersReducedMotion } from "@lernapps/tooling/a11y";
import { translator, type Messages, type Params } from "@lernapps/tooling/i18n";
import type { Input } from "@lernapps/app-templates/interactive";
import { COURSES, fingerOf, shiftHand } from "../core/course.ts";
import { LEVELS, positionOf, type State } from "../core/index.ts";
import de from "../messages/de.json";
import en from "../messages/en.json";
import Keyboard from "./Keyboard.vue";
import { loadProgress, saveResult, starsOf, type Progress } from "./progress.ts";

const props = defineProps<{ state: State; lang: string }>();
const emit = defineEmits<{ input: [input: Input] }>();
const t = computed<(key: string, params?: Params) => string>(() =>
  props.lang === "en" ? translator<Messages>(en, "en-GB") : translator<Messages>(de),
);

const progress = ref<Progress>({});
const reduced = ref(false);
/** In a round Tab must not move the focus to a link: the shell gives no key to a focused link or button. */
const keepFocusOut = (event: KeyboardEvent): void => {
  if (props.state.phase === "play" && event.key === "Tab") event.preventDefault();
};
onMounted(() => {
  progress.value = loadProgress();
  reduced.value = prefersReducedMotion();
  document.addEventListener("keydown", keepFocusOut);
});
onBeforeUnmount(() => document.removeEventListener("keydown", keepFocusOut));
/** Moves the focus off the clicked button, so that the keys 1, 2, 3 and Enter reach the game again. */
const release = (event: Event): void => {
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.blur();
};

const course = computed(() => COURSES[props.state.course]);
const levels = [1, 2, 3] as const;
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
const choose = (level: 1 | 2 | 3, event: Event): void => {
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
const legend = computed(() => ["lp", "lr", "lm", "li"].map((id) => t.value(`legend.${id}`)));
const pickedWord = computed(() => props.state.comets.find((comet) => comet.id === props.state.target)?.word ?? "");
/** Earlier places of a comet on its arc, to draw its tail. */
const tail = (id: number): { x: number; y: number; n: number }[] => {
  const comet = props.state.comets.find((other) => other.id === id);
  if (comet === undefined) return [];
  return [1, 2, 3, 4, 5]
    .filter((n) => props.state.time - n * 160 >= comet.born)
    .map((n) => ({ ...positionOf(comet, props.state.time - n * 160), n }));
};

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

const ship = { left: "50%", top: "88%" };
const cometStyle = (id: number): Record<string, string> => {
  const comet = props.state.comets.find((other) => other.id === id);
  if (comet === undefined) return {};
  const { x, y } = positionOf(comet, props.state.time);
  return { left: `${x}%`, top: `${y}%` };
};

watch(
  () => [props.state.phase, props.state.last, props.state.destroyed, props.state.missed, props.state.level] as const,
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
      progress.value = saveResult(state.route, state.level, state.stars, state.score);
      announce(t.value(state.phase, params));
    } else if (["menu", "level", "start", "destroyed", "missed"].includes(state.last)) {
      announce(t.value(state.last === "start" ? "startAnnounce" : state.last, params));
    }
  },
);
</script>

<template>
  <section class="game" :aria-label="t('game')">
    <template v-if="state.phase === 'menu'">
      <header class="marquee">
        <h2 class="logo">TYPONAUT</h2>
        <p class="tagline">{{ t(`course.${state.course}`) }}</p>
        <a class="switch" :href="`#${state.course === 'de' ? 'en' : 'de'}-1`">{{
          t(`switchTo.${state.course === "de" ? "en" : "de"}`)
        }}</a>
      </header>

      <nav class="planets" :aria-label="t('chapters')">
        <a
          v-for="chapter in course.chapters"
          :key="chapter.id"
          class="planet"
          :href="`#${routeOf(state.course, chapter.id)}`"
          :aria-current="chapter.id === state.chapter ? 'true' : undefined"
          :style="{ '--hue': `${(chapter.id * 47) % 360}` }"
        >
          <span class="globe">{{ chapter.id }}</span>
          <span class="stars" :aria-label="t('stars', { n: bestStars(chapter.id) })">{{
            "★".repeat(bestStars(chapter.id)) || "·"
          }}</span>
        </a>
      </nav>

      <section class="briefing" :aria-label="t('chapterTitle', { chapter: state.chapter, keys: keysTitle })">
        <p class="stage">{{ t("chapter", { chapter: state.chapter }) }}</p>
        <p class="keycaps" aria-hidden="true">
          <span v-for="(key, index) in newKeys" :key="index" class="cap">{{ key }}</span>
        </p>
        <p v-if="state.chapter < 3" class="keys-title">{{ keysTitle }}</p>
        <p class="record">{{ t("record", { dust: dustOf(state.route) }) }}</p>
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
          <span class="stars">{{ "★".repeat(starsOf(progress, state.route, level)) || "☆☆☆" }}</span>
        </button>
      </div>
      <p class="info">{{ t("levelInfo", { words: LEVELS[state.level].total }) }}</p>
      <button type="button" class="start" @click="start">{{ t("startButton") }}</button>
      <p class="small">{{ t("keysHelp") }}</p>
    </template>

    <template v-else-if="state.phase === 'play'">
      <div class="hud" aria-hidden="true">
        <span>{{ t("where", { chapter: state.chapter, level: state.level }) }}</span>
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
        <svg class="ship" :style="ship" viewBox="0 0 24 32" width="28" height="38">
          <path d="M12 1 L21 24 L12 19 L3 24 Z" fill="#e8ecff" />
          <circle cx="12" cy="12" r="3" fill="#6c7bd9" />
          <path d="M9 22 L12 30 L15 22 Z" fill="#ffd166" />
        </svg>
      </div>
      <div class="shield" aria-hidden="true">
        <div class="bar"><div class="fill" :style="{ width: `${state.shield}%` }"></div></div>
        <span>{{ t("shield", { shield: state.shield }) }}</span>
      </div>
      <p v-if="pickedWord !== ''" class="picked-word" aria-hidden="true">{{ t("typing", { word: pickedWord }) }}</p>
      <p v-if="state.level < 3" class="hint" aria-hidden="true">{{ hint }}</p>
      <Keyboard
        v-if="state.level === 1"
        :layout="course.layout"
        :next="aimChar"
        :shift-keys="shiftSide"
        :known="knownKeys"
        :legend="legend"
      />
      <p class="small">{{ t("escape") }}</p>
    </template>

    <template v-else>
      <h2 class="result">{{ t(state.phase === "won" ? "wonTitle" : "lostTitle") }}</h2>
      <p v-if="state.phase === 'lost'">{{ t("lostText") }}</p>
      <p v-else class="stars big">{{ "★".repeat(state.stars) }}{{ "☆".repeat(3 - state.stars) }}</p>
      <p v-if="state.phase === 'won'" class="small">{{ t("starsInfo") }}</p>
      <p>
        {{ t("summary", { destroyed: state.destroyed, total: state.total, accuracy, score: state.score }) }}
      </p>
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
        <button type="button" class="primary" @click="emit('input', { kind: 'action', name: 'again' })">
          {{ t("again") }}
        </button>
        <button
          v-if="state.phase === 'won' && state.level < 3"
          type="button"
          @click="emit('input', { kind: 'action', name: 'next' })"
        >
          {{ t("next") }}
        </button>
        <button type="button" @click="emit('input', { kind: 'action', name: 'menu' })">{{ t("map") }}</button>
      </div>
    </template>
  </section>
</template>

<style>
.interactive-routes {
  display: none;
}
</style>

<style scoped>
.game {
  padding: 1rem;
  border: 3px solid #5ce1e6;
  border-radius: 1rem;
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

.marquee {
  text-align: center;
}

.logo {
  margin: 0;
  color: #5ce1e6;
  font-size: clamp(2rem, 9vw, 3.5rem);
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
  gap: 0.6rem 1.1rem;
  margin: 1rem 0;
}

.planet {
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
  margin: 0.8rem 0;
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
  text-align: center;
}

.start {
  display: block;
  margin: 0.8rem auto;
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
  .start {
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
  height: 22rem;
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

.picked-word {
  margin: 0.4rem 0;
  color: #ffd166;
  font-weight: 600;
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
  margin: 0.5rem 0;
  font-weight: 600;
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
