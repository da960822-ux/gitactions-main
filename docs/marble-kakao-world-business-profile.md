# Kakao Marble World / Business reference profile

The new Marble route uses a versioned 32-cell, 18-city World map and the 2013 mobile Business-class data supplied for this audit. New 2-player and solo 2×2 games use `kakao-world-business-2013-zero-discount` (`cityRouteVersion: 4`, `economicVersion: 4`). Existing saves without that profile ID continue to use their prior route and economy; do not migrate their money, positions, properties, or construction masks.

## Data and mechanics connected

- City purchase and per-structure construction prices, with no construction discount, come from the transcribed 2013-12-01 community calculator image: [source image](https://appdata.hungryapp.co.kr/data_file/data_img/201312/01/Wjg761F138583142696648188.png). Its author notes transcription uncertainty. The 32-cell order is from a secondary map listing: [map source](https://tcatmon.com/wiki/모두의마블_for_Kakao).
- The 18 Business toll rows come from the same-date public XLS supplied for this audit: [XLS post](https://cafe.naver.com/momakakao/124693). The 2013 edition labels its class scales Economy 1×, Business 2.5×, First 5×. The active route fixes Business; no character, cash-item, or event multipliers are applied to the listed tolls.
- Verified starting cash is 5,000,000: [2014 community report](https://m.hungryapp.co.kr/bbs/bbs_view.php?durl=YmNvZGU9ZXZlcm1hcnZlbCZwaWQ9MzUwOTg2JnVzZXI9), corroborated by the launch-era class-selection screenshot supplied in the audit.
- Buildings are independently selectable: villa, building, and hotel may be selected separately; a landmark requires all three. Building unlocks require landing on that owned city and at least 0/1/2/3 completed own laps for villa/building/hotel/landmark. These lap gates are secondary-rule evidence and are explicitly represented in the data profile.
- Ordinary-property acquisition is 2× land plus selected ordinary-building investment. Sale returns half that ordinary investment; the landmark surcharge is excluded. Tourism tiles can be bought from the bank for 250,000 and cannot be acquired from a player. A community rule explanation says owning all five tourism tiles wins immediately: [2015 explanation](https://www.inven.co.kr/board/mogong/4222/402).
- Blue islands charge by the owner’s island count (1/2/3 → 200,000/400,000/800,000). Pink beaches charge by their visit stage (1/2/3 → same schedule); a secondary rule description says the current visitor pays before the beach stage advances: [rule description](https://www.namu.moe/w/모두의마블%20for%20kakao/규칙).
- Noncanonical city building masks use additive building toll increments. This is directly corroborated only for Cairo with “building only”: a 2015 screenshot shows a 56,000 Economy toll, which scales to 140,000 Business; canonical toll rows and the other partial masks are documented separately by `classicMarbleCityTollEvidence()`.

## Explicit unknowns and assumptions

- Pass-Start salary is **750,000 inferred**, not directly verified. The profile exposes `salaryStatus: inferred` and every salary event says so. The class-proportional estimate is not described as an original confirmed value.
- Beach starting stage 1 and advancing on an unowned visit are implementation defaults, not directly verified from the supplied XLS. Reset after sale is unverified; tourism player acquisition is disabled in the connected rules.
- The legacy 100-marble island escape payment is not confirmed for this 5,000,000-marble profile, so the new route does not offer it; the existing legacy route retains its old action.
- The all-five tourism victory is direct secondary evidence for one player. In the custom 2×2 route, the implementation currently requires one seat to own all five before awarding that seat’s team; that team adaptation is not a historical Kakao team rule.
- The unowned city/tourism decision flow and verified prices/rents/building actions are connected. Bonus-game, fortune-card, Olympic, tax, and world-travel effects are left as “reference pending” with no invented card or tax charge. Exact island hold/escape rules, card composition/probabilities, debt/credit rules, turn-limit victory, and bankruptcy/value settlement were not recovered from this reference packet. Legacy route-specific settlement/turn logic remains local-game behavior, not a claim of historical parity.
- The reference city toll table lists canonical building combinations. The Cairo building-only case is the only direct partial-mask toll observation; other noncanonical masks are extrapolated by additive increments. No unobserved mask is labeled as source-verified.

## Smoke examples

Bangkok costs 50,000 for land and 25,000 for a villa. Business toll goes 5,000 → 20,000 after villa. Building costs 75,000 and canonical land+villa+building toll is 70,000. Seoul costs 500,000; villa/building/hotel cost 200,000/600,000/1,000,000; its canonical tolls are 200,000/600,000/1,450,000/3,200,000/4,700,000 (bare through landmark). No city-group multiplier is added.

Tourism selectors are isolated in `src/games/marble-tourism-selector.ts`; city/toll/cost and construction eligibility are in `src/games/marble-reference-profile.ts`. Both game engines, public build/toll previews, and the team AI use these shared selectors/helpers.
