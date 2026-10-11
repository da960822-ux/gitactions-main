# Three-game follow-up fixes — 2026-10-11

Scope: Domino, Jaipur and Splendor. The original [independent two-player review](LIVE-TWO-PLAYER-QA-2026-10-11.md) and [before-fix photographs](../screenshots/live-play-2026-10-11/README.md) are preserved. Follow-up evidence is collected after the fixes; original observations are not rewritten as passing checks.

## Implemented UX changes

| Game | Change | Purpose |
| --- | --- | --- |
| Shared | Same-game replay request with the existing two-player consent protocol | Restart a completed game without switching games; preserve the result while consent is pending. |
| Domino | Viewer-relative result headline | A losing player sees a neutral match result and the rival winner badge. |
| Jaipur | Sale controls immediately below the player's hand | Keep selected goods, quantity and confirmation together. |
| Jaipur | Notices occupy their own layout row and expire; historical notices are silent on remount | Keep round/turn information visible and avoid replaying stale bonus events. |
| Jaipur | Two-line mobile next-token labels; desktop values remain visible | Keep Korean and Spanish text within each commodity column. |
| Jaipur | Viewer-relative end notices and singular Spanish sale grammar | Describe the actual result and number of cards correctly. |
| Splendor | Visible gem symbols and quantities on every market card | Read purchase costs before selecting a card. |
| Splendor | Phase-aware market/bank guidance | Distinguish own turn, rival turn, noble selection, token returns and completion. |
| Splendor | Own reserved-card preview describes purchase only | Avoid showing new-reservation gold and slot instructions for an already reserved card. |
| Splendor | Reserved-card panel uses the card's actual tier | Avoid showing “tier 0” for an already reserved tier 2/3 card. |

## Evidence boundaries

Actual gameplay uses two independent Chromium contexts, Korean and Dominican Spanish, against the local SQL/RLS/authority fixture. Gameplay, room creation, joining and consent use UI controls. Peer synchronization uses read-only snapshot refreshes because this fixture has no Realtime. Decisions use each player's own visible resources and public information; screenshots intentionally show the viewer's own hand.

Separate controlled component checks cover notice lifetime, reduced motion and dimensions at 1440px and 390px. They do not substitute for actual online gameplay. Physical touch, audible output, deployed Supabase Realtime and Internet latency remain unverified.

Completed follow-up gameplay and Domino AI results are recorded below.

## Actual follow-up gameplay

| Game | Independent UI checks | Outcome |
| --- | --- | --- |
| Domino | 13 actions; 117 assertions; no page errors | Losing-view headline corrected. Finished result and board survived the first replay request; second-player consent reset the hand and private views. SQL room versions were 15 → 16 pending → 17 fresh. |
| Jaipur | 16 actions; 213 assertions; no page errors | Both active viewers completed mobile quantity/cancel/confirm sales. Initial KO/ES token cells fit at 390/1440px. Fresh notices were observed before refresh, expired naturally and did not reappear after refresh. Separate final photography reached 25 actions and verified visible 3/4/5+ thresholds after the desktop integration correction. |
| Splendor | 57 actions; 735 assertions; no page errors | p2 won 16–10 at 28 completed turns each. Both finished guides matched the result. A reserved purchase used one gold without new-reservation instructions, and an 8+3−1 token return finished at ten. Replay versions were 59 → 60 pending → 61 fresh after the second player's UI consent. |

Splendor's reserved purchase was naturally reached by the Korean viewer, not the Spanish viewer, in this independent match. The first-player-reaches-15 extra-turn branch and three-reservation boundary were not reached. Jaipur's completed-match loss effect was checked in a controlled component case, not through this unfinished follow-up round. The original full-match/round checks and follow-up evidence remain separate in the independent report.

## Integration and targeted component checks

Remote main updates through `7295768` were preserved in merge `d459ea8`. Integration removed duplicate replay controls for the three games while retaining the upstream replay for other games. A direct photograph review then caught the legacy compact stylesheet hiding the Jaipur 3/4/5+ sale thresholds. Its obsolete overrides for the three premium boards were removed in favor of their dedicated stylesheets; Minhwatu's upstream styling and all other-game changes are preserved. Integrated tests passed: 48 files, 427 tests. The production TypeScript, Vite and Edge build passed. After the AI and reserved-tier changes, the complete suite passed 48 files and 433 tests. The final one-line settings-mode correction then passed the focused 16-test DominoBoard suite and a fresh production TypeScript, Vite and Edge build.

