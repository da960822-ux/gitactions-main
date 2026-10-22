# 004 — Keep letter layout stable during projective motion

- **Status**: IMPLEMENTED — integrated browser verification recorded in docs/reviews/IMPECCABLE-LANDING-2026-10-23.md
- **Commit**: 921bac6
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: PostHeroPreview.tsx tracking + existing projection tests

## Problem

`post-hero-preview/src/PostHeroPreview.tsx:72`:
```ts
article.style.width=`${width}px`;if(frozen)article.style.height=`${frozen.height}px`;else article.style.removeProperty('height');const height=frozen?.height??article.offsetHeight;
```
Width varies per frame at:71; writing it then reading offsetHeight forces layout/text reflow. Host reads dimensions again at LandingWorldHost.tsx:172–179. No hardware dropped-frame claim is made.

## Target

The readable DOM paper uses one measured stable natural layout width per viewport/language/layout epoch during tracking. Visual quad width continues through existing `paperTransform(corners,baseWidth,baseHeight)` matrix mapping. Width/height changes happen only on semantic measurement invalidation or frozen close setup; no frame write→offsetHeight read sequence. Keep the original letter text and paper handoff exact, preserve frozen close rect and interruption.

## Repo conventions to follow

Existing refs p/q carry frame scalars. paperProjection.ts:3–13 maps any stable DOM rectangle to a four-corner visual quad. `LetterCloseCompletion.test.tsx` and letterFinaleState cover protected fold/reopen behavior. Do not replace the letter with canvas text or duplicate content.

## Steps

1. Read trackPaper, paperTransform, letterOpeningLayout and every onPaperPose caller in Scene/LetterCollection.
2. Measure base DOM dimensions at stable reader width (slot width), cache until viewport/language/content dimensions change. Use a scoped ResizeObserver to invalidate without interleaving reads/writes within a tracking frame; disconnect on cleanup. A frozen closingRect remains authoritative while folding.
3. Keep article layout width/baseHeight fixed during a tracking interval; supply cached dimensions to paperTransform. Continue interpolation of destination/opening corners through existing helpers, so apparent size and position remain the same without continuous text wrapping.
4. Make all frame geometry reads precede writes. Do not write unchanged slot height/width repeatedly. Keep host paperAspect and measuredPaperHeight consistent with base dimensions.
5. Check the initial handoff, full reader, close mid-scroll, interruption and reopen in KO/ES; extend existing projection tests for stable base rectangle mapping.

## Boundaries

Preserve original artwork and approved B, eight games, API/rhythm, original letter copy, KO/ES, shared renderer ownership and installed versions. No dependency, blanket will-change, video, full mobile QA or unrelated redesign. If stamped source excerpts have drifted, re-read all callers and report the drift rather than blindly applying line edits.

## Verification

Mechanical: `npx tsc -b`; run the relevant existing tests named below with `npx vitest run <paths>`; then `npm run build:landing-preview` once after integrated fixes. These commands are for the executor, not performed during read-only review.

Feel check: actual1440x900 browser pointer and keyboard interactions; inspect intermediate frames/DevTools10% speed, forward/reverse, and both initial and live-toggle reduced motion. Use software screenshots only for composition/state; actual GPU frame budget needs a real device recording. No invented FPS result.

Relevant tests: `src/landing/LetterCloseCompletion.test.tsx`, `src/landing/letterClosingView.test.ts`, `src/landing/letterFinaleState.test.ts`, paperProjection tests found by rg. Done when DevTools shows no tracked per-frame width→layout-read cycle and original letter stays legible/registered through open/close. Read animation-performance and gsap-performance before implementation.
