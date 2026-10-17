// The sounds of the game, made with the Web Audio API: no files to load. The audio context starts on the first sound,
// which always follows a key or a click, as browsers demand. Without Web Audio, or when sound is off, nothing happens.

let context: AudioContext | undefined;
let enabled = true;

export const setSound = (on: boolean): void => {
  enabled = on;
};

function audio(): AudioContext | undefined {
  if (!enabled) return undefined;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return undefined;
  }
}

/** One note: from `from` Hz to `to` Hz in `length` seconds, starting `delay` seconds from now. */
function note(from: number, to: number, length: number, type: OscillatorType, volume: number, delay = 0): void {
  const ctx = audio();
  if (ctx === undefined) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + length);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + length);
}

/** A pentatonic scale, so that a run of right words always sounds nice. */
const SCALE = [0, 2, 4, 7, 9];
const hertz = (step: number): number => 392 * 2 ** ((SCALE[step % 5] ?? 0) / 12 + Math.floor(step / 5));

export const sounds = {
  key: (): void => note(880, 940, 0.05, "square", 0.025),
  error: (): void => note(180, 90, 0.18, "sawtooth", 0.07),
  /** A word typed: the higher the combo, the higher the chime. */
  hit: (combo: number): void => {
    const step = Math.min(combo, 14);
    note(hertz(step), hertz(step) * 1.5, 0.22, "triangle", 0.09);
    note(hertz(step) * 2, hertz(step) * 2, 0.12, "sine", 0.04, 0.05);
  },
  miss: (): void => note(120, 50, 0.4, "sawtooth", 0.09),
  milestone: (): void =>
    [0, 2, 4, 5].forEach((step, index) => note(hertz(step + 5), hertz(step + 5), 0.16, "triangle", 0.08, index * 0.07)),
  win: (): void =>
    [0, 2, 4, 7, 9].forEach((step, index) =>
      note(hertz(step + 3), hertz(step + 3), 0.3, "triangle", 0.09, index * 0.11),
    ),
  lose: (): void =>
    [4, 2, 0].forEach((step, index) => note(hertz(step), hertz(step) * 0.9, 0.35, "sine", 0.08, index * 0.18)),
};
