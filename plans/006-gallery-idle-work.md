# 006 — Stop settled gallery rendering and repeated diagnostics

- **Status**: IMPLEMENTED — integrated browser verification recorded in docs/reviews/IMPECCABLE-LANDING-2026-10-23.md
- **Commit**: 921bac6
- **Severity**: MEDIUM
- **Category**: Purpose / performance
- **Estimated scope**: StudioScene.tsx + GalleryCollection.ts

## Problem

`src/landing/gallery/StudioScene.tsx:57–60` renders continuously whenever visible and non-reduced. Normal gallery storyFocus=0 has no idle sine movement (`GalleryCollection.ts:63/77`). Each frame:54 repeats texture readiness traversal; :55 allocates Box3/eight projection vectors/arrays/JSON and writes selectedBounds.

## Target

Keep the gallery active only while selection exchange(.48s), hover tilt/return or another visible effect has not settled; render on selection, pointer hover/leave, asset completion, resize, visibility/context restore. Once games settle, no render submission or diagnostics update until invalidated. Hearts mode keeps intentional idle motion. Cache readiness after all assets loaded; compute bounds when transforms/camera actually changed, reuse projection scratch objects. Keyboard/reduced selection remains snap.

## Repo conventions to follow

The shared host already uses dirty/signature gating (LandingWorldHost.tsx:152–155). Reuse that conceptual convention locally, not its world renderer. GalleryCollection owns exchange and interpolation; expose a boolean settled/needsFrame result rather than duplicating motion math outside it.

## Steps

1. Make GalleryCollection.update report whether any position/rotation/scale or exchange remains beyond an explicit tolerance of0.001 world units for position,0.001 radians for rotation, or0.001 for scale; snap values to target at that tolerance. Preserve .48s exchange and current damping8.
2. In StudioScene frame, run games rendering while invalidated or needsFrame; resume on all existing sync/move/leave/asset/resize/visibility/context hooks. Retain renderer animation loop heartbeat if simplest but do not redraw or allocate while settled. Hearts mode is unchanged.
3. Cache texture readiness after true; reset on context restore. Gate selectedBounds recomputation on actual scene/camera change; preallocate Box3/vector scratch objects. Preserve data-selected-bounds output used by QA and accessible fallback.
4. Check rapid pointer/keyboard selections across all8 games, hover return, initially loading assets, viewport changes and visibility restoration. No infinite never-settled tail; no frozen hover.

## Boundaries

Preserve original artwork and approved B, eight games, API/rhythm, original letter copy, KO/ES, shared renderer ownership and installed versions. No dependency, blanket will-change, video, full mobile QA or unrelated redesign. If stamped source excerpts have drifted, re-read all callers and report the drift rather than blindly applying line edits.

## Verification

Mechanical: `npx tsc -b`; run the relevant existing tests named below with `npx vitest run <paths>`; then `npm run build:landing-preview` once after integrated fixes. These commands are for the executor, not performed during read-only review.

Feel check: actual1440x900 browser pointer and keyboard interactions; inspect intermediate frames/DevTools10% speed, forward/reverse, and both initial and live-toggle reduced motion. Use software screenshots only for composition/state; actual GPU frame budget needs a real device recording. No invented FPS result.

Relevant tests: `src/landing/gallery/GalleryCollection.test.ts`, `studioObjects.test.ts`, GameGallery tests found by rg. Done when an untouched settled gallery submits no new draw for a2s observation, pointer/selection restarts immediately, final transforms and selected bounds still update, and keyboard/reduced snaps remain immediate. Read performance-optimization, gsap-performance and threejs-scene-setup before implementation.
