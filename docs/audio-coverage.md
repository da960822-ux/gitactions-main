# Contextual audio coverage

Scope: six requested games only. **rhythm**: Explicitly excluded: existing rhythm audio is unchanged. **catchmind**: Explicitly excluded: existing drawing/answer audio is unchanged.

The executable inventory is `src/audio/coverage.ts`; this document mirrors it. **40 accepted action types**, **60 public event types**, and **16 Marble card IDs** are explicitly accounted for. Counts sum per-game types; a repeated name in another game is a separate contract.

## Timing, ownership and privacy

- Listed cue arrays are possible outcomes or separately timed layers, never a direction to play every cue simultaneously.
- A rejected action must not produce an accepted-action cue. Marble decline/skip-train and Domino legacy set-mode have no guaranteed event, so their acknowledgement follows a successful action response.
- Marble uses the event currently presented and step frames, not the newest raw board. Domino and Jaipur presentation owners prevent shared-feedback double sounds.
- Splendor uses confirmed own transfers and public opponent counters; Da Vinci uses published draw/guess events. A hidden draw or reserve identity never chooses a pitch or timbre.
- Existing Hwatu presentation offsets own card contact/capture sounds. A no-bonus special event intentionally gets no reward cue.
- Initial snapshots, historical replay/reconnect batches, hidden tabs, and unmounts must not create new historical audio. Those lifecycle contracts are tested in the runtime/presenter suites, not asserted solely by this inventory.
- Local hover, focus and candidate selection are not accepted game actions; optional existing selection Foley is not counted as successful gameplay.

## Regression gate

Run `npx vitest run src/audio/coverage.test.ts`. Tests parse actual two-player and four-player source with TypeScript AST: action comparisons, includes/switch branches, action-label objects and fourMarble's dynamic `add(ko,es,type)` calls. Event unions/interfaces plus literal/conditional emitter calls are compared strictly with this manifest. A new source action/event or stale manifest key fails the gate. Four-player Splendor/Hwatu reuse their two-player validators and are covered by the combined source inventory.

The gate also checks both Marble card definitions, Jaipur take payload modes, cue IDs, live dispatcher outputs, and invariance to hidden reservation identities. It does **not** substitute for browser event timing, real output listening, or end-to-end replay testing.

## marble

Engine sources: `src/games/marble.ts`, `src/games/fourMarble.ts`.

### Accepted actions

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `roll` | `dice`, `step`, `arrival` | createMarbleAudioPresenter · presented-event | Accepted roll, each presented step, then arrival; no click anticipation. |
| `attempt-doubles` | `dice`, `escape`, `jail`, `step` | createMarbleAudioPresenter · presented-event | Public dice outcome chooses escape or island rest. |
| `buy` | `buy`, `build`, `landmark` | createMarbleAudioPresenter · presented-event | Land purchase and optional selected buildings/landmark are public. |
| `build` | `build`, `landmark` | createMarbleAudioPresenter · presented-event | Ordinary construction and landmark completion differ. |
| `takeover` | `takeover` | createMarbleAudioPresenter · presented-event | Accepted ownership transfer. |
| `borrow` | `loan` | createMarbleAudioPresenter · presented-event | Fixed loan receipt, not an income-card reward. |
| `repay` | `repay` | createMarbleAudioPresenter · presented-event | Accepted debt repayment. |
| `sell-property` | `sell` | createMarbleAudioPresenter · presented-event | Accepted bank liquidation. |
| `declare-bankruptcy` | `crisis` | createMarbleAudioPresenter · presented-event | Confirmed individual bankruptcy; result is separate. |
| `choose-pawn` | `select` | createMarbleAudioPresenter · presented-event | Confirmed public pawn choice. |
| `pay-rent` | `income`, `outgoing`, `coin` | createMarbleAudioPresenter · presented-event | Direction uses only the presented public viewer money delta. |
| `use-rent-pass` | `ticket` | createMarbleAudioPresenter · presented-event | Confirmed pass use, no cash sound for zero payment. |
| `pay-escape` | `escape` | createMarbleAudioPresenter · presented-event | Confirmed paid island release. |
| `use-escape-pass` | `ticket` | createMarbleAudioPresenter · presented-event | Confirmed escape-pass use. |
| `choose-train` | `travel`, `step`, `arrival` | createMarbleAudioPresenter · presented-event | Travel departure and actual presented route. |
| `choose-event-city` | `festival`, `blackout`, `rest` | createMarbleAudioPresenter · presented-event | Applied city-card or free festival-site effect, or explicit no-effect result. |
| `endTurn` | `turn` | createMarbleAudioPresenter · presented-event | Confirmed next turn or extra roll. |
| `decline` | `pass` | cueForAction / MarbleTeamBoard · accepted-action | No engine event; only successful action completion may acknowledge it. |
| `skip-train` | `pass` | cueForAction / MarbleTeamBoard · accepted-action | No travel sound when the accepted choice declines travel. |

