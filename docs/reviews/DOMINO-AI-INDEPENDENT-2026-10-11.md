# Domino AI independent review — 2026-10-11

This review concerns the isolated `/tmp/domino-ai-candidate/` copy. The reviewer did not edit application source, restart a server, or run a new browser match. The game-ai and Ponytail instructions were applied. Offline chooser matches are distinct from the separately recorded two-player UI evidence.

## Decision boundary and rules

The candidate chooser receives its own hand, public placed tiles/ends, difficulty, actor/mode, public remaining-hand counts and public event history. The production wrapper passes no other hand faces, unused stock, hidden pip totals, or revealed-hand object. Enumerating the double-six tile universe minus the caller's hand and public board estimates unknown tiles without reading their actual allocation. Engine-only round resolution continues to read hands for scoring; that is outside the chooser.

Team mapping agrees with the engine: `partners` pairs p1+b1 and p2+b2; `humans-vs-bots` pairs p1+p2 and b1+b2. Four-seat turn order remains p1, b1, p2, b2. Forced opening is owned by the engine wrapper. The chooser passes only when no legal move exists. All three difficulties give an empty remaining hand a dominant score, so easy does not intentionally miss an immediate hand-out.

The final hard policy adds sampled rollouts to the own-hand utility. Its virtual `state.hands` contains only the caller's hand and sampled assignments from the unknown tile universe. Virtual seed is constant zero; virtual stock is generated from the unassigned universe. It never enters actual private engine state. The rollout reuses the engine's pure transition and normal utility, so no recursive hard search occurs. Both the production caller and benchmark pass the public `tranqueRule` into the virtual settings.

The final bound is **16 sampling attempts × at most 3 evaluated moves × at most 60 rollout steps**; each sampling attempt has a 64-work budget and recursion depth at most three other seats. Invalid sample allocations are excluded and scores divide by the number of valid worlds. Single legal moves and immediate hand-outs return before sampling. Public pass inference is valid within a block-domino round because no tiles are drawn. The retained 40-event log requires a round boundary before this inference or ally-play signals are used.

## Findings resolved during candidate review

| Finding | Reproduction | Candidate correction |
| --- | --- | --- |
| Incorrect predicted left endpoint | With ends 1/5, playing 1/6 on the left predicted 1/5 rather than 6/5. This affects utility, not engine acceptance. | Left orientation now matches the authoritative transition. |
| Previous-round ally signal | An ally's old 6/6 play before `round-start` contributed a positive signal on new 6/5 ends. | Both pass inference and ally signals use the same current-round event filter. |
| Benchmark/production pass-inference mismatch | The first-round benchmark omitted the separate board-sequence context, causing all pass inference to be ignored, while production supplied it. | The filter now derives its fallback boundary directly from the already supplied public board, shared by both callers. |

The final read-only in-memory bundle verification passed **27 assertions**: four endpoint/orientation cases, exclusion of an old ally play, current-board filtering of old passes, four team-relation checks, immediate hand-out at all three difficulties, two assertions proving the supported-end fixture fails with the original orientation error, and twelve assertions covering configuration and pure-transition/`applyAction` parity across two modes and three seeds. This verifies the benchmark's transition path against the actual automatic bot runner on those six representative cases. No persistent candidate or application file was changed by this check. An earlier probe met a concurrently changed helper signature and did not constitute an application test result.

The candidate now includes a utility-orientation regression with four tiles, public-context forbidden getters, immediate hand-out/pass legality, deterministic/nonmutating decisions and current-round pass behavior. The original one-tile orientation test alone could not detect the utility defect; the added four-tile fixture does. The candidate author separately reports **27 unit tests and strict TypeScript passing**; that unit count is distinct from the reviewer's 27 in-memory assertions.

## Benchmark interpretation

The benchmark uses the same deals with candidate seats or teams swapped, a frozen old policy, engine legal actions and terminal bounds. Its four-seat comparison exposes the existing pure engine transition only in the in-memory bundle; production exports are unchanged. Separate engine self-play checks exercise the automatic bot runner, but their timing samples cover manually selected human-seat decisions rather than the automatic bot work inside `applyAction`.

Direct hard-versus-normal paired team comparisons were added for both actual bot modes. Candidate-versus-old-hard results alone would not establish the new difficulty ordering. Chooser timing includes zero-duration forced openings, so its mean is not an every-call latency guarantee. Current turn order alternates human and bot seats; one production `runBots` invocation makes at most one bot decision, including configuration/next-round opening handling.

