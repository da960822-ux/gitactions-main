# Marble visual QA

## Canonical 32 cell World/Business presentation fixture

The [fixture data](classic-world-32-fixture.json) was exported directly from `src/games/marble-reference-profile.ts` at QA commit `993b587` (`kakao-world-business-2013-zero-discount`). It contains the ordered 32 cells, 18 cities, five tourism sites, starting cash of 5,000,000, and verified city purchase and toll values. The captures mount the production React board components in Chromium with those exact data. They demonstrate presentation and layout; the profile has **not yet been activated in a live match**, and the fixture's purchase action is a visual action placeholder, not proof of the new engine's legality. Tourism rent stages are shown from the profile, but the selection rule is still pending in the logic branch. [Capture script](capture-classic32.mjs) can be rerun with `npm run dev -- --port 5174` and `node docs/qa/marble-stage-redesign/capture-classic32.mjs`.

| Check | Browser image |
| --- | --- |
| Two player stage | [1280 × 800](classic32-2p-roll-ko-1280x800.png), [1440 × 900](classic32-2p-roll-ko-1440x900.png) |
| Four player stage | [1280 × 800](classic32-4p-roll-ko-1280x800.png), [1440 × 900](classic32-4p-roll-ko-1440x900.png) |
| Vacant plot, villa, building, hotel and landmark | [Five stages at once](classic32-2p-levels-ko-1280x800.png) |
| Seoul bank purchase, 500만 cash and 50만 land | [Korean 1280 × 800](classic32-2p-purchase-ko-1280x800.png), [Spanish 1280 × 800](classic32-2p-purchase-es-1280x800.png) |
| Full map, own cash, selected city and both purchase choices | [Two player 390 × 844](classic32-2p-purchase-ko-390x844.png), [four player 390 × 844](classic32-4p-purchase-ko-390x844.png) |
| Other widths | [Four player 390 roll](classic32-4p-roll-ko-390x844.png), [four player 768 roll](classic32-4p-roll-ko-768x900.png) |
| Crowded mobile board with three owned cities and four pawns on one tile | [New York selected](classic32-4p-crowded-ko-390x844.png), [after tapping Seoul](classic32-4p-crowded-selected-ko-390x844.png) |
| Four player auxiliary menu after document scroll | [1440 × 900](classic32-4p-roll-ko-1440x900-menu.png), [768 × 900](classic32-4p-roll-ko-768x900-menu.png) |

At 1280 × 800, a two player 32 cell board is 1040 × 679 pixels and each edge tile is about 111 × 72 pixels. The four player board uses the same column width; all four edges share the same cell grid within each layout. The 390 pixel view fits the complete board, own cash, selected tile enlargement, and purchase/skip in the viewport. At 768 pixels the board stays inside the viewport without horizontal clipping. Vacant land, villa, building, hotel, and landmark use different original drawings; the stage label sits in the tile header and owner marker has its own slot. In the simultaneous stages capture, each artwork row measures 31 px instead of the earlier ~20 px. The crowded fixture checks that tapping Seoul switches the enlarged title from New York to Seoul while own cash and the roll button remain visible. The four player auxiliary menu follows the normal document scroll; primary actions remain on the board.

## Current live 40 cell game behavior

The following captures use the currently routed 40 cell engine. They validate existing interaction, movement, rent and transition behavior until the 32 cell economy branch is integrated; their prices are not historical profile prices.

| Check | Browser image |
| --- | --- |
| Live two and four player stage | [2p 1280 × 800](2p-stage-1280x800.png), [4p 1280 × 800](4p-stage-1280x800.png) |
| Purchase and build | [2p purchase](2p-purchase-ko-1280x800.png), [2p build](2p-build-ko-1280x800.png), [4p purchase](4p-purchase-ko-1280x800.png), [4p build](4p-build-ko-1280x800.png) |
| Rent transfer and retained receipt | [2p rent](2p-rent-ko-1280x800.png) |
| Spanish and narrow | [Spanish purchase](2p-purchase-es-1280x800.png), [4p mobile build](4p-build-ko-390x844.png) |
| Real sampled movement | [450 ms moving](motion-move-450ms.png), [2650 ms landed](motion-landed-2650ms.png) |

The 40 cell build and takeover screens show an explicit end turn alternative in the same decision area. The takeover sheet displays recipient, exact cost, after cash, and acquired stage. During the sampled live movement, both cash HUDs held their settled 1,500 value. The two captured movement frames verify those moments, not every animation timing or random outcome.

All screenshots used the repository Playwright dependency and `/usr/bin/chromium`; no browser download was needed.
