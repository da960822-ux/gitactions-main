---
name: couple-games-landing-design
description: Audit and refine the couple-games landing page while preserving the real product, couple artwork, bilingual voice, and accessible motion.
---

# Couple games landing design

Use this skill when changing the landing page or its visual system. Read the current implementation, design notes, product copy, and real assets before editing. Treat the provided cosmic reference as direction, not as a specification to reproduce literally.

## Design direction

- Keep the page personal and games-first: the first screen should tell the couple this is their private space, offer one clear play action, and make the games easy to reach without scrolling through promotional sections.
- Use the reference’s deep plum night sky, restrained rose light, fine stars, and warm handwritten details as accents. Keep text and controls legible over the art; do not turn every surface into glass or glow.
- Let the couple’s supplied artwork remain the visual anchor. Preserve the source image and both people’s faces; do not crop, redraw, or replace them without an explicit request.
- Prefer an expressive display face paired with a Korean-capable, readable UI sans. Keep the type system small and confirm Korean and Dominican Spanish glyph coverage before choosing fonts.
- Favor a clear asymmetric hero and a compact game rail. Reduce decoration or copy before pushing the game choices below the fold. Avoid fake stats, testimonials, anniversaries, features, or destinations.

## Content and behavior

- Describe only features that work in the current app. A prototype, example, or future idea must be labeled as such.
- Write short, natural Korean and Dominican Spanish copy for the couple. Keep implementation details out of visible copy unless they help someone decide what to do.
- Make the main play action and every game card lead to a working destination. Keep navigation and page language understandable at narrow widths.
- Preserve existing game, chat, and room behavior while making visual changes. Inspect the actual routes and controls before describing or changing them.

## Motion and accessibility

- Use motion to acknowledge input or reveal a small amount of content: roughly 120–170 ms for press feedback and 180–260 ms for hover/focus transitions; keep larger reveals brief and interruptible.
- Animate `transform` and `opacity`, not layout. Avoid scroll hijacking, perpetual motion on every card, and decorative parallax that competes with the play action.
- Restrict hover-only effects to fine pointers. Provide visible keyboard focus, sufficient contrast, and usable controls without animation.
- Under `prefers-reduced-motion: reduce`, remove parallax, translations, smooth scrolling, and repeating effects. The page must remain complete and usable.

## Review before finishing

- Check the hero, game choices, chat, and memory/letter content against the real implementation. Keep game choices prominent and secondary sections brief.
- Review screenshots at 1440×900, 768×1024, and 390×844. Confirm that the first screen has a clear path to play, there is no horizontal overflow, and controls remain readable and reachable.
- Test keyboard focus and reduced-motion behavior. Confirm the artwork remains intact and that no new copy promises an unavailable feature.

This project-specific skill is a curated adaptation of the audit-first and brief-reading guidance in the upstream Taste Skill. The user-supplied `couple-landing-design` guide is the source for this project’s visual and motion constraints and takes precedence over generic design advice.
