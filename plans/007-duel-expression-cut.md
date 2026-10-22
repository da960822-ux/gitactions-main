# 007 — Remove double faces during duel expression changes

- **Status**: IMPLEMENTED — integrated browser verification recorded in docs/reviews/IMPECCABLE-LANDING-2026-10-23.md
- **Commit**: 921bac6
- **Severity**: MEDIUM
- **Category**: Cohesion / physicality
- **Estimated scope**: post-hero-preview/src/duel-illustration.css, one motion declaration

## Problem

`post-hero-preview/src/duel-illustration.css:5` currently includes:

```css
transition:opacity 280ms cubic-bezier(.77,0,.175,1)
```

The two masked expression layers crossfade over the original room illustration. At a genuinely frozen 140 ms midpoint, their opacities are .404029 and .595971; both faces visibly have doubled eyes/mouths. Evidence: `output/current-review/full-skill-review/motion/duel-frozen-140ms.png` and `rose-check.json`. The first asynchronous screenshot had already reached the endpoint and was insufficient; use the frozen evidence.

## Target

Make expression image opacity changes instantaneous. Keep existing 160 ms text/underline/press feedback on the buttons with the existing cubic-bezier(.23,1,.32,1). Keep original room/art/masks and both accessible text choices unchanged. Keyboard and reduced modes stay instant. No additional blur, crop, fade-through-black, face rebuilding or new assets.

This follows the remedial preference hierarchy: delete the problematic animation. A direct expression cut is coherent for two illustrations with distinctly different drawn eyes/mouths; dissolving them creates a second face.

## Repo conventions to follow

`DuelIllustration.tsx:15–18` already preserves both choices and sets `data-animate=false` for keyboard actions. `.duel-illustration-choices button:after` has the bounded selection feedback, and `:active` uses scale(.97). Preserve these. `review-animations` prioritizes deleting an unsuitable animation over adding effects.

## Steps

1. Remove the opacity transition from `.duel-illustration-layer`; leaving the existing `transition:none` keyboard/reduced overrides is harmless, or delete only redundant declarations if the surrounding style remains clearer.
2. Preserve both layers, `aria-hidden`, data-active logic, `mix-blend-mode`, masks and all original art paths. Preserve button/underline transition durations and keyboard focus handling.
3. Repeat rapid pointer switches and keyboard switches. Sample immediately before/after state changes; no intermediate partially visible pair of facial expressions should exist.

## Boundaries

No changes to approved art, B arrival, games/API/rhythm, original letter text or KO/ES. No source restructure, new dependency or global timing-token change. If stamped source has drifted, re-read rather than applying line edits blindly.

## Verification

- **Mechanical**: `npx tsc -b`; run existing StoryChapters and PostHeroDetails tests, then the integrated `npm run build:landing-preview` once with other fixes.
- **Feel check**: in an actual desktop browser click both duel choices, then switch rapidly and repeat by keyboard. In DevTools or WAAPI pause at the former 140 ms midpoint: opacity must already be exactly 0/1 and both faces must have one expression. Existing button feedback remains subtle and immediate. Test both fresh and live-toggle reduced motion.
- **Done when**: expression cut has no ghost features at any sampled transition time, original endpoints/KO/ES alt text remain correct, and button feedback still confirms selection.

Implementation skills: animate and review-animations; no new motion library.