The [notice component record](../screenshots/live-play-2026-10-11/component-checks/jaipur-notice.json) covers Korean/Spanish, 1440/390px and normal/reduced motion. Bonus notices expired in approximately 2.6 seconds and end notices in 4.5 seconds; loss/draw views had no winner confetti and remounts did not replay historical notices. These are controlled component cases.

The [token-cell component record](../screenshots/live-play-2026-10-11/component-checks/jaipur-token-cells.json) verifies six visible values in their own columns at both widths and languages after moving mobile rules out of the desktop media query. Independent actual UI had caught the prior Spanish overflow; its [failure evidence](../screenshots/live-play-2026-10-11/after-fixes/qa-jaipur-token-cell-failure-es.png) is retained. The [Splendor cost record](../screenshots/live-play-2026-10-11/component-checks/splendor-costs.json) is a separate controlled layout check, not a completed online match.

After the reserved-tier correction, a [controlled native-browser record](../screenshots/live-play-2026-10-11/component-checks/splendor-reserved-tier.json) verifies KO/ES tier 2 and 3 headers. Its four images in `component-checks` use mocked TableGames props and contain no live room actions. The actual gameplay reproduction and this targeted correction check are explicitly separate.

## Domino difficulty

The installed [game-ai skill](../../.agents/skills/game-ai/SKILL.md) guided utility selection, a separate action intent and bounded verification. Easy and normal both make useful legal moves; hard additionally uses current-round public pass inference, counts, team relationships and up to 16 hypothetical deals to compare three candidates through the existing rule transition. Actual hidden hands and game RNG are never inputs.

On unused deal seeds 2001–2200, with team assignments swapped, hard beat the new normal 236–154 with ten draws in humans-vs-bots, and 255–139 with six draws in partners: 60.51% and 64.72% of decisive matches, respectively. These are 400 simulated paired games per mode, not human-player win rates. Both current bot modes improved against the frozen old hard policy as well. The existing 1v1 remains two humans; its synthetic chooser comparison showed only a small difference and does not establish a 1v1 bot feature.

See the [implementation and benchmark report](DOMINO-AI-UPGRADE-2026-10-11.md) and [independent review](DOMINO-AI-INDEPENDENT-2026-10-11.md) for exact counts, source hashes and runtime limits. The measured hard decision averaged about 0.9ms on the Node host; a 32.31ms maximum is retained rather than omitted. This is not a deployed Edge or physical-device latency guarantee.

## Hard AI through the actual UI

The [canonical UI report](../screenshots/live-play-2026-10-11/ai-live/final/report.json) passed 391 assertions with no page errors. Two independent Korean/Spanish contexts configured hard difficulty and completed both bot modes through visible controls: 14 human UI actions in humans-vs-bots and 13 in partners. Both games finished legally, and private-hand visibility and committed room versions remained consistent. The report and eight midgame/final images preserve the actual results; simulation win rates are not attributed to these two games.

An earlier live check caught the settings panel reverting its mode when reopened before the first human tile. The board now initializes its local configuration from the authoritative view mode as well as difficulty. The failed observation is retained separately from the successful canonical matches.

## Final repository checks and cleanup

The complete integrated suite passed **48 test files / 433 tests**. After the final one-line Domino settings-mode correction, its focused **16 tests** and a fresh **TypeScript / Vite / generated Edge engine build** passed. The bounded final settings-reopen inspection reached the actual partners form and verified partners/hard/target 0. Humans-vs-bots naturally opened with a bot in all four allowed deals, so its reopen branch was not reached. The bounded follow-up recorded 45 passing checks but exited nonzero on a post-screenshot close-control timeout; this is not counted as a passing end-to-end run. The canonical 391-check completed gameplay run remains separate. Full details and the unresolved close-stage cause are recorded in the independent AI review.

Seven owned temporary diagnostic/candidate directories and 24 owned `/tmp` logs/intermediate benchmark files were removed after selected evidence was archived. Shared servers, dependencies, installed skills, production assets and every permanent requested photograph remain. Deployment Realtime, physical devices/audio and commercial asset/licensing clearance remain separate release checks.
