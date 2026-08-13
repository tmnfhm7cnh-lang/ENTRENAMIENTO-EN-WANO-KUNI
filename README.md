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
2. **Attributes are derived from real marks, not spent points.** Strength comes
   from actual pull-up maxima and front-lever holds, not from clicking. They can
   go down.
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

The composition is 16 bars at 72 bpm (53 s) in Hirajoshi on A, laid out as
jo-ha-kyū — slow opening, body, fast close — and looped. It is written to that
form with the instruments of the genre; it is not a transcription of any
particular piece.

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

node tools/test-score.mjs   # asserts the music score: grid, loop, pulse, scheduler windowing
```

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
src/data/initialData.ts      starting character, skills, quests
src/audio/score.ts           the music, as data — no Web Audio, runnable in Node
src/utils/muzenza.ts         Muzenza corda sequence (reference data)
src/utils/storage.ts         localStorage + JSON backup/restore
src/components/              UI
tools/make-icons.mjs         PNG icon generator (no image dependencies)
tools/test-score.mjs         assertions over src/audio/score.ts
public/                      manifest, service worker, icons
```

## Status

Phase 0 (persistence, PWA, cleanup) is done. The game economy, the real skill
tree and the visual redesign are not. Planning documents live outside this
repository, in the owner's personal system.
