# Two-player Minhwatu — adopted rules and renewal

This pass preserves the project's existing Minhwatu rules and scores. It does not turn the game into Go-Stop. The user-requested Godori bonus is 50 in this explicitly adopted variant; other established rules remain unchanged. Completed legacy games retain their stored scores.

## 1. Card classification

48 distinct Korean Hwatu faces: four cards for each month, five bright cards (광), nine animal/ten-point cards (열끗), ten ribbons (띠), and twenty-four plain cards (피). Each card's engine ID maps to one local SVG face. Classification follows the engine, including November bright, December rain bright, September sake-cup animal and December plain; there is no double-pi substitution. Original identifying birds, ribbon text/colors and bright motifs must remain visible.

## 2. Combination conditions

| Combination | Exact cards / condition | Bonus |
| --- | --- | --- |
| Hongdan / 홍단 | Ribbon IDs 1-2, 2-2, 3-2 | 30 |
| Cheongdan / 청단 | Ribbon IDs 6-2, 9-2, 10-2 | 30 |
| Chodan / 초단 | Ribbon IDs 4-2, 5-2, 7-2 | 30 |
| Godori / 고도리 | Animal bird IDs 2-1, 4-1, 8-2 | 50 |
| November / 오동 완성 | All four November cards | 40 |
| May / 창포 완성 | All four May cards | 20 |
| October / 단풍 완성 | All four October cards | 20 |
| December / 비 완성 | All four December cards | 20 |
| Bright / 광 | Count every captured bright card | Basic card points only |
| Plain / 피 | Count every captured plain card | 0 basic points; no count threshold |

New and ongoing games award Godori 50. Completed legacy games without rulesVersion 2 retain the old zero bonus. Three-/four-/five-bright Go-Stop bonuses, rain-bright exceptions, pi thresholds, multipliers, stealing pi, and Go/Stop are not added.

## 3. Score calculation

Basic captured points: bright 20, animal 10, ribbon 5, plain 0. Existing set bonuses accumulate independently (month sets and ribbon sets can overlap). A player's live/final score is **basic card points + 2 × own set bonuses − rival set bonuses**. A newly earned bonus can increase the actor's score by twice the bonus and reduce the rival's score by the bonus. Negative scores are valid and must be displayed. Godori contributes 50 bonus; its three animal cards contribute 30 base points. Alone this gives 130 adjusted points, and subtracts 50 from the rival.

## 4. Deal, capture and exceptions

Each player receives 10 cards, the public table 8, and the deck 20. Player 1 begins. Play one hand card, then reveal the first deck card. For either card: no matching month leaves it on the table; one match captures that card and the played/revealed card; two matches require choosing exactly one; three matches captures all three and the played/revealed card. If the revealed card requires a two-target choice, the actor keeps the turn in `capture-draw` until resolving it. No extra draw, Go-Stop special capture or pi transfer is added. Initial table patterns and cards left on the table receive no new award.

## 5. Victory

One hand only. End when both hands and deck are empty, after any pending capture is resolved. Compare authoritative adjusted scores: higher wins, equal is a draw. There is no early victory threshold, new round count or invented match record. Replay follows the existing room flow.

## Delivery plan

Preserve all 48 local vector face illustrations; improve framing, edge depth, backs and table lighting without altering motifs. Keep table/hand and matching actions central, with four categorized captured piles per seat. Add visible combination progress and exact score explanation for both seats. Engine public sequence events drive actual play, deck reveal, match capture, newly completed existing bonus, turn and result animation. Only committed public cards enter events; no future deck cards or hidden opponent hand IDs.

Verification will cover classification/face mapping, set conditions, unchanged scores/negative values, all capture branches, full game and result, caller-safe views/events, actual browser source/destination motion, quiet reload and reduced motion. Native desktop KO/ES captures are reviewed in one batch, with one consolidated fix and at most one confirmation. Local fixture Realtime and physical audio limits must be reported.

## Implemented assets and UI

All original 48 SVG faces remain byte-for-byte unchanged, verified against their source SHA-1 manifest. SVGs already provide resolution-independent art; this pass improves their display size, outside-art month tags, crisp edge, thickness and offset shadows rather than raster upscaling or replacing traditional motifs. `src/app/HwatuCard.test.tsx` verifies 12×4 mapping, classification, ribbon and bird identities and accessible bilingual labels.

`src/app/MinhwatuTable.tsx` and its scoped CSS provide a wood-framed green table, flat table cards in authoritative engine order, enlarged selectable ten-card hand, matching-month highlighting (including automatic one-/three-match captures), legal duplicate-target buttons, hidden opposing backs/count, current turn, pending draw instruction, loading/error handling, and categorized non-overlapping capture grids. Both sides show eight combination progress indicators, four category counts and a complete score formula. Godori completes only for all three exact bird IDs and emits one sequenced positive-bonus event. The most recent six public events can be expanded with actor and score changes. Result comparison sits near the top; finished empty areas collapse and no further-play instruction remains.

