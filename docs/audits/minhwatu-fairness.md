# Minhwatu fairness QA (synthetic data)

Scope: Minhwatu engine baseline at `8d8697e` versus this QA branch, rebased onto GitHub `main` at `f246dec`. The intervening `main` commits changed UI files, not the engine or AI policy. These runs do not reconstruct a reported user's game. No user data, credentials, or production telemetry are included.

## Reproduce

From the repository root, install the locked dependencies, then bundle the audit once:

```sh
npm ci
./node_modules/.bin/esbuild scripts/audit-minhwatu-fairness.ts --bundle --platform=node --format=esm --outfile=/tmp/minhwatu-fairness-audit.mjs
node /tmp/minhwatu-fairness-audit.mjs --fixed-starter > docs/audits/minhwatu-fairness-main.json
node /tmp/minhwatu-fairness-audit.mjs > docs/audits/minhwatu-fairness-qa.json
./node_modules/.bin/esbuild scripts/audit-minhwatu-seed-correlation.ts --bundle --platform=node --format=esm --outfile=/tmp/minhwatu-seed-correlation.mjs
node /tmp/minhwatu-seed-correlation.mjs > docs/audits/minhwatu-seed-correlation.json
```

`--fixed-starter` reproduces the old `p1`-first rule while using the same QA engine code for everything else. Each of 1,000 distinct, repeatable SHA-256-derived seeds plays a complete match under both uniform legal-action choice and the same Minhwatu AI policy in every seat. Hand-play matching and random stock-draw matching have separate numerators and denominators. The difference confidence intervals use one paired rate difference per match. Every transition asserts 48 unique card IDs, no loss or duplication, legal actions, and unchanged prior state. Hidden hand/stock/seed swaps assert both the public view and the AI choice remain unchanged under identical policy randomness.

The QA change rotates the first seat from the match seed's high bits. It does not change the deal, score, matching rules, AI policy, or draw order. The synthetic simulation puts the 2-player `p1` minus `p2` stock-match difference at −2.89 percentage points (95% paired interval −4.20 to −1.58) with fixed `p1` first under identical AI policies; with rotated start it is +0.30 (−1.01 to +1.61). In 4-player, `p1` minus the other three seats' mean is −6.07 (−7.69 to −4.44), then +0.79 (−0.76 to +2.34). See the JSON files for all raw counts, uniform-policy controls, and perfect-draw-match counts.

The 20,000-seed correlation check compares the high-bit bucket to the first stock card's month and to the chosen starter's initial hand/table matching opportunity. It did not detect a material association: the chosen starter's opening-match rate minus the seat average was −0.11 percentage points (95% interval −0.27 to +0.04) in 2-player and −0.25 (−0.51 to +0.02) in 4-player. This is an empirical check, not a proof of independence.

## Browser check

With a local Vite server on port 5197 and Chromium available:

```sh
npm run dev -- --host 127.0.0.1 --port 5197
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_NO_SANDBOX=1 node scripts/audit-minhwatu-browser.mjs
```

The Playwright check uses synthetic seeds and the real local room UI. It checks AI-first render, first automatic AI action, presentation animation and card flight, a 4-player pending draw-choice continuation, and the result-screen replay button. To reach the result screen quickly, it completes the synthetic engine state in the browser and then clicks the real replay control. The report is `minhwatu-browser-qa.json`; it contains no screenshots or personal data.

## Change scope and limits

The implementation changes initial `turn` selection in the shared 2-player and 4-player Minhwatu engines, so both local AI and two-human 2-player matches may now start from another seat. It uses bits of the fresh 32-bit match seed already produced at game start and replay. Existing match states retain their stored turn. This branch has not been merged or deployed. Browser testing used the local Vite app; deployed Supabase and any specific reported match were not tested.
