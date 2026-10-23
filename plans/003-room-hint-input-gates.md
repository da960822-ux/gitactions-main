# 003 — Show keyboard hints instantly and gate pointer motion

- **Status**: IMPLEMENTED — integrated browser verification recorded in docs/reviews/IMPECCABLE-LANDING-2026-10-23.md
- **Commit**: 921bac6
- **Severity**: MEDIUM
- **Category**: Purpose / accessibility
- **Estimated scope**: src/landing/landing-world.css only

## Problem

`src/landing/landing-world.css:39–40`:
```css
transition:opacity 150ms,transform 150ms
.room-discoveries button:hover span,.room-discoveries button:focus-visible span{opacity:1;transform:translate(-50%,0)}
```
Real object activation produced a focused hint still in movement. Hover is not limited to fine hover devices.

## Target

Default hint opacity0/translate(-50%,8px), no transition. In `@media(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)`, allow `transition:opacity 150ms var(--ease-out),transform 150ms var(--ease-out)` and hover visibility. `.room-discoveries button:focus-visible span` is visible at translate(-50%,0) with `transition:none`. Retain current reduced-motion no-transition rule.150ms falls in125–200ms hint budget.

## Repo conventions to follow

Landing --ease-out is cubic-bezier(.23,1,.32,1) at src/styles/landing.css:4. Follow existing AcrossHero CSS hover and focus separation; do not create a new timing token.

## Steps

1. Separate shared focus-visible reveal from pointer hover reveal.
2. Put animated pointer hover and transition inside the fine-hover/no-preference media query; leave keyboard reveal instant even when hover also matches.
3. Preserve room button bounds, label text, aria labels, focus outline and native dialog actions.

## Boundaries

Preserve original artwork and approved B, eight games, API/rhythm, original letter copy, KO/ES, shared renderer ownership and installed versions. No dependency, blanket will-change, video, full mobile QA or unrelated redesign. If stamped source excerpts have drifted, re-read all callers and report the drift rather than blindly applying line edits.

## Verification

Mechanical: `npx tsc -b`; run the relevant existing tests named below with `npx vitest run <paths>`; then `npm run build:landing-preview` once after integrated fixes. These commands are for the executor, not performed during read-only review.

Feel check: actual1440x900 browser pointer and keyboard interactions; inspect intermediate frames/DevTools10% speed, forward/reverse, and both initial and live-toggle reduced motion. Use software screenshots only for composition/state; actual GPU frame budget needs a real device recording. No invented FPS result.

No new unit test required for narrow reversible CSS. Done when keyboard tab reveals hint in its final state immediately, pointer hover reveals in150ms with existing curve, coarse-pointer taps do not latch hover movement, reduced motion is instant. Read animate and motion accessibility guidance before implementation.
