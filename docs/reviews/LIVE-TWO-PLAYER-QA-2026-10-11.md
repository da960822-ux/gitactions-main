# Independent live two-player UI QA — 2026-10-11

Owner: Sol (`/root/sol_jaipur`). Scope is Domino → Jaipur → Splendor, only when root requests the next game after presenting that game's photographs. This report does not use the photograph agent's game findings or old issue lists. No application source, engine rules, or existing artifacts were changed/deleted by this verifier; no push was performed. Initial and interrupted sections below are historical stage records; the current completion and remaining limits are stated at the end. Assertion counts include repeated per-action checks, not that many independent feature scenarios.

## Domino

### Environment and method

- HEAD `a87d033`; app `http://127.0.0.1:5192`, local PGlite SQL/authority fixture at54321. Two independent Chromium contexts,1440×900, p1 Korean and p2 Spanish. Different room from the photograph work: `bf92ecc1-755f-4c0d-8e08-963d88294dee`.
- Room creation, invitation-link entry, join, game consent, tile selection, endpoint placement and pass all used real UI buttons/keyboard. No `sendAction`, `engine.applyAction`, injected game state, direct room creation/join/game selection APIs or first-legal-action loop.
- This fixture has no Realtime. **Explicit read-only `client.reconnectRoom()`/`getSnapshot()` refreshed both seats**; this is not proof that two remote production clients synchronize automatically. The UI's loaded client resource URL was used, including Vite's HMR timestamp. Plain `/src/core/client.ts` imports initially created a separate empty client; those QA diagnostic attempts are described here and were not counted as product failures.
- Strategy used only the active player's hand DOM and public ends. Candidate placement utility favored shedding pip weight and keeping remaining tiles connected to the new outer number; doubles received a small preference. Examples: p2 placed4|6 to retain three6-connected tiles, p1 later chose0|5 to retain two0-connected tiles. Neither player used the other player's hidden hand or a generated legal-action list to decide.
- Runner: `scripts/play-two-player-qa.mjs`, portable `launchChromium` helper. Diagnostic origin: `run-1791714556960`; selected permanent summary/finished evidence is linked below. Raw diagnostic runs are not permanent evidence. The final runner has assert-based checks and passed `node --check`.

### Actual outcome and checks

Completed one default single-round match with **13 UI actions:10 placements and3 passes**. The round blocked with public ends4/2, ten placed tiles, p1 one tile remaining/p2 three remaining. Both clients reached **version15, phase finished, winner p1**, remaining pips **3 versus19**, award19. KO result says `내 팀 승리`; ES result says `Ganó el otro equipo`, with matching public result/pip accounting. **101 assertions passed, page errors0** in this completed run. Repeated per-turn consistency/privacy assertions are included in that count; it is not101 separate feature scenarios.

- Refreshed public board and version matched at each checkpoint; a UI move advanced exactly one version and changed the turn or finished the round.
- An actual endpoint double click generated one committed placement. No forced click or API action was used.
- After selecting a tile that matched only one end, a real mouse click on the disabled other end did not advance the version and preserved the selection. Its accessible label explained the incompatible end.
- Tile selection and endpoint confirmation used native Enter/Space. Escape cleared the selected tile and restored focus to that tile. The first opening tile was the only enabled opening candidate; later moves were ranked from this player's visible hand, not simply the first legal choice.
- During every sampled play phase, opponent seat DOM contained **0 numeric tile elements** and **0 revealed-hand containers**; only backs/counts were shown. Finished-state hands were intentionally revealed in both screens, as the rules/UI describe.
- KO/ES turn, placement/end, pass, remaining-pip and blocked-result wording was readable in the captured desktop screens. Long chains remained on the felt; both public open-end values matched the actual result. No gameplay-blocking UI defect was reproduced in the completed run.
- Resizing these same finished sessions to390×844 was a read-only auxiliary check: Domino shows the current desktop-only notice in both languages, document width390. This is **not mobile Domino gameplay validation**.

