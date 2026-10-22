# 005 — Keep embedded animation scalars outside broad React renders

- **Status**: IMPLEMENTED — integrated browser verification recorded in docs/reviews/IMPECCABLE-LANDING-2026-10-23.md
- **Commit**: 921bac6
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: PostHeroPreview.tsx + existing host callback contract

## Problem

`post-hero-preview/src/PostHeroPreview.tsx:127` calls setProgress per scroll frame. :141 calls setOpening(q.current) every frame across1.8s envelope movement. Both drive React rendering of story/letter while host Three rendering also runs.

## Target

In embedded/external-scene mode, send exact p.current/q.current to onSceneState and data-progress/data-opening through refs on active frames, not React scalar state each frame. React updates only when semantic UI changes: progress buckets <.35,<.56,<.86,<.90; opening buckets <=.0005, <=LETTER_UNFOLDED, >LETTER_UNFOLDED; explicit control/manual/finale state. Keep standalone renderScene=true behavior working with exact props; no global state abstraction.

## Repo conventions to follow

PostHeroPreview.tsx:56/57 already owns q,p refs, and LandingWorldHost.tsx:42 receives onSceneState to a ref plus dirty flag. onRegisterFrame is already the external frame pipeline. Existing branch budgets and1.8s progression are intentional; do not shorten the experience to avoid rerenders.

## Steps

1. Read every progress/opening use and the onSceneState effect. Retain latest non-scalar scene payload in a ref so exact p/q can publish without stale closures.
2. In the embedded external-frame path, update React progress only when one of .35,.56,.86,.90 boundaries is crossed, preserving latest numeric value at the crossing; use explicit UI state as needed to keep button/control branches synchronized. Update opening only when zero/intermediate/unfolded status changes or an explicit action snaps it.
3. Call onSceneState with exact refs whenever p/q changes; do not let the existing semantic effect overwrite the latest exact scalar values with a stale state snapshot. Write diagnostic dataset scalars directly on host for exact browser QA.
4. Keep standalone scene path using continuous state props unless its own ref subscription is implemented with existing interfaces. Preserve all interruption/fold/rose/focus transitions.
5. Count React renders during an embedded1.8s opening and confirm they occur on semantic thresholds, while Three receives smooth exact q. This is a performance correction, not a rendering architecture rewrite.

## Boundaries

Preserve original artwork and approved B, eight games, API/rhythm, original letter copy, KO/ES, shared renderer ownership and installed versions. No dependency, blanket will-change, video, full mobile QA or unrelated redesign. If stamped source excerpts have drifted, re-read all callers and report the drift rather than blindly applying line edits.

## Verification

Mechanical: `npx tsc -b`; run the relevant existing tests named below with `npx vitest run <paths>`; then `npm run build:landing-preview` once after integrated fixes. These commands are for the executor, not performed during read-only review.

Feel check: actual1440x900 browser pointer and keyboard interactions; inspect intermediate frames/DevTools10% speed, forward/reverse, and both initial and live-toggle reduced motion. Use software screenshots only for composition/state; actual GPU frame budget needs a real device recording. No invented FPS result.

Relevant tests: `src/landing/StoryChapters.test.tsx`, `src/landing/LetterCloseCompletion.test.tsx`, `src/landing/EndingChapter.test.tsx`, `src/landing/RoseGiftFinale.test.tsx`. Done when exact scene progress remains continuous, embedded whole-story React commits no longer follow every frame, and standalone preview/keyboard/reduced flows retain original behavior. Read animation-performance; host owner integrates after plan004.