### Public events

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `roll` | `dice` | createMarbleAudioPresenter · presented-event | Dice phase of the presentation. |
| `move` | `step` | createMarbleAudioPresenter · presented-event | Movement event is silent itself; each presented traveler step owns one impact. |
| `arrival` | `arrival` | createMarbleAudioPresenter · presented-event | Arrival frame, not raw destination state. |
| `pawn` | `select` | createMarbleAudioPresenter · presented-event | Public pawn selection. |
| `buy` | `buy`, `build`, `landmark` | createMarbleAudioPresenter · presented-event | Purchase plus optional construction layer. |
| `build` | `build`, `landmark` | createMarbleAudioPresenter · presented-event | Public construction level selects material/accent. |
| `takeover` | `takeover` | createMarbleAudioPresenter · presented-event | Ownership transfer. |
| `sell` | `sell` | createMarbleAudioPresenter · presented-event | Bank sale. |
| `rent` | `income`, `outgoing`, `coin`, `ticket` | createMarbleAudioPresenter · presented-event | Viewer delta determines transfer direction; pass means ticket. |
| `tax` | `income`, `outgoing`, `coin` | createMarbleAudioPresenter · presented-event | Public payment direction. |
| `bonus` | `income`, `outgoing`, `coin`, `festival` | createMarbleAudioPresenter · presented-event | Public receipt; festival may add its specific accent. |
| `salary` | `income`, `coin` | createMarbleAudioPresenter · presented-event | Four-player-only Start crossing salary; income for recipient, neutral coin for another viewer. |
| `event-card` | `key-draw`, `event`, `rest`, `ready`, `festival`, `income`, `outgoing`, `travel`, `move`, `jail`, `ticket`, `warning`, `blackout` | createMarbleAudioPresenter · presented-event | Draw reveal uses key Foley; pending choice is ready, applied resolution uses the exact card below, no-effect uses rest. |
| `festival-site` | `ready`, `festival`, `rest` | createMarbleAudioPresenter · presented-event | Free corner: ready on target choice, festival only on applied receipt, rest when no eligible city. Never key draw, even with inherited travel-card causality. |
| `loan` | `loan` | createMarbleAudioPresenter · presented-event | Loan receipt. |
| `repay` | `repay` | createMarbleAudioPresenter · presented-event | Debt repayment. |
| `crisis` | `debt` | createMarbleAudioPresenter · presented-event | Pending payment shortage. |
| `bankruptcy` | `crisis` | createMarbleAudioPresenter · presented-event | Confirmed bankruptcy. |
| `monopoly-warning` | `warning`, `rest` | createMarbleAudioPresenter · presented-event | Warning or explicit no-effect outcome. |
| `island` | `jail` | createMarbleAudioPresenter · presented-event | Island entry or failed escape. |
| `escape` | `escape`, `ticket` | createMarbleAudioPresenter · presented-event | Release or escape-pass acquisition/use. |
| `train` | `travel`, `ticket`, `ready` | createMarbleAudioPresenter · presented-event | Departure, ticket, or travel-ready prompt are distinct. |
| `rest` | `rest` | createMarbleAudioPresenter · presented-event | Rest stop. |
| `turn` | `turn` | createMarbleAudioPresenter · presented-event | Turn advance. |
| `win` | `win`, `lose`, `score` | createMarbleAudioPresenter · presented-event | Viewer/team win, loss, or draw only after presentation. |