An earlier independent round reached ten attempted actions/nine confirmed public tiles before the QA comparison ran ahead of a request's completion. The initial check recorded p1 version11 but did not preserve the other version, so an exact11/12 discrepancy is not proven. The final runner explicitly waits for the UI request's version to settle and records/retries transient read-only refresh comparisons. This was corrected in QA code, without changing the product.

### Reproduced UX findings

**D1 — P2, no visible same-game replay after the default single round.**

Reproduction: create/join with the two UI clients → both choose Domino → play to the blocked default one-round result. Inspect the finished board and its controls. It offers no `Play again`/`다시 하기`/`Jugar otra vez`/next-round control. The switcher lists other games and has0 entries for the current Domino game. The ↻ control is named `다른 게임으로 바꾸기`/`Cambiar de juego`, so it is not presented as a Domino replay. The result is valid, but the next step for people wanting another hand is unclear. A new-room workaround was not performed and no other game was started during this Domino task. This is a UX affordance gap, not proof that the server cannot restart a game through another authorized route.

Evidence: both `finished-p*.png`, report `observations.restartControls` and `sameGameSwitcher:0`. Default `targetScore:0` is a completed single round; match-mode next-round support is outside this run.

**D2 — P3, loss screen's celebratory headline can imply a personal win.**

Reproduction: this finished match's losing Spanish p2 screen. The felt's outcome strip starts **`¡Partido ganado!`** and then says `Ganó el equipo rival`; the result card correctly says `Ganó el otro equipo`. Winner/score data is consistent, but the standalone celebratory opening phrase can be read as “you won” before the rival qualifier. A neutral match-ended or explicit rival-won headline would reduce that brief ambiguity. This is wording, not an incorrect declared winner.

Evidence: `finished-p2.png`; the actual result text is preserved separately in `report.json`.

**Layout observation, fixture-specific rather than a proven production defect:** the fixture's persistent `Reconectando…`/recovery strip occupied room header space. At sampled play checkpoints the Domino board was top268.42/bottom955px, so its lower hand/ledger required vertical movement in the900px viewport; keyboard focus scrolling allowed play to continue. A connection strip expected from this fixture cannot demonstrate a normal connected production room's height. Horizontal document width remained1440 at those checkpoints. Root's earlier clean-room layout reports were not imported into this run.

### Initial run limits / next stage

Real Supabase Realtime, independent physical devices, physical audio, touch gameplay, offline recovery, network latency and full keyboard Tab traversal were not tested. Single-match replay and non-default100/200-point match continuation were not executed. No application fixes are included. At that stage Domino was complete and Jaipur/Splendor awaited root's sequential instruction; both subsequently ran as recorded below.

Permanent Domino evidence: [summary JSON](../screenshots/live-play-2026-10-11/qa-domino-summary.json), [finished Spanish screen](../screenshots/live-play-2026-10-11/qa-domino-finished-es.png). D1 source/minimal direction: `src/app/PlayApp.tsx` finished-game controls/switcher exclude the current game; add an explicit same-game replay request that still requires both players' consent. D2 source/minimal direction: `src/app/DominoEventStage.tsx` displays the engine's generic `win` title before its relative-team winner label; choose the displayed headline from `presented.team`/`ownTeam`, preserving server winner/rules. Regression: finish a default one-round match, verify replay consent from both UI clients; on a losing ES client verify the headline says the rival won. No such source changes were made by this reviewer.

## Jaipur

### Independent actual play

Root presented the Domino photographs/result before authorizing this game. A new two-context room `1c2061d0-8f24-4b3b-9735-24fb129d4fd5` used the same UI-only join/consent and read-only refresh method. No photograph findings or older Jaipur QA issue list were used. **45 actual UI actions:30 single-good acquisitions,13 group sales,1 camel-group acquisition,1 strategic2↔2 exchange.** This completed the first round at action44 and executed the first ordinary acquisition in round2 at action45. **479 assertions passed, page errors0**, final public version47 in both contexts. Count includes repeated per-turn checks.

