# Jaipur table polish and implementation contract

Jaipur remains the existing two-player game and uses engine-authored legal actions and scores. This pass adds player-facing presentation for the existing rules and a settlement ledger/history; it does not change the rules, card identities, turn order, or round outcomes.

## Rules and compatibility contract

| Area | Contract |
| --- | --- |
| Deck | Preserve the existing 55-card deck, including 11 camel cards. Keep goods, camels, market, and deck accounting consistent with the engine. Do not add cards or replace the deck composition. |
| Market and exchange | Preserve the engine's existing legal exchange choices and equal-count constraints. Do not add a camel-herd exchange action. Rule copy must describe the choices this game actually offers; it must not claim a universal or official-rules correction. |
| Round progression | Preserve the existing automatic advance with `p1` opening the next round. Do not add a confirmation gate or change who begins. |
| Round end | Preserve the existing finish triggers: three or fewer goods stacks remain, or the draw deck is empty. Use the engine's result and tie behavior. |
| Match result | Preserve the existing match end: two round wins, or the existing result after round three. Keep the engine's tie handling and winner authoritative. |
| Settlement | Present goods-sale points, sale-bonus points, and camel points as distinct parts of the settlement where the stored state contains that breakdown. Keep token values and totals sourced from the engine. |
| Legacy state | Saved states without a settlement ledger must show their authoritative combined total and label it as combined/total. Never reconstruct or imply a goods/bonus/camel split that the saved state does not contain. |

Do not add a rule or historical claim to resolve a mismatch in explanatory copy. Explain only the action and scoring behavior the current engine exposes.

## Visual and asset direction

Build a warm, legible market around the existing goods identities and engine values. Keep the player's goods hand, camel herd, public market, visible top of each prize stack, remaining-deck count, round status, and settlement result visually distinct. Do not reveal lower prize-stack token values before the sale that reveals them. Keep goods type labels and pip/score values readable alongside the visual tokens, rather than relying on color alone.

The original local art plan is 21 SVG compositions: seven goods categories with three authored variants each, plus local token faces/backs where the table needs them. These are game artwork, not replacements for engine IDs or scoring values. Preserve mapping from each public goods identity to its intended composition; don't use a generic placeholder or external artwork. The local SVG set should remain viewBox-based and scale cleanly for hand, market, and compact token rows.

## UX, events, and audio

Exchange selection remains local to the active player view and offers exactly the engine's legal equal-count hand/market combinations. Show selected counts and leave the exchange control disabled until the matching legal action exists. Sale controls identify the visible top goods token without exposing deeper hidden tokens; bonus values stay hidden until earned. Selection resets when the authoritative turn, round, market, or hand changes.

Show sales as distinct goods, bonus, and camel settlement components when available. A round ledger/history should use authoritative event identifiers and sequence ordering; each row should name its type, value, and effect on the score. Refilled market goods and new rounds animate only when a real public transition is observed. Do not invent an event on first render or imply animation from a hidden deck. Result presentation identifies win, loss, or tie using the engine's result.

Local selection changes use a Jaipur pick cue. Confirmed trades, camel takes, sales, bonus reveals and public turn/result changes use Jaipur-specific sound effects via the existing audio transport. No BGM or new audio API is added. Sound must follow committed actions/public views and respect mute, game preferences, hidden-tab behavior, and unmount cleanup. Reduced-motion users receive the same visible state changes without decorative transitions.

## Privacy and function contract

Render only the current player's private goods/hand and the public camel/market state exposed in their player view. Never expose an opponent's private goods, hidden prize-token values, or future deck order through the board, history rows, accessibility labels, or client-visible logs. Use the server-provided action list as the authority for exchange and sale controls; UI selection state cannot itself authorize a move. Settlement rows must be absent or explicitly combined for old saves lacking the new ledger.

## Implementation and verification