### Variants and explicit silence

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `card:draw` | `key-draw` | createMarbleAudioPresenter · presented-event | Identical draw sound for every card until publicly revealed. |
| `card:no-effect` | `rest` | createMarbleAudioPresenter · presented-event | Explicit no-effect card outcome is not a reward. |
| `card:pending-choice` | `ready` | createMarbleAudioPresenter · presented-event | A public choice prompt is not yet an applied festival, blackout or travel effect. |
| `construction:landmark` | `landmark` | createMarbleAudioPresenter · presented-event | Distinct completion accent from ordinary building. |
| `route:step` | `step` | createMarbleAudioPresenter · presented-event | Deduplicated by event sequence, seat and presented tile. |

## splendor

Engine sources: `src/games/splendor.ts`, `src/games/fourSplendor.ts`.

### Accepted actions

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `take` | `select`, `return-tokens`, `noble` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Gem landing; optional returned excess and later public noble. |
| `takeTwo` | `select`, `return-tokens`, `noble` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Double gem landing; optional excess return. |
| `reserve` | `place`, `select`, `return-tokens`, `noble` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Card sleeve plus actual gold/return transfers; never encode reserved identity. |
| `buy` | `buy`, `return-tokens`, `noble` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Card/purchase landing and public payment/noble. |
| `chooseNoble` | `noble` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Only the confirmed award, not the selection click. |

### Public events

This engine has no discrete public event log. The public-delta variants below are the source of accepted effects; hidden deck/reserved identities are not inspected.

### Variants and explicit silence

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `take:returnTokens` | `return-tokens` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Excess-token return is a separate presented outward transfer. |
| `reserve:market` | `place` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Public market card reservation. |
| `reserve:deck` | `place` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Same reservation cue for every hidden deck identity. |
| `reserve:gold` | `select` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Only actual gold received. |
| `buy:reserved` | `buy` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Same accepted purchase cue as a market purchase. |
| `buy:market` | `buy` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Public development-card purchase. |
| `noble` | `noble` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Noble may follow any accepted eligible turn. |
| `turn` | `turn` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Public turn change. |
| `result` | `win`, `lose`, `event` | SplendorMotion / splendorOpponentCues / SplendorTeamTable · public-delta | Public viewer/team result; neutral event for draw and no hidden reserved-card scoring inference. |

## davinci

Engine sources: `src/games/davinci.ts`, `src/games/fourDavinci.ts`.

### Accepted actions

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `draw` | `draw` | GameFeedback / DaVinciTeamTable · public-delta | Same tile draw cue for every hidden number and color. |
| `skip-draw` | `turn` | GameFeedback / DaVinciTeamTable · public-delta | Public empty-stock transition to guessing. |
| `place-joker` | `place` | GameFeedback / DaVinciTeamTable · public-delta | Confirmed arrangement only. |
| `finish-setup` | `ready` | GameFeedback / DaVinciTeamTable · public-delta | Confirmed setup completion. |
| `guess` | `correct`, `error` | GameFeedback / DaVinciTeamTable · public-delta | No pre-accepted guess cue; only published outcome. |
| `reveal-own` | `error` | GameFeedback / DaVinciTeamTable · public-delta | Published failed-guess penalty reveal, never hidden tile content. |
| `stop` | `turn` | GameFeedback / DaVinciTeamTable · public-delta | Accepted turn end. |

### Public events

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `draw` | `draw` | GameFeedback / DaVinciTeamTable · public-delta | Public occurrence only; hidden tile identity never changes pitch. |
| `arrange` | `place` | GameFeedback / DaVinciTeamTable · public-delta | Public rack movement. |
| `ready` | `ready` | GameFeedback / DaVinciTeamTable · public-delta | Setup ready. |
| `skip-draw` | `turn` | GameFeedback / DaVinciTeamTable · public-delta | Empty stock transition. |
| `correct-guess` | `correct` | GameFeedback / DaVinciTeamTable · public-delta | Published success. |
| `wrong-guess` | `error` | GameFeedback / DaVinciTeamTable · public-delta | Published failure. |
| `stop` | `turn` | GameFeedback / DaVinciTeamTable · public-delta | Turn end. |