The first round ended by commodity pile depletion, p1 won **72–67**: p1 goods60+bonus7+camel5; p2 goods59+bonus8+camel0. Before the camel award both had67 sale points, so herd strategy mattered. Market/hand/score resets, new round2, wins1–0 and the preserved old-round summary agreed between clients. This is one completed round plus next-round play, not an entire two-round-winning match.

The strategy concentrated own goods against public market availability/top token values, exchanged weaker holdings for better groups, acquired four public camels together, sold groups of3 for bonus eligibility, and sold smaller groups when capacity or low deck/pile supply favored cashing out. Examples of actual sales: p1 gold3/cloth3/spice3, p2 leather3/silver3/diamond2. Future bonus values were not read for planning. No `view.actions`/legal-action traversal decided moves.

Actually reached boundaries:

- p2 held one diamond: selling mode showed `Se necesitan al menos2 cartas para vender`, output1 and disabled confirmation. The operation was cancelled through Escape; no server rejection was forced.
- p2 reached hand7: a selected market good showed `La mano está llena`, disabled confirmation and unchanged hand. Other naturally available trades then continued.
-2 hand selections/1 market selection produced a mismatch explanation and disabled exchange confirmation; explicit cancel cleared both sides, then2↔2 was staged/confirmed and preserved hand count.
- Group quantity +/− changed the sale count; explicit cancel preserved the cards and cleared selection; reselecting/resizing/confirming sold exactly the chosen count. All13 sales were ordinary real-engine UI commits, eight of them3-card groups.
- A native confirmation double click produced one version increase. Enter/Space confirmations advanced exactly one turn or automatically entered the next round.
- Every sampled own-hand zone belonged to that context's seat; opponent backs exposed0 card IDs. Future bonus tiles were absent from the public board, and lower commodity token values were null. Public counts/earned bonus events were permitted public information, not called leaks.

Permanent evidence: [summary JSON](../screenshots/live-play-2026-10-11/qa-jaipur-summary.json), [KO mobile sale](../screenshots/live-play-2026-10-11/qa-jaipur-mobile-ko.png), [ES mobile sale](../screenshots/live-play-2026-10-11/qa-jaipur-mobile-es.png), [automatic round2](../screenshots/live-play-2026-10-11/qa-jaipur-round2-ko.png). Selected evidence was archived from diagnostic run `run-1791714847681`; raw runs are not permanent evidence.

### Initial UX finding and spatial observation

**J1 — P2, a current-round bonus notice covers the round pill on narrow screens.**

Reproduction from this play: p1 confirms gold3 sale → refresh the other seat for its turn → p2 stages leather3 → resize that same session to390×844 while the previous earned3-card bonus notice remains. In the ES PNG, `Bono por vender3 cartas` occupies the top-right header where the round pill otherwise appears; the current round number is not visible. It is an already earned bonus event, not a preview of the pending sale. Unlike the previously investigated old-round notice case, this actual notice belongs to the **current** round and lasts briefly. No wrong round or score value was found.

Source/minimal direction: `src/app/JaipurMotion.tsx` current-round notice + `src/styles/jaipur-motion.css` `.jaipur-event-note` absolute top12/right12. Reserve a notice location outside the round/turn/header controls, including current-round bonus notices. Regression: earn a3-card bonus, keep the notice visible, then assert the round pill's text/rectangle remains visible at390px in both languages. Evidence is the permanent ES mobile PNG; no numeric overlap rectangle was collected, so the overlap claim relies on direct native PNG inspection plus the positioning source.