`src/games/minhwatu.ts` exports authoritative breakdowns and a bounded 48-entry public sequence log. New event types are deal (eight public table cards only), play, draw, capture, existing positive-bonus completion, turn and final result. Origin metadata identifies only public captured cards. Actual per-capture score deltas include the actor's increase and rival's existing bonus deduction. All returned event and breakdown data is detached from mutable state.

`HwatuMotion` uses the pre-commit hand/table rectangle and current destinations for real face flights. Rival plays originate at the hidden opposing fan without rival hand IDs. Draws flip a separate patterned back to the actual revealed SVG. Capture flights enter the correct player/category rack; new existing yaku and result receive short neutral Korean-pattern accents. Initial public dealing is claimed once per session signature, with storage failure staying quiet. Repeated snapshots/remounts don't replay historical actions. Reduced motion keeps state and scores readable. Effect sounds are independently mapped to Minhwatu deal/shuffle, placement, flip, capture, bonus, turn and win/loss through its existing opt-in/volume control. No BGM or paid service.

## Native verification and review

Root inspected the first Korean 1440px and Spanish 1920px batch together. A single consolidated finishing batch corrected final-turn text, moved the result comparison to the top, compacted empty finished areas and no-pending draw space, and added the expandable public log. Root inspected the final confirmation images; no further aesthetic iteration followed.

Actual SQL/RLS fixture runs used two separate anonymous browser contexts and ordinary UI card selections and confirmations. The first natural 20-hand-action game ended with p1 winning 155–105; the frozen-source confirmation ended with a 155–155 draw after 20 hand actions. Final report passes 10/10 checks: both locales, desktop widths, actual result and scores, initial/live hidden opposing IDs absent from DOM, reduced-motion context, intact images and no application errors. The report retains action IDs/titles and initial/live privacy evidence. File: `output/playwright/game-polish/minhwatu-native/minhwatu-native-qa.json`. Native games exercised duplicate-target hand captures; no random duplicate-target stock draw occurred in these two completed runs. Pending draw resolution is covered separately by the engine tests.

The 17 engine tests cover 48-card conservation including pending, 10/10/8/20 deal, category/combination conditions, Godori and legacy zero-bonus compatibility, negative scores, exact bonus transfer, immutable state, duplicate-target validation, stock capture phase, full game, draw result, deep-copy projections and legacy states without logs. Full-suite and production-build results are recorded in the final verification below.

Limits: the local PGlite HTTP/RLS fixture has no Supabase Realtime WebSocket implementation; peer pages were refreshed after actions. No production live delivery claim is made. Minhwatu remains desktop-only. Native tests use Chromium, not physical hardware audio or a physical phone; physical speaker quality/latency is unverified. No video was recorded.


## Final automated verification

Full project suite: **312/312 passing**. After the final Minhwatu localization and same-component new-deal reset changes, the scoped engine/UI/asset/motion/feedback/audio suite passes **64/64**. Production build passes TypeScript, Vite and edge output. No new dependency was added. Source/RLS route inspection confirms online clients continue to receive their own `room_snapshot` view, with authoritative raw state handled by the server action path; this pass adds no raw-state client transport.


## Confirmed native motion events

The controlled Chromium harness passes **14/14 checks** with no browser errors. It renders the real Minhwatu table from prepared authoritative states, applies real engine actions, and consumes their player-safe events. Checks include eight visible-table deal flights, session reload deduplication, own played card starting at its former hand rectangle, captured card starting at its former table rectangle, revealed face flip completing at 220ms before the 255ms flight removal (clone still present at 224ms), actual November completion and terminal result, clone cleanup, quiet terminal remount, a genuine fresh new-deal entrance after sequence reset, rival public play starting at the hidden fan without private IDs, and reduced-motion static dealing/capture. These are controlled edge cases, not claims about naturally drawing each combination online. Report: `output/playwright/minhwatu-motion-controlled.json`.

The final production bundle was built after the source's same-component fresh-deal reset fix. No further source changes were needed after browser event confirmation.

## Event delivery and action robustness follow-up

The user's additional acceptance criteria prompted functional fixes rather than further cosmetic changes. Appending committed events while a flight was running could restart the current queue head; motion now processes the stable active event once, deduplicates public sequence IDs, and retains each event batch's pre-commit card rectangles. Reduced-motion input releases those cached positions. Minhwatu effects use the same 320ms event cadence, append behind pending cues, include the final capture and bonus before the result cue, and cancel prior-game cues on sequence reset. Historical remounts remain quiet.

