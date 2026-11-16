# Marble runtime image optimization — 2026-10-28

Approved PNGs are unchanged. Content-hashed `/images/marble/runtime/<name>-<sha256-prefix12>.webp` URLs now use mechanical, uncropped WebP derivatives; hero/result landing references still use their original approved PNGs. No rule, timing or presentation geometry changes.

| Scope | Original bytes | Runtime bytes | Unique asset URLs |
|---|---:|---:|---:|
| Seven world landmarks/island | 12,643,802 | 978,778 | 7 → 7 |
| Two early-preloaded character scenes | 4,041,348 | 599,736 | 2 → 2 |
| All nine derivatives | 16,685,150 | 1,578,514 | 9 → 9 |
| Island + both cameo preloads on a fresh world board | 6,116,498 | 809,284 | 3 → 3 |

Repeated tourism tiles share one island URL, not a separate file per tile. The last row is the expected cold asset payload for those specific sources, not the entire application's payload or a measured network timing. Landmark files are requested when their art is rendered. Existing SVGs, other city art, JavaScript, and CSS are excluded.

- Landmarks/island: longest edge 768px, quality 92, lossless alpha. Same aspect ratio and complete image canvas; no trimming, redrawing, face editing or stretching.
- Character cameos: original 1672×941 size, quality 94. Their existing SVG crop/viewBox is untouched.
- Reproduction: `node scripts/optimize-marble-runtime-images.mjs` (installed Sharp dependency). `public/images/marble/runtime-images.json` records dimensions, bytes and source SHA-256.
- Automated tests verify unchanged source hashes, all runtime files, dimensions/aspect-preserving resize, original hero reference, saved-route mapping, and byte-exact alpha relative to the resized source.
- Visual comparison: original/runtime pairs inspected at 300px display for Giza, Singapore, New York and island, plus 450px-wide complete character scenes. Silhouettes/composition remained intact; no noticeable quality loss at these display sizes. Encoding is lossy RGB, not lossless artwork.
- Browser layout/interactions and cold-network elapsed timings are separate checks owned by integration; file byte reductions do not imply an exact speedup.