## Frozen candidate and held-out result

The final candidate was frozen before the newly approved **2001–2200** seed range was run once. Each comparison swaps teams or seats for every seed, yielding 400 games. The reviewer read the completed JSON and the parent retained it permanently at [ai-benchmarks/holdout-2001-2200.json](../screenshots/live-play-2026-10-11/ai-benchmarks/holdout-2001-2200.json). The isolated candidate and temporary benchmark files were subsequently cleaned by the parent.

| Actual bot mode | Hard vs new normal: wins / losses / draws | Decisive win rate | Hard mean / maximum chooser time |
| --- | --- | --- | --- |
| humans-vs-bots | 236 / 154 / 10 | 60.51% | 0.923 / 5.867 ms |
| partners | 255 / 139 / 6 | 64.72% | 0.947 / 32.309 ms |

Against frozen old hard, the corresponding results were **227 / 160 / 13** and **230 / 159 / 11**. Both actual bot modes therefore show an observed held-out advantage over the new normal policy and the old hard policy in these offline paired matches. This is descriptive benchmark evidence, not a general production-strength guarantee. The 32.309 ms observed maximum is retained rather than replaced by the lower development-run maximum; no rigid 20 ms acceptance threshold was specified. Physical device or deployed Edge timing was not measured.

Synthetic 1v1 hard-versus-normal finished **199 / 188 / 13** (51.42% decisive wins); the final development range had 98 / 98 / 4. A substantial 1v1 improvement is not established, and the current product has no 1v1 bot seat. Automatic-runner self-play terminated for all **200 seeds per mode/difficulty**, six combinations.

Frozen SHA-256 values:

- `src/games/domino.ts`: `3aaff80c812e031130dedac23db39d3001aece806797584c2d72dcbce800dacc`
- `src/games/domino.test.ts`: `aceda916a165cac78e8774db557b6f8657004c539ff113cde16bfa94c5a12792`
- `scripts/benchmark-domino-ai.mjs`: `8f08ab44e741ccbdb3cd0d368a7d6a1b55df2947e75c47318a010aaae24764ad`

Independent source/tactical/benchmark review supports integration of this frozen candidate. At candidate-review completion, the UI script was prepared and awaited the parent's application freeze/release; its actual execution results follow below. Its method is UI-only two-context play against the local SQL/RLS/authority fixture, using read-only refreshes; it is not a real Supabase network test. Browser/physical-device experience and deployed timing remain separate evidence. No source edit, server restart, commit or push was performed by the reviewer.

## Actual UI verification — first attempt

After the parent reported the integrated 433-test/build gate and explicitly released UI verification, the reviewer ran `scripts/play-domino-ai.mjs` against port 5192. Two isolated 1440×900 contexts used KO and ES-DO, created/joined one room, consented to Domino and applied humans-vs-bots plus hard through visible controls. Authority version 3 correctly showed the selected mode and hard setting to both viewers. Eight checks passed before the ninth failed; **zero human moves**, no completed mode run and **zero browser page errors** were recorded. Browser contexts and the browser closed through the runner's `finally` block.

The failure is a product defect: reopening settings before the opening tile shows **1v1** despite the persisted humans-vs-bots mode; hard and target zero remain correct. `DominoBoard.tsx` builds `settings` from `DEFAULT_CONFIG` and `view.settings`, but engine settings omit mode. The effect then resets `config` to this object, restoring the default 1v1. Applying that reopened form could change the chosen mode. The failure is not a synchronization delay: the authority view already had humans-vs-bots, and the source deterministically fills the missing settings mode from the default. Application source was not edited by this reviewer; the finding was sent to the parent for the owning developer's minimal correction.

Initial evidence is preserved at `docs/screenshots/live-play-2026-10-11/ai-live/report.json`. This fixture uses local SQL/RLS/authority infrastructure, not deployed Supabase or physical devices.

## Corrected-source actual UI result

The parent corrected the fresh settings object's mode to the derived actual view mode, reported 16 DominoBoard tests plus TypeScript/Vite/Edge build passing, froze application source again and explicitly authorized the rerun. The AI engine hash did not change. The reviewer made no runner or application-source change. The rerun exited zero and preserved its separate evidence at [ai-live/final/report.json](../screenshots/live-play-2026-10-11/ai-live/final/report.json).

