# Digital board-game polish

The home and private two-player rules stay intact. Build the common design system first, then apply each game's own material, interactions and events. No new services or paid runtime are required.

## Shared contract

`src/styles/game-design-system.css` defines room-scoped app/board semantic colors, a 4/8/12/16/24/32px spacing scale, tabular scores, visible keyboard focus and 120/240/420ms motion tokens. Existing game assets and felt/paper materials remain game-owned. Body/action labels use DM Sans at 14px or larger; secondary guidance uses 12px or larger, excluding actual card printing. Status always has a text label; color is supplemental.

Motion responds to a real change, never every render. Prefer transform/opacity and limited node counts, respect reduced motion, avoid continuous React animation ticks and block no legal action for a decorative transition. Action pending/error feedback must reflect the server outcome. Sounds must follow confirmed actions or authoritative public-view changes, never invent success.

`GameValue` displays a real public numeric value and its signed change, resets its baseline on player/game context changes, and never derives hidden information. Shared event observation consumes only the player view. Each game can provide a contextual event label, but secret guesses, unexposed cards and answers stay private.

The audio controller plays game-specific effects only, with each game's enable/volume preferences saved independently. No app BGM or ambient music is added. Audio starts only on a gesture. Hidden tabs stop sound; unmount releases nodes/listeners. App-generated effects are suppressed during Rhythm, whose embedded soundtrack remains owned by its original player. No pretend volume control for that soundtrack.

## Per-game implementation matrix

| Game | Visual | UX | Event direction | Sound | Additional local feature | Test points |
| --- | --- | --- | --- | --- | --- | --- |
| Da Vinci | Ivory/obsidian tiles, clear revealed state | Target + exact number choice | Draw, public reveal, wrong-guess response, turn and result | Confirmed draw; guess itself is silent, then a public wrong/correct reveal or result cue | Visible target selection | Hidden value never rendered, legal guesses only, selected target reset |
| Catchmind | Bright paper canvas, organized tool shelf | Clear roles, selected tool/color/width | Countdown, public guess/score, phase and result changes | Drawing and timer ticks stay silent; correct score, turn, and result transitions cue | Tool preview and accessible controls | Real drawing, role secrecy, exact bilingual answer, timer and reduced motion |
| Domino | Felt, ivory pieces, highlighted open ends | Selected piece and legal left/right placement | Piece arrival, pass/turn change and result | Confirmed placement, then public turn/result cues; pass has no direct action cue | Hand pip subtotal | Orientation/ends, disabled moves, team score/result, long chain |
| Jaipur | Warm market, real goods artwork | Balanced trade counts and clear sell action | Market refill, sale score and round | Confirmed take and sell actions; public turn/result transitions | Exchange progress | Hand limit, trade validity, bonuses/round changes |
| Splendor | Gem bank, readable mapped card art | Token selection and affordability | Purchase/reserve/noble and prestige | Confirmed token take, reserve, purchase, and noble choice; public turn/result transitions | Purchase cost breakdown | Bonus/gold costs, token returns, nobles, final-round accuracy |
| Minhwatu | Large real Hwatu faces on green felt | Hand selection previews matching month | Capture tray and visible score change | Confirmed card draw/play/capture; public turn/result transitions | Captured category totals | Duplicate-month targets, draw capture, true bonus-adjusted score |
| Marble | Existing 40-space board with owner/building marks | Explicit phase/landing decision | Dice, movement, rent/card/build/finish | Confirmed roll, transaction, or build; new public event, turn, and result transitions | Contextual transaction readout | Island/train/cards, duplicate animation prevention, rapid turn updates |
| Rhythm | Concert-like frame around original player | Keyboard focus, fullscreen and loading recovery | Ready/error and user key feedback | Original embedded music only; app SFX are suppressed | Local focus/control help | Load/retry/unmount, keyboard never intercepted, fullscreen errors |

Implementers append actual shipped behavior and verification below; the table is a contract, not a claim that every item is already implemented.

Catchmind’s current interaction and privacy implementation is documented in [GAME-POLISH-CATCHMIND.md](GAME-POLISH-CATCHMIND.md). The final test/build and browser evidence are recorded in [VERIFICATION.md](VERIFICATION.md). Catchmind’s four component tests cover role/phase labels, answer and hint privacy, and result-state copy. Minhwatu’s three SSR tests cover caller-only hand values, matching months, yaku score breakdowns, and active-seat capture actions.

## Completed browser evidence

- **TableGames, three games:** Separate KO-host and Dominican-Spanish-guest fixture sessions completed a Jaipur 2-for-2 exchange, keyboard-selected Splendor three-color take, and Da Vinci draw plus keyboard target/guess. The screenshot and room/error/privacy report is [tables-browser.json](../output/playwright/game-polish/tables-browser.json), with captures at `/mnt/data/game-polish-{jaipur,splendor,davinci}-{ko,es}.png`. All six views had no horizontal overflow at 1440×900. No page errors or unexpected console errors occurred; the fixture's absent Realtime service returned expected WebSocket 404s, so the peer was refreshed to fetch each committed snapshot.
- **Sound settings and cue controller:** [sfx-ui-browser.json](../output/playwright/game-polish/sfx-ui-browser.json) records 17/17 passing checks in an isolated Chromium component harness, including seven off-by-default profiles, explicit gesture unlock, per-game preferences, cue graphs, Rhythm suppression, and teardown. No browser errors occurred.
- **Catchmind:** [catchmind-browser.json](../output/playwright/game-polish/catchmind-browser.json) records 13/13 passing checks in two independent fixture contexts: KO drawer / Spanish guesser, synchronized drawing, no repaint on timer ticks, answer secrecy through wrong guesses, and public +3/+1 correct-answer scoring. No page errors occurred. The fixture has no Realtime, so the Spanish canvas was refreshed after committed drawing updates.

These browser runs use a local SQL authority fixture, not deployed Supabase Auth/PostgREST/Realtime. They verify the browser interface and fixture action path, not production transport or automatic Realtime delivery.

## Three-game quality revision — 2026-10-11

The user requested commercial-quality interaction for Domino, Jaipur and Splendor, with one agent auditing each game, then requested installation and application of Awesome GameDev Agent Skills. The revised [GAME-QUALITY-PLAN.md](GAME-QUALITY-PLAN.md) connects each proposal to installed UI/input/feel/art/audio/card-resolution/profiling guidance and states implementation and acceptance gates. These are planned improvements; the older browser evidence above is retained as historical evidence and does not certify the new proposals. Eight-game scope, rule contracts, private data and free-tier constraints remain in force.
