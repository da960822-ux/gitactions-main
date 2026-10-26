# Existing Marble visual upgrade — review checkpoint

Branch `codex/marble-existing-visual-upgrade` starts at main `2c78ba1`. The existing 40 cells, named cities, routes and engine economy remain in place. No 32-cell World Business profile or new special-square rules are included. Main and production have not been updated.

## Compare on PC

- [Main baseline, 2p 1280×800](baseline-main-2p-1280x800.png)
- [Upgraded 2p stage, 1280×800](2p-stage-1280x800.png), [4p stage](4p-stage-1280x800.png), [2p 1440×900](2p-stage-1440x900.png), [4p 1440×900](4p-stage-1440x900.png)
- [Owner-coloured apartment selected on the board](2p-apartment-selected-1280x800.png), [simultaneous levels 0–3](2p-levels-1280x800.png)
- [Purchase](2p-purchase-1280x800.png), [build with skip](4p-build-1280x800.png), [rent/pass alternatives](4p-rent-pass-1280x800.png), [takeover cost/recipient/after cash](2p-takeover-1280x800.png)
- [Real 2p roll → five-tile move → purchase → build video](live-2p-turn-1280x800.mp4) and [4p video](live-4p-turn-1280x800.mp4). [2p state and DOM trace](live-2p-turn-trace.json), [4p trace](live-4p-turn-trace.json).

The video script uses the existing engines and clicks the rendered primary action; seed 1 gives an opening five-cell move onto Santiago. Its DOM observer confirmed the moving pawn visible on each of cells 2–6 in both modes. The final state is owned Santiago with one house and cash 1,280 after purchase and first build. The controlled screens use the existing engine's public views and submit real actions. Both modes resolved purchase 1,500→1,400, build 1,500→1,440, rent 1,500→1,464, and takeover 1,500→1,100. With one pass, rent was waived and the pass count went 1→0.

Run with an existing local Vite server at `http://127.0.0.1:5176/play?game=marble`:

```sh
node docs/qa/marble-existing-upgrade/capture.mjs
node docs/qa/marble-existing-upgrade/capture-motion.mjs
```

This checkpoint has a square, full-height board, compact cash/asset HUDs, contextual center actions, selected-city preview, distinct land/house/apartment/landmark art, owner paint on house roofs and apartment facades, visible moving pawns and stage-local growth. The build and rent choices stay together in the viewport. The transfer preview names the payee and shows cost and resulting cash.

**Remaining review items:** validate the construction effect timing in live video frame by frame, and add a spatial origin→destination money movement treatment if the current event card plus settled receipt is insufficient. The old 40-cell board still constrains edge-tile art at 1280, so independent visual review must decide whether tile text and building silhouettes meet the PC readability target. The 4p engine advertises `use-rent-pass` when zero passes are held; the UI hides it, but that engine defect belongs to the economy worker. Mobile was explicitly removed from scope.

Checks at this checkpoint: Vitest 115 files / 1,005 tests passed, production build (including TypeScript and edge bundle) passed; Playwright/Chromium captures showed no page errors. Reproducible capture code and evidence are game-only files under this folder.
