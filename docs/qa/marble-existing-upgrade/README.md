# Existing Marble visual upgrade — review checkpoint

Branch `codex/marble-existing-visual-upgrade` starts at main `2c78ba1`. The existing 40 cells, named cities and routes remain in place; the reviewed v3 rebalance changes only the existing economy (start 3,000, pass salary 300, adjusted land/build/rent). Saved matches retain their prior economy versions. No 32-cell World Business profile or new special-square rules are included. Main and production have not been updated.

## Compare on PC

- [Main baseline, 2p 1280×800](baseline-main-2p-1280x800.png)
- [Upgraded 2p stage, 1280×800](2p-stage-1280x800.png), [4p stage](4p-stage-1280x800.png), [2p 1440×900](2p-stage-1440x900.png), [4p 1440×900](4p-stage-1440x900.png)
- [Owner-coloured apartment selected on the board](2p-apartment-selected-1280x800.png), [simultaneous levels 0–3](2p-levels-1280x800.png)
- [Purchase](2p-purchase-1280x800.png), [build with skip](4p-build-1280x800.png), [rent/pass alternatives](4p-rent-pass-1280x800.png), [takeover cost/recipient/after cash](2p-takeover-1280x800.png)
- [Real 2p roll → five-tile move → purchase → build video](live-2p-turn-1280x800.mp4) and [4p video](live-4p-turn-1280x800.mp4). [2p state and DOM trace](live-2p-turn-trace.json), [4p trace](live-4p-turn-trace.json).
- [2p building rise and money transfer at 115ms](effect-2p-build-115ms.png), [at 340ms](effect-2p-build-340ms.png), [4p building/transfer](effect-4p-build-115ms.png), [2p rent transfer](effect-2p-rent-115ms.png), [4p rent transfer](effect-4p-rent-115ms.png), [reduced-motion static equivalent](effect-2p-build-reduced-115ms.png).
- [2p second-city sale before selection](2p-debt-sale-1280x800.png) and [after selection](2p-debt-sale-resolved-1280x800.png); corresponding 4p screenshots are alongside them.

The video script uses the existing engines and clicks the rendered primary action; seed 1 gives an opening five-cell move onto Santiago. Its DOM observer confirmed the moving pawn visible on each of cells 2–6 in both modes. The final state is owned Santiago with one house and cash 2,820 after purchase and first build. The controlled screens are separate seeded scenarios, each starting at 3,000 cash; they use the existing engine's public views and submit real actions. Both modes resolved Gwangju purchase 3,000→2,920 (80), a separately seeded Gwangju level 1→2 build 3,000→2,950 (50; rent 40→60), rent 3,000→2,940 (60), and takeover 3,000→2,700 (300). With one pass, rent was waived and the pass count went 1→0. The center build preview, selected-city ledger, and economic helper agree on the 50 cost.

Run with an existing local Vite server at `http://127.0.0.1:5176/play?game=marble`:

```sh
node docs/qa/marble-existing-upgrade/capture.mjs
node docs/qa/marble-existing-upgrade/capture-motion.mjs
node docs/qa/marble-existing-upgrade/capture-effects.mjs
```

This integration checkpoint has a wider board, horizontal cash/asset HUDs, contextual center actions, selected-city preview, distinct land/house/apartment/landmark art, owner paint on house roofs and apartment facades, visible moving pawns and stage-local growth. The build and rent choices stay together in the viewport. The transfer preview names the payee and shows cost and resulting cash.

The newer effect script clicks real engine build/rent actions and observes a single sequence-keyed HUD-to-HUD/board money token with sender −cost, recipient +cost, and resulting balance. It finds the tile's `mp-owner-building-rise` animation on 2p/4p, checks that the transfer disappears and does not replay after a parent re-render, and checks that reduced-motion disables both animations. The debt-sale capture selects the second city and confirms only that city is sold in both modes. Saved legacy 18-cell roll/buy/end-turn buttons have regression tests.

**Remaining review items:** The first enlarged layout patch is merged, but independent review still found side tile label/price/tier clipping. The separate layout/art owner is correcting those cells; current screenshots are integration evidence, not final visual approval. The zero-pass 4p action defect is fixed in the merged economy candidate. The economy candidate passed its separate review, but this combined screen and updated layout still need final review. Mobile was explicitly removed from scope.

Checks for the merged code: production build (including TypeScript and edge bundle) passed; Playwright/Chromium captures showed no page errors. Full Vitest passed 117 files / 1,023 tests, including the combined 4p decision/ledger regression assertion. Reproducible capture code and evidence are game-only files under this folder.
