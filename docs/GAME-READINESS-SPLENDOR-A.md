# Splendor readiness — Assessment A

Date: 2026-10-11. Surface: the desktop Splendor room, Korean and Spanish. Assessor: Sol. This is the independent usability assessment, before the coordinated correction batch. Detector output and Assessment B were not consulted. Root owns synthesis; this report is not a claim of independent user research.

## Evidence and limits

One fresh, batched Chromium run used separate KO/ES browser contexts at 1440 × 900 against `http://127.0.0.1:5191`. It exercised the real local-demo client and Splendor engine. Deliberate local fixtures made expensive purchases, gold returns and endgame states reproducible; fixtures were not written to an online room. All 12 scenario authority assertions passed, with no page errors. A passing scenario assertion establishes the engine result, not the absence of a usability defect.

Evidence: `output/playwright/splendor-readiness-a/assessment-a.json`, the fresh PNGs beside it, and `/tmp/splendor-readiness-a.mjs`. Scenarios per language: baseline keyboard selection/cancel; ten-token keyboard returns; reservation with gold returned immediately; purchase/noble/15-point final round and resize; multiple nobles with the next legal input during motion; empty bank, reservation cap and empty deck. Result screenshots follow the actual switch to the second player, whose language differs from the initial player's language.

This assessment did not test real Supabase transport, two physical devices, physical audio output, assistive technology, or production performance. Root's separate SQL/performance evidence is outside this assessment. Earlier artwork, audio and guide checks are historical evidence in `GAME-QUALITY-SPLENDOR.md`; they were not rerun here. No runtime files were changed during Assessment A.

## Overall assessment

The presentation is specific to Splendor: a three-tier market of twelve original cards, three nobles, a recognizable gem family and a restrained ivory/teal table. It reads as a game table, with the market carrying the hierarchy. The single selection panel makes purchase arithmetic easier to inspect than twelve repeated control panels. Complex legal states and keyboard transitions expose remaining operational gaps.

Nielsen score: **26 / 40 — acceptable, improvements needed**. No authority-breaking defect was observed in this batch. Several recoverable UI defects interfere with keyboard operation, the promised native viewport fit and the continuity of confirmed motion.

| Heuristic | Score / 4 | Assessment |
| --- | ---: | --- |
| Visibility of system status | 3 | Turns, bank/own counts, exact return equation and confirmed result are visible. Net-zero gold movement and overwritten motion lose feedback. |
| Match with the real world | 3 | Localized gems and original card values match the game. Empty-bank instructions ask for zero colors; the KO illegal-purchase label uses technical legality language. |
| User control and freedom | 2 | Card Escape works. Selection does not enter the action panel; closing its focused button loses focus. Token selection has no Escape/clear-all equivalent. |
| Consistency and standards | 3 | Selection and confirmation are coherent. Reservation returns still use a native dropdown while ordinary returns use steppers. |
| Error prevention | 3 | Stable card IDs, current-version checks, exact legal-action matching and the action guard prevent invalid or repeated authority changes. |
| Recognition rather than recall | 2 | Original card costs remain visible, but the selectable-card hint and selected-art enlargement are hidden. Reserved-card accessible names and rival token-total visibility are incomplete. |
| Flexibility and efficiency | 2 | Native keyboard controls work, including return steppers. Focus routing requires traversal through unrelated cards before reaching the selected action. |
| Aesthetic and minimalist design | 3 | One focused panel and a compact table reduce repetition. Several complex states exceed the available height. |
| Error recognition and recovery | 2 | Source has localized stale/unknown-confirmation recovery and retains inspectable selection. Actual transport recovery was not tested. Focus loss makes local recovery harder. |
| Help and documentation | 3 | A localized illustrated guide and expandable details exist, with an in-room entry. This batch inspected the source/entry rather than repeating the prior guide-browser sweep. |

## Cognitive load and personas