### Variants and explicit silence

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `result` | `win`, `lose`, `event` | GameFeedback / DaVinciTeamTable · public-delta | Only public match outcome; neutral event for draw, setup and tile draws never disclose identity. |

## minhwatu

Engine sources: `src/games/minhwatu.ts`, `src/games/fourMinhwatu.ts`.

### Accepted actions

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `play` | `place`, `draw`, `capture`, `special` | useMinhwatuPresentation / HwatuMotion · presented-event | Accepted hand-card, public deck flip, matched captures, then earned yaku. |
| `capture` | `capture`, `special` | useMinhwatuPresentation / HwatuMotion · presented-event | Confirmed pending public pair and any completed yaku. |

### Public events

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `deal` | `deal` | useMinhwatuPresentation / HwatuMotion · presented-event | Only live presented deal; initial/reconnect history is suppressed. |
| `play` | `place` | useMinhwatuPresentation / HwatuMotion · presented-event | Card contact. |
| `draw` | `draw` | useMinhwatuPresentation / HwatuMotion · presented-event | Public draw flip contact. |
| `capture` | `capture` | useMinhwatuPresentation / HwatuMotion · presented-event | Per-card landing offsets with bounded voices. |
| `special` | `special` | useMinhwatuPresentation / HwatuMotion · presented-event | Earned positive yaku bonus uses stack triplet, not premature victory. |
| `turn` | `turn` | useMinhwatuPresentation / HwatuMotion · presented-event | Presented next turn. |
| `win` | `win`, `lose`, `score` | useMinhwatuPresentation / HwatuMotion · presented-event | Public result; score uses draw-result Foley for ties. |

### Variants and explicit silence

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `special:no-bonus` | Intentional silence | hwatuCueForEvent · silent | A special event without a positive earned bonus intentionally has no reward sound. |
| `capture:stack` | `capture` | useMinhwatuPresentation / HwatuMotion · presented-event | Multiple cards use bounded, staggered physical contacts. |

## domino

Engine sources: `src/games/domino.ts`.

### Accepted actions

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `play` | `place` | DominoEventStage · presented-event | Accepted public tile landing. |
| `pass` | `pass` | DominoEventStage · presented-event | Confirmed legal pass, not failed attempted placement. |
| `configure` | `ready` | DominoEventStage · presented-event | Public configure event acknowledges accepted setup. |
| `next-round` | `event` | DominoEventStage · presented-event | Public round-start event. |
| `set-mode` | `ready` | cueForAction · accepted-action | Legacy mode action has no guaranteed event; acknowledge only accepted completion. |

### Public events

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `play` | `place` | DominoEventStage · presented-event | Presented tile contact. |
| `pass` | `pass` | DominoEventStage · presented-event | Presented pass. |
| `turn` | `turn` | DominoEventStage · presented-event | Presented next seat. |
| `tranque` | `tranque` | DominoEventStage · presented-event | Blocked-table result. |
| `capicua` | `capicua` | DominoEventStage · presented-event | Public capicúa bonus. |
| `paso-corrido` | `paso` | DominoEventStage · presented-event | All other seats passed. |
| `opening-pass` | `paso` | DominoEventStage · presented-event | Public opening-pass event. |
| `round-end` | `score` | DominoEventStage · presented-event | Round tally. |
| `score` | `score` | DominoEventStage · presented-event | Public points award. |
| `win` | `win`, `lose`, `score` | DominoEventStage · presented-event | Viewer/team outcome. |
| `round-start` | `event` | DominoEventStage · presented-event | New round. |
| `configure` | `ready` | DominoEventStage · presented-event | Confirmed setup configuration. |

### Variants and explicit silence

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `play:selection` | Intentional silence | DominoBoard · silent | Selecting a candidate is not an accepted play; optional selection Foley must never announce a placement. |

## jaipur

Engine sources: `src/games/jaipur.ts`.

### Accepted actions

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `take` | `place`, `camel`, `exchange`, `draw` | JaipurMotion · presented-event | Exact accepted take mode determines material; refill is separately presented. |
| `sell` | `sell`, `coin`, `bonus` | JaipurMotion · presented-event | Accepted sale followed by earned token and optional bonus landings. |

