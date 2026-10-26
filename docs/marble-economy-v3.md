# Marble economy profile v3

This profile rebalances the existing 40-space, 24-city Marble map. It keeps the current cities, routes, special squares, and victory rules. It is a local economy design informed by a reference affordability ratio; it is not a claim of reproducing an official price table.

New games use economy version 3. Saved version 1/2 games continue to use their saved values. The 2-player engine, 2×2 team engine, purchase/build previews, AI valuations, and generated online engine bundle use the same economy helpers in `src/games/marbleEconomy.ts`.

## Values and formula

| Setting | Saved v2 | New v3 |
| --- | ---: | ---: |
| Starting cash per player | 1,500 | 3,000 |
| Pass-Start salary | 200 | 300 |
| City list | Existing | Existing |
| Effective city price | Existing 100–560 | 80% of old listed price, rounded to 10 (80–450) |
| Build costs | 40/60/80% of listed price | 40/60/80% of effective price, rounded to 10, minimum 30 |
| Bare-land rent | Existing hand-authored table | 25–30% of effective price, linear by original listed price, rounded to 10 |
| Rent by building stage | ×1 / ×2 / ×4 / ×8 | ×1 / ×2 / ×3 / ×4 |
| Completed color group | ×2 | ×2 |

The highest effective city price is 450, or 15% of new starting cash (versus 37.3% in saved v2). A 4,500/450 candidate matched a 10% highest-city ratio but produced 100/100 team turn-cap settlements and 23.75 mean cities owned at settlement; the selected 3,000/300 profile reduces that saturation while keeping first builds affordable. The 10% reference is an affordability comparison, not an official price claim. The event-card amounts and existing tax, fund, train, and island fees are unchanged. New economy version 3 now follows the existing loan/liquidation debt flow instead of immediately declaring bankruptcy when a payment exceeds cash.

## City examples

Active route display names and route positions are used below. Rent columns are bare / first build / second build / third build, before any group or temporary event multiplier.

| City | v2 price / bare rent / first build | v2 rents | v3 price / bare rent / first build | v3 rents |
| --- | --- | --- | --- | --- |
| Gwangju | 100 / 12 / 40 | 12 / 24 / 48 / 96 | 80 / 20 / 30 | 20 / 40 / 60 / 80 |
| Madrid | 140 / 18 / 60 | 18 / 36 / 72 / 144 | 110 / 30 / 40 | 30 / 60 / 90 / 120 |
| Puerto Plata | 180 / 26 / 70 | 26 / 52 / 104 / 208 | 140 / 40 / 60 | 40 / 80 / 120 / 160 |
| New York | 260 / 42 / 100 | 42 / 84 / 168 / 336 | 210 / 60 / 80 | 60 / 120 / 180 / 240 |
| Seoul (route index 38; legacy row is Vancouver) | 560 / 112 / 220 | 112 / 224 / 448 / 896 | 450 / 140 / 180 | 140 / 280 / 420 / 560 |

The existing completed-group multiplier doubles these rents. A one-use city-festival effect can double a rent once more. Thus Seoul's max v3 rent is 1,120 with a completed group, or 2,240 if the festival also applies, versus 3,584 for the old stage-3/group/festival stack. The 2-player AI simulation's 90th-percentile match maximum rent fell from 1,408 to 1,120; that metric is an AI run outcome, not a hard maximum.

The fixed five-city low/mid/high example (Gwangju, Madrid, Puerto Plata, New York, Seoul) costs 1,240 in v2 land plus 490 for one first build on each. At the 1,500 start, that is a 230 shortfall. In v3 the same five cost 990 in land plus 390 for those builds, leaving 1,620 from the 3,000 start. This is the specific early-build liquidity target.

## Paired simulation

`src/games/marbleEconomy.simulation.test.ts` runs seeds 1–100 for each economy in 2-player and team modes: 400 deterministic AI matches total. It uses the same board, action policy, dice/event seed per paired match, and the existing 120-personal-turn settlement cap. The 2-player route uses `chooseSimpleAiAction`; the team route uses `fourMarbleEngine.chooseAiAction`. These bots are useful for consistency checks, not substitutes for human playtests.

| Metric (per match unless noted) | 2p v2 | 2p v3 | Team v2 | Team v3 |
| --- | ---: | ---: | ---: | ---: |
| Average turns | 98.2 | 106.3 | 118.5 | 119.6 |
| Median / P90 turns | 112 / 120 | 120 / 120 | 120 / 120 | 120 / 120 |
| Turn-cap settlements / 100 | 45 | 58 | 93 | 98 |
| Bankruptcy outcomes / 100 | 55 | 42 | 7 | 2 |
| Average city buys | 11.8 | 21.0 | 14.7 | 24.6 |
| Average build actions | 31.0 | 59.9 | 39.6 | 72.1 |
| Average paid rent event | 270 | 302 | 272 | 295 |
| P90 per-match highest rent | 1,408 | 960 | 1,024 | 1,040 |
| Average rent-debt crises | 5.4 | 9.2 | 0 | 0 |
| Average loans / bank sales | 2.1 / 4.2 | 3.6 / 7.8 | 2.7 / 2.3 | 3.0 / 3.5 |
| Combined buys before each player's second Start crossing | 4.9 | 8.2 | 8.4 | 13.5 |
| Combined builds before each player's second Start crossing | 11.8 | 23.2 | 20.6 | 38.6 |
| Median cash immediately after a player's 5th buy | 352 | 480 | 556 | 790 |
| 5th-buy samples with a legal build still available | 100% | 100% | 99.0% | 100% |

There are tradeoffs to retain in review: 2-player rent-debt crises and liquidations increased even as bankruptcies fell; and team AI still averages 21.1 of 24 cities at settlement, with 98/100 reaching the turn cap. Reaching the cap is the existing win condition, not a failure. A 4,500/450 sensitivity run was even more saturated (24.7 mean team cities, 100 turn-cap games); lowering to 3,000/300 cuts the 2-player fifth-purchase median cash from that candidate's 1,880 to 480 while every sampled fifth buyer still had a legal build affordable. The simulations support improved early purchase/build liquidity and higher average collected rent, but they do not establish human match pacing or final balance.

## Test and scope notes

- Formula and route parity tests cover v3 prices, all rent stages, construction costs, start salary, purchase/build debits, a v3 debt/loan case, the five-city liquidity example, and saved-v2 values.
- Existing special-square costs and card behavior were not removed or replaced with no-ops.
- The new profile does not change cities, routes, end conditions, visual layout, or any other game.
- No mobile review, human playtest, production deploy, or main-branch merge was performed in this task.
