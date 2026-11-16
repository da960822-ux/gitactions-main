# Independent city construction — local review

## Visual contract

- DOM/SVG/CSS board (not a new 3D renderer), 40 perimeter cells on a uniform 11×11 CSS grid. The board now fits height as a square; all four edges use the same square cell dimensions and internal composition; regional ground colors remain separate from ownership flags.
- Existing approved transparent house (512×482) and apartment (438×512) WebP art retained. Their original manifest/provenance is unchanged. Sharp decoded both and confirmed useful transparent and opaque alpha pixels.
- Villa, mid-rise and high-rise coexist. High-rise is original code-native SVG geometry in `MarblePropertyArt.tsx`, not a newly generated or fetched raster asset. Landmark replaces the whole cluster only when the explicit landmark flag is true.
- Bottom anchors, offset silhouettes and shadows supply depth. No legacy stage number badge: accessible labels enumerate the independent buildings, and owner flags explicitly show P1–P4. Separate large pawn sprites have numbered, owner-colored bases; four pawns pack into two rows on one location.
- References actually inspected: `/tmp/marble_refs/g7.jpg`, `buy.jpg`, `g9.jpg`, `mobile_start.png`, `mobile_buy.png`, plus both source building WebPs. Static references establish composition, not authentic motion timing.

## Skills actually read

Project `AGENTS.md`; software-engineering skill; restored pinned game-development `router`, `create-game-assets`, `game-ui-ux`, `game-feel`. Applied asset reuse/provenance and alpha checks, shared baseline/silhouette rules, container-driven equal-cell layout, event-driven transient construction pop with reduced-motion fallback. The project-local ponytail skill file was absent; its rules embedded in AGENTS.md were read. No engine migration.

## Checks

- `npx vitest run src/app/MarblePropertyArt.test.tsx src/app/MarbleCityTile.test.tsx`: 10 passed, including all-three coexistence, hotel-only, landmark replacement and legacy art routes.
- TypeScript aggregate check passed after integration at 11:17 UTC; repeat final aggregate after other owners finish.
- Local Vite/Chromium could not launch inside restricted command runtime (`uv_interface_addresses` errno 1; Chromium socket Operation not permitted). No screenshots or motion observation claimed from that attempt.
- Temporary native `__qa_marble.html` / `__qa_marble.tsx` supports actual 2p/4p engines, start/dense/built/landmark/buy/build scenarios, query language and reset. Parent managed-browser review pending. Remove temporary entry files before publication.

## Remaining review gates

Review at 1280×800 and 1920×1080, including dense builds, 4 pawns sharing a cell, all 40 equal-size cell measurements, Korean/Spanish labels, keyboard focus and selection dismissal, native-size asset legibility, and construction motion returning to rest. Final visual quality is not approved solely by unit tests.

Parent managed-browser first pass at 1188×761 measured all cells 102.54×49.54 but failed visual quality (short rectangles, tiny art, hotel protrusion). The revision switches to square table/cells, contains all art, and hands spare width to existing HUD/actions. Awaiting repeat screenshot; do not treat the equal-cell measurement from the failed rectangle pass as approval of current visuals.

## 32-cell Korea research projection (not a playable release)

The exact research profile is 18 cities + 5 tourism + 9 special cells. It is not assigned fabricated economy values. Missing Korean landmark art uses an explicitly marked generic code-native high-rise, not a foreign landmark. Approved original house/apartment/pawn art is retained. All seven pawn WebPs decoded with alpha 0–255; Maltipoo and Ragdoll pixels were inspected directly and have no baked card frame.

The deeper diamond ring uses unprojected outer tracks 1.7fr, inner tracks 1fr, a 45° rotation and .64 vertical scale. Top/bottom and left/right rectangular cells are rotations of the same geometry; their projected bounds match. The four corners are intentionally larger. This decreases the center's side fraction from 7/9 to 7/10.4 without inserting unrelated center content.

Parent managed-browser observations at 1188×761:
- First projection failed: width shrink-wrap made layout 284px and board12px. Explicit ancestor stretch/width fixed the intrinsic-size collapse.
- After correction: projected board892×571, noncorner cells109.18×69.88, corners137×88. This is measured evidence reported by the parent, not this agent's own browser run.
- That frame still failed legibility: upright white label plates overlapped adjacent cells, icons too large. Current corrective patch keeps names in the ground plane, countertransforms raised buildings/pawns only, puts buildings on the outer lane, removes price placeholders from the ground, caps special icons30px. Repeat observed frame remains required.

