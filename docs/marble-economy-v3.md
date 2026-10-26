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

The highest effective city price is 450, or 15% of new starting cash (versus 37.3% in saved v2). A 4,500/450 candidate matched a 10% highest-city ratio but produced 100/100 team turn-cap settlements, 24.74 average purchase actions, and 23.75 final owned cities; the selected 3,000/300 profile reduces that saturation while keeping first builds affordable. The 10% reference is an affordability comparison, not an official price claim. The event-card amounts and existing tax, fund, train, and island fees are unchanged. New economy version 3 now follows the existing loan/liquidation debt flow instead of immediately declaring bankruptcy when a payment exceeds cash.

## City examples

Active route display names and route positions are used below. Rent columns are bare / first build / second build / third build, before any group or temporary event multiplier.

| City | v2 price / bare rent / first build | v2 rents | v3 price / bare rent / first build | v3 rents |
| --- | --- | --- | --- | --- |
| Gwangju | 100 / 12 / 40 | 12 / 24 / 48 / 96 | 80 / 20 / 30 | 20 / 40 / 60 / 80 |
| Madrid | 140 / 18 / 60 | 18 / 36 / 72 / 144 | 110 / 30 / 40 | 30 / 60 / 90 / 120 |
| Puerto Plata | 180 / 26 / 70 | 26 / 52 / 104 / 208 | 140 / 40 / 60 | 40 / 80 / 120 / 160 |
| New York | 260 / 42 / 100 | 42 / 84 / 168 / 336 | 210 / 60 / 80 | 60 / 120 / 180 / 240 |
| Seoul (route index 38; legacy row is Vancouver) | 560 / 112 / 220 | 112 / 224 / 448 / 896 | 450 / 140 / 180 | 140 / 280 / 420 / 560 |

The existing completed-group multiplier doubles these rents. A one-use city-festival effect can double a rent once more. Thus Seoul's max v3 rent is 1,120 with a completed group, or 2,240 if the festival also applies, versus 3,584 for the old stage-3/group/festival stack. In the controlled 2-player AI run, the 90th-percentile match maximum rent was 1,408 in v2 and 1,040 in v3; that metric is an AI run outcome, not a hard maximum.

The fixed five-city low/mid/high example (Gwangju, Madrid, Puerto Plata, New York, Seoul) costs 1,240 in v2 land plus 490 for one first build on each. At the 1,500 start, that is a 230 shortfall. In v3 the same five cost 990 in land plus 390 for those builds, leaving 1,620 from the 3,000 start. This is the specific early-build liquidity target.

## Paired simulation

`src/games/marbleEconomy.simulation.test.ts` runs seeds 1–100 in each economy in 2-player and team modes: 400 deterministic matches. The board, dice/event seed, and AI reserve are held constant across versions; the simulation passes a fixed reserve of 200 to both AI policies so the comparison isolates the economy rather than the production v3 reserve override. This controlled AI run is a measurement aid, not a prediction of human play. A turn is one completed personal turn; total actions count each engine action separately (rolls, builds, buys, debt actions, and so on).

The fifth-purchase samples count players, not matches. “Build affordable” means the engine exposes at least one legal build immediately after that player's fifth successful bank purchase. “Cash after immediate build” includes only the sample where their very next action was a build. Purchase actions count rebuys after a city was sold; distinct cities count unique board indices ever bought, and final owned cities count unique property entries still owned at settlement. Rent-debt crises count only a transition into debt caused by rent, once per episode. Paid-rent averages exclude zero-cost rent-pass events. First-bankruptcy turn is the first failed player's current completed-turn index (reported only in games with bankruptcy). The maximum-rent cash ratio uses cash immediately before the largest paid/attempted toll; if that balance is zero, the denominator is floored to one game unit.

| Metric | 2p v2 | 2p v3 | Team v2 | Team v3 |
| --- | ---: | ---: | ---: | ---: |
| Average completed personal turns | 98.2 | 106.6 | 118.5 | 119.6 |
| Median / P90 turns | 112 / 120 | 120 / 120 | 120 / 120 | 120 / 120 |
| Average engine actions per match | 334.0 | 375.9 | 370.9 | 397.1 |
| Turn-cap settlements / 100 | 45 | 55 | 93 | 98 |
| Matches ending in bankruptcy / 100 | 55 | 45 | 7 | 2 |
| Average buy actions / distinct cities ever bought / repeat buys | 11.8 / 10.6 / 1.2 | 20.5 / 17.6 / 2.9 | 14.7 / 14.0 / 0.7 | 24.6 / 22.7 / 2.0 |
| Average distinct cities still owned at finish | 7.6 | 13.3 | 12.4 | 21.1 |
| Average build actions | 31.0 | 58.3 | 39.6 | 72.2 |
| Average positive paid-rent amount | 293 | 315 | 287 | 306 |
| P90 largest rent per match | 1,408 | 1,040 | 1,120 | 1,040 |
| Median cash before match's largest rent | 260 | 280 | 428 | 610 |
| Median / P90 largest-rent-to-cash ratio | 2.52 / 12.00 | 2.40 / 14.67 | 1.43 / 6.00 | 1.21 / 4.63 |
| Average rent-debt episodes / loans / bank sales | 3.66 / 2.07 / 4.15 | 5.95 / 3.29 / 7.14 | 3.71 / 2.66 / 2.30 | 4.31 / 3.02 / 3.50 |
| Combined buys / builds before each player's second salary receipt | 5.1 / 12.1 | 8.5 / 23.8 | 8.8 / 21.4 | 14.4 / 40.9 |
| Fifth-buy matches / player samples | 96 / 154 | 100 / 194 | 82 / 105 | 100 / 332 |
| Median cash immediately after fifth buy | 352 | 540 | 556 | 790 |
| Fifth-buy samples with a legal build available | 100% | 100% | 99.0% | 100% |
| Immediate next-action builds after fifth buy; median remaining cash | 100; 342 | 165; 510 | 80; 498 | 293; 740 |
| Median / P90 cash at settlement (per player) | 317 / 581 | 350 / 800 | 396 / 804 | 600 / 1,520 |
| Median first-bankruptcy turn (bankrupt games only) | 85 (55 games) | 96 (45 games) | 90 (31 games) | 100 (14 games) |

The candidate improves fifth-buy liquidity and increases unique acquisitions/builds in both routes. It also increases 2-player rent-debt episodes, loans, and sales despite fewer bankruptcies. Team games remain close to the existing settlement cap, and v3 ends with an average 21.1 of 24 distinct cities owned. A separate 4,500/450 sensitivity run averaged 24.74 buy actions and 23.75 distinct final city holdings (not 24.7 unique cities); all 100 team games reached the cap. These results justify review of the liquidity loop, not a claim that pacing or balance is finished.

## Test and scope notes

- Formula and route parity tests cover v3 prices, all rent stages, construction costs, start salary, purchase/build debits, a v3 debt/loan case, the five-city liquidity example, and saved-v2 values.
- Existing special-square costs and card behavior were not removed or replaced with no-ops.
- The new profile does not change cities, routes, end conditions, visual layout, or any other game.
- No mobile review, human playtest, production deploy, or main-branch merge was performed in this task.
