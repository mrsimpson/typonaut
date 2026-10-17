---
name: app-content
description: Use for any content work in this app - researching, writing, extending, correcting or reviewing its competencies, chapters, pages, rounds, questions, exercises, figures, terms or sources. This app's own content decisions; they take precedence over the generic lernapps content skills. Load it before you change any content.
---

# Content guide of this app

<!--
The standing guide to this app's content, for every agent that works on it after you: what the app teaches, from
which curriculum, and how its content is built. The generator wrote it as a skeleton.

- Fill in every "FILL IN" once the creator has confirmed the plan, before you build the content. Keep the headings:
  `lernapps check` looks for them (rule app-content-guide), and fails on a "FILL IN" left once the plan is in Commit.
- Write precise, concrete instructions that a follow-up agent can act on without your conversation: name the files,
  ids, data files and examples of this app.
  - Vague: "Use varied exercises with figures where they help."
  - Concrete: "Every page ends with the section `uebung`: one `generated` exercise of the pattern 'Ohmsches Gesetz'
    (below), drawing from `src/data/widerstaende.yaml`, and one `matching` block of symbols and parts."
- When a content decision changes (a new pattern, a figure type, a source rule), change this file in the same
  commit. The plan file is the record of one run; this file is the guide that stays.
- Keep it free of personal data and of goals of one learner: it is public, in the app's repo.
-->

## Curriculum