The eight-item cognitive checklist has two failures: minimal simultaneous choices and strict small-set chunking. The bank has six gem identities and the board necessarily offers twelve strategic cards plus take/deck options. Those intrinsic choices should not be hidden merely to satisfy a numeric heuristic. Grouping, hierarchy, a single active plan, one-step-at-a-time confirmation, visible calculation and progressive disclosure pass. The avoidable load lies in discovering card selection, reaching the panel by keyboard and recovering from clipped/focusless states.

For a first-time player, the familiar card art and three-step guide establish confidence. The hidden selection hint and hidden enlarged art make the next action less discoverable, and “choose 0 colors” gives no useful recovery at an empty bank. For a keyboard player, Enter/Space and the six return steppers work, but entering the panel and returning to its originating card are missing. A screen-reader concern follows from reserved-card markup; this is a source finding, not an actual NVDA/VoiceOver test. For a player acting quickly or resizing a window, engine actions remain legal and responsive, while cached motion coordinates and replacement of an active flight undermine the visible explanation.

The emotional journey has a coherent opening and a reassuring calculation preview. The valleys are lost focus, hidden detail and complex-state clipping. A confirmed purchase with a noble creates an appropriate peak, and the equal-turn ending is correct. Rapid noble choice currently interrupts part of that peak. These are expert-inspection interpretations, not measured participant reactions.

## Reproducible defects and priorities

| Priority | Finding | Reproduction and evidence | Consequence |
| --- | --- | --- | --- |
| P1 | Selection panel has no keyboard entry/return contract | Focus a market card, Enter, then Tab: focus stays on the card and advances to another market card. Click the panel's close button: focus becomes `BODY`. `baseline-keyboard-focus-cancel` in JSON/PNGs. | Keyboard users traverse unrelated options; a focused control disappears without a return target. |
| P1 | Complex legal states exceed 900 px | At ten tokens, select four-cost-color `t3-05` and reserve with gold returned: board bottom KO **931.3125**, ES **948.0625**. Multiple-noble 15-point state bottom **922.921875**. `reserve-gold-return` and `multi-noble-confirmed` PNGs. | Lower table content is clipped or pushed below the promised native view. Basic/cap-take states still fit at **890.671875**. |
| P1 | Reserved-card accessible name is probably empty at desktop | `SplendorReservedCard` has `role="button"`/tab index but no explicit accessible label; art is aria-hidden and desktop CSS hides its remaining text. Source: `TableGames.tsx` reserved-card component and desktop `.sp-reserved-*` rules. | A playable reservation may be announced without identifying its cost/bonus/points. Source inference; actual AT not tested. |
| P2 | Resize leaves confirmed card flight at an obsolete destination | Buy `t1-01`, then resize 1440 → 1280 before landing. Fixed endpoint misses the new bonus anchor by **160.0004 px** in both languages. | A card appears to land outside the bonus it explains. Cached coordinates have no resize/scroll cleanup. |
| P2 | Gross gold transfer disappears when net change is zero | Start at ten tokens including one gold, reserve a card and return the gained gold. Engine confirms the reservation; own/bank gold totals remain unchanged. At 100 ms there is no incoming gold/payment flight. | Net token deltas omit two actual confirmed transfers. |
| P2 | Next legal noble input replaces an active card flight | Buy with two eligible nobles, then choose one immediately via Enter. The input is accepted correctly, but flight types change from card to noble only. | Authority stays responsive, but the confirmed purchase bundle loses its card leg. |
| P2 | Discovery/status gaps | Desktop selected art and market selection hint are hidden; empty bank says “0가지 색을 골라 가져오세요” / “Elige 0 colores distintos”; `view.opponentCount` is available but not displayed. | Novices have less visual guidance and the public view omits a useful legal aggregate. |

The five recommended correction groups are: focus/names; complex-state fit; coordinate invalidation; gross-transfer and overlapping-flight continuity; discovery/public-status copy. Changes should preserve legal next inputs and original art. No additional broad edge-test campaign is needed before this batch.

## Strengths to preserve

