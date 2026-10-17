<script setup lang="ts">
// The keyboard of the layout with the fingers in colour: it shows the key to type next. Only a hint for the first
// level, the text above it says the same in words.
import type { Layout } from "../core/course.ts";

defineProps<{ layout: Layout; next: string; shiftKeys: string }>();

const fingerClass = (layout: Layout, key: string): string => `f-${layout.fingers[key] ?? "none"}`;
const baseOf = (layout: Layout, char: string): string => layout.shifted[char] ?? char.toLowerCase();
</script>

<template>
  <div class="keyboard" aria-hidden="true">
    <div
      v-for="(row, index) in layout.rows"
      :key="row"
      class="row"
      :style="{ marginLeft: `calc(${index * 0.6} * var(--k))` }"
    >
      <span
        v-for="key in row.split('')"
        :key="key"
        class="key"
        :class="[fingerClass(layout, key), { next: key === baseOf(layout, next) }]"
        >{{ key }}</span
      >
    </div>
    <div class="row space">
      <span class="key shift" :class="{ next: shiftKeys === 'l' }">⇧</span>
      <span class="key wide f-thumb"></span>
      <span class="key shift" :class="{ next: shiftKeys === 'r' }">⇧</span>
    </div>
  </div>
</template>

<style scoped>
.keyboard {
  --k: min(1.5rem, calc((100vw - 5rem) / 13));

  display: inline-block;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: #1c2557;
}

.row {
  display: flex;
  gap: 0.2rem;
  margin-bottom: 0.2rem;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--k);
  height: var(--k);
  border-radius: 0.25rem;
  background: #aab2d9;
  color: #0d1330;
  font:
    0.8rem/1 ui-monospace,
    monospace;
}

.wide {
  width: calc(5 * var(--k));
}

.shift {
  width: calc(1.8 * var(--k));
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

.next {
  outline: 3px solid #ffffff;
  background: #ffffff;
  transform: scale(1.15);
}
</style>
