# Domino and Marble board polish

This pass changes presentation in `BoardGames.tsx` and `board-games.css`; both game engines and their action contracts stay unchanged.

| Game | Visual | Interaction | Event feedback | Sound | Additional feature | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| Domino | Selected playable tile and legal open end are emphasized; long chains scroll horizontally. | Select a hand tile before choosing its offered left/right placement; new placements bring the chain to the latest tile. | The latest placed tile is announced, the arrival is brief, and existing pass/result messages remain. | No board-local sound; shared room audio owns cues. | Hand pip totals remain visible; no reward score was added. | KO/ES rendering checks selected tile, legal end, scroll affordance and blocked lower-pip copy. Existing engine tests cover legal moves and winner. |
| Marble | Existing 40-space perimeter, art, event cards and movement effects remain. Property descriptions now identify ownership, purchase/rent values and villa/building/hotel tier. | Existing phase-generated actions remain authoritative; purchase copy includes the actual price. | Existing movement, dice, property and event motion is retained. `GameValue` shows authoritative cash changes; asset totals remain plain values to avoid a second transaction signal. | No board-local sound; shared room audio owns cues. | No rules or board features added. | KO/ES render checks cover 40 cells, city names, owner/rent/tier labels, event text and a cash decrease. Existing engine tests cover events, island, trains, fund, build and insolvency. |

The Domino variation remains the documented two-player double-six block game, with optional bot modes. A blocked game is won by the lower remaining pip total; this pass adds no positive-points reward. Marble remains the project's own house-rule game. Its classic-size adaptation and event behavior are unchanged.

These focused render checks do not replace the planned bilingual browser QA or verify sound-controller behavior. Sound cues are centralized in the room audio controller and are not duplicated by these board components.

Historical note (2026-10-11): the obsolete forwarding `BoardGames.tsx` and unused `board-games.css` were removed by the Ponytail cleanup. Active implementations are `DominoBoard.tsx` and `MarbleBoard.tsx` with their game-specific styles; historical checks were migrated to those components.