The board acquires a synchronous action lock before awaiting React's busy render. A second distinct action is blocked while one is pending; false results, synchronous throws and rejected promises release the lock for retry. Existing server version checks, member checks and request receipts remain authoritative. Client regressions additionally verify that an older reconnect snapshot cannot roll back committed events, and a stale-state retry reuses the same request ID.

The SQL/RLS HTTP probe passes six checks. Two distinct legal actions at the same version yield one accepted play (hand 10→9, exactly one public play event) and one stale-state rejection. An exact retry preserves the returned version, table and event log; two identical request bodies advance the version once. Fresh snapshots from both authenticated seats match public cards, captures, scores, breakdown, pending draw, event log, phase and turn. Opposing private hand IDs remain absent. Evidence: `output/playwright/game-polish/minhwatu-native/minhwatu-idempotency-qa.json` and its adjacent runner. This fixture serializes HTTP requests; these results validate the protocol, not concurrent PostgreSQL transaction load or production Realtime.

The full automated suite passes **317/317**. After the final terminal draw destination fix, the focused motion/feedback/audio/UI/client suite passes **53/53** and the production build passes. The controlled Chromium harness passes **18/18**, with no console or page errors. Two authoritative actions 80ms apart, plus a duplicated rendered event, present sequences 1–9 exactly once. Actual image-clone counts match every expected play/draw/capture card, pre-commit origins remain correct, and terminal draws continue to animate using the last public draw position. Remounts stay quiet; reduced motion stays static. Audio verification covers synthesis profiles and ordered scheduling; actual audible browser output, physical speaker quality and production Realtime delivery remain unverified.

## Latest Godori and illustrated-guide pass — 2026-10-11

Current full suite: **322/322 passing** (19 Minhwatu engine tests). The native two-seat KO/ES pass checks **15/15**, including a natural 20-action full game, exact turn-aware matching-hand highlights, no month boxes, and 29 original SVG guide images per locale. The opponent waiting hand is not highlighted. The guide below the game illustrates 0/1/2/3 matching cases, capture flow, exact combinations and score calculation. Current scores use Godori 50; old completed results are preserved. Earlier counts above describe earlier passes, not the latest source.

Quality is not approved as commercial-grade: current viewport review still finds capture collections below the fold. Next work is a compact complete tabletop and room-shell hierarchy, not another superficial CSS pass. Native fixture pages were manually refreshed; production Realtime and audible sound quality remain unverified.


## 2026-10-11 — tabletop composition and confirmed-event feedback

- Replaced the vertically stacked capture/puzzle presentation with own captures / central felt and hand / rival captures. Four category counts and all eight existing combination counters remain visible on each rail; actual captured faces lift on hover/focus.
- Preserved the original 48 recognizable vector faces and existing canonical rule engine. No new Go/Stop, stealing-pi, score multiplier or alternative Godori rule. Hand highlights still mean a matching public month, not a separate match-puzzle objective.
- Field capacity now adapts without reordering public cards or changing legal action indices. Fourteen cards fit two rows; larger synthetic fixture layouts are capacity checks, not new gameplay rules. Event text sits in the opponent header, outside the field.
- Capture flights shrink to the actual destination face. Confirmed score changes generate signed popups for both seats. Earned combinations show their canonical card faces, including Godori's three birds. Turn emphasis and result comparison use the same public event stream.
- Minhwatu placement/capture synthesis impacts are delayed to the 255ms landing. Existing per-game sound preferences and muted/reduced-motion behavior remain intact; no shared BGM or paid service was added.
- Transient flights, score popups and combination reveals are canceled on reset, seat change, reduced-motion change and unmount. Existing event sequence deduplication, quiet historical remount and action lock remain in place. A new deal resets the score display baseline.
- Full suite: 329/329 passing; production build passing. In the real Room shell at1440×900, primary stage bottoms were877.6px (KO) and865.6px (ES); selected action rows remained inside the viewport and neither locale had horizontal overflow.

Verification uses local canonical engine fixtures and the real rendered component. It does not establish live two-device Supabase/Realtime performance or physical-speaker Foley quality. Original SVG card art was reused, not represented as newly commissioned illustrations.

Native browser QA: `scripts/verify-minhwatu-table.mjs` passed41/41 checks with0page/console errors. KO1440×900 uses normal motion; ES1920×1080 verifies reduced motion. Deterministic real-engine fixtures cover confirmation, both legal capture targets, both flight endpoints, signed130/−50 score changes, the exact three Godori faces, completed result agreement, caller hand privacy, quiet duplicate/remount, new-deal baseline reset, active unmount cleanup and live reduced-motion cleanup. RealRoom normal-motion KO/ES layout was separately inspected by root. To rerun, start Vite on5192 and run `LANDING_URL=http://127.0.0.1:5192/ node scripts/verify-minhwatu-table.mjs`; optional installed-browser overrides are documented in `scripts/playwright-browser.mjs`. Browser artifacts are intentionally ignored by Git.