Settled arrivals have a static high-contrast ring and a textual/symbol ownership label (✓ 내 땅 / ! 상대 땅 / + 빈 땅). The UI owner gates it on active displayed-pawn settlement, not future destination. Raw pawn art is frameless on both legacy40 and research32 and anchored on its actual cell.

Latest focused checks: 12 tests passed (PropertyArt + CityTile, including32 shell preservation, generic Korea art, missing price and arrival labels). TypeScript passed before final ground-plane CSS changes; CSS requires browser review, not just type checking.

## Direct managed-browser observations by board-assets owner

Opened an isolated managed cloud QA tab through the authorized existing preview server (no Chromium/server launch). Inspected screenshots at host1188×761 and same-origin iframe fixtures with actual inner1280×800 /1920×1080, in both 2p and4p. The iframe is scaled only outside its layout for a whole-composition screenshot; these are **browser viewport fixtures, not physical 1920px monitor tests**.

Critical measured fix: legacy global `[data-building-level="1/2"]` scaling was still shrinking the cluster's approved raster assets by .54/.73. At the original94×66 cluster, the house was25.8×23.2 despite its47.8×42.9 slot. Explicit independent cluster assets now disable that legacy scaling. The final cluster frame was then reduced slightly (9.4cqw×6.6cqw) to keep the neighboring ground-text lane clear; this is not the old tiny-asset scale.

Observed results:
- 1280×800 /2p: real inner viewport confirmed, body800; before final height cap board983.98×629.75; zero text scroll-width clips.
- 1280×800 /4p, final height cap: body800, board968.74×619.99, bottom702; four character sprites present; zero text scroll-width clips. All four faces and numbered seat markers visible after compact two-row offsets; lower bodies may naturally overlap in the four-piece group.
- 1920×1080 /2p: body1080, board1406.24×899.99, bottom936; two character sprites; zero text scroll-width clips.
- 1920×1080 /4p: board1406.24×899.99, bottom1010 before QA-nav adjustment; normal tiles175.91–175.94 ×112.59–112.60. The prior28px page overflow was conclusively QA nav28 + game100svh, and the UI owner corrected that harness overhead.
- Noncorner projected dimensions match across four orientations within subpixel rounding. Corners remain intentionally larger.
- Ground text is in the board plane, not floating white plates. Buildings remain upright on the outer lane, pawn raw images are frameless, and the occupied city has the separate high-contrast ownership cue.

Remaining quality gates: center generic-art placeholder is owned by the UI agent; research-profile gameplay/economy readiness is not established here. Construction motion/original timing fidelity is not proven by these static screenshots. One full-page screenshot call timed out; ordinary managed screenshots of the loaded scaled fixture succeeded. Temporary files to remove before publication: `__qa_marble.html`, `__qa_marble.tsx`, `__qa_marble_viewport.html`.

## Bounded playable40 projection hotfix (2026-10-27 12:17 UTC)

Generalized the tested projection to40, keeping 11×11 placement and every index/corner unchanged. Outer tracks1.7fr plus9 inner tracks;32 still uses7 inner tracks. No rule/economy edits. Ground plinth overlays hidden; raw approved art and P1–P4 flags retained. Occupied tiles render above the contextual center panel so it cannot cover character faces.

Direct before/after native1188×761: square40 baseline611×611 with very small ground assets; projected40 is891.99×570.88, normal projected cells90.64×58.01 and body761. Actual loaded2p/4p dense images inspected: upright buildings on outerlane, board-plane labels, four visible faces and numbered markers. This is a materially wider play surface, not a square shrink-only change.

1920×1080 browser viewport fixture /4p (not physical host screen): actual inner1920×1080,40 tiles, body1080, board1406.24×899.99 ending982. Normal cell widths146.62–146.65 and heights93.84–93.86 across all edges; no text scroll-width clipping. Fully loaded images confirmed for all4 approved pawn sprites. Shared center/action projection stayed in its established bounds; game rule/data state untouched.

Parent owns final aggregate build, staged publication, regression gate for current cards, and removal of all temporary QA entry files. This change does not unlock research32.
