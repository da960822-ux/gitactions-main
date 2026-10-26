# Marble board layout and art QA

Branch: `codex/marble-layout-art-qa`, starting from `5b8aebc` (`2c78ba1` on production main). This changes only the existing 40-cell Marble presentation. The cities, turn rules, prices, rent, and actions are unchanged.

## PC comparisons

| State | Rejected QA checkpoint | This branch, 1280×800 | This branch, 1440×900 |
| --- | --- | --- | --- |
| 2p empty | [old stage](../marble-existing-upgrade/2p-stage-1280x800.png) | [empty board](2p-stage-1280x800.png) | [empty board](2p-stage-1440x900.png) |
| 2p built | [old levels](../marble-existing-upgrade/2p-levels-1280x800.png) | [built levels](2p-levels-1280x800.png) | [built levels](2p-levels-1440x900.png) |
| 2p selected | [old selection](../marble-existing-upgrade/2p-apartment-selected-1280x800.png) | [selected apartment](2p-apartment-selected-1280x800.png) | [selected apartment](2p-apartment-selected-1440x900.png) |
| 4p empty | [old stage](../marble-existing-upgrade/4p-stage-1280x800.png) | [empty board](4p-stage-1280x800.png) | [empty board](4p-stage-1440x900.png) |
| 4p built | [old levels](../marble-existing-upgrade/4p-levels-1280x800.png) | [built levels](4p-levels-1280x800.png) | [built levels](4p-levels-1440x900.png) |
| 4p selected | [old selection](../marble-existing-upgrade/4p-apartment-selected-1280x800.png) | [selected apartment](4p-apartment-selected-1280x800.png) | [selected apartment](4p-apartment-selected-1440x900.png) |

At 1280×800, the playable 2p board grows from roughly 680px to **1256px** wide; 4p grows to **1248px**. At 1440×900 they are 1416px and 1408px. The four HUDs occupy one 55px row in 4p, and the two 2p HUDs occupy one 52px row. Board and bottom controls fit the captured viewports. The eleven board rows now have equal height. City name, building, and price each have a separate slot on every edge, while owner and the full tier badge stay inside the tile. House roofs and apartment facades use their owner's color in the same approved artwork shown by the enlarged city card. A built side-edge tile has about 30px of art height at 1280 and 38px at 1440; the rejected square board made it single-digit height.

The primary roll action sits at the map's left side. The route label stays clear, and the large selected-city card no longer needs to carry the only readable building. Special-square names remain on one line in the captured Korean views. The existing world map, approved house/apartment/city artwork, flags, and action components are reused. The vacant plot keeps its isometric SVG with improved stone and grass detail. No reference artwork was copied.

Run `node docs/qa/marble-layout-art-qa/capture.mjs` while Vite is serving `http://127.0.0.1:5176/play?game=marble`. It uses the existing engines and asserts 40 cells, a board at least 94% of viewport width, a fully visible board, equal edge-row heights, at least 24px of side-edge built art, no clipped property names or overlapping name/art/price slots, in-tile tier badges, and no page errors. The synthetic built fixtures contain levels 0–3 on bottom tiles and owner-colored buildings on both side edges. The official reference image at `https://c2.img.netmarble.kr/web/board/moma/v2/img/guide/g7/img01.jpg` was requested, but its server/proxy returned HTTP 403 here; no assets from it were used.

Validation: production build and typecheck passed. Full Vitest passed after the equal-row and shared-art patch: 115 files, 1,006 tests, using four workers and longer timeouts for unrelated heavy tests. Only PC viewports were reviewed.