**J2 — P3, spatial observation rather than a proven touch failure:** selected hand and sale controls are separated vertically, with the opponent-hand row between them. At the first3-card sale in each language, same-session390px layout measured tray139.96875px, selected-card top→confirm top **200.359375px KO/196.359375px ES** upward; selected-card top→tray top290.53125/286.53125px. All sale controls remained at least44×44px; cancel was80×44px and the current word fit. Document width390. Sequence was select a group in the hand→increase to3→cancel/reselect→adjust→confirm; the controls appear above the selected cards. Both areas can fit within an844px viewport at a suitable scroll position, so this is not evidence that every sale requires a full extra-screen scroll. The resize was an auxiliary read/layout check, not physical thumb usability or a fresh mobile-touch game.

Optional minimal UX direction for root's approved improvement batch: keep the mobile sale tray adjacent to the hand after group selection using `src/styles/jaipur-premium.css` order/layout and existing `JaipurBoard.tsx` DOM; preserve one set of controls,44px targets and stable card IDs. A narrowed follow-up should measure the distance and perform the same selection/quantity/cancel/confirm sequence. Reviewer did not modify this source.

No gameplay-blocking Jaipur UI defect was reproduced. Unreached cases include6/7-card sales, maximum5↔5 exchange, a real server error, full match victory, physical touch/audio and Supabase Realtime. Earlier task results are not substituted for these unrun scenarios. Jaipur is complete; root authorized Splendor next.

## Splendor

### Actual full match and strategy

Root presented Jaipur's photographs/result before authorizing Splendor. New independent two-context room `3807bc6a-30cf-4e16-92c3-eaa8d1c83953`, KO p1/ES p2,1440×900, used UI create/join/consent/play and explicit read-only refreshes. The same loaded-client resource URL was used. Opponent private reserve data was not accessed for planning.

**61 actual UI actions:34 purchases,22 distinct-color takes,2 same-color takes,2 reservations,1 noble choice.** Both seats reached **version63, finished,30 turns each; final13–15, p2 won**, owned development counts16/18. **689 assertions passed; page errors0.** The action count is one higher than the60 completed turns because choosing between qualifying nobles completes the pending purchase turn. No forced state or direct action API was used.

Strategy evaluated visible card costs/points/permanent bonuses against the active player's own tokens/discounts and own reserved cards, planned near-term resource shortages, used reservations for gold, developed an inexpensive engine and then prioritized tier2 prestige cards. Candidate utility balanced points, useful permanent discounts, public noble requirements and estimated gather turns. When a token color was unavailable, it preferred reachable alternatives; unused excess colors were returned when required. It did not iterate the server's first legal action. Active `ownHand` read-only snapshot data matched information rendered in that seat's treasury/reserved UI; the other seat's hand was never read to choose moves.

Permanent evidence: [summary JSON](../screenshots/live-play-2026-10-11/qa-splendor-summary.json), [finished KO](../screenshots/live-play-2026-10-11/qa-splendor-finished-ko.png), [finished ES](../screenshots/live-play-2026-10-11/qa-splendor-finished-es.png). Diagnostic origin was `run-1791715252117`; only the relevant summary and final screenshots were archived as permanent docs evidence.

### Reached checks / final-turn contract

