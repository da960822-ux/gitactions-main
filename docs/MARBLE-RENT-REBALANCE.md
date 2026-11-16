# SUPERSEDED PROPOSAL — NOT CURRENT RULES

The user superseded this proposal on2026-10-28: ordinary/tourism tolls and building components are now20% below deployed v52, and landmark tolls30% below, with land prices unchanged. The historical40%/50% proposal and simulations below must not describe the current implementation. Current specification: `MARBLE-ECONOMY-20PCT-20261028.md`.

# New-room toll adaptation — 2026-10-28

`rentRulesVersion: 2` applies only to newly created games. Missing/1 retains saved-room rates. Original calculator extraction stays unchanged: the playable board projection rounds each ordinary-city mask to 40% of its source toll and landmarks to 50%; tourism stages become 50%. Festival/blackout/color rules apply afterward, once. Prices, construction costs, takeover costs, sale values, starting cash3000 and salary450 are unchanged.

## Seoul, all independent-building combinations

| Buildings | Before | New |
|---|---:|---:|
| Land only |120|48|
| Villa |360|144|
| Building only |630|252|
| Villa + building |870|348|
| Hotel only |1170|468|
| Villa + hotel |1410|564|
| Building + hotel |1680|672|
| All three |1920|768|
| Landmark |2820|1410|

Ordinary full stack: festival3840→1536. Landmark: festival5640→2820. Landmark retains +83.6% toll premium over ordinary full stack, plus takeover immunity. Cheapest ordinary full stack126→50 (integer rounding); cheapest landmark501→251. Tourism120→60; purchase150/sale75 unchanged.

Cash examples (not predictions): purchasing/building a Seoul full stack costs1380. Starting3000 plus one salary450 leaves2070; paying another full-stack toll then leaves150 before versus1302 now. A Seoul landmark costs1980 total; starting3000 plus two salaries900 leaves1920; another landmark bill2820 would require rescue before, whereas1410 leaves510 now. Other purchases, cards and rent income are excluded.

Emergency rescue considers cash + property liquidation + an unused600 loan. Existing debt prevents another loan; in a crisis, cash+600 must cover payment before borrowing, so sales can be needed first. Repayment660 and sale proceeds are unchanged; Seoul landmark liquidation remains690, not990.

## Actual paired self-play, not human win rates

30 deterministic seeds1–30 per engine and condition, current heuristic AI, fixed minimum reserve200, existing120-turn cap; new board/festival/loan rules held fixed. Actual bundled production engines ran to completion. Final baseline explicitly clears `rentRulesVersion`; new condition uses2. Historical run evidence follows. `scripts/marble-rent-selfplay.ts` now runs the superseding current economy, not this retired proposal. Raw120-match evidence, summaries, exact configuration and source SHA256 fingerprints: `docs/performance/MARBLE-RENT-SELFPLAY-20261028.json`. This historical report was generated before the user superseded the proposal; its source SHA256 fingerprints identify that earlier code. Do not use its outcomes as current-economy results.

| Metric | 2p before | 2p new | Team before | Team new |
|---|---:|---:|---:|---:|
| Matches with any bankruptcy |22|7|28|7|
| Bankruptcy match endings |22|7|12|1|
| Monopoly match endings |7|19|7|3|
| Turn-cap endings |1|4|11|26|
| Average landmark builds |3.77|6.30|6.70|9.60|
| Average turns |50.60|73.90|100.87|116.27|
| Average property sales |7.93|5.73|8.47|4.00|

Tradeoff: team matches now usually reach the120-turn asset settlement. This is not evidence of balanced human outcomes; it verifies reduced forced liquidation/bankruptcy and more landmark construction under this AI. Baseline already produced landmarks in all30 seeds, so claiming landmark construction was literally impossible would be unsupported.

## Checks

Dedicated exhaustive checks cover all18 cities ×9 construction states ×3 save versions ×2 engines: recipient payment, single debit/rent event, reload and UI preview consistency. All additions remain strictly increasing within each city's building-subset lattice, and landmarks exceed full ordinary construction. Source prices/sale tables are unchanged. Tourism and one-use festival settlement are checked separately. Historical source-audit fixtures explicitly select version1.

Cross-city audit: the source reconstruction already has one building-only dip (source 여수315 → 제주309; new126 →124). The adaptation introduces no new price-tier reversals; it preserves that source distinction rather than silently revising the underlying formula. Every additional building still increases tolls within every city.
