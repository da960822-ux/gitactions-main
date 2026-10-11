# Splendor review B — detector, source, and browser evidence

This is the isolated Assessment B record. It contains mechanical and reproducible evidence only; the design assessment is kept separate for the parent synthesis. No application source was edited during this pass.

## Detector run

Command run once:

```sh
.agents/skills/impeccable/scripts/impeccable detect --json src/app/TableGames.tsx src/app/SplendorMotion.tsx src/app/SplendorQuickGuide.tsx
```

Exit code: `0`. Finding count: `0`. Complete stdout JSON:

```json
[]
```

The CLI detector reported no source findings and therefore no source-location false positives.

The browser detector was injected into the Splendor room rendered by the existing 5191 Vite server. The script loaded, emitted the console group `[impeccable] 62 anti-patterns found`, and inserted 62 overlay nodes. Observed overlay labels included `UNDERSIZED FUNCTIONAL TEXT`, `TINY BODY TEXT`, `LOW CONTRAST TEXT`, `WIDE LETTER SPACING ON BODY TEXT`, and `CREAM / BEIGE PALETTE`. This is a whole rendered-room scan: it includes the shared room shell and content outside the table, and the overlay has no source-file or line mapping. The cream-page finding is a page-level rule while the Splendor table itself is dark teal; it is not evidence that the table background is cream. The small-text warnings deserve visual review: several token names and secondary labels use 10px text, though primary card costs, payment cells, and buttons remain larger. No human-presented browser tab was available; the overlay and console were inspected in headless Chromium.

## Browser evidence

Used a fresh headless Chromium profile against `http://127.0.0.1:5191`, with the Splendor room entered through the local demo UI. At 1440×900 the captured table measured 1367×684.5px at x=29, y=206.2, ending at y=890.7; all 12 market cards and 3 nobles were present, with no horizontal document overflow. The screenshot used for visual inspection is `/tmp/splendor-b-selected.png`.

Selecting market card `t3-14` opened one action panel. The card is a tier-3, four-point red-bonus card with blue 3, green 6, and red 3 costs. The panel showed only those three nonzero cost rows, with cost, discount, colored payment, gold payment, and remaining shortage columns; with the initial empty hand and no matching bonuses, the displayed shortage summed to 12 and the buy action was disabled. The DOM exposed stable card ID, source zone, viewer, and version attributes for the visible market cards.

Resize samples from that same selected view showed no horizontal overflow at any tested width. At 1024×768 the board extended to y=1273.5; at 900×900 it extended to y=1850.6; at 390×844 it extended to y=2927.6. The lower-width layouts scroll vertically and become much taller. Splendor remains desktop-entry-only under the current product contract, so the 390px observation is layout stress evidence, not mobile-play support. This browser run did not exercise the 10-token return tray, compound noble award, end-game transition, keyboard-only purchase, reconnect race, or Spanish rendering; those rows below distinguish existing source/tests and prior records from this pass.

The app's local browser demo was used. The current container did not have the Playwright Node module or CLI installed, so scenario automation from `scripts/verify-splendor-quality.mjs` was not run in this pass. Chromium itself, the existing Vite server, the source detector, and the detector overlay all ran successfully.

## Requirement evidence matrix