- Keyboard Enter selected a development card and focused the action panel. Escape closed it and returned focus to that card; explicit × cancel also closed it. Native Enter/Space confirmations completed actions.
- One native confirmation double click committed exactly one version. Public market/bank/score/discounts/nobles/turn counts matched after each action's completion and refresh. `reservedOpponentCount` is intentionally viewer-relative and was excluded from shared-board equality, rather than expecting that asymmetric field to match.
- All34 purchases added exactly one permanent bonus, and own remaining colored/gold tokens matched calculated cost minus own discounts. Actual gold substitutions were reached twice: p1 `t1-32`, one gold; p2 `t1-22`, one gold plus a green discount. Their UI payment-preview text and own payment data are retained in summary JSON. Reserved cards were confirmed through the ordinary UI, not by revealing a deck or inspecting a rival's reserve.
- One natural over-cap take started from9 tokens, took3 and returned white1+blue1 through UI steppers, then committed at10. Every committed action's own total stayed at most10.
- A purchase naturally qualified p2 for multiple public nobles. The UI provided selectable nobles; choosing `n6` awarded3 points and completed that pending turn. The selected noble visit was confirmed by the public owned-noble change. Automatic single-qualifying-noble award was not separately reached.
- Own reserved DOM entries all carried the current viewer's seat. The shared board had no hidden-deck/opponent-reserve array or private token-hand object. These are scoped DOM/returned-view checks, not an audit of all browser memory.
- This match first reached15 on **p2's30th completed turn**, when p1 already had30. After the pending noble selection, the server immediately produced the matching finished result. This verifies the equal-turn completion branch. **p1 reaches15 first→p2 receives an extra last turn** and its `.sp-final-turn` guidance were not reached. No claim is made that this complementary branch was played.
- Reservation slots never naturally reached3; the3-slot refusal boundary is unverified in this run. The match finished in61 actions under the100-action bound, so no further games were played to manufacture those conditions.

### Reproduced UX findings

**S1 — P2, the finished board still announces the other person's turn.**

Reproduction: play this13–15 match to completion→refresh/read the KO finished screen. The outer room status says the hand is finished and the result says `상대가 이겼어요`, but the prominent feedback line above the market reads **`상대 차례예요. 보석 은행과 공개 카드를 살펴보세요.`**. The ES finished screen likewise keeps the generic other-person-turn instruction. Controls correctly refuse further gameplay, so this is stale status guidance, not an extra server turn or incorrect winner.

Source/minimal direction: `src/app/TableGames.tsx` `.sp-feedback-slot`/`.sp-turn-guide` tests `!active` without first handling `view.result`; finished games make active false for both viewers. Render completed-match guidance before the turn fallback, in both languages. Regression: after a real finished result and after transient feedback expires/refreshes, assert the fallback announces completion and does not contain opponent-turn or take/buy prompts. Evidence: permanent finished KO/ES PNGs and final matching phase/turn counts in summary JSON.

**S2 — P2, same-game replay affordance is also absent here.**

Finished Splendor has a valid result, but no replay/next-hand button and0 `게임 선택: 스플렌더` entries. This reproduces the same shared PlayApp affordance gap as Domino D1, rather than adding a different engine defect. Source/minimal direction/regression are the shared D1 recommendation: offer an explicit same-game replay request and preserve both-player consent. No replay was executed by switching to another game or injecting a request.

No gameplay-blocking Splendor UI defect was reproduced. Actual production Realtime, physical devices/audio, reserve3-cap, p1-first15 extra last-turn branch, tiebreak by fewer cards, and full keyboard Tab traversal remain unverified. At that stage the three original games were complete; root's coordinated fixes and independent follow-ups are recorded below.

## Follow-up fix validation — Domino

After root's source freeze, the same UI-only two-context strategy runner completed a new Domino match in room `5cb94051-9727-4f53-b990-932436619534`:13 actions (11 placements,2 passes),117 assertions passed,0 uncaught browser errors. Both finished views agreed at version15; p2 won the blocked game with remaining pip totals p1=6,p2=0. This follow-up does not erase the original D1/D2 observations above.

The losing KO viewer's actual event DOM showed neutral title **`경기 결과`** and badge **`상대 팀 승리`**, resolving D2 in this run. Both replay buttons had the exact KO/ES accessible names and ready state. p1 clicked the replay CTA: both still showed the same finished result and11-tile board, with `pendingGame=domino`. The metadata request advanced room version15→16; the version number was not unchanged. p2's CTA remained enabled, and its UI click gave both viewers fresh version17, empty public chain,7 own tiles per viewer, no revealed opponent tiles, and no previous result/win effect. This verifies the visible same-game request and two-player consent path for D1; requester repeat-click was not separately exercised.

