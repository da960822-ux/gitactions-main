# Splendor board artwork loading

## Cause and change

Board SVGs requested full 683×1024 development art and 1024×1024 noble art even though the play surface displays small cards. All 106 mapped art sources now have mechanically encoded WebP board derivatives (maximum width 320px, no enlargement, quality 84). They are selected by exact source URL in `SplendorArtwork`; no unknown, remote, blob, or private-host override URL is rewritten. All original files and `card-map.json` remain unchanged. SVG view boxes, clipping, aspect alignment, card identities and rule values remain unchanged. Detail view explicitly uses originals, including printed card crops; custom detail images retain their full original resolution. Async decoding is requested for full-size HTML detail images, without lazily delaying visible board art or preloading entire decks.

`node scripts/optimize-splendor-assets.mjs` reproduces derivatives and the allowlist manifest. Derivative filenames contain a SHA-256 content prefix so changed artwork cannot reuse an old browser-cache key. This change adds no cache policy and does not alter host authentication/routes. Existing source is already under public; no private source was copied there.

## Encoded bytes (all mapped assets; not one initial hand)

| Group | Count | Original bytes | Board bytes |
| --- | ---: | ---: | ---: |
| Tier 1 | 40 | 756,815 | 653,276 |
| Tier 2 | 30 | 9,178,206 | 1,364,876 |
| Tier 3 | 20 | 6,702,536 | 1,046,692 |
| Nobles, including extras | 16 | 6,636,856 | 518,828 |
| Total | 106 | 23,274,413 | 3,583,672 |

84.60% fewer encoded bytes over the complete mapped set. Original deck bytes are not all requested on initial load; actual initial savings depend on the dealt cards. Reduced dimensions also lower decoding pixel count for custom art. No wall-clock speedup is claimed.

## Checks and limits

- 45 targeted tests in 8 files: artwork, detail viewer, two/four-player tables, quick guide, motion, game-table interactions, private overrides.
- Regression traverses every tier/card/noble (including n10–n15), checks derivative existence, board-only request selection, original full-size selection, private/remote/blob pass-through and aggregate byte budget.
- Original n0 and its derivative visually inspected: same portrait/composition, no crop or redraw.
- Browser QA initially blocked by missing Playwright Chromium executable. No browser installation performed. Production cold/warm timings, deployed cache behavior and all-card visual comparison are not established by these unit checks.
- Project AGENTS.md read; its referenced `.agents/skills/ponytail` and router directories are absent from this checkout.