| Splendor acceptance item | Source evidence | Test / existing evidence | B-pass outcome |
|---|---|---|---|
| Preserve canonical 90 card + 10 noble image mapping and correct art IDs | `src/app/TableGames.tsx:20-23,376-390`; `src/app/SplendorMotion.tsx:88-96`; `src/app/SplendorQuickGuide.tsx:5-6,27,35` | `src/app/TableGames.test.tsx` mapping test checks 90/10 unique IDs and files, `t1-01 → cards/01.jpg`, `n0 → nobles/20001.jpg`; `docs/GAME-QUALITY-SPLENDOR.md` records prior original-art hash comparison | Source/tests support mapping; browser screenshot showed face-up original art. Hashes were not recomputed in this pass. Commercial-use rights remain unresolved in `docs/ASSETS.md`. |
| One selected-card purchase/reserve panel; identity survives market movement only when the same ID remains | `src/app/TableGames.tsx:37-41,175-182,255-264,321`; card elements carry `data-card-id`, `data-source-zone`, `data-viewer`, `data-version` | `src/app/TableGames.test.tsx` checks stable-ID rebinding and rejects a moved/missing ID | Browser selected one market card and showed one panel; UI race/reorder was not simulated in this pass. |
| Explain actual cost, permanent discount, colored payment, gold payment, and color deficit | `src/app/TableGames.tsx:54-69,308-319` | `TableGames.test.tsx` cost-plan/payment-row case checks discount, gold allocation, deficit, and omission of zero-cost rows | Browser card `t3-14` preview showed blue 3 + green 6 + red 3 shortage, no zero-cost rows; buy disabled. Initial screenshot was Korean only. |
| Resolve purchase/reserve from current legal actions; reservation cap and gold semantics | `src/app/TableGames.tsx:50-52,262-264,321`; engine remains authority | `TableGames.test.tsx` asserts no reserve choices with 3 slots and the action/UI matching; `src/games/splendor.test.ts:45-60` checks gold reserve and no action after all slots fill | Code and regression coverage present. Gold-bank-empty and three-slot browser interaction not repeated in B. |
| Direct gem selection and exact legal return plan; total includes gold and cannot exceed 10 | `src/app/TableGames.tsx:32-48,161-188,250-254,330-341` | `TableGames.test.tsx` covers `10 + take − return`, exact selected return matching, rejection of wrong return plans, and 10-token boundary; `src/games/splendor.test.ts:25-38` checks valid legal returns | Net-zero arithmetic is covered by source/tests. The live B browser did not enter cap state; prior visual cap evidence is documented in `docs/GAME-QUALITY-SPLENDOR.md` and is not claimed as a new B capture. |
| Public rival bonuses and nobles; no hidden rival token counts, reserve faces, or deck data | Engine view contract in `src/games/splendor.ts`; `src/app/TableGames.tsx:152-153,344-368` renders own hand and public board fields | `src/games/splendor.test.ts:5-23,54-60` checks private hands/seed/reserve and public bonuses/counts; `TableGames.test.tsx` supplies a private opponent-card sentinel and asserts it is absent | Code/test evidence supports current privacy contract. B screenshot showed public score strip; a fresh DOM secret-data scan was not run. |
| Noble progress, choosing one among several, and a purchase that also awards a noble | `src/app/TableGames.tsx:308-319,358-368`; `deriveSplendorVisualEvent` at `102-147` compares owned nobles and card/bonus changes | `src/games/splendor.test.ts:39-43,62-80`; `TableGames.test.tsx:177-214` covers confirmed purchase/noble events and public selection state; existing `scripts/verify-splendor-quality.mjs` contains the compound purchase/noble scenario | Rule and event coverage exists. Compound browser state was not replayed in this B pass. |
| Fifteen-point end, equal-turn completion, result and tie handling | `src/app/TableGames.tsx:270-279,358-368`; rules remain in `src/games/splendor.ts` | `src/games/splendor.test.ts:42-52`; `src/app/TableGames.test.tsx:216-224` checks last-turn wording; `scripts/verify-splendor-quality.mjs` contains a 15-point purchase/noble case | Engine/UI tests cover equal turns; B did not replay the full result flow or tie-break. |
| Confirmed motion is version- and scope-bound; repeated/stale/hidden/reduced events do not replay flights | `src/app/SplendorMotion.tsx:16-17,20-105`; confirmed event receives snapshot version in `TableGames.tsx:195-205,370` | `src/app/SplendorMotion.test.ts` tests matching new version and rejects missing, stale, duplicate, hidden, and reduced flags | Guard tests exist; no live repeated-snapshot or queue race was executed in B. Existing implementation record reports prior coordinate/audio run in `docs/GAME-QUALITY-SPLENDOR.md`. |
| Shared online queue preserves version/idempotency and does not blindly replay stale actions | Shared behavior is in `src/core/client.ts`, outside the three UI targets | `src/core/client.online.test.ts` tests stale version refresh, request receipt ID reuse, lost response, reconnect, and stale snapshots | Source/test review only; no two-device Supabase run in B. |
| Korean/Spanish illustrated quick guide matches actual rules and exact card/noble examples | `src/app/SplendorQuickGuide.tsx:5-42`; example IDs resolve from `card-map.json` | `src/app/PlayApp.test.ts` checks three illustrated steps before collapsed detail; prior guide browser/rule review is recorded in `docs/GAME-QUALITY-SPLENDOR.md` | Sol's independent copy/art review and prior KO/ES guide browser matrix are documented there. Spanish visual pass was not repeated in B. |
| 1440×900 fit, resize, selected-payment readability | `src/styles/splendor-premium.css`; target markup in `TableGames.tsx` | Existing `scripts/verify-splendor-quality.mjs` asserts 12 cards, bounds, no horizontal overflow, payment font floor, and cap tray targets | Current B measured 1440×900, 1024×768, 900×900, 390×844. Only 1440 fit within viewport height; narrower heights require vertical scroll. No tested width caused horizontal overflow. |

## Scope and limitations

This is Assessment B, not the combined design verdict. The detector's CLI result is source-scoped and clean; the larger browser count is a rendered-page scan with shared shell content and no source attribution. Existing unit tests and earlier Splendor records are cited as existing evidence, not presented as rerun results. Not verified here: real two-device Supabase play, physical-device touch, actual speaker listening, current publisher comparison, browser 125% zoom, full Spanish table flow, cap-state/multiple-noble/end-game browser replay, and an online reconnect/queue race. The current CSS includes 10px secondary text and should be weighed against the visual inspection and the detector's text-size overlays.