The first follow-up attempt stopped on a QA expectation error: actual title `경기 결과` was correct, but the prepared regex omitted `결과`. The expectation was changed to the exact neutral title plus rival badge before the successful run. The QA expectation failure is documented here and selected successful evidence is archived below; this was not a reproduced application defect. No application source was changed by this verifier.

Permanent evidence: [summary JSON](../screenshots/live-play-2026-10-11/after-fixes/qa-domino-summary.json), [finished/request pending KO](../screenshots/live-play-2026-10-11/after-fixes/qa-domino-finished-pending-ko.png), [finished/request pending ES](../screenshots/live-play-2026-10-11/after-fixes/qa-domino-finished-pending-es.png), [fresh replay KO](../screenshots/live-play-2026-10-11/after-fixes/qa-domino-replayed-ko.png), [fresh replay ES](../screenshots/live-play-2026-10-11/after-fixes/qa-domino-replayed-es.png). The local SQL fixture still lacks Realtime; peer refreshes were read-only `reconnectRoom/getSnapshot`, and all gameplay/replay requests used actual UI. Physical devices/audio and production Realtime remain unverified. At that stage Jaipur/Splendor follow-ups had not yet been authorized; their completed checks follow below.

## Follow-up fix validation — Jaipur, interrupted attempts

The first follow-up reached6 actual UI actions, including a2↔2 exchange and p2's ES390 cloth3 sale with +/−, cancel, reselection and confirmation. The single sale tray was inside the own-hand article, had139.97px height and44px minimum controls, and the document remained390px wide. It stopped when the verifier waited for a fresh bonus notice **after** calling `reconnectRoom`. That refresh increments `syncEpoch` and remounts the board, so old history is intentionally baselined without a new notice. The QA observation order was corrected to inspect the active client's fresh event before read refresh, then separately require historical-notice absence after refresh. This timeout does not establish a product notice defect; the diagnostic sequence is recorded here.

After another source freeze, room `8ce5d4d4-dedf-45f9-977a-8965d2a0ec7a` exposed a current layout regression at the initial board, before gameplay: KO390 and both1440 views showed all six next-token values inside their cells, but ES390 showed `Siguiente:` plus coin/value on one line overflowing each cell. Document width stayed390 and the board had a single338.406px column, so this is inner token-cell overflow rather than page-wide overflow. Values/labels were present and visible; all six containment assertions failed. Exact overflow distances were not recorded in this attempt and are not inferred from the screenshot. Root was notified; the browser closed, and no further gameplay ran while source corrections were pending.

Source/minimal direction: the stacking/label/value rules at `jaipur-premium.css`282 are inside the1024px-minimum media block, leaving the default `.jp-pile-next` flex/nowrap layout active on390. Apply the intended stacked cell layout at the mobile breakpoint and recheck both labels and numeric values in KO/ES390; preserve desktop numeric-value visibility. [Failure JSON](../screenshots/live-play-2026-10-11/after-fixes/qa-jaipur-token-cell-failure.json) and [ES390 screenshot](../screenshots/live-play-2026-10-11/after-fixes/qa-jaipur-token-cell-failure-es.png) preserve this finding. At that interruption those mobile/notice checks were unverified; the completed final-v2 run below supersedes that stage status.

## Final-v2 follow-up — Jaipur

Source revision `d459ea8`, after the mobile cell correction and remote integration, passed the bounded actual UI run in a fresh independent KO/ES room `f186e205-45eb-4911-bf9d-87011b335d5c`. It completed16 actions (11 single goods,1 camel group,1 exchange,3 sales),213 assertions,0 uncaught browser errors; both viewers agreed at version18, round1, with25 deck cards left. The run stopped after the requested midgame scope instead of replaying the earlier full round. Earlier failed/interrupted evidence above remains preserved; the previously pending mobile and notice checks below are now completed.

