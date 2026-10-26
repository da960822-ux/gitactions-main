# Existing Marble visual upgrade — review checkpoint

Branch `codex/marble-existing-visual-upgrade` starts at main `2c78ba1`. The existing 40 cells, named cities, routes and engine economy remain in place. No 32-cell World Business profile or new special-square rules are included. Main and production have not been updated.

## Compare on PC

- [Main baseline, 2p 1280×800](baseline-main-2p-1280x800.png)
- [Upgraded 2p stage, 1280×800](2p-stage-1280x800.png), [4p stage](4p-stage-1280x800.png), [2p 1440×900](2p-stage-1440x900.png), [4p 1440×900](4p-stage-1440x900.png)
- [Owner-coloured apartment selected on the board](2p-apartment-selected-1280x800.png), [simultaneous levels 0–3](2p-levels-1280x800.png)
- [Purchase](2p-purchase-1280x800.png), [build with skip](4p-build-1280x800.png), [rent/pass alternatives](4p-rent-pass-1280x800.png), [takeover cost/recipient/after cash](2p-takeover-1280x800.png)
- [Real 2p roll → five-tile move → purchase → build video](live-2p-turn-1280x800.mp4) and [4p video](live-4p-turn-1280x800.mp4). [2p state and DOM trace](live-2p-turn-trace.json), [4p trace](live-4p-turn-trace.json).
- [2p building rise and money transfer at 115ms](effect-2p-build-115ms.png), [at 340ms](effect-2p-build-340ms.png), [4p building/transfer](effect-4p-build-115ms.png), [2p rent transfer](effect-2p-rent-115ms.png), [4p rent transfer](effect-4p-rent-115ms.png), [reduced-motion static equivalent](effect-2p-build-reduced-115ms.png).
- [2p second-city sale before selection](2p-debt-sale-1280x800.png) and [after selection](2p-debt-sale-resolved-1280x800.png); corresponding 4p screenshots are alongside them.

The video script uses the existing engines and clicks the rendered primary action; seed 1 gives an opening five-cell move onto Santiago. Its DOM observer confirmed the moving pawn visible on each of cells 2–6 in both modes. The final state is owned Santiago with one house and cash 1,280 after purchase and first build. The controlled screens use the existing engine's public views and submit real actions. Both modes resolved purchase 1,500→1,400, build 1,500→1,440, rent 1,500→1,464, and takeover 1,500→1,100. With one pass, rent was waived and the pass count went 1→0.

Run with an existing local Vite server at `http://127.0.0.1:5176/play?game=marble`:

```sh
node docs/qa/marble-existing-upgrade/capture.mjs
node docs/qa/marble-existing-upgrade/capture-motion.mjs
node docs/qa/marble-existing-upgrade/capture-effects.mjs
```

This checkpoint has a square, full-height board, compact cash/asset HUDs, contextual center actions, selected-city preview, distinct land/house/apartment/landmark art, owner paint on house roofs and apartment facades, visible moving pawns and stage-local growth. The build and rent choices stay together in the viewport. The transfer preview names the payee and shows cost and resulting cash.

The newer effect script clicks real engine build/rent actions and observes a single sequence-keyed HUD-to-HUD/board money token with sender −cost, recipient +cost, and resulting balance. It finds the tile's `mp-owner-building-rise` animation on 2p/4p, checks that the transfer disappears and does not replay after a parent re-render, and checks that reduced-motion disables both animations. The debt-sale capture selects the second city and confirms only that city is sold in both modes. Saved legacy 18-cell roll/buy/end-turn buttons have regression tests.

**Remaining review items:** Independent review has rejected the current square 1280 PC map and small edge art. A separate layout/art owner is enlarging the board and refining tile zones; this branch leaves those presentation modules unchanged after the initial checkpoint. The 4p engine advertises `use-rent-pass` when zero passes are held; the UI hides it, but that engine defect belongs to the economy worker. Mobile was explicitly removed from scope.

Checks at this checkpoint: Vitest 115 files / 1,008 tests passed, production build (including TypeScript and edge bundle) passed; Playwright/Chromium captures showed no page errors. Reproducible capture code and evidence are game-only files under this folder.
