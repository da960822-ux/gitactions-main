# Marble PC board checkpoint

This is a QA branch fixture capture, not a production screenshot. Run `node docs/qa/marble-readable-board/capture.mjs` against the local Vite server to reproduce it.

The previous checkpoint is in `docs/qa/marble-pawn-landmark-rules/`. Its 1280×800 board used roughly 60 px edge rows with buildings protruding across city labels, and the central map carried most of the area. This checkpoint uses a 12-column, 10-row perimeter: top and bottom rows are 100 px; side rows share the remaining height and place the building beside the city name and toll. The map is low contrast, and the central card carries dice, arrival, financial decision, and next action. An ordinary end-turn card is compact.

## Pixel evidence

| State | 1280×800 | 1440×900 | 1847×872 |
| --- | --- | --- | --- |
| 2 player built | [PNG](2p-built-1280x800.png) | [PNG](2p-built-1440x900.png) | [PNG](2p-built-1847x872.png) |
| 2 player selected | [PNG](2p-built-selected-1280x800.png) | [PNG](2p-built-selected-1440x900.png) | [PNG](2p-built-selected-1847x872.png) |
| 4 player built | [PNG](4p-built-1280x800.png) | [PNG](4p-built-1440x900.png) | [PNG](4p-built-1847x872.png) |
| 4 player dense, all properties built and four pawns on one cell | [PNG](4p-dense-1280x800.png) | [PNG](4p-dense-1440x900.png) | [PNG](4p-dense-1847x872.png) |

The fixture also writes start, landmark selection and 2 player dense PNGs. `geometry.json` records each screenshot's board and pawn rectangles. At 1280×800 the board is 1256×640 (2p) or 1248×680 (4p); each pawn marker is 50×60. The browser check found no clipped or sub-12 px property names in these states. Both fixtures fit the 800 px page height, and the 1440×900 and 1847×872 fixtures fit their respective page heights. The actual room viewport still needs final human review.

Board art and selected-city art both render `MarblePropertyArt` with the same owner, city and level data. This capture exercises stages 1, 2 and 3 across every property. The money flight now shows a single signed amount with payer → payee and balance, while the moving coin carries only a glyph.

`motion.json` records real button clicks in both modes. Dice and stepwise pawn motion appeared during rolls, and money flight and building growth appeared during construction and landmark selection.

The official Everyone's Marble guide is used only as a hierarchy reference. These captures show this game's 40-cell map and its current three-stage house, apartment and landmark model. No official art was copied.
