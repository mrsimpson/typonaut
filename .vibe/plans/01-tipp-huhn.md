---
# Read by the git hooks, the review and the evals.
# Schema: @lernapps/tooling/guidance/plan-front-matter.v1.schema.json. Keep all three keys.
# archetype: the kind of app, chosen at the end of Explore: explainer, interactive or quiz. null until then.
archetype: interactive
# phase: the phase you work in now: explore, plan, code or commit. Change it when you enter the next phase.
phase: explore
# prePushFailures: failed runs of the pre-push hook. The hook counts them. Never change this value.
prePushFailures: 0
---

# Plan: Tipp-Huhn, first version

<!--
This file guides you, the assistant, through the first version of an app, and shows the creator where you are.
- Keep it at .vibe/plans/01-<short name>.md. Read it before each step. Each later increment gets a plan of its own,
  from the increment template.
- Read each skill and page this plan names in full, from its file: a skill where `npx skills add lernapps/tooling`
  installed it, a page downloaded unchanged. Never work from the summary of a fetch tool: it loses tasks and rules.
- Work through one phase at a time: Explore, Plan, Code, Commit. Do the tasks of the current phase in order.
- Tick a task when it is done and move it to "Completed" of its phase. Add tasks as you find them.
- A task marked as a checkpoint means: stop, show the creator what they need to decide, and wait for their answer.
- Work on the branch `work`, from the first commit on, until the first publish: before it, if your environment asks
  you to push, push `work` only. The first publish, in Commit, creates `main`; from then on, push `main` as the Commit
  tasks say. While a check fails, tell the creator instead of pushing.
- Write the plan in the language you talk to the creator in. Keep the headings and the front matter keys as they
  are: the review reads them.
- Delete these comments only where you have filled the part they explain.
-->

*Started on 2026-10-17. Workflow: Explore, Plan, Code, Commit.*

## Goal

<!-- One or two sentences: what learners do in the app, and what they learn or train by it. Fill it in Explore. -->

## Key decisions

<!--
One line each: the decision and why. The archetype is the first one. Add decisions in any phase.
Mark a choice you made without asking the creator with "(guess)", and list it in the retrospective.
-->

- Archetype interactive: das Spiel (Wörter fliegen, abtippen) ist selbst der Inhalt; keine Erklärseiten nötig.
- Lehrgang als Daten je Layout (QWERTZ/Deutsch, QWERTY/Englisch), Reihenfolge nach dem Schwyzer Leitfaden: Grundreihe, Großbuchstaben, dann paarweise neue Tasten.
- Veröffentlichung unter https://mrsimpson.github.io/tipp-huhn/ (aus dem Repo-Owner abgeleitet).
- Ersteller im Eintrag: "mrsimpson" (guess: Name nicht genannt, Repo-Owner verwendet).
- Oberfläche (Texte) zunächst nur Deutsch (guess); Übungswörter und Layout deutsch und englisch.
- Nur mit Hardware-Tastatur gedacht, nicht fürs Handy; das und der Zeitdruck kommen als "limits" in den Eintrag (guess).
- Ruhige Gestaltung für Kinder: kein Blitzen, Explosion als sanfte Funken, Ton standardmäßig aus (Rat der Skill-Doku).

## Notes

<!-- What you need later: sources and licences of content, links, open questions. -->

Curriculum orientation: no Lehrplan of a German Land was found that fixes keyboarding (search found none; not checked
in the official documents of the Länder). Orientation instead: Lehrplan 21 (Schweiz), where Tastaturschreiben sits in
Deutsch D.4.A.e (Zyklus 2) and in Medien und Informatik; found only via a search summary, the Lehrplan itself not
opened: NOT CHECKED.

Verified source (downloaded and read): Kanton Schwyz, Amt für Volksschulen und Sport, "Leitfaden Tastaturschreiben"
(Version 2024), https://www.sz.ch/public/upload/assets/65825/Leitfaden_Tastaturschreiben.pdf. Licence: © of the
authors, no free licence seen: take facts, not sentences. Facts used:
- Ziel Ende Klasse 6: 500 Anschläge in 10 Min (50/Min), max. 3 Fehler; Klasse 4/5: 350 Anschläge/10 Min, <5 % Fehler.
  Perfektes Blindschreiben ist ausdrücklich nicht Ziel; Fokus auf Buchstaben (auch Umlaute) und gängige Satzzeichen.
- Reihenfolge (Anhang 2, Levels): 1 asdf jklö; 2 Großbuchstaben (Umschalttaste mit dem kleinen Finger der Gegenhand,
  schon ab Lektion 3); 3 gh; 4 ei; 5 ru; 6 tz; 7 wo; 8 pq und ?; 9 bn; 10 vm; 11 c ,; 12 x .; 13 y - ä; 14 ü Ä Ö Ü;
  15 Ziffern und Sonderzeichen. Je Level ca. 2 neue Zeichen samt Großbuchstaben; je Zeichenpaar: Einführung,
  Wörter, Abschreibtext, Wiederholung.