- All six next-token numeric values rendered inside their cells in both1440px views. At390px both boards had one column, token rows computed to grid, and all six labels/coins/numeric values fit their cells. Raw cell/label/value/child rectangles and computed display are in the summary, resolving the observed ES inner-cell overflow.
- On their actual active turns, KO sold cloth3 and ES sold leather4 at390px through +/−, cancel, reselection and explicit confirmation. Both showed exactly one sale tray inside their own-hand article;139.97px tray height, minimum44×44px buttons,80×44px cancel and390px document width. The exact selected number was removed. Take/camel/exchange each retained a single market-local confirmation tray. The2↔1 exchange mismatch explanation/blocked confirm and cancel/restage2↔2 path also passed.
- A lone diamond sale remained disabled. Clicking its disabled confirm location preserved selected card and version; no server rejection was induced, so authoritative failure-selection preservation remains unverified. The natural7-card cap and one double-confirm producing one commit also passed.
- For each active seller, the actual fresh earned-bonus notice was inspected **before** read refresh at390 and1440: its rectangle overlapped the round pill by0px². Each notice expired before any read refresh; afterward both refreshed viewers had no historical notice. Fresh notice and no replay of old history therefore have separate observations. These are actual DOM/full-page evidence, not a claim that an offscreen notice automatically scrolls into view.

J1's round-pill overlap was not reproduced after the notice-rail change. J2's sale tray now belongs directly to the own-hand area, with no rival row inserted between hand and tray. Measured first-selected-card→confirm distance is **352.97px below** in KO and**344.97px below** in ES with two hand rows. That verifies placement, but does not show shorter travel than the original upward200px observation; no distance-reduction claim is made.

Evidence: [final-v2 summary JSON](../screenshots/live-play-2026-10-11/after-fixes/final-v2/qa-jaipur-summary.json), [KO mobile sale](../screenshots/live-play-2026-10-11/after-fixes/final-v2/qa-jaipur-mobile-sale-ko.png), [ES mobile sale](../screenshots/live-play-2026-10-11/after-fixes/final-v2/qa-jaipur-mobile-sale-es.png), [KO mobile bonus](../screenshots/live-play-2026-10-11/after-fixes/final-v2/qa-jaipur-mobile-bonus-ko.png), [ES mobile bonus](../screenshots/live-play-2026-10-11/after-fixes/final-v2/qa-jaipur-mobile-bonus-es.png), [KO table bonus](../screenshots/live-play-2026-10-11/after-fixes/final-v2/qa-jaipur-table-bonus-ko.png), [ES table bonus](../screenshots/live-play-2026-10-11/after-fixes/final-v2/qa-jaipur-table-bonus-es.png).

Final-match loser notice/confetti, full-round settlement in this bounded follow-up, maximum5-card exchange,6/7-card sale, physical touch/audio and production Realtime were not exercised. The local fixture still uses read-only reconnect/snapshot for peers; all moves used UI. No application source was edited by this verifier. At that stage Splendor follow-up awaited authorization; its completion is recorded below. Original and selected permanent evidence remains archived.

## Final-v3 follow-up — Splendor and current completion

After root's final source freeze, a new independent KO/ES room `19810b81-f2fa-412f-8d43-17a6022d3e78` completed a full strategic match and consented replay through actual UI.57 game actions comprised37 purchases,17 different-color takes,1 same-color take,1 reservation and1 noble selection. All735 assertions passed, with0 uncaught browser errors. Finished version59 showed p2 winning16–10, both28 completed turns, and development-card counts p1=15,p2=22. These replace no original observations; the original61-action match and earlier fix evidence remain preserved.

