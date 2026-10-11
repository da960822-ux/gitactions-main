# Domino bot chooser upgrade — 2026-10-11

The chooser now makes a stronger public-information decision in the existing four-seat bot modes. This update does not add a bot to one-versus-one: that mode still has two human players. It also leaves the opening rule, legal actions, blocked-hand resolution, bonuses, match scoring, and saved-state compatibility in the engine unchanged.

## Decision boundary and policy

`chooseDominoBotAction` receives the acting seat's hand, the public board and ends, difficulty, actor and mode, public hand counts, public event history, and the public tranque rule. The `botAction` wrapper does not pass the seed, stock, or another seat's hand. The chooser estimates unseen tiles by removing only its own hand and public board from the double-six set. Pass history constrains hypothetical hands only within the current round; if the retained log has dropped `round-start`, the current board's first placement sequence supplies the boundary. The same filter protects ally-play signals from the prior round.

Easy takes a hand-out and otherwise sheds pips with light hand-continuity weighting. Normal also sheds pips, while rewarding tiles that keep both ends connected and discouraging stranded ends. Hard starts with those public utility signals, considers public pass voids, seat counts, opponent and teammate relationships, and evaluates the top three legal candidates through 16 deterministic, public-information sampled deals. For each sample it uses the engine's pure `play` transition through terminal hand-out or blocked scoring, bounded at 60 actions. Other seats use the normal hand-only utility during the rollout. Samples are built with at most 64 randomized assignment attempts each; unsatisfiable samples are skipped and scores average only valid samples. Stable action order breaks ties.

The simulations do not inspect or receive actual opponent hands, stock allocation, engine seed, or random state. The hypothetical hands come from the public unknown-tile pool, public counts, and current-round pass constraints. The existing `play` transition remains the scoring and termination authority. Four-seat mapping follows the engine: `partners` pairs p1+b1 and p2+b2; `humans-vs-bots` pairs p1+p2 and b1+b2.

## Paired benchmark

The reproducible harness is [benchmark-domino-ai.mjs](../../scripts/benchmark-domino-ai.mjs). It builds the chooser and rules from the repository, uses same-seed seat/team swaps, validates choices against engine player views, and checks terminal results through the engine transition. The old normal and hard policies are frozen in the script. Four-seat comparisons use an in-memory-only export of the existing pure transition; no production export is added. Raw summaries, without per-hand data, are retained in [dev-1-100.json](../screenshots/live-play-2026-10-11/ai-benchmarks/dev-1-100.json) and [holdout-2001-2200.json](../screenshots/live-play-2026-10-11/ai-benchmarks/holdout-2001-2200.json).

| Paired comparison | Development seeds 1–100 | Independent holdout 2001–2200 |
| --- | ---: | ---: |
| Normal vs frozen old normal, synthetic 1v1 | 105–90–5 | 208–179–13 |
| Hard vs frozen old hard, synthetic 1v1 | 103–91–6 | 198–186–16 |
| Hard vs frozen old normal, synthetic 1v1 | 112–83–5 | 204–180–16 |
| Hard vs new normal, synthetic 1v1 | 98–98–4 | 199–188–13 |
| Hard vs frozen old hard, humans-vs-bots | 116–81–3 | 227–160–13 |
| Hard vs frozen old hard, partners | 132–65–3 | 230–159–11 |
| Hard vs new normal, humans-vs-bots | 121–72–7 | 236–154–10 |
| Hard vs new normal, partners | 125–72–3 | 255–139–6 |

Each row lists candidate wins–opponent wins–draws. For holdout, hard won 60.51% of decisive humans-vs-bots matches and 64.72% of decisive partners matches against the new normal chooser. In the current product, the useful difficulty separation is those two four-seat modes. The 1v1 rows are synthetic chooser comparisons only; they do not imply a one-versus-one bot is available.

The holdout hard chooser averaged 0.92 ms per call in humans-vs-bots and 0.95 ms in partners. The largest observed hard-call time was 32.31 ms in the partners-versus-normal comparison; the other 4-seat hard comparison maxima were 5.87 ms and 9.92 ms against old hard. These are host measurements, not an edge-runtime or browser latency guarantee. The harness also completed 200 engine-runner self-play hands per four-seat mode and difficulty without an illegal chooser action or a nonterminal hand within its action bound. Its chooser timing samples for those runs are human-seat decisions; automatic bot execution is covered by termination and legality, not by that timing field.

The results support a measured improvement in both existing bot modes and a clear hard-over-normal difference in the paired synthetic team matches. They do not establish a win rate against human players. The simulated seats use the normal utility policy, and real players may choose differently.

## Verification and release boundary

The engine tests pass 27/27, including immediate hand-out at all difficulties, no-legal-move pass behavior, orientation-sensitive endpoint scoring, current-round pass inference, stale-round exclusion, both team maps, chooser input privacy, existing round/bonus/match rules, and bounded public logs. Strict TypeScript validation passed for the candidate engine and shared types. Independent static review also confirmed the sampled rollout, public input boundary, and parity of the in-memory transition with the normal engine action path in both four-seat modes.

The measured source lives in `src/games/domino.ts`; the generated authority bundle remains the responsibility of the root integration/release check. No commit or push is part of this change.
