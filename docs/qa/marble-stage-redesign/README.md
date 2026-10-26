# Marble stage visual QA

These are Chromium captures of the actual React game screens at device scale 1. The live route captures use `/play?game=marble` and its AI match controls. Controlled state captures mount the same production components with states produced by `marbleEngine` or `fourMarbleEngine`; the rent capture applies an actual engine `roll` and waits for the transient event to become the retained receipt. Controlled states let all four building levels and both languages be inspected without relying on random dice rolls.

| Check | Evidence |
| --- | --- |
| Live 2 player and 4 player roll stages | [2p 1280 × 800](2p-stage-1280x800.png), [4p 1280 × 800](4p-stage-1280x800.png), [2p 1440 × 900](2p-stage-1440x900.png), [4p 1440 × 900](4p-stage-1440x900.png) |
| Purchase and build choices, 1280 × 800 | [2p purchase](2p-purchase-ko-1280x800.png), [2p build](2p-build-ko-1280x800.png), [4p purchase](4p-purchase-ko-1280x800.png), [4p build](4p-build-ko-1280x800.png) |
| Vacant lot, house, apartment, landmark together | [Four stages](2p-levels-ko-1280x800.png) |
| Real 120 rent transfer, settled receipt | [Rent](2p-rent-ko-1280x800.png) |
| Spanish | [2p purchase](2p-purchase-es-1280x800.png), [4p build](4p-build-es-1280x800.png) |
| Narrow screens | [2p 768](2p-purchase-ko-768x900.png), [4p 768](4p-build-ko-768x900.png), [2p 390](2p-purchase-ko-390x844.png), [4p 390](4p-build-ko-390x844.png) |
| Live dice movement | [450 ms moving](motion-move-450ms.png), [2650 ms landed](motion-landed-2650ms.png) |

The 1280 × 800 live boards occupy x=23–1257, y=161–786 in 2 player mode and x=10–1270, y=103–705 in 4 player mode. At 1440 × 900 the 2 player map artwork spans 1082 × 549 px. The dice dock sits at the map's right edge and the top/bottom tile heights have been reduced to give the map more height and bring all four edge rows closer in size. The narrow captures have no document-level horizontal overflow; the board itself scrolls horizontally, while the contextual action sheet stays in view at 390 px. During one live 9 second movement probe, both player cash displays remained at 1,500; no false zero occurred. At 450 ms the moving pawn and travel status were visible; at 2650 ms the pawn had landed and the purchase decision was visible. These observations verify the sampled frames, not all animation timing or every random outcome.

The controlled captures reflect the current checked-in 40-cell economy. Historical mobile rule research and a separate logic implementation are pending integration, so these images are visual and interaction checkpoints rather than evidence of final historical prices or board count.

Validation at this checkpoint: `npm test -- --reporter=dot` passed 113 files and 998 tests; `npm run build` passed. The browser used the repository Playwright dependency and `/usr/bin/chromium`; no browser download was needed.
