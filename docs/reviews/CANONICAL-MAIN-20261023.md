# Canonical main and playable screen sizes — 2026-10-23

## Scope

The latest existing private Site at https://yeonseok-lisbeth-review-20261021.pinktrout1024.chatgpt.site/#games is the only landing baseline. Preserve its current approved cosmos, characters, shared room, letter and eight games. No replacement Site or audience change.

## Removed and preserved

Removed 1243 obsolete tracked files (1,641,125,498 bytes) from the source tree: historical preserved-work designs, emerald-era design sessions and review images, standalone landing/post-hero previews, unused preview renderers, 32 unused public assets, and obsolete generation helpers. Git history retains earlier files. Active story/letter code (38 files) moved into src/landing/story; its main integration, current artwork and provenance remain. The historical landing-preview image directory still has 11 live images/textures and is intentionally preserved. Source-only preview scripts and build entries are retired.

Ignored old preview dependencies and the temporary historical reference screenshot were moved outside both deployment/source checkouts into the existing recoverable cleanup archive. They are excluded from publication. No active server/game/letter source is inferred unused merely because its name says preview.

## UI and behavior

- Desktop game shells use up to 1888px with reduced outer margins. Essential play surfaces and actions must fit one viewport; descriptions and rules can remain below. No page zoom, automatic fullscreen or clipped controls.
- Rhythm preserves its 11:9 original game, measures actual remaining height, fits the full frame, and exposes secondary source/recovery notes through a closed disclosure.
- Domino, Da Vinci, Splendor and Minhwatu use larger tiles/cards/figures. Jaipur and Marble use desktop width and viewport-aware play layout. Catchmind keeps the shared 5:3 drawing coordinates.
- Hero title, caption and CTA scale with height. Direct letter links were removed from the hero and top navigation; the actual later letter section remains.
- Existing private feedback members p1 and p2 can both post. p1 alone edits status. The membership/RPC checks, direct-insert denial, invitation flow and seven-day retention remain. Migration 009 was applied remotely before release. A p1 owner submission from the built app saved to the real Supabase backend and appeared in the list; the p1 status selector and the empty reset composer were observed.

## Verification

Root Vitest passed 90 files and 770 tests. TypeScript and the production build passed. The source closure contains 179 reachable code/style files with no missing imports; active asset checks found no missing references. Browser checks covered all eight game layouts at 1366×768, including selected/confirmation states for Domino, Splendor and Minhwatu; Rhythm was additionally measured at 1440×900 and 1920×1080, and Catchmind at 1920×900. Essential play surfaces and controls fit without vertical scrolling in those observed states. Hero KO/ES checks passed at 1366×768, 1440×900, 1920×900 and 1920×1080, with CTA/footer gaps of 20–59px and zero direct hero/nav letter links. See the final release receipt for exact source/Site versions and verification results. Baseline Site 19 verification in DEPLOYMENT.md is historical, not a claim that this release was already published.

The migrated composition test now asserts the existing mobile FOV of 30 (the production logic was unchanged); its old standalone-only expectation of 38 had become stale. The migrated LocalEventRig teardown uses Vitest afterAll.

Limits: the complete original Flash game/audio and every late-game permutation were not replayed; mobile continues its existing Jaipur-only game policy. No song audio was added in this release.