- The original card/noble art remains contained, and six distinct gems share a consistent light/material family. The selected cost table exposes actual base cost, discount, payment, gold and shortage without changing rules.
- Ten-token returns use exact arithmetic and exact legal-action matching. Native plus/minus controls accepted keyboard input; over-return disabled confirmation and correcting it restored the legal action.
- Purchase plus noble reached 15 points, then the second player's final turn completed with equal turn counts `{p1: 1, p2: 1}`. Multiple-noble choice remained a legal next input while motion was running.

## Plan-to-source comparison

Statuses distinguish **implemented**, **partial**, **different method**, **missing**, and **unverified**. Historical implementation notes are not automatically evidence that a current requirement passed. References are `GAME-QUALITY-PLAN.md`, the Splendor plan/addenda in `GAME-QUALITY-SPLENDOR.md`, and current source.

| Planned requirement | Status | Current evidence / limitation |
| --- | --- | --- |
| Compact shared header; market, nobles, bank, treasury and reservation slots fit KO/ES 1440 × 900 | Partial | Basic and ten-token take states fit; four-cost reserve-return and multi-noble ending overflow as measured above. |
| Three tiers × four cards; three nobles; one selected action panel | Implemented | Fresh DOM counts 12/3 and one conditional panel. Per-card action panels removed. |
| Original art uncropped, card numbers unobscured; 44 px controls | Implemented, limited verification | `object-fit: contain`; actual return controls use native keyboard interaction. Current A did not rehash all 100 assets or retest every control at zoom. |
| Selected purchase/reservation uses room/player/source/card ID/current version | Implemented | `TableGames.tsx` selection contract, exact action match and latest-view confirmation checks. Cards remain inspectable even if buying is illegal. |
| Enlarged selected original art and clear inspect hint | Missing at desktop | Art exists in the panel but desktop CSS hides it; selection hint/cost-summary text is also hidden. |
| Panel focus entry, Escape/close return to source | Partial / missing | Escape removes card selection; entry/return focus is absent. Background cancellation only applies to the direct root/empty slot, a narrower method than a general blank-zone cancellation. |
| Private deck reservation preview | Implemented | Card back/tier and slot/gold/return plan; no private deck face exposed. Empty deck is disabled. |
| Purchase preview: base cost, permanent discount, colored tokens, gold and shortage | Implemented | Only nonzero base-cost rows; actual color-to-gold payment matches the engine. Optional gold payment choice is intentionally deferred, not a missing implementation of current rules. |
| Token take/return tray with current + gain − return = total ≤ 10 | Implemented | Fresh cap scenario shows `10 + 3 − 3 = 10 / 10`; keyboard adjustment and exact legal matching pass. |
| Same-color take requires bank ≥ 4; distinct take min(3, available colors); ordinary gold take prohibited | Implemented | Engine/source guards and actual empty-bank controls. Empty-bank explanatory copy is wrong, while the authority correctly disallows a zero take. |
| Return control consistency and cancel affordance | Different method / partial | Ordinary returns have six steppers; reservation returns remain a native select. Bank selection has individual toggles but no Escape/clear-all cancellation. |
| Public scores/bonuses, noble requirements/progress, reserved counts and rival token total | Partial | Scores, both bonus sets, noble progress and rival reservation count are present. Rival aggregate token total and a separate noble-point breakdown are absent; colored rival-token secrecy is intentional. |
| Noble qualification uses permanent bonuses; choose one of several; each gives three points | Implemented | Fresh multi-noble choice accepted one award only and ended the same turn correctly. |
| Fifteen points starts last round; equal turns; points then fewer cards decide winner | Implemented / partly unverified | Actual 15-point/equal-turn ending passes. Tie-break source exists; this batch did not exercise all tie outcomes. |
| Six high-quality gem identities, transparent material family and restrained DOM | Different method | Six authored transparent SVG assets with distinct outlines and upper-left lighting, rather than generated transparent atlas art. Historical manifest/hash/contact-sheet evidence exists. Current A did not remeasure all asset/provenance details. |
| Public-card preload / enlarged reading; WebP where beneficial; robust image failure | Partial / unverified | Original images are lazy-loaded, without explicit preload of the visible public set. Enlargement is hidden. WebP was optional. Gem fallback exists; actual failed-card-image/zoom/colorblind cases were not tested here. |
| Immediate selection, pending indication, confirmed only state changes, failed selection retained | Implemented in source; partly observed | Local selection precedes confirmation, global action guard prevents reentry, board has pending state. Failure/stale copy and retention exist; real failure transport was not tested. |
| Payment → card → bonus → noble/score motion from real anchors | Partial | Confirmed own purchase provides payment/card/noble objects. Net-zero gold and rapid next-event continuity fail. Public opponent card purchase is not derived from own-bonus change; private colored opponent payments must remain hidden. |
| Motion timing 180–320 ms; restrained importance, no shake/hitstop/3D | Different tuned method | Flight duration is 650 ms, card delay 260 ms, noble delay 760 ms. Ease/pointer-events behavior is restrained; no input lock/shake/hitstop/3D introduced. |
| Resize/scroll/hidden interruption safely cancels or reanchors objects | Missing / partial | Confirmed helper filters hidden/stale starts and clears on hidden; existing fixed endpoints have no resize/scroll cleanup. The older incoming-token layer has separate lifecycle behavior. |
| Motion permits the next legal input | Implemented authority; partial visuals | Immediate noble choice succeeds. Active card flight is replaced by the next batch. |
| New confirmed events only; no replay on reconnect/first mount/stale view | Implemented in source | Helper version/scope checks, core stale-version filtering and sync-epoch remount. Actual online/reconnect interruption remains unverified. |
| Reduced motion, mute and landing-owned buy/noble cues; result cue precedence | Implemented in source; physical audio unverified | Helper suppresses replay, reduces to immediate cue and gives result priority. Earlier UI-unlocked WebAudio tests are historical; this A did not hear physical output or repeat their audio assertions. |
| Connection states and actual reconnect snapshot, not a cached read | Implemented in source; online unverified | `reconnectRoom()` calls fresh snapshot; subscription errors and online/focus/visibility recovery exist. Older plan wording about cached-only retry is superseded. |
| Request ID/version/queue/private view preserve free-tier/server authority | Implemented in source; deployed path unverified | Core action serialization/stale filtering/unknown-confirmation handling and engine player view remain. This A used demo client/engine, not deployed Supabase. |
| Two physical devices, network delay/offline/reconnect expiry, duplicate transport and sustained performance | Unverified by A | No physical-device/Supabase/headphone/laptop-audio or production frame/memory measurement here. Root's separate performance/SQL checks must be reported separately. |
| Mobile policy unchanged; guide usable independently | Implemented in source; prior guide evidence | Desktop entry restriction remains. Prior separate guide sweep covered mobile explanation layout; current A did not reopen that campaign. |
| Commercial asset rights | Existing unresolved gate | Provenance recording does not itself establish distribution rights. This assessment adds no new rights conclusion. |

Key source locations: `TableGames.tsx` derives net visual deltas, handles selection/return legality and builds card/reservation controls; `SplendorMotion.tsx` caches bounds and replaces flight batches; `splendor-premium.css` hides desktop art/hints and styles fixed flights; `splendor.ts` applies token/cost/noble/endgame rules; `client.ts` handles request IDs, snapshot versions and reconnection; `PlayApp.tsx` supplies pending guard, localized errors and quiet remount boundaries.

## Questions for synthesis

1. Should the selected panel be the explicit keyboard continuation of selecting a card? This assessment recommends yes, with Escape/close returning to that originating card and a stable fallback if it disappears.
2. Which original-art reading affordance fits the fixed-height board: a compact contained selected image, or an optional enlarged view? Both must retain the semantic cost table and avoid clipping the return plan.

These questions are inputs to root's synthesis, not a request to stop authorized corrections. Detector/B comparison and final user-facing prioritization belong to the parent assessment.

## Bounded follow-up

Assessment A is complete. The authorized next step is one coordinated correction batch, followed by one confirmation of the existing representative cases. No additional independent inspection campaign or runtime edit occurred before this report.
