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
      <h2 class="course">{{ t(`course.${state.course}`) }}</h2>
      <nav class="chapters" :aria-label="t('chapters')">
        <a
          v-for="chapter in course.chapters"
          :key="chapter.id"
          class="chapter"
          :href="`#${routeOf(state.course, chapter.id)}`"
          :aria-current="chapter.id === state.chapter ? 'true' : undefined"
        >
          <span class="number">{{ chapter.id }}</span>
          <span class="keys">{{ chapterTitle(chapter.id, chapter.keys) }}</span>
          <span class="stars">{{
            "★".repeat(Math.max(...(progress[routeOf(state.course, chapter.id)]?.stars ?? [0])))
          }}</span>
          <span class="dust">{{ dustOf(routeOf(state.course, chapter.id)) }} ✦</span>
        </a>
      </nav>
      <p class="other">
        <a :href="`#${state.course === 'de' ? 'en' : 'de'}-1`">{{
          t(`switchTo.${state.course === "de" ? "en" : "de"}`)
        }}</a>
      </p>
      <h3>
        {{
          t("chapterTitle", {
            chapter: state.chapter,
            keys: chapterTitle(state.chapter, course.chapters[state.chapter - 1]?.keys ?? ""),
          })
        }}
      </h3>
      <div class="levels">
        <button
          v-for="level in levels"
          :key="level"
          type="button"
          class="level"
          :class="{ chosen: level === state.level }"
          :aria-pressed="level === state.level"
          @click="choose(level, $event)"
        >
          {{ t(`level${level}`) }}
          <span class="stars">{{ "★".repeat(starsOf(progress, state.route, level)) }}</span>
        </button>
      </div>
      <p>{{ t("levelInfo", { words: LEVELS[state.level].total }) }}</p>
      <button type="button" class="primary" @click="start">{{ t("start") }}</button>
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

<style scoped>
.game {
  padding: 1rem;
  border-radius: 0.5rem;
  background: #0f1535;
  color: #e8ecff;
}

h2,
h3 {
  margin: 0.25rem 0 0.5rem;
}

a {
  color: #ffd166;
}

.chapters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chapter {
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  gap: 0 0.4rem;
  min-width: 8rem;
  padding: 0.4rem 0.6rem;
  border: 2px solid #3a4585;
  border-radius: 0.5rem;
  color: #e8ecff;
  text-decoration: none;
}

.chapter[aria-current="true"] {
  border-color: #ffd166;
  background: #1c2557;
}

.number {
  grid-row: span 2;
  align-self: center;
  font-weight: 700;
}

.stars,
.dust {
  color: #ffd166;
  font-size: 0.85rem;
}

.levels,
.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.chosen,
button[aria-pressed="true"] {
  border-color: #ffd166;
}

.primary {
  border-color: #4cc9a7;
  background: #4cc9a7;
  color: #0f1535;
  font-weight: 700;
}

.small {
  color: #b8c0f0;
  font-size: 0.9rem;
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
