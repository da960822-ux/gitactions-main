# 002 — Honor reduced motion changes without reloading

- **Status**: IMPLEMENTED — integrated browser verification recorded in docs/reviews/IMPECCABLE-LANDING-2026-10-23.md
- **Commit**: 921bac6
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: CountryCompanions.tsx + PartnerPact.tsx, bounded subscription changes

## Problem

`post-hero-preview/src/CountryCompanions.tsx:35` uses `reduced=useReducedMotion()`; :60 selects greeting based on that value. Runtime `targeted.json` live-reduced-bird reports media=true, data-reduced=false, phase=greet, visible transform(-28px,-3px)550ms later. Fresh reduced load correctly reports phase=instant. `PartnerPact.tsx:51` also owns motion through the same hook and must use the same current media truth.

## Target

Use the existing local matchMedia change subscription pattern in `PostHeroPreview.tsx:95–98` for both component reduced booleans. On transition to reduce, set birds together=false/phase=instant, clear pointer spring tilt using existing effect, stop pact GSAP opening via effect cleanup and remove transform movement. Preserve immediate semantic state/opacity feedback. Keyboard remains instant. No hook/library migration.

## Repo conventions to follow

Existing pattern:
```ts
const media=matchMedia('(prefers-reduced-motion: reduce)');
const update=()=>setReducedMotion(media.matches);
media.addEventListener('change',update);
return()=>media.removeEventListener('change',update);
```
Existing bird return220ms cubic-bezier(.23,1,.32,1) and narrative greeting1.8s cubic-bezier(.77,0,.175,1) remain for no-preference.

## Steps

1. Replace the stale hook-derived reduced value in CountryCompanions with initialized local boolean state and one mount effect subscribing to the media query change; invoke update at registration to close initialization races. Remove only now-unused hook import.
2. Apply the same initialized boolean/subscription to PartnerPact. Keep existing effect cleanup that reverts its GSAP tween when reduced changes; keep explicit press transform branch.
3. Exercise reduce on/off while greeting, while pact unfolds and while pointer is hovering. Ensure the current preference is used immediately for the next action and the active gesture settles.
4. Extend browser regression coverage with both fresh reduce and live reduce→no-preference transitions; no mock-only assertion.

## Boundaries

Preserve original artwork and approved B, eight games, API/rhythm, original letter copy, KO/ES, shared renderer ownership and installed versions. No dependency, blanket will-change, video, full mobile QA or unrelated redesign. If stamped source excerpts have drifted, re-read all callers and report the drift rather than blindly applying line edits.

## Verification

Mechanical: `npx tsc -b`; run the relevant existing tests named below with `npx vitest run <paths>`; then `npm run build:landing-preview` once after integrated fixes. These commands are for the executor, not performed during read-only review.

Feel check: actual1440x900 browser pointer and keyboard interactions; inspect intermediate frames/DevTools10% speed, forward/reverse, and both initial and live-toggle reduced motion. Use software screenshots only for composition/state; actual GPU frame budget needs a real device recording. No invented FPS result.

Relevant tests: `src/landing/CountryCompanions.test.ts`, `src/landing/PostHeroDetails.test.tsx`, existing PartnerPact tests found by rg. Done when matchMedia true implies data-reduced=true, phase instant, wing animation none, no continuing body/tilt motion, and pact movement stops without losing the current signature.