| UI mode | Human UI actions | Subsequent automatic bot play/pass events | Final authority version | Placed tiles | Natural result |
| --- | --- | --- | --- | --- | --- |
| humans-vs-bots | 14 | 13 | 17 | 22 | finished, human team won |
| partners | 13 | 12 | 16 | 24 | finished, p1's mixed team won |

**391/391 checks passed, zero browser page errors.** Both viewers agreed on public boards and versions; active hand DOM matched each private own-hand view without opponent faces or premature reveal; hard mode persisted in authority settings and visible readouts; every human UI action committed exactly one authority version; automatic bot actions returned to a human turn or the natural result. Tile/endpoint actions used keyboard Enter/Space, and passes used the visible legal pass control. Only `reconnectRoom`/`getSnapshot` read-only refreshes accessed the exact client; no action dispatch or state injection was used.

Both new deals naturally opened with a bot during configuration, so the unopened-form launcher disappeared. The visible current-mode/hard readout branch passed for both modes. **The corrected first-human-opening settings-reopen branch was not reached in this complete-match rerun**; at this stage its correction had source inspection and the parent's focused unit/build evidence. The separately bounded follow-up below subsequently reached partners. No deals were manufactured to hide the coverage limit.

Four representative KO/ES midgame/result PNGs were visually inspected: active opposing hands remained backs; human/mixed team labels agreed with their mode; the KO human-team win and ES mixed-team loss titles matched the result and scoring. Eight original full-page PNGs remain unchanged, 1440×1945–2083 pixels and approximately 0.62–0.69 MB each; these include the guide and room sections. The displayed reconnect banner accompanies the harness's explicit read-only fixture refreshes and is not evidence of a deployed connection outage or recovery test.

The two contexts and browser closed in `finally`; there is no reviewer-owned idle browser/server/session. This UI verification created no temporary diagnostic files outside its artifact directory. The parent subsequently cleaned the two earlier notice diagnostics `/tmp/jaipur-notice-qa.log` and `/tmp/jaipur-notice-final-qa.log`. Live Supabase reliability, physical-device frame rate and physical audio remain untested; the benchmark's observed Node maximum of 32.309 ms is retained without estimating device FPS.

## Bounded settings-reopen follow-up

The parent authorized a configuration-only follow-up because the corrected reopen branch had not been reached in the complete matches. The runner gained `--configuration-only` with at most four natural UI-created deals per mode, stopping when the branch is reached; it never forces a seed and makes no gameplay moves. Canonical 391-check evidence remains unchanged.

The first configuration-only attempt observed three humans-vs-bots deals, all opened naturally by b1. The fourth create request met the normal SQL maximum of three active rooms and navigation timed out. **27 checks passed, zero page errors, runner exit 1**. This is a test-room lifecycle limit rather than evidence that the product quota is defective. Evidence is preserved at [config-reopen/report.json](../screenshots/live-play-2026-10-11/ai-live/config-reopen/report.json).

The parent authorized cleanup through the visible room-close/confirmation UI and only the remaining **one humans-vs-bots deal plus at most four partners deals**. The runner gained per-mode bounded attempt arguments and visible UI cleanup, without SQL/quota edits. Four subsequent test rooms were visibly closed. The last partners room was reached before cleanup completed; its browser context was still closed in `finally`.

| Mode | Total natural configured deals across follow-up attempts | Actual reopen result |
| --- | --- | --- |
| humans-vs-bots | 4 | All bot openings; corrected reopen remains unverified within the approved bound. |
| partners | 4 | Fourth deal had a human opening; actual selected values **partners / hard / 0** passed. |

The last run recorded **45 passed checks, zero page errors, zero human moves, and runner exit 1** because the post-screenshot close-button locator timed out after the successful partners value assertion. Its underlying cause is unresolved; this is not classified as a new application defect or definitively as a harness-only defect. The saved PNG lacks the open dialog despite the immediately preceding values being read successfully. All evidence remains at [config-reopen/final/report.json](../screenshots/live-play-2026-10-11/ai-live/config-reopen/final/report.json) and its adjacent PNG. The reusable runner now closes the settings dialog only if that close control is still visible after capture; saved-value assertions are unchanged. This final minimal post-processing change passed syntax/whitespace checks and was not rerun.

No additional rooms or broad match reruns followed. Every browser/context closed, no application source or server was changed, no temporary diagnostic files remain owned by the reviewer, and the known first-human settings regression has direct browser confirmation for partners plus focused source/unit/build evidence for the shared fix. Humans-vs-bots browser coverage of that branch remains explicitly limited.
