Current integration and review record: [REDESIGN-HANDOFF-20261018.ko.md](docs/REDESIGN-HANDOFF-20261018.ko.md). The user authorized implementation and integration; older direction-pause notes describe historical checkpoints. Main merge and deployment still require separate approval.

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

`src/PostHeroPreview.tsx` exports `PostHeroPreview`. `src/Scene.tsx` exports `PostHeroScene` with props `{progress, opening, reducedMotion, effect:{name,value,nonce}, portraitSrc, onReady?, onFailure?}`. The caller owns normalized p/q. The standalone wrapper owns rendering. The extracted `createPostHeroCollection` owns its geometry/materials and can return local camera poses with `ownCamera:false`; the shared parent host owns the actual renderer/camera/frame clock. See the latest handoff for `projectPaper`, atmosphere and disposal order. It disposes textures/geometries/materials/renderer and handles resize/context failure. Transform datasets on its host expose the actual flap/card/camera values for QA.

`src/interaction.ts` contains pure scroll/manual-state helpers. `src/Details.tsx` default export takes `{language,reducedMotion,onEffect}`. Root application owns language, source letter, direct-anchor behavior, q interpolation and the feature drawer. Effect messages never call room APIs or write game state. The current preview/details styles are scoped under `.post-hero-preview`; standalone body setup belongs to its entry. See the latest handoff for shared-host integration and root-build validation.

The original letter source and approved cutout are resolved from this checkout. Vite serves `../public`; the build therefore includes that public directory. Parent integration should use its own current public paths and stop copying unrelated game assets into a dedicated preview build. Existing `/#games` and `/feedback` links describe production targets: this standalone server does not host the game/feedback app. Parent must supply navigation into the real app (or an explicit app-origin) when integrating.

Hero's final object identity/pose, video seam and start/end camera are not connected or approved here. Desktop now projects the insert's corners onto the same DOM letter and interpolates to its normal reading position at p=.70–.86. Three static 1600×1000 poses have under .1px DOM bounding-box error against the intended interpolated quad; this does not certify all frames/devices. Mobile and reduced-motion retain the normal reading surface. See [the latest handoff](docs/REDESIGN-HANDOFF-20261018.ko.md) and [preserved review limits](../preserved-work/2026-10-18/REVIEW-LIMITATIONS.ko.md).

## Asset-dependent work awaiting main handoff

The approved seven figures are lisyeon (pink rabbit), sali-suli (dog pair), astronaut-rose-heart, maltipoo, ragdoll, panda and chinchilla under `/images/marble/premium/pawns/`. Preserve the actual ID-to-art mapping; the older `robot` ID means the pink rabbit. The black joker uses the waterfront photo and the white joker uses the indoor photo, contained without cropping or regenerating faces. Inspection of the actual doctor and hanbok noble images found Lisbeth alone in each image; the old “couple nobles” wording was inaccurate. Do not generate an additional person to match that wording.

The latest handoff documents six functioning local standee interactions using those assets and distinguishes fixture route fulfillment from final product asset-network QA. They are CSS/DOM standees, not a claim that the full sixteen-family Three.js/physical-rig design is complete. The remaining procedural rigs use the existing folding pocket, lens, wax, curved paper, domino drawer and bridge geometry. Asset paths and the shared host must be verified after integration; historical reports that the old isolated checkout lacked these files are not the current product status.

The four remote families remain specification only. No new authentication, RLS, permissions, chat transmission or server synchronization was created. Remotion/HyperFrames exports and high-cost bakes/renders were not run. The existing Remotion/HyperFrames source and exports remain owned by the main project; this independent implementation did not replace them.

## Evidence and limits

See `output/playwright/qa-report.json` and actual PNG captures there. Screenshots are Chromium with software WebGL, not real-device performance/Safari evidence. Main product tests are not claimed because production files did not change. Preview state tests and build are the relevant local checks. The Three.js chunk is around756kB uncompressed; lazy-load this isolated scene at the production integration boundary rather than adding it to the initial Hero bundle.

Ownership: root—workspace/build/preview shell/CSS/capture/integration; Sol—`Scene.tsx`; Luna—`interaction.ts`, `interaction.test.ts`, `Details.tsx`, `details.css`. No shared product files were edited.
