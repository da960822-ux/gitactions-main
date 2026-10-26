# Marble revision 2: controlled state evidence

**Source:** QA branch `codex/marble-qa-rework`; screenshots are 1280×800 Chromium captures from the installed repository Playwright and `/usr/bin/chromium` 154. Local Vite server: `127.0.0.1:5174`. No runtime or browser was downloaded.

**Method:** `state-harness.html` mounts the production `MarbleBoard` and real `marbleEngine`. Each scenario creates a controlled `MarbleState`, then uses `getPlayerView` and, for actions, `applyAction`. This is a deterministic UI/engine state harness, not a random live-match recording; the displayed UI and reducer are real. Scenario values are listed below so reviewers can reproduce the screen.

## Captured cases

| Capture | Fixture / action | Observed result |
|---|---|---|
| `state-evidence/levels-0-3.png` | Route v3, own Gwangju at stage 0, New York at 1, Madrid at 2, San Juan at 3. | All four stages coexist on one board. Tile stage counters are visible and constructed cities use the city/building artwork. This verifies discrete level rendering, not that the smaller perimeter art is legible at every display size. |
| `state-evidence/insufficient-funds.png` | Cash 200; land on Seoul, price 560. | UI states a 360 shortfall, zero projected cash, and purchase refusal; passing remains available. No negative-cash purchase was offered. |
| `state-evidence/rent-before-payment.png`, `rent-transfer-event.png`, `rent-retained-receipt.png` | Cash 1,500; New York stage 1 owned by opponent; rent 120; activate pay-rent. | Payer moves to 1,380, receiver to 1,620; receipt identifies `나 → 상대`, amount 120 and resulting cash. Persistent receipt remains after the event display. Note: the HUD briefly renders the change as `1,380−120` / `1,620+120` while its delta is active; the after-state later settles to `1,380` / `1,620`. |
| `state-evidence/train-destination.png`, `train-arrival.png` | Station choice with 100 fare; choose Santiago (selector index 3). | Destination selector exposes city names and fare; selected route resolves to Santiago and its purchase decision. |
| `state-evidence/bankruptcy-confirmation.png` | Unpayable bank debt 5,000 with cash 0. | A separate confirmation asks whether to end the game by accepting bankruptcy; fixture remains in debt until confirmation. This verifies the confirmation prompt, not full match-end handling. |
| `state-evidence/sale-selected-city-1.png`, `sale-selected-city-4.png`, `sale-after-city-4.png` | Debt state with two valid owned-city sale offers; select tile 1 then tile 4 and activate the center action. | Actual browser interaction changes the center-stage city and primary sale action together: Gwangju/50 → Madrid/100. After activation, Madrid returns to the bank, Gwangju remains owned, and cash rises to 100; no page errors. |
| `state-evidence/keyboard-focus.png` | Keyboard skip link, then Enter. | Focus moves to the enabled central current-action button (`#mp-action-primary`). |
| `state-evidence/competing-actions-before.png`, `competing-actions-after.png` | Purchase decision; issue center buy and side decline in the same browser interaction batch. | One terminal phase transition to `main`, cash remains 1,500, no transaction event. No double purchase/payment is shown. This is a smoke check rather than a stress test of rapid repeated input. |
| `state-evidence/reduced-motion-after-roll.png` | Browser context with `prefers-reduced-motion: reduce`; roll once. | Action resolves with dice rolling false, pawn travel count 0 and tile animations 0; readable landing/event state remains. |

The harness reported no page errors or failed asset requests in these runs. Existing tests/build were reported passing at the preceding implementation checkpoint (TypeScript build, 108 test files / 992 tests, production build); those commands were not rerun for this documentation/evidence-only checkpoint.

## Limits / review notes

- Captures show stage 0–3, affordability, rent, train choice, bankruptcy confirmation, focus, competing actions, and reduced-motion end state. They do not establish smooth normal-motion timing or quality; no continuous video is included.
- The screenshots expose remaining presentation issues for review: the board still shares the screen with an information-dense right rail; settlement HUD temporarily concatenates cash and delta; the center action view can cover map scenery. State evidence should not be read as visual approval.
- The team route's dedicated 4-seat layout is evidenced separately in `evidence.md`; this harness exercises the shared 2-player board component and engine. It is not evidence of four-seat team event-ledger behavior.
