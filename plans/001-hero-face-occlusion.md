# 001 — Remove cosmic double exposure from B arrival

- **Status**: IMPLEMENTED — integrated browser verification recorded in docs/reviews/IMPECCABLE-LANDING-2026-10-23.md
- **Commit**: 921bac6
- **Severity**: HIGH
- **Category**: Cohesion / physicality
- **Estimated scope**: heroRoomJourney.ts and its existing tests; same visual owner

## Problem

`src/landing/cinematic/folded/heroRoomJourney.ts:67` currently says:
```ts
material.opacity=1-smooth(.28,.42,p);surface.visible=p<.42;
```
B remains fully visible behind this sheet. Settled exact p=.3500 forward and reverse both show telescope/orbit/planet RGB across both B faces: `output/current-review/full-skill-review/motion/settled-0-p0.35.png` and `settled-2-p0.35.png`. Portrait opacity is already0, so changing portrait fade does not address the source.

## Target

The original cosmos must retire spatially/through occlusion before either B face is revealed. No simultaneous legible cosmic detail and face detail in the face regions, at any sample .20–.42. Keep the authored p0 composition, original source pixels, rigid portrait, existing short dolly, room registration and fully settled p>=.42 B. Progress remains a pure function and reverse matches forward. This is a composition correction requiring the existing visual owner's frame judgment; the audit does not pretend an arbitrary opacity constant solves it. Do not use2px blur to hide the competing whole scenes.

## Repo conventions to follow

`heroRoomJourney.ts:57–72` owns normalized registered geometry and camera; `previewSpaceV19.ts:45–51` invokes it. GSAP owns scroll progress, not individual SVG Motion components. The3.2s intro and scroll extent are deliberate Experience timings; do not shorten them to300ms.

## Steps

1. Read the whole journey, canonical room registration and existing `heroRoomJourney.test.ts` before editing.
2. Keep the original standing portrait opaque until an explicit p=.24 editorial pose cut. From .24–.42, use original B RGB with the existing semantic union mask to protect the seated people, computers, desks and rabbit in canonical registration. Recede the opaque indexed cosmic mesh behind B using depth testing; its overscanned outer ring stays beyond the frustum. No whole-image opacity tween, face morph, floating photo outline or new generated person. This revises the initial retreat-only brief because it did not specify how faces remained readable during the handoff.
3. Sample .20,.24,.28,.30,.32,.35,.38,.40,.42 before animating between them; adjust the existing same-owner composition until all acceptance targets above hold.
4. Keep p0 and settled B pixel registration unchanged; verify the reverse path uses the same state and no mutable arrival latch. Add assertions for source retirement and deterministic forward/reverse pose, extending existing tests.

## Boundaries

Preserve original artwork and approved B, eight games, API/rhythm, original letter copy, KO/ES, shared renderer ownership and installed versions. No dependency, blanket will-change, video, full mobile QA or unrelated redesign. If stamped source excerpts have drifted, re-read all callers and report the drift rather than blindly applying line edits.

## Verification

Mechanical: `npx tsc -b`; run the relevant existing tests named below with `npx vitest run <paths>`; then `npm run build:landing-preview` once after integrated fixes. These commands are for the executor, not performed during read-only review.

Feel check: actual1440x900 browser pointer and keyboard interactions; inspect intermediate frames/DevTools10% speed, forward/reverse, and both initial and live-toggle reduced motion. Use software screenshots only for composition/state; actual GPU frame budget needs a real device recording. No invented FPS result.

Relevant tests: `src/landing/cinematic/folded/heroRoomJourney.test.ts`, `approvedRoomGeometry.test.ts`, `initialCosmicHero.test.ts`. Done when both face regions are free of overlaid cosmic detail at every intermediate sample, forward/reverse match, and original endpoints are preserved. Ownership: visual owner + host integration; read threejs-scene-setup, gsap-scrolltrigger and gsap-react before implementation.
