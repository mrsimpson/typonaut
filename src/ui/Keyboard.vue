<script setup lang="ts">
// The keyboard of the layout with the fingers in colour: it shows the key to type next and flashes a key typed wrong.
// Only a hint for the first level, the text above it says the same in words. The rows are staggered like those of a real
// keyboard, with Shift at the ends of the bottom row and the space bar in the middle, and the keyboard sits in the
// middle of the screen.
import type { Layout } from "../core/course.ts";

defineProps<{
  layout: Layout;
  next: string;
  shiftKeys: string;
  known: string;
  legend: string[];
  /** The key typed wrong last and how many wrong keys there were: a new count flashes the key again. */
  wrong: string;
  wrongCount: number;
}>();

/** How far each row starts from the left edge of the number row, in keys, as on a real keyboard. */
const STAGGER = [0, 0.5, 0.75, 1.25];

const fingerClass = (layout: Layout, key: string): string => `f-${layout.fingers[key] ?? "none"}`;
const baseOf = (layout: Layout, char: string): string => layout.shifted[char] ?? char.toLowerCase();
</script>

<template>
  <div class="keyboard" aria-hidden="true">
    <div v-for="(row, index) in layout.rows" :key="row" class="row">
      <span v-if="index === 3" class="key shift left" :class="{ next: shiftKeys === 'l' }">⇧</span>
      <span v-else class="gap" :style="{ width: `calc(${STAGGER[index] ?? 0} * (var(--k) + var(--g)))` }"></span>
      <span v-if="index === 3" class="gap" :style="{ width: `calc(0.1 * var(--k))` }"></span>
      <span
        v-for="(key, at) in row.split('')"
        :key="`${at}-${key === baseOf(layout, wrong) ? wrongCount : 0}`"
        class="key"
        :class="[
          fingerClass(layout, key),
          {
            next: key === baseOf(layout, next),
            unknown: !known.includes(key),
            bump: key === 'f' || key === 'j',
            flash: wrong !== '' && key === baseOf(layout, wrong),
          },
        ]"
        >{{ key }}</span
      >
      <span v-if="index === 3" class="key shift right" :class="{ next: shiftKeys === 'r' }">⇧</span>
    </div>
    <div class="row">
      <span class="gap" :style="{ width: `calc(3.5 * (var(--k) + var(--g)))` }"></span>
      <span class="key wide f-thumb"></span>
    </div>
    <div class="legend">
      <span class="chip f-lp">{{ legend[0] }}</span>
      <span class="chip f-lr">{{ legend[1] }}</span>
      <span class="chip f-lm">{{ legend[2] }}</span>
      <span class="chip f-li">{{ legend[3] }}</span>
      <span class="chip f-thumb">{{ legend[4] }}</span>
    </div>
  </div>
</template>

<style scoped>
.keyboard {
  --k: min(2.6rem, calc((100vw - 5rem) / 14.5), 5.5vh);
  --g: 0.2rem;

  align-self: center;
  box-sizing: content-box;
  width: fit-content;
  max-width: 100%;
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem;
  background: #1c2557;
}

.row {
  display: flex;
  gap: var(--g);
  margin-bottom: var(--g);
}

.gap {
  flex: none;
  margin-right: calc(-1 * var(--g));
}

.key {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: var(--k);
  height: var(--k);
  border-radius: 0.25rem;
  background: #aab2d9;
  color: #0d1330;
  font-family: ui-monospace, monospace;
  font-size: calc(var(--k) * 0.42);
  line-height: 1;
}

.bump::after {
  position: absolute;
  bottom: 18%;
  width: 36%;
  height: 2px;
  border-radius: 1px;
  background: currentcolor;
  content: "";
}

.wide {
  width: calc(6 * var(--k));
}

.shift {
  width: calc(1.15 * var(--k));
}

.shift.right {
  width: calc(1.9 * var(--k));
}

.f-lp,
.f-rp {
  background: #f4b6c2;
}

.f-lr,
.f-rr {
  background: #f9d29d;
}

.f-lm,
.f-rm {
  background: #f6ea8c;
}

.f-li,
.f-ri {
  background: #b9e3a1;
}

.f-thumb {
  background: #c9b8ff;
}

.unknown {
  opacity: 0.35;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.4rem;
}

.chip {
  padding: 0.05rem 0.4rem;
  border-radius: 0.25rem;
  color: #0d1330;
  font-size: 0.75rem;
}

.next {
  z-index: 1;
  outline: 3px solid #ffffff;
  background: #ffffff;
  transform: scale(1.15);
}

.flash {
  animation: flash 0.5s ease-out;
}

@keyframes flash {
  from {
    background: #ff5c7a;
    opacity: 1;
    transform: scale(1.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flash {
    animation: none;
    outline: 2px solid #ff5c7a;
  }
}
</style>
