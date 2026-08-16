# Entrenamiento en Wano Kuni

Training log for calisthenics and capoeira, wrapped in a samurai progression.
Single user, no accounts, no backend: everything lives in the browser and leaves
only as a JSON backup the user downloads.

Live at **https://tmnfhm7cnh-lang.github.io/ENTRENAMIENTO-EN-WANO-KUNI/**

## Design rules

These are decisions, not preferences. Breaking one is a bug.

1. **The corda is never awarded by the app.** Muzenza cordas are given by the
   mestre at the yearly batizado. The app records which one you hold and when
   you got it; game progression runs on a separate axis (samurai ranks).
2. **The log is the only input; the character is a derived view.** XP, level,
   rank, the four attributes and every skill's progress are pure functions of
   logged sets, computed in `src/game/derive.ts` on each render and never stored.
   Nothing about the character can be typed, spent or clicked upward.
   This is also a bug-prevention rule: both defects found so far — the corda
   deduced from the game level, the avatar URL persisted with a build hash inside
   it — were derived things that had been written down.
3. **Nothing gives XP that is not real training.** No "practice" buttons, no
   debug shortcuts.
4. **The catalogue is a seed, not a cage.** Any movement, skill or exercise can
   be added from inside the app. Difficulty is tagged against anchor movements,
   not adjectives.
5. **The user owns the data.** localStorage is a cache; the exported JSON is the
   record.
6. **Exercises are called what they are called.** A skill is a movement the user
   actually trains, so it is named "Front lever", not "Enma's Horizontal
   Suspension". The Wano skin belongs to quests, ranks, lore and art — never on
   top of the training data, which has to stay comparable with the plain-text
   training log the user keeps outside this app. Renaming an exercise for
   flavour is the same bug as inventing a measurement.
7. **Nothing ships pre-filled.** No demo sessions, no starting progress, no
   invented marks. A diary that opens with fake entries cannot be trusted about
   the real ones — and it can never be taken back to zero, because wiping it
   restores the fakes.

## Music

Fully synthesised with Web Audio: no audio files, so there is nothing to license
and nothing to fetch. That is a constraint, not a taste — this repository is
public, so bundling a recording would mean publishing it.

- `src/audio/score.ts` — the written composition. Pure data plus arithmetic, no
  Web Audio, so it runs under `node tools/test-score.mjs`.
- `src/components/Soundtrack.tsx` — the instruments (shamisen, koto, shakuhachi,
  taiko, tsuzumi) and the clock.

Two things matter and are easy to undo by accident:

**There is a pulse.** Notes sit on a beat grid at a fixed tempo. The previous
engine had written phrases but randomised the gaps between them and the length of
every note, which is why it did not sound like music — a listener had no beat to
hold onto. Nothing in the score is random any more.

**Notes are scheduled ahead against `ctx.currentTime`**, not fired one per
`setTimeout`. A JS timer on a phone slips constantly; the audio clock does not.
The scheduler wakes every 60 ms and tops up a 350 ms lookahead window.

The composition is 16 bars at 96 bpm (40 s) in the **yo scale** on A, laid out as
jo-ha-kyū — slow opening, body, fast close — and looped. It is written to that
form with the instruments of the genre; it is not a transcription of any
particular piece.

**The scale is a decision, not a detail.** Japanese traditional music has two
scale families: *in* (陰), dark, built on semitone steps, and *yo* (陽), bright,
built without them. This was first written in Hirajoshi, which is *in*, and the
owner's verdict on hearing it was "muy fea y da miedo". No arrangement fixes
that — the scale was doing what that scale does. The test asserts the reason
rather than the notes: no semitone step anywhere in the scale. Three sound-design
choices were doing horror by accident alongside it, and are documented in the
commit: a 72 bpm funeral tempo, a taiko sweeping to 28 Hz like a trailer sub-boom,
and a flute whose pitch wavered across every long note.

If a licensed recording is ever chosen instead, it goes in `public/`, its
attribution goes in this file, and `Soundtrack.tsx` becomes a looping `<audio>`
element — a smaller file than it is now.

## Running it

Requires Node 24+.

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm run build    # production bundle into dist/
npm run icons    # regenerate the PWA icons from tools/make-icons.mjs

node tools/test-score.mjs       # the music: grid, loop, pulse, scheduler windowing
node tools/test-exercises.mjs   # the catalogue, and its link to the skill tree
node tools/test-derive.mjs      # the economy: no XP without logging, attributes that fall
```

Pass `tools/test-exercises.mjs` the path to the owner's `sesiones.csv` and it also asserts that
every exercise already logged in the real training record exists in the catalogue. Run it that way
whenever that file gains an exercise.

## The economy

Calibrated to **four sessions a week**, which is what his training plan actually has — v2 cut it
from seven slots to four, and to three during September. The planning document still said six, and
calibrating to six would mean the game reporting that he is behind while he follows his own plan
exactly. For someone whose stated problem is sustaining rather than remembering, that is the worst
failure mode available.

`tools/test-derive.mjs` locks the design decisions rather than the constants, so the numbers can be
re-tuned against real sessions without losing the meaning:

- A full season at target, never missing a week, reaches ~66% of the season. **Turning up cannot
  finish it** — the last third has to come from achievements.
- Attributes are computed from a rolling 28-day window, so they fall on their own when training
  stops. No punishment logic exists anywhere; that is the whole mechanism.
- Missing a week breaks the streak and nothing else. No XP is ever lost or negative.
- A skill only advances by logging the movement it trains.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages. One-time setup in the repository:
**Settings → Pages → Source: GitHub Actions**.

**Bump `CACHE` in `public/sw.js` whenever you deploy.** The service worker
serves cached assets first, so phones that already installed the app will keep
running the previous version until the cache name changes.

The Pages base path is hardcoded in `vite.config.ts`; renaming the repository
means changing it there too.

## Layout

```
src/App.tsx                  application state and game rules
src/types.ts                 domain types
src/data/initialData.ts      starting skills and quests (no pre-filled progress)
src/data/exercises.ts        exercise catalogue, ids shared with the owner's sesiones.csv
src/game/derive.ts           the character, computed from the log — nothing here is stored
src/audio/score.ts           the music, as data — no Web Audio, runnable in Node
src/utils/muzenza.ts         Muzenza corda sequence (reference data)
src/utils/storage.ts         localStorage + JSON backup/restore
src/components/              UI
tools/make-icons.mjs         PNG icon generator (no image dependencies)
tools/test-*.mjs             assertions, run straight from source with no build step
public/                      manifest, service worker, icons
```

## Status

Phase 0 (persistence, PWA, cleanup) is done, and verified on a real iPhone on
2026-08-14: a logged session survives the app being killed from the app switcher,
which was the one failure that would have invalidated the whole thing.

`src/game/derive.ts` and `src/data/exercises.ts` are the foundation of Phase 1 and
are finished and tested. **What is missing is the wiring**: `App.tsx` still keeps
the character in state and still accepts free-text log entries, so the derived
economy is not yet what the screens read. That is the next job, and until it is
done the two halves disagree.

Planning documents live outside this repository, in the owner's personal system.