- Methodik (Kap. 6): Genauigkeit vor Tempo; jeder Finger nur für seine Tasten; Finger nach jedem Anschlag zurück
  in die Grundstellung (Fühlpunkte F/J); Großbuchstaben mit beiden Händen; nicht auf die Tastatur schauen von
  Anfang an; kurze, verteilte Übungseinheiten (10 bis 15 Min, mehrmals pro Woche) wirken besser als lange Blöcke;
  Tempo am Anfang bewusst langsam; Lektion erst wiederholen, wenn nicht bestanden.
- Hinweis: Das ist die Schweizer Tastatur (ö/ä auf der Grundreihe, kein ß, é è à). Die deutsche Belegung (DIN 2137)
  weicht ab (ß, ä am rechten Rand der Grundreihe, ü rechts neben p): NOT CHECKED, vor dem Plan an einer Quelle
  prüfen.

Not found: a controlled study comparing lesson orders. Home row first, then the reaches, is the common practice of
school curricula, not an evidence-backed optimum. The search result pages (ERIC ED313002 on Dvorak and children,
UK scheme of work) were seen only as search snippets, not opened.

Competencies by chapter (draft, for the checkpoint):
1. Grundstellung: Ich kann meine Finger in die Grundstellung (asdf jklö) legen und die Fühlpunkte auf F und J finden. /
   Ich kann die Grundreihe tippen, ohne auf die Tastatur zu schauen.
2. Großschreibung: Ich kann Großbuchstaben mit der Umschalttaste der anderen Hand tippen.
3. Innere Tasten (g h) und Mittelfinger (e i), dann r u, t z: Ich kann ... mit dem richtigen Finger tippen und danach
   den Finger zur Grundstellung zurückbringen.
4. Obere und untere Reihe (w o, p q, b n, v m, c x), Satzzeichen (. , ? -).
5. Umlaute und ß, y: je nach Layout.
6. Wörter und Sätze: Ich kann einen kurzen Text fehlerarm abtippen.


## Explore

<!--
Find out what the app is for, for whom, and what the app overview needs to help adults find it.
Ask the creator; write no code. Ask one or two questions per turn, in plain words. Do not ask what you can derive
from earlier answers. Write each answer under "Answers".
-->

### Tasks

- [x] Install the skills, if they are not installed yet: `npx skills add lernapps/tooling`. The app commits them.
- [x] Ask what the app is for: what do learners do in it, and what do they learn or train?
- [x] Ask who the learners are: subject, school year, what they know already.
- [x] Ask where the content comes from: written by the creator, or taken from others (with source and licence)?
- [x] Research the content: load the skill `lernapps-content-research` and follow it (in an app whose
      `.agents/skills/app-content/SKILL.md` is filled in, load that first; it takes precedence). Write the curriculum
      orientation (the Lehrplan, cited where you used one), the competencies by chapter and the verified sources
      under "Notes".
- [x] Fetch the entry schema of the app overview: https://lernapps.net/apps/schemas/entry.v1.schema.json. Read the
      description of every property. Ask the creator what it needs to help adults (teachers, parents) find the app.
      Fill the "Entry draft" from the answers.
- [x] Choose the archetype from the answers: `explainer` (many pages of explanation and exercises), `interactive`
      (one app page in the browser, plus a static start page) or `quiz` (questions with options and feedback).
      Write it under "Key decisions" with the reason; set `archetype`.
- [ ] **Checkpoint:** research. Explain to the creator, in plain words, what you found and how: the curriculum
      orientation, the competencies by chapter, the sources and how you checked them, what you could not check, and
      the archetype with its reason. Stop and wait for the creator. Change it if they ask, then ask again.
- [ ] Set `phase: plan`.

### Answers

<!-- The creator's answers, in their words, one bullet per question. -->

- Zweck: verspielte Version eines Zehn-Finger-Schreiblernprogramms für Kinder. Klassischer Lehrgang (Grundreihe, dann Schritt für Schritt die Tastatur erforschen). Die zu tippenden Zeichenfolgen fliegen wie im Spiel „Moorhuhn“ in einer Parabel über den Bildschirm und müssen abgetippt werden; ist die Folge getippt, explodiert das Wort und es gibt Punkte, mehr für schwierige Wörter.
- Lernende: Start bei null, kein Vorwissen. Tastaturschreiben steht nicht im klassischen Lehrplan, es ist eher eine digitale Kompetenz.
- Klassenstufen: ab 3., nach oben offen.
- Sprache/Layout: Deutsch und Englisch, mit je eigenem Tastaturlayout (QWERTZ, QWERTY) und eigenen Zeichenfolgen/Wörtern.
- Veröffentlichung: im persönlichen Repo mrsimpson/tipp-huhn auf GitHub Pages.
- Auftrag: Recherchieren, welche Lernreihenfolge didaktisch sinnvoll ist; sie hängt von Tastaturlayout und Sprache ab.

