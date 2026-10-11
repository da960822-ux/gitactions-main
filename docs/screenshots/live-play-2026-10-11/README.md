# Three-game live play — 2026-10-11

These are original screenshots from actual UI play in two independent Chromium contexts: player 1 Korean, player 2 Dominican Spanish (`es-DO`). They were presented one game at a time, Domino → Jaipur → Splendor. These first six images show the inspected version **before the follow-up UX fixes**.

| Game | Korean | Spanish | Actual unfinished position |
| --- | --- | --- | --- |
| Domino | [Korean](domino-ko.png) | [Spanish](domino-es.png) | Version 11; 9 placed tiles; 5/4 placements; 2/3 tiles in hand; open ends 6/5. |
| Jaipur | [Korean](jaipur-ko.png) | [Spanish](jaipur-es.png) | Version 24; first round; 11 actions each; score 40/35; hands 2/2; herds 5/3. Both players sold goods and exchanged two cards. |
| Splendor | [Korean](splendor-ko.png) | [Spanish](splendor-es.png) | Version 26; 12 actions each; developments 3/5; score 1/1. Reserved cards were bought and a two-token return was confirmed through the UI. |

Each image captures the entire `#game-board` element at its native CSS scale, using a 1440×900 viewport. No image crop, generated game position, direct action API, or game-state injection was used. Strategies used only each active player's own visible hand/resources and public information. Own hands are intentionally visible in these requested screenshots.

The service was the local PGlite SQL/RLS/authority protocol fixture, not deployed Supabase. It has no Realtime, so explicit read-only snapshot refreshes synchronized the other screen after UI actions. The `*-play.json` records preserve the actual action history, state consistency checks and limitations. These captures do not prove automatic Internet synchronization, physical device responsiveness or audible quality.

Independent gameplay QA used separate rooms. Its selected `qa-*` evidence and [report](../../reviews/LIVE-TWO-PLAYER-QA-2026-10-11.md) distinguish observed defects from fixture and automation limitations.

## Follow-up photographs

Successful photographs from each inspection stage remain preserved. `after-fixes/final` is an interrupted token-cell inspection; its partial outputs do not establish a passing final run. `final-v2` caught an additional desktop bonus-threshold visibility regression during direct photograph review. The final Jaipur images below include its correction.

| Game | Korean | Spanish | Verified position |
| --- | --- | --- | --- |
| Domino | [Korean](after-fixes/domino-ko.png) | [Spanish](after-fixes/domino-es.png) | Version 11; nine placed tiles; 5/4 placements; own hands 2/3. Independent finished-game replay validation is recorded separately. |
| Jaipur | [Korean](after-fixes/final-v3/jaipur-ko.png) | [Spanish](after-fixes/final-v3/jaipur-es.png) | Version 27; 25 UI actions (13/12); round 1 still active; score 45/39; hands 2/2; both exchanged and sold. Bonus thresholds and token values are visible in both languages at 1440/390px. |
| Splendor | [Korean](after-fixes/final-v3/splendor-verified/splendor-ko.png) | [Spanish](after-fixes/final-v3/splendor-verified/splendor-es.png) | Version 33; 31 UI actions (16/15); score 2/1; developments 6/8. Both players used one gold in purchases; p1 returned five tokens in total. The independent finished/replay match is a separate room. |

Jaipur [Korean mobile](after-fixes/final-v3/jaipur-ko-mobile-final.png) and [Spanish mobile](after-fixes/final-v3/jaipur-es-mobile-final.png) show the same final version. Independent sale and fresh-notice checks use a different room and are documented in the review, rather than being attributed to these photographs.

The first follow-up Splendor capture stopped because its new gold check ran before the actor snapshot updated. The successful `splendor-verified` run waits for the committed version before checking payment. This was a harness timing error, not an incorrect purchase. Direct reserved-panel inspection separately caught a displayed tier of zero; the final follow-up report records its correction and targeted validation. Main midgame photographs show the panel closed.

## AI and controlled checks

The [hard-AI UI report](ai-live/final/report.json) records two completed games, 27 human UI actions, 391 passing assertions and no page errors. Its eight `ai-live/final` images show Korean and Spanish midgame/final views. Earlier interrupted checks remain separate evidence.

The [independent AI review](../../reviews/DOMINO-AI-INDEPENDENT-2026-10-11.md) distinguishes UI play from paired simulations in `ai-benchmarks`. `component-checks` contains controlled component records and four selected reserved-tier screenshots using mocked props; those images are not online matches. Temporary raw diagnostic outputs are not needed to read these archived records.
