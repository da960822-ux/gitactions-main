# Golden key card art

`public/images/marble/golden-key-cards.svg` provides ten original portrait illustrations; `MarbleEventStage.tsx` explicitly maps all 16 supported card IDs. The original 13 cards share seven families, while city-festival, blackout, and rent-pass have distinct art: a miniature city decorated with flags, dark windows beside a broken power grid, and a ticket above a gate with a crossed-out coin.

Portrait symbols use a 128 × 160 viewBox. The three strategic cards also expose object-only `city-festival-mark`, `blackout-mark`, and `rent-pass-mark` symbols with 128 × 128 viewBoxes for board badges and held-pass indicators. Use the sprite via SVG use, retain accessible labels/tooltips in the DOM, and avoid generic fill/stroke CSS overriding the authored palette. Event-card art retains the existing flip animation and scoped 3rem × 4rem sizing.

Provenance: original geometric SVG paths authored for this project. Palette and 2.5D architectural conventions follow the repository's existing board art; no third-party assets or source artwork were copied. License: CC0-1.0 for these new illustrations. No raster images, emoji, typography, gradients, external references, scripts, or dependencies are embedded.

Validation: XML and internal reference checks; Inkscape render inspection; Chromium external SVG use loading and screenshots. Mobile integrated board animation remains part of integration QA.