### Entry draft

<!--
The entry of the app in the app overview, as YAML that validates against the entry schema. Use the schema's
property names; its descriptions say what each one needs. Fill it from the answers; never invent a value. Leave out
what is not known yet, such as the app's address before it is published. The listing completes it.
-->

```yaml
title: Tipp-Huhn
subject: Informatik
grades: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
summary: >-
  Lerne das Zehnfingersystem Schritt für Schritt, von der Grundreihe bis zur ganzen Tastatur.
  Wörter fliegen in einem Bogen über den Bildschirm; tippst du sie richtig ab, explodieren sie
  und du sammelst Punkte. Mit deutscher und englischer Tastatur.
url: https://mrsimpson.github.io/tipp-huhn/
creator:
  name: mrsimpson
source: https://github.com/mrsimpson/tipp-huhn
keywords: [Zehnfingersystem, Tastaturschreiben, Tippen lernen, Schreibtraining, Tastatur, Spiel]
limits: >-
  Nicht für Screenreader und nicht für das Handy gedacht: Die App braucht eine Tastatur,
  und das Spiel läuft unter Zeitdruck.
fitness:
  account: false
  install: false
  storage: device
  thirdParty: none
```

### Completed

## Plan

<!--
Turn the answers into tasks the creator can confirm in one read. After the confirmation you work on your own: the
creator's turns from here to the listing are counted in the retrospective (target: at most 3).
-->

### Tasks

- [ ] Write the tasks of Code under "Code": the pages or screens, the content, and what each must show. Each task
      ends in a commit.
- [ ] Write the content method under "Content method": load the skill of the archetype and the skill
      `lernapps-exercise-patterns`, and decide with them how you will make the content.
- [ ] Show the creator the goal, the competencies by chapter, the entry draft and the tasks, short. Explain the
      content method in plain words: what learners will see and do, and what it cannot do.
- [ ] For every component and interactive exercise, show a sketch: a static SVG or image of what learners see, or
      the steps (what they do, what they see after each). A description in words alone is not enough.
- [ ] **Checkpoint:** confirm the plan and the content method. Stop and wait for the creator. Change the plan if they
      ask, then ask again.
- [ ] Set `phase: code`.

### Content method

<!--
How you will make the content, one line each, so the creator can judge it: the exercise patterns and where each is
used; the figures and how they are made; data files for material used more than once; each component, what it
checks and what it cannot; how a later agent adds a chapter. In Code, it becomes the content guide.
-->

### Completed

## Code

<!--
Generate the app, then build it task by task. Load the skill lernapps-app and the skill of the archetype before you
write code. Commit after each task: the git hooks run the checks. The pre-commit hook is quiet: when it fails, it
prints one line naming the step and its log, `node_modules/.cache/lernapps/pre-commit.log`; read that log for the
messages. Fix every failed check from its message; never bypass a hook. When you cannot decide something, choose, mark it "(guess)" under "Key decisions" and go on.

The generator needs git, Node 22.18 or later and the network: github.com and codeload.github.com for the tooling, the
template and the runtime, and the npm registry (registry.npmjs.org) for the other dependencies. If the sandbox blocks
one of them, stop and ask the creator to allow it, then run the command again. Never write the app by hand.
-->

### Tasks

- [ ] Generate the app in the folder that holds this plan: `npx --yes github:lernapps/tooling#main create --archetype
      <archetype>`. Nothing needs to be installed first. The generator keeps this plan where it is.
- [ ] Run `git init --initial-branch=work` if the folder is not a git repository yet; in one, `git switch -c work` if
      you are not on `work` yet. Then run `npm install`: it installs the dependencies and the git hooks. From now on,
      everything runs from the app's own `node_modules`: `npx lernapps check`, the hooks.
- [ ] Commit what the generator wrote, with this plan: the first commit.
- [ ] Load the skill `lernapps-app` and the skill of the archetype.
- [ ] Fill in the content guide `.agents/skills/app-content/SKILL.md`, which the generator wrote, from the confirmed
      plan and its content method, before you build the content: replace every "FILL IN" with precise, concrete
      instructions, as its comments show (the skill `lernapps-exercise-patterns` helps with its patterns). Commit it.
      Whenever a content decision changes later, update it in the same commit: this plan records the run, the guide
      stays for the agents after you.
- [ ] <the tasks written in Plan>
- [ ] `npx lernapps check` passes.
- [ ] Set `phase: commit`.

