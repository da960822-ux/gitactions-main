# Current requested economy — 20% ordinary/building and30% landmark-toll reduction

This supersedes the unpublished40% ordinary/50% landmark proposal. All reductions are relative to deployed v52 source amounts, not compounded with that proposal.

- New-room `rentRulesVersion: 2`: ordinary-city tolls and tourism tolls ×0.8; landmark tolls ×0.7. Round the base once, then apply existing festival/blackout/color modifiers.
- New-room `constructionPriceRulesVersion: 2`: villa, building, hotel and extra-landmark construction charges ×0.8, each rounded once. **Land purchase prices do not change.**
- Missing/1 flags preserve v52 saved-room values independently. Source calculator tables remain immutable. Public board, actual charges, AI, picker, ledgers and guides use the same adapted values.
- Investment equals unchanged land + actual discounted components. Takeover remains twice that investment. Sale returns half of unchanged land plus discounted normal buildings; extra-landmark cost remains excluded from liquidation as before. There is no resale gain from using old undiscounted cost bases.

## Exact examples

| Seoul construction | v52 toll | Current toll |
|---|---:|---:|
| Land |120|96|
| Villa |360|288|
| Building only |630|504|
| Villa + building |870|696|
| Hotel only |1170|936|
| Villa + hotel |1410|1128|
| Building + hotel |1680|1344|
| All three ordinary buildings |1920|1536|
| Landmark |2820|1974|

Seoul land300 unchanged; villa120→96, building360→288, hotel600→480, extra landmark600→480. Full ordinary investment1380→1164; full landmark investment1980→1644. Full-stack/landmark bank sale690→582. Ordinary takeover2760→2328; landmark remains immune.

Incheon opening example: land39 + villa12 + building36 =87; cash3000→2913; toll48→38. Old save remains99 cost/2901 cash/48 toll. Tourism purchase150/sale75 unchanged; toll120→96, including profile metadata.

Festival still doubles a single applicable toll: Seoul ordinary3072, landmark3948. These requested cuts do **not** guarantee survival or remove cash-management risk. Landmarks remain more valuable and protected from takeover.

## Reproducible evidence

Run commands at the top of `scripts/marble-rent-selfplay.ts`. Current raw report: `docs/performance/MARBLE-ECONOMY-20PCT-20261028.json`, with all120 match rows, source SHA256 fingerprints and configuration. It compares absent economic flags versus both2 under identical current board/loan/festival/event defaults and fixed AI minimum reserve200. This isolates economic changes, not every difference from the deployed v52 application. Heuristic AI results are not human win-rate evidence.

Historical stronger-cut results remain in `MARBLE-RENT-REBALANCE.md`, prominently marked superseded. They must not be quoted as the current balance outcome.

## Checks

`marble.rentRules.test.ts`: all18 cities×9 construction states×3 rent versions×2 engines, save reload, displayed vs charged toll, exactly-one payment, tourist metadata and one-use festival.

`marble.constructionPriceRules.test.ts`: all18 cities×8 masks×3 construction-price versions×2 engines, actual purchase, landmark upgrade, sale and save compatibility; investment/takeover/sale helper assertions and immutable source verification. No new building-subset reversals: adding any building always raises toll. The source's single cross-city building-only dip remains, rather than silently changing its reconstruction.

### Current economy-only self-play snapshot (before the new golden-key expansion)

| Metric,30 seeds each | 2p before | 2p current | Team before | Team current |
|---|---:|---:|---:|---:|
| Any bankruptcy in match |22|17|28|21|
| Bankruptcy ending |22|17|12|6|
| Monopoly ending |7|13|7|5|
|120-turn settlement |1|0|11|19|
| Mean landmark builds |3.77|5.67|6.70|9.93|
| Mean turns |50.60|62.63|100.87|110.40|

The baseline keeps current loan/festival rules and clears only the two economic flags; it is not a full historical application replay. The planned golden-key expansion is outside this snapshot and may change these outcomes.