- Both initial views rendered12 public development cards with numeric cost chips at13px, visible and contained within the card. Keyboard selection, Escape returning card focus, explicit cancel, and one double confirmation yielding one version continued to pass.
- The non-active bank guidance consistently waited for that viewer's turn, with no generic `Elige 3` prompt. When p2 naturally qualified for multiple nobles, KO p1 showed `rival-noble-choice` and `상대가 귀족을 선택 중이에요. 차례를 기다려 주세요.`, while ES p2 showed `noble-choice` and `Elige un noble.`. Their bank guidance likewise waited instead of offering gem acquisition; the actual UI noble choice completed successfully.
- KO p1 reserved `t3-13`, then bought it for4 points using discounts and1 gold. Its own-reserved action panel read `이미 예약한 카드 · 구매` with no reserve button or new gold acquisition preview. Only p1 naturally reserved; the corresponding ES own-reserved panel is **unverified** in this match, rather than covered by changing state or starting extra games. All37 purchases' remaining colored/gold tokens matched own costs after discounts. A natural cap case took3 from8 tokens and returned1 white through the UI, finishing at10.
- S1 is resolved in the observed finished views: KO losing status was `게임 종료 · 상대가 이겼어요.`, ES winning status `Partida terminada · ganaste.`. Both bank guides had `finished` phase and refused further gem acquisition. Equal28-turn finish verified the p2-reaches-target branch; p1-first15→p2 extra last turn was not reached.
- S2 replay passed: p1 UI request kept the previous public board and result while advancing metadata version59→60 with pending game. p2's enabled UI approval produced fresh version61. Both public scores/turns/bonuses reset to0; each viewer's own tokens and reservations were0, and the previous result disappeared. No action API or state injection was used.

Evidence: [final-v3 summary JSON](../screenshots/live-play-2026-10-11/after-fixes/final-v3/qa-splendor-summary.json), [finished KO](../screenshots/live-play-2026-10-11/after-fixes/final-v3/qa-splendor-finished-ko.png), [finished ES](../screenshots/live-play-2026-10-11/after-fixes/final-v3/qa-splendor-finished-es.png), [own-reserved purchase KO](../screenshots/live-play-2026-10-11/after-fixes/final-v3/qa-splendor-own-reserved-buy-ko.png), [pending replay ES](../screenshots/live-play-2026-10-11/after-fixes/final-v3/qa-splendor-replay-pending-es.png), [fresh replay KO](../screenshots/live-play-2026-10-11/after-fixes/final-v3/qa-splendor-replayed-ko.png), [fresh replay ES](../screenshots/live-play-2026-10-11/after-fixes/final-v3/qa-splendor-replayed-es.png). The summary preserves exact checks and source-file hashes after the frozen run.

The three sequentially authorized independent follow-ups are complete: Domino13 game actions/117 assertions with replay, Jaipur16 actions/213 assertions in its bounded mobile/notice scope, and Splendor57 game actions/735 assertions with replay. Earlier `pending` wording describes those stages chronologically; no further game awaits execution. This verifier made no application source edits or push. Original and selected permanent screenshots/JSON remain archived; no further independent browser run is scheduled.

Remaining limits: ES reserved panel, reservation3 cap, p1-first15 extra last turn, score tie by fewer cards and full keyboard Tab traversal were not reached here. Jaipur's final-match loser/confetti branch remains unplayed by this verifier. Production Realtime and physical devices/audio remain unverified: this fixture requires explicit read-only reconnect/snapshot for peers, and the checks used browser UI input rather than physical hardware.

After the actual network-fixture run, root/Luna corrected an additional reserved-card heading that displayed tier0. KO/ES tier2 and tier3 headings passed mock-backed native browser checks, as reported by root; this verifier did not rerun that correction through the two-player SQL/network fixture. The final433-test/build results are root-reported repository checks, not433 live UI scenarios.

Root removed the ignored `output/playwright/live-two-player-qa/` raw diagnostic directory after archiving the selected evidence in the permanent paths linked above. Other owned notice/layout diagnostics and AI candidate temporary files were also removed; permanent photographs and reports remain. This verifier did not perform the deletions.