| Axis | Implemented outcome | Verification |
| --- | --- | --- |
| Visual | Warm, readable market with authored 21-composition goods art, clear goods/camels/market/prize stacks, readable tokens, and responsive layout. | Verify every existing goods ID maps to the intended local SVG; inspect KO at 1440×900 and ES at 1920×1080; check no overflow, clipped values, or broken images. |
| UX | Equal-count exchange selection, exact legal action gating, visible market/stack status, clear sale choice and current round/match state. | Exercise legal and incomplete exchanges, sale of top-token piles, camel state, and match advancement through the actual UI. |
| Events and motion | Confirmed exchanges, sales, revealed sale bonuses, round scoring, round advance, and final results receive concise feedback. | Drive public engine snapshots for each event; ensure events occur once, first render stays quiet, and automatic p1 round advance remains intact. |
| Settlement | Separate goods, bonus, and camel points when the ledger exists; display only combined totals for legacy state. | Verify each component against engine settlement data and cover missing-ledger saved states without fabricating category values. |
| Sound | Use Jaipur-specific take/sell and public turn/result cues through the current controller. | Verify cue mapping follows committed/public transitions, no duplicate or rejected-action success cue, and no BGM/new API. Physical output remains a separate check. |
| Privacy and accessibility | Preserve viewer-specific hand secrecy and hidden stack/deck information; retain text labels, keyboard controls, focus, and reduced-motion behavior. | Inspect serialized views and accessibility labels for private IDs/values; test keyboard exchange/sale selection and reduced motion. |
| Regression | Preserve 55 cards/11 camels, market/exchange rules, finish thresholds, p1 auto-advance, round wins, and existing tie behavior. | Run focused engine/component tests and full suite/build after implementation freeze. |
| Native browser QA | Verify the actual two-seat UI in Korean and Spanish with current visuals and actual UI actions. | Save fresh screenshots plus a JSON report. Local fixture Realtime failures must be reported separately; this is not production Realtime verification. |

## Frozen engine audit

The read-only audit confirms the engine preserves the 55-card supply (44 goods and 11 camels), five-card market, seven-card goods-hand limit, group camel take, equal-count 2–5 card exchange without camels, goods sale minimums, top-first token awards, bonus tiers, five-point camel majority, pile/deck round end, automatic `p1` round starts, and the two-wins/round-three match result. No scoring or action rule change was found. Existing engine tests exercise these rule edges, including exhausted token piles and tied third-round results; their final pass status is tracked with the project verification run.

New engine data keeps card IDs stable as public cards move between market, a player's own hand, an exchange, a sale, and the camel herd. The 40-event log contains IDs only for cards made public by a take, exchange, sale, or refill; exchanged cards become public in the same action, and sale cards are already revealed by the sale. Hidden remaining hand IDs, deck order, and unrevealed bonus values are not included in player views or public events. Bonus stacks are projected as counts only. Goods-token pile arrays preserve their length and top value for existing UI callers while lower, face-down values are `null` in the view; full ordered piles remain only in authoritative state. The engine tests include a regression assertion for this top-only projection.

Settlement entries retain goods points and bonus points separately while `tokens` remains the existing combined sale score. Round summaries add the camel majority's five points to that combined sale score and snapshot the round winner, cause, camel counts, and rounds won. Missing/unknown legacy ledgers report `goods: null`, `bonus: null`, and `detailed: false`, while retaining the combined sale total; no breakdown is fabricated. Round history is bounded to the three-round match and public only after settlement.

The engine audit and implementation are complete. Final browser evidence and its local-fixture limits are recorded below. Production Realtime is outside local-fixture verification.


## Delivered assets and behavior

