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

## Running it

Requires Node 24+.

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm run build    # production bundle into dist/
npm run icons    # regenerate the PWA icons from tools/make-icons.mjs
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
src/utils/muzenza.ts         Muzenza corda sequence (reference data)
src/utils/storage.ts         localStorage + JSON backup/restore
src/components/              UI
tools/make-icons.mjs         PNG icon generator (no image dependencies)
public/                      manifest, service worker, icons
```

## Status

Phase 0 (persistence, PWA, cleanup) is done. The game economy, the real skill
tree and the visual redesign are not. Planning documents live outside this
repository, in the owner's personal system.