### Public events

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `take-single` | `place` | JaipurMotion · presented-event | Goods card landing. |
| `exchange` | `exchange` | JaipurMotion · presented-event | Accepted reciprocal card transfer. |
| `take-camels` | `camel` | JaipurMotion · presented-event | Herd transfer. |
| `sale` | `sell`, `coin` | JaipurMotion · presented-event | Sale accent then money-token landing. |
| `market-refill` | `draw` | JaipurMotion · presented-event | Only newly public market card reveal. |
| `bonus` | `bonus` | JaipurMotion · presented-event | Earned bonus landing. |
| `round-end` | `score` | JaipurMotion · presented-event | Public round tally. |
| `round-start` | `event` | JaipurMotion · presented-event | New round. |
| `win` | `win`, `lose`, `score` | JaipurMotion · presented-event | Public viewer result. |

### Variants and explicit silence

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `take:single` | `place` | JaipurMotion · presented-event | One public goods card. |
| `take:camels` | `camel` | JaipurMotion · presented-event | All public market camels. |
| `take:exchange` | `exchange` | JaipurMotion · presented-event | Public goods exchanged; no deck prediction. |

## Marble card resolution inventory

All cards share `key-draw` at their presented public draw. The following cues describe later applied effects; an explicit no-effect outcome uses `rest`, not a reward. Card movement steps and resulting cash transfers remain separate presentation frames.

| Action / event | Cue alternatives or layers | Owner / clock | Why |
| --- | --- | --- | --- |
| `festival` | `festival`, `income` | createMarbleAudioPresenter · presented-event | Neighborhood festival and public cash receipt. |
| `lottery` | `income` | createMarbleAudioPresenter · presented-event | Lottery receipt. |
| `rent-rebate` | `income` | createMarbleAudioPresenter · presented-event | Rent reimbursement. |
| `travel-cost` | `outgoing` | createMarbleAudioPresenter · presented-event | Travel expense. |
| `maintenance` | `outgoing`, `rest` | createMarbleAudioPresenter · presented-event | Actual maintenance debit or no-effect. |
| `visit-santo-domingo` | `travel`, `step`, `arrival` | createMarbleAudioPresenter · presented-event | Destination travel. |
| `advance-start` | `travel`, `step`, `arrival`, `income` | createMarbleAudioPresenter · presented-event | Move to Start; salary only if publicly awarded. |
| `retreat` | `move`, `step`, `arrival` | createMarbleAudioPresenter · presented-event | Backward movement, not a forward salary. |
| `go-to-island` | `jail`, `step`, `arrival` | createMarbleAudioPresenter · presented-event | Travel to confinement. |
| `escape-pass` | `ticket` | createMarbleAudioPresenter · presented-event | Escape card acquisition/use. |
| `train-ticket` | `ticket`, `travel` | createMarbleAudioPresenter · presented-event | Ticket acquisition followed by travel only when used. |
| `city-dividend` | `income`, `rest` | createMarbleAudioPresenter · presented-event | Public per-city dividend or no-effect. |
| `monopoly-warning` | `warning`, `outgoing`, `rest` | createMarbleAudioPresenter · presented-event | Warning and actual assessed payment, or no-effect. |
| `city-festival` | `festival`, `rest` | createMarbleAudioPresenter · presented-event | Confirmed selected-city festival or no eligible city. |
| `blackout` | `blackout`, `rest` | createMarbleAudioPresenter · presented-event | Confirmed blackout or no eligible city. |
| `rent-pass` | `ticket` | createMarbleAudioPresenter · presented-event | Rent-pass acquisition/use. |

## Assets and verification limits

Physical samples and source permissions are recorded in `public/audio/contextual/manifest.json` and `public/audio/contextual/README.md`; original Web Audio accents are in `src/audio/contextual.ts`. The coverage test proves inventory completeness against current engine syntax, not human-auditioned mix quality. Native browser decode/render results are recorded separately in `docs/audio-browser-render.json`; numeric verification does not constitute listening approval.

### Splendor zero-net return exception

An accepted `take`/`takeTwo` that returns exactly every just-taken gem has no net token delta or landing animation. `splendorZeroNetReturnCue` emits one `return-tokens` clink only after successful action acceptance. Ordinary positive/net-changing takes remain exclusively owned by SplendorMotion; they do not double-play this cue.