### Completed

## Commit

<!--
Publish the app and list it, each only after the creator says yes. Then fill the retrospective.
A push to `main` publishes the app: the workflow `Pages` checks it and, in its job `deploy`, publishes the checked
bundle to the repo's GitHub Pages, at the repo's own address (usually https://<owner>.github.io/<repo>/). So work on
the branch `work` until the creator says yes; the first publish creates `main`.
The repo's default branch must be `main`: only `main` publishes, and update pull requests (Renovate) and new pull
requests target the default branch. A repo whose first push was `work` has `work` as its default branch until it is
changed.
A push to `main` that changes only the plan (`.vibe/`) starts a run of `Pages` that checks and publishes nothing:
push the plan whenever a task says so. Every push to `main` must start a run of `Pages`. If none has started a minute
after the push (`gh run list --workflow Pages --branch main --commit <commit>` lists none), start it:
`gh workflow run Pages --ref main`.
-->

### Tasks

- [ ] Push the branch `work` (not `main`): `git push -u origin work`. The pre-push hook runs the heavy checks; fix
      what fails.
- [ ] Check the repo's settings on GitHub: the default branch (`gh repo view --json defaultBranchRef`) and GitHub
      Pages (`gh api repos/<owner>/<repo>/pages`; "Not Found" means it is off). For each one that is not right and
      that you may not change, note the clicks of a repository admin:
      - Pages, once the first run has created the branch `gh-pages`: Settings → Pages → Build and deployment →
        Source: Deploy from a branch → Branch: gh-pages, folder: / (root) → Save.
      - The default branch, once `main` is pushed: Settings → General → Default branch → ⇄ (Switch to another
        branch) → main → Update.
- [ ] **Checkpoint:** publish. Ask the creator before the app goes online, and wait for their yes. Put the clicks you
      noted into the same question, to make after the first run, so that they cost no extra turn.
- [ ] Create `main` from `work` and push it: `git switch -c main`, `git push -u origin main`. Check that a run of
      the workflow `Pages` started for this commit:
      `gh run list --workflow Pages --branch main --commit "$(git rev-parse HEAD)"`. GitHub may start none for a
      push that creates a branch from commits it already has. If none is listed a minute after the push, start it:
      `gh workflow run Pages --ref main`. Watch the run until it ends (for example `gh run watch`, or the Actions
      tab of the repo). If it fails, read the message of the failed step: fix what you can and push again. For a
      setting only a repository admin may change: if the creator agreed to the clicks at the checkpoint, wait until
      the setting is made (for example `gh api repos/<owner>/<repo>/pages` names `gh-pages`) and run the failed jobs
      again (`gh run rerun <id> --failed`); otherwise tell the creator the exact clicks the message names, and run
      them again when they are done.
- [ ] Set the default branch to `main`: `gh repo edit --default-branch main`, or the creator's clicks from the
      checkpoint. The run of `Pages` warns while it is another branch.
- [ ] Open the address the job `deploy` printed ("published at ...", also in the run's summary) and confirm that it
      shows the app. Take that address, never one you derive: a repo whose owner has its own domain is served there,
      and its github.io address only redirects to it. The job ends only once the app answers at that address, so do
      not wait for it yourself; when you open an address, follow its redirects.
- [ ] Load the skill `lernapps-listing`.
- [ ] Complete the entry draft with what is known now, such as the app's address.
- [ ] **Checkpoint:** list. Ask the creator before you open the listing pull request, and wait for their yes.
- [ ] Fill the retrospective.
- [ ] Commit this plan on `main` and push it: the listing check and the review read it, with the filled
      retrospective, in the repo. A push that changes only `.vibe/` publishes nothing again.
- [ ] Open the listing pull request as the skill says, and see it through to "bestanden": when the check passes, the
      results comment on the pull request says "bestanden" (not "nicht bestanden").
- [ ] If this plan changed since its last push, commit it on `main` and push it again.

### Completed

## Retrospective

<!--
Fill it at the end of Commit, before the listing pull request: facts, short, no names of people. The review reads
it with the listing; the evals compare it across runs. It stays in the creator's repo.
-->

### Phases reached

<!-- The last phase you completed and the checkpoints the creator passed. Example: "commit; confirmed, published". -->

### Failed checks

<!--
Each check that failed, with its rule id and how often. Example: "`no-request-before-click`: 2".
Leave out the failed pre-push runs: the hook counts them in the front matter.
-->

### Creator turns after the plan

<!-- How many messages the creator sent after confirming the plan, and what each was about. Target: at most 3. -->

### Where I had to guess

<!--
Each place where this plan, a skill, a message or the creator's answers did not tell you what to do, and what you
chose. Write "None" if there was none.
-->