Typonaut teaches touch typing (Zehnfingersystem) to children from grade 3 and anyone older who starts from zero. Tastaturschreiben is
not part of the Lehrplan of a German Land that was found; it is a digital competency. Orientation for the order and the
tempo: the Leitfaden Tastaturschreiben of the canton of Schwyz (Amt für Volksschulen und Sport, 2024, 
https://www.sz.ch/public/upload/assets/65825/Leitfaden_Tastaturschreiben.pdf), read in full: home row first, capitals from the third lesson, then new keys in pairs
(g h, e i, r u, t z, w o, q p, b n, v m, c and the comma, x and the full stop, last y and the umlauts); accuracy before speed; no
looking at the keyboard; short, spread-out sessions. The Lehrplan 21 (Deutsch D.4.A.e, Medien und Informatik) places it in the Swiss
second cycle; it was found only in a search summary and not opened: NOT CHECKED. The order is school practice, not an
evidence-based optimum; no study comparing orders was found. The app follows no school's own material.

## Competencies

Chapters are the 12 chapters of each course, `src/data/de.json` and `src/data/en.json` (`chapters[].id`, `keys`, `words`). A competency is
practised by the three levels of its chapter (level 1: runs of keys, level 2: words, level 3: mix with earlier chapters).

- Chapter 1 Grundreihe (de: a s d f j k l ö, en: a s d f j k l ;): Ich kann meine Finger in die Grundstellung legen und die Grundreihe tippen, ohne zu schauen.
- Chapter 2 Großbuchstaben: Ich kann Großbuchstaben mit der Umschalttaste der anderen Hand tippen.
- Chapters 3 to 11 (g h; e i; r u; t z (en: t y); w o; q p; b n; v m; c x , .): Ich kann diese Tasten mit dem richtigen Finger tippen und den Finger danach zur Grundreihe zurückbringen.
- Chapter 12 (de: y ä ü ß ? -, en: z ' ? -): Ich kann Sonderzeichen und die übrigen Buchstaben mit dem richtigen Finger tippen.
- All chapters: Ich kann Wörter fehlerarm abtippen und merke, welche Tasten mir noch schwerfallen (the analysis after a round).

## Content structure

A chapter is three levels, each a round with a fixed number of comets (`LEVELS` in `src/core/index.ts`):
level 1 has 10 runs of 2 to 4 keys (the chapter's new keys mixed with the keys of chapter 1; chapter 2: capital first), one comet at a time, with the keyboard hint
(`src/ui/Keyboard.vue`); level 2 has 10 words, two at a time, 70 % from the chapter's own `words`, 30 % from earlier chapters,
hint only as text; level 3 has 14 words, three at a time, mixed from all chapters up to this one, no hint. A round takes
about two to four minutes. Routes are `de-1` to `de-12` and `en-1` to `en-12` in `src/app.yaml`; the level is state of the core.

## Terminology

Learners are addressed with "du". Terms: Komet (a word in flight), Schutzschild (the energy, in percent), Sternenstaub (score;
the account per chapter), Kombo (words in a row without a wrong key), Grundreihe (a s d f j k l ö), Grundstellung (fingers on
the Grundreihe), Level, Kapitel. Avoid "Leben", "Strafe", "Game over" (the game does not punish; a lost level says "nochmal?").
English UI texts use: comet, shield, stardust, combo, home row. Fingers are named "linker/rechter Zeigefinger,
Mittelfinger, Ringfinger, kleiner Finger" (`finger.*` in `src/messages/de.json`).

## Exercise patterns

One pattern, "Komet abtippen" (competency: type the right key with the right finger, then whole words), expressed by the core:
the comet shows a word, the first letter picks it (the oldest comet with that first letter), a right letter colours the
tail, a wrong key costs 3 % shield and ends the combo, a comet that arrives costs 8 % plus 1 % per letter. What varies: the word source
(level), the number of comets, the speed. Success is checked as "the word was typed exactly, with Shift for capitals" and
nothing else. Every other correct way to reach the same key is not offered: only the finger is taught, not enforced.
Data file: `src/data/<course>.json`. Example: chapter 4 (e i), level 2: `Ei`, `Esel`, `Hase` appear and are typed in `src/playthroughs/woerter-kapitel-4.yaml`.
The analysis after a round lists the three keys with the most mistakes, the keys typed instead and the finger of the key.

## Figures

There are no bundled images. The look is an arcade cabinet: dark space, neon cyan and pink, monospace capitals, a stage select (a row of coloured planets for the chapters, keycaps for the new keys, three stage buttons, a pink START button); nothing flashes, the glow of START pulses slowly and stops with reduced motion. The keyboard (`src/ui/Keyboard.vue`) is drawn from the layout of the course, the fingers in
four colours (little finger, ring, middle, index) with dark text on light colour for contrast; the key to type next is white with an outline. It is decoration for
the hint, `aria-hidden`; the hint text says the same in words. The field with the comets is decoration; what happens is announced
(`announce`). Comets are plain text in a monospace font; no pictures, no sound, nothing flashes; reduced motion switches the wobble off.

## Sources

Verified by reading: Leitfaden Tastaturschreiben, Kanton Schwyz, 2024 (see Curriculum). Facts taken: the order of the keys, the
finger of each letter of lessons 6 to 54 (g h left/right index, e i middle, r u index, t z index, w o ring, q p little finger, b n index, v m index,
c and comma middle/right middle, x and full stop ring, ä ü right little finger), the methodic points (accuracy before speed, no looking, return to the
home row, distributed practice, 10 to 15 minutes), the goal of 500 strokes in ten minutes (not used as a target in the game). The text is the authors',
no free licence was seen: no sentence is copied. NOT CHECKED against a source: the finger of y, ß, - and ? on the German keyboard and of z, ', ? and - on the English one;
they follow the usual touch-typing charts. The words are written by the creator and the assistant, nothing is taken from word lists of others. No video and no second article is linked.
The creator's own material does not exist; nothing local is committed.

## Adding a chapter or round

1. To add words to a chapter or a whole chapter, edit `chapters` in `src/data/de.json` or `src/data/en.json`: `id`, `keys` (the keys the chapter introduces), `words`
   (only keys introduced up to this chapter; capitals only from chapter 2). Add its fingers to `layout.fingers` if a key is new.
2. Add the route `de-<n>` or `en-<n>` to `routes` in `src/app.yaml` with title and description in German and English; `chapters.length` must match.
3. Run `npx vp test`: `src/core/course.test.ts` rejects a word with a key not yet introduced, a missing finger and too few words (7 or more).
4. For a new language add `src/data/<lang>.json`, the course in `src/core/course.ts` (`COURSES`, `Course`), `course.<lang>` and the texts in every message file and `languages`.
5. Add or update a playthrough in `src/playthroughs/` for the behaviour; write the competency in `src/app.yaml` and in this guide;
   update `docs/arc42/` in the same commit; run `npx lernapps check`; commit. The end-to-end tests type on a US keyboard: playthroughs must not type ö, ä, ü or ß.

## Rules learned from mistakes

- The end-to-end tests cannot press ö, ä, ü or ß: pick a seed whose typed words have none (see `dec-playthroughs-us-keys`).
- Numbers over 999 show in announcements with a dot in German (`1.754`): write them so in playthroughs.
- The shell gives no key to a focused button or link: the root component keeps Tab from moving the focus in a round and takes the focus off a clicked level button; the core returns a new state object for keys that would scroll the page (space, arrows, Page, Home, End, Backspace), so the shell keeps their default away.
- A playtest with a bot at a child's tempo (1 to 1.6 s per key) lost levels 2 and 3 of the first version: the levels are slow on purpose (level 2: 10 words, a comet every 5 s at least, 14 to 16 s of flight; level 3: 14 words); change the numbers in `LEVELS` only with such a test.
- A word comes once per level, whatever its case (`used` in the state); the lists must not give a level fewer words than it draws, a short chapter 1 list (8 words) repeats after a retry.
- Words are only written in the case of German spelling: nouns capitalised, adjectives, numbers and `über` in lower case; capitals of other words only as sentence starts in chapter 2. No word that is rude in another language (`ass`).
- Level 1 drills cover the keys that no word of an early chapter can use (j and ; in English chapter 1, ö in German chapter 1).
