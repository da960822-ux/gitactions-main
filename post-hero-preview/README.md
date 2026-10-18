# Independent post-Hero preview

Branch: `feature/post-hero-preview`. This directory is an independent React/Vite/Three.js workspace. It does not edit or replace the product landing, Hero, games, translations, letter source, or root package/lockfile.

```sh
cd post-hero-preview
npm ci --cache /tmp/post-hero-npm-cache
npm run dev
```

Open http://localhost:4178/ . `npm run build` checks TypeScript and creates the isolated build. `npm test` tests envelope progress/manual overrides/storage. `node scripts/verify-preview.mjs` exercises the real Chromium/WebGL page and writes screenshots plus `output/playwright/qa-report.json`. Chromium path defaults to `/usr/bin/chromium` and can be set with `CHROMIUM_PATH`.

## Implemented

- Scroll-driven story, deformed burgundy surface, actual perspective camera, approved couple cutout, real three-dimensional envelope with front folds/liner/separate seal/top flap and a three-panel folded insert.
- Click opening/closing, scroll progression and reverse, direct full-letter navigation, KO/es-DO, reduced-motion support, WebGL failure fallback. Letter paragraphs come directly from `../src/copy/home.ts` without editing that file.
- Local domino matching, adjustable balance, bounded drawing with button alternatives and preservation on card flip, visual rhythm matching, three-piece paper puzzle, plus wax/pocket/wind/prism child-rig controls. These are local toys, not game engine commands or a multiplayer implementation.

## Integration contract

`src/PostHeroPreview.tsx` exports `PostHeroPreview`. `src/Scene.tsx` exports `PostHeroScene` with props `{progress, opening, reducedMotion, effect:{name,value,nonce}, portraitSrc, onReady?, onFailure?}`. The caller owns normalized p/q. Scene owns the actual mesh/camera/material transforms and demand rendering. It disposes textures/geometries/materials/renderer and handles resize/context failure. Transform datasets on its host expose the actual flap/card/camera values for QA.

`src/interaction.ts` contains pure scroll/manual-state helpers. `src/Details.tsx` default export takes `{language,reducedMotion,onEffect}`. Root application owns language, source letter, direct-anchor behavior, q interpolation and the feature drawer. Effect messages never call room APIs or write game state. `preview.css` is scoped for this page except normal reset/font rules: scope these under a feature root before importing into the production landing. Root build is intentionally not modified.

The original letter source and approved cutout are resolved from this checkout. Vite serves `../public`; the build therefore includes that public directory. Parent integration should use its own current public paths and stop copying unrelated game assets into a dedicated preview build. Existing `/#games` and `/feedback` links describe production targets: this standalone server does not host the game/feedback app. Parent must supply navigation into the real app (or an explicit app-origin) when integrating.

Hero's final object identity/pose, video seam and start/end camera are NOT connected or approved here. No claim is made that DOM letter corners track the 3D insert within2px: this preview transitions to a separately readable normal-flow paper. That precise surface handoff remains integration work, not a passing check.

## Asset-dependent work awaiting main handoff

The latest approved seven pieces are pink rabbit, Salli/Sulli dog pair, rose-heart astronaut, maltipoo, ragdoll, panda and chinchilla. `robot` means pink rabbit in latest main. Approved jokers use black waterside/white indoor couple photos; approved nobles are doctor/hanbok couples. These exact source/runtime assets and mappings are absent from this old checkout. No old six-piece art, minus joker, or old nobles have been substituted. Shadow theater, character rail, photo shutters, couple popups, pawn flipbook and decorating with those approved pieces await their files. The non-character rigs now include a folding miniature room/table/seats, an aligned lens with shutters onto a pip-card icon, deforming wax with retained imprint, a curved segmented paper gust, an indexed domino fall opening a drawer, and three actual bridge hinges. These are procedural preview geometry, not newly baked final art.

The four remote families remain specification only. No new authentication, RLS, permissions, chat transmission or server synchronization was created. Remotion/HyperFrames exports and high-cost bakes/renders were not run. Existing main seven MP4s are not available in this environment and were not replaced.

## Evidence and limits

See `output/playwright/qa-report.json` and actual PNG captures there. Screenshots are Chromium with software WebGL, not real-device performance/Safari evidence. Main product tests are not claimed because production files did not change. Preview state tests and build are the relevant local checks. The Three.js chunk is around756kB uncompressed; lazy-load this isolated scene at the production integration boundary rather than adding it to the initial Hero bundle.

Ownership: root—workspace/build/preview shell/CSS/capture/integration; Sol—`Scene.tsx`; Luna—`interaction.ts`, `interaction.test.ts`, `Details.tsx`, `details.css`. No shared product files were edited.
