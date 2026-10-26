# Marble redesign · revision 2 evidence

Captured from the current local source in the existing app, through `/play?game=marble` → AI 1v1 or AI 2×2. Runtime: preinstalled `/usr/bin/chromium` 154 with the repository's installed Playwright, Vite at `127.0.0.1:5174`, viewport 1280×800. No browser/runtime package was installed or downloaded.

## Screens

- `2p-board-roll-1280x800.png`: current 2-player board at roll phase. The board and primary play controls fit the 800px viewport; guide/history content below the play surface makes the document taller.
- `team-board-roll-1280x800.png`: current 2×2 team board at roll phase. It uses the same parchment palette, board, city art, stage markers, and central roll presentation.
- `2p-purchase-preview.png`: actual landing on Madrid: price 140, base toll 30, projected cash 1,360 from 1,500, plus buy/pass choices and city artwork.
- `2p-build-preview.png`: actual post-purchase action for Madrid: stage 0→1, build cost 60, toll 30→60, projected cash 1,300.
- `2p-built-level1.png`: after building, the house silhouette and level marker are visible; the next preview reads stage 1→2, cost 80, toll 60→90.
- `2p-transaction-receipt.png`: four seconds after the build, the transient event panel is gone and one persistent transaction receipt remains (`mp-center-receipt` count 1, event theater count 0).

Screens are raw browser captures. The flow used ordinary buttons in the local AI game; it was not mocked or hand-composited. This set shows stages 0 and 1, not every level.

## What changed since the rejected candidate

- Replaced the same pin art on active route v3's unbuilt city tiles with their individual city dioramas; removed the `.54`/`.73` scaling from the outer building frame that had shrunk constructed art.
- Increased top/bottom city art from 22px to 30px and stopped Korean city names breaking at arbitrary syllables.
- Shared the pip dice component with the team roll stage and constrained its oversized primary button.
- Made the 2-player shell use the same parchment palette and removed duplicate outer player pills on desktop; the right HUD remains the cash/status source.
- The 2-player receipt waits for the temporary event presentation to finish, leaving one animated event followed by one retained receipt.

## Checks

- `npx tsc -b --pretty false` passed.
- `npm test -- --reporter=dot` passed: 108 files, 992 tests.
- `npm run build` passed. Existing Framer Motion `"use client"` notices and large-chunk warning remain.
- 2-player and team route smoke screenshots captured at 1280×800. The 2-player board surface is 689px tall and fits the viewport; the page is 971px tall because secondary guide/history content continues below. The team surface fits 800px.

Additional controlled states are captured in [`state-evidence.md`](state-evidence.md) and `state-evidence/`: levels 0/1/2/3 on one board, a 360 shortfall, an opponent rent transfer, train destination selection/arrival, bankruptcy confirmation, keyboard focus, competing buy/decline actions, and reduced motion. The harness mounts the production board and uses the real engine/reducer with deterministic fixture states; it is not a random-match playthrough.

`roll-move-browser-capture.mp4` is a 4.5-second, 1280×800 capture of actual Chromium browser frames sampled every 100ms through the installed Playwright and encoded with the already-installed system FFmpeg. The browser interaction was live (roll → movement/event resolution); frames were not drawn or interpolated. It demonstrates the sequence and visual state changes, but does not establish hardware frame pacing or a long-match playthrough.

Independent visual review remains a blocker: revision 2 still has a large right rail alongside the center action surface; city art and labels can crowd one another; and reviewer feedback flags city-art semantics as insufficiently tied to construction stage. Treat these images and the clip as QA evidence, not design approval. Mobile, full motion-performance, and reviewer approval remain open.