- `src/app/JaipurArt.tsx` and `src/styles/jaipur-art.css`: 21 hand-authored, scalable illustrations (three compositions per seven goods), commodity coins, concealed/revealed bonus tokens and camel-majority emblem. No external graphic production or paid service is required. Stable card IDs select the same composition before and after a trade.
- `src/app/JaipurBoard.tsx` and `src/styles/jaipur-premium.css`: five-slot market, take/exchange/sell tabs, legal multi-card selection, private hand, rival backs/count, herds, explicit remaining-token counts and next point value, current turn and round wins, recent public trades, previous-round category settlement and final result. Desktop market cards are 230px high.
- `src/app/JaipurMotion.tsx`, `src/app/jaipur-motion.ts` and motion CSS: committed card transfers, simultaneous reciprocal exchange, deck refill, camel collection, staggered sale, earned coin flights, luxury glint, bonus flip, round feedback and a short market-coin/petal victory burst. Initial/repeated snapshots do not replay effects.
- Existing audio transport now contains distinct Jaipur selection, card placement, exchange, camel, sale/coin, bonus, turn, round and match cues. No BGM or paid audio API is introduced.
- Jaipur alone supports mobile entry and tap selection. Room creation and invite joining can run on mobile; other games remain desktop-only. No drag-to-trade gesture is claimed.

## Final automated verification

The frozen final source passes **283/283 tests** and `npm run build` (TypeScript, production Vite bundle and edge build). Engine tests cover 55-card accounting, seven-card limit, equal-count exchange, precious-good minimum sale, bonus tiers, camel majority/tie, automatic round advance and match result. Privacy tests cover opponent-hand IDs, deck/seed, future bonuses and lower goods-token values. Component tests cover legal gating, legacy settlement, current-turn labels and explicit token values; motion tests cover confirmed event mapping, transfer paths and repeated-event suppression. Physical audio output is not proved by these checks.


## Final native evidence

Root reviewed the first KO 1440px / ES 1920px batch, then one consolidated polish batch corrected rival-turn Spanish, made token counts/top points explicit, and reduced desktop market cards to 230px. The confirmation captures were reviewed; no further aesthetic iteration was requested. A genuine mobile invite blocker was also found: an active room with no game chosen was mistakenly treated as an unsupported game. The room-view policy now permits this voting state while keeping active non-Jaipur games restricted; a regression test covers the distinction.

Two separate anonymous browser users created/joined a real SQL/RLS fixture room and exercised goods take, camel collection, equal-count exchange and sale. The native desktop run reached a natural third-round match result, with p1 winning two rounds against p2's one. Its action JSON was lost when a later mobile harness stopped, so no exact action count is claimed; the result screenshots are retained. Current desktop captures are in `output/playwright/game-polish/jaipur-native/jaipur-final-*.png`.

Mobile confirmation passes **10/10 checks** in distinct KO/ES touch-emulated Chromium contexts at 390×844. It verifies Jaipur-only lobby choices, invitation joining before game selection, two-seat Jaipur start, a real camel tap and turn advance, caller-private hand, 390px document width, 44px mode buttons and reduced-motion behavior. Peer state was verified after manual refresh. Root inspected both final mobile captures. Report: `output/playwright/game-polish/jaipur-native/jaipur-mobile-final-qa.json`.

A controlled browser harness passes **11/11 checks** using actual `jaipurEngine.applyAction` transitions and caller-safe views rendered by the real `JaipurBoard`. It verifies illustrated gold sale flight starts at the pre-action hand, distinct source/destination geometry, actual commodity-token SVG and score destination, luxury glint, separate bonus flip, category settlement and automatic next-round start, fresh win burst, repeated-snapshot deduplication, quiet final-state remount and reduced-motion static results. The fixtures deliberately prepare rare endgame states; they are not claimed as a naturally played second online match. No app source changes were made by this harness. Report: `output/playwright/game-polish/jaipur-motion-controlled/jaipur-motion-controlled.json`.

Limitations: the local PGlite HTTP fixture has no Realtime WebSocket implementation, so this does not validate production live delivery; peer pages were refreshed after writes. Native runs had no application JS errors (fixture WebSocket 404s and a harness favicon 404 were separated). Mobile is Chromium touch emulation, not physical iOS/Safari verification. Physical speaker output and latency remain unverified. No video was recorded.
