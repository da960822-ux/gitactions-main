# Actual in-game review — 2026-10-17

## Scope and environment

Reviewed `games/product-quality-refine-20261012` at remote tip
`438f50d4506c5e6197813c7a5ec055a973a9a7e6`, in the separate local branch
`fix/actual-ingame-ui-review-20261017`. The original `/workspace/gitactions-main`
checkout remained on `work` at `b37c10b`; no remote push or deployment was made.

All gameplay evidence in this review came from the actual `/play` lobby and
`/room/:id` application, including room creation, joining in separate browser
contexts, game consent, and rendered legal-action buttons. No hand, board, score,
deck, seed, or view injection was used. The earlier standalone card-component
examples are **not** gameplay evidence for this review.

The existing `scripts/online-fixture.mjs` served real repository migrations,
SQL/RLS, and the built game authority at `127.0.0.1:54329`. Vite used that service
at `127.0.0.1:5219`. This fixture does **not** implement production Supabase Auth,
PostgREST, or Realtime. Independent seats exchanged accepted actions and matching
public snapshots; explicit `client.reconnectRoom()` calls refreshed read state.
The visible reconnect banner and WebSocket 404s therefore remain in captures.
They were not hidden or presented as production connection success. No production
Supabase credentials were present in this checkout (only `.env.example`).

Desktop browser viewport: 1440×900; DaVinci evidence used device scale factor 2.
Mobile viewport: 390×844. The existing application policy permits only Jaipur
on mobile. The other seven actual room routes show `DesktopGameNotice`; these
guards were not bypassed or removed. Browser emulation is not physical-device,
speaker, touchscreen, or screen-reader verification.

## Confirmed defects and fixes

| Severity | Reproduction in the actual application | Fix and verification |
| --- | --- | --- |
| P2 — DaVinci portrait overflows its tile | Start a natural game with a joker, place it into the hand. The portrait enters the first 18px grid row and protrudes above the tile. | Give the value, color, and revealed-state elements explicit grid rows. Ordinary numbers and portraits share the same central value row. Placement preview remains separate. |
| P2 — DaVinci face is already cropped in the asset | In the actual hand, the black portrait has a straight cut through the left face; the white portrait also has a hard source boundary. `object-fit: contain` alone cannot recover missing pixels. | Re-extract both individual portraits from the existing approved 1254×1254 RGBA couple cutout. A source-shaped alpha boundary excludes the other face; original RGB pixels and likeness are unchanged. `scripts/crop-joker-portraits.py` reproduces and checks the crops, masks, hashes, dimensions, and visible feature regions. Full couple paintings are **not** newly made the default. |
| P2 — overflowing DaVinci placement row can lose its first gap | A later joker draw with a larger hand makes the centered gap row wider than its scrollport. The first gap can be outside the reachable start edge. | Use `safe center` so wide rows align to their scrollable start. Actual subsequent joker placement succeeded in the full-match checks. |
| P2 — DaVinci terminal tools still describe an opponent turn | Finish a real match as the waiting seat. The phase bar says result while the tool panel still says the opponent is playing. | Terminal tool panels show the existing localized result label/message and omit waiting/guessing tools. Added a regression test for both locales and both waiting/guess phase views. |
| P2 — Jaipur mobile sale controls separated from selected cards | At 390×844 choose sell and a good. The amount/confirmation tray sits after the market action tabs, outside the player-hand section. | Move the existing mobile tray directly after the hand cards; preserve desktop preview and existing strings. Both seats completed actual mobile sale/cancel flows, with ≥44px controls and no horizontal page overflow. |
| P2 — Jaipur mobile exchange confirmation becomes narrow | At 390×844 select an unequal exchange. The confirmation label becomes a narrow vertical stack. | Let that confirmation occupy a full-width row and wrap normally. Actual unequal-exchange UI still explains the mismatch and blocks commit. |
| P3 — Splendor desktop cost numbers shrink | At 1440×900 the fine-pointer rule reduces all 12 visible market-card cost values to 12px. | Restore 13px cost chips and bold values. Actual visible market cards passed size, containment, and readability checks; full match and replay passed afterward. |

Game rules, deck composition, numerical costs, scoring, approved noble mappings,
and landing copy/translations were not redesigned. The default black joker is
Yeonseok, the default white joker is Lisbeth. Approved full couple paintings
remain separate optional assets.

## Actual gameplay coverage

| Game | Observed states and outcome | Remaining limits |
| --- | --- | --- |
| DaVinci Code | Initial setup, both default portraits, drawing, placement, hidden opponent backs, selected targets, number/joker guesses, wrong/correct reveals, long scrollable racks, result, and dual-consent replay. Final portrait run: 61 UI actions, p1 win, 94 loaded/contained portrait measurements, fresh setup after both accept. | Mobile play blocked by existing policy. Natural random deals mean this is representative coverage, not every possible hand/animation. |
| Catchmind | Two contexts, category/topic selection, drawing and paired stroke readback, Korean/Spanish guesses, deadlines, two actual 30-second timeouts, draw result, and dual-consent replay with cleared scores. | Production translation service/Realtime and physical input latency unverified. |
| Domino | Full blocked game, scoring, selection/confirm/cancel/focus and duplicate protection, hidden-opponent privacy, result and replay. Final run: 13 actions, 118 checks; p1 wins 13–24 remaining pips. | Mobile play blocked by policy; not every long-chain arrangement. |
| Jaipur | Mobile sale and unequal exchange, resource/bank clarity, cancel, real sales/bonus notices, multi-round match, result and replay. Final run: 85 moves, 907 checks; p1 wins 2–0, replay resets round wins and result. | Physical phone/touch and every possible rejected server response unverified. |
| Splendor | 56-action full match, 661 checks; p1 wins 18–11 after 28 turns each. Take/reserve/gold/discount/return/noble visit/final turn, selection/cancel/focus/duplicate checks and dual-consent replay passed. All n0–n9 nobles actually appeared across 14 fresh lobby starts with matching loaded art. n0 doctor and n1 hanbok appeared in actual UI. | Third-reserve limit and choosing among multiple eligible nobles were not naturally reached. Own-reserved preview was checked in a separate actual-room focused run. Mobile blocked by policy. |
| Minhwatu | Real hand/table clicks, captures, hidden opponent cards, scores, full 20-action game, result, and dual-consent replay with fresh hands/table. Result p2 175–95. | The hand extends beyond a 900px viewport but is reachable by ordinary page scroll: after y=206, all eight visible hand buttons were enabled and passed center hit tests; no clipped ancestor was found. Random duplicate stock-target branch and physical audio unverified. Mobile blocked by policy. |
| Marble | Actual 40-space board, all seven pawn selections across the two seats, correct loaded premium art, visible 36×46 markers, two natural turns and distinct positions. Lisyeon's legacy engine ID is `robot`; its actual artwork is the approved rabbit and is not an eighth pawn. | Two separate actual UI matches reached the natural 120-turn asset limit: 310 actions, p1 3700–3230; then 319 actions, p1 3330–3300. In the second match, one replay request preserved both results, and the second consent reset both views to roll / zero turns. The existing `.match-replay` control worked; no extra replay UI was added. Mobile blocked by policy; full ownership/build/debt strategy coverage is not claimed. |
| Music Talk Talk | Actual embedded Ruffle/SWF room player: title, volume/menu, ready screen, falling-arrow level 1, keyboard input and Game Over with score 50. SWF/Ruffle assets loaded. | Original game content/score completion beyond that result and physical audio unverified. Mobile blocked by policy. |

## Technical gates and evidence

- `npm test -- --no-file-parallelism --maxWorkers=2`: 57 files / 507 tests passed.
  The first fully parallel run had two PGlite setup timeouts and one card-map
  import timeout under concurrent browser/build load; no failing assertion was
  hidden by changing a test timeout or application logic.
- `npm run build`: passed. Vite retains its existing >500kB chunk advisory.
- `python scripts/crop-joker-portraits.py`: both exact asset hashes/dimensions and
  source RGB checks passed. This is an asset-integrity gate, not visual approval.
- `scripts/verify-davinci-live-ui.mjs`: real two-context lobby/play regression,
  with explicit read refresh, privacy/portrait containment, terminal tools and
  dual-consent replay assertions. `DAVINCI_QA_URL` and
  `PLAYWRIGHT_ARTIFACT_DIR` select the server/output. Browser configuration uses
  existing `PLAYWRIGHT_MODULE` / `PLAYWRIGHT_EXECUTABLE_PATH` support.
- `scripts/play-two-player-qa.mjs`: real Domino/Jaipur/Splendor UI checks;
  extended localized mismatch recognition, mobile exchange geometry,
  console/network classification, and optional full Jaipur match coverage.

Raw artifacts and detailed reports are under `/workspace/review-output/`:
`davinci-final-assets`, `domino-jaipur`, `splendor`, `other-games`, and `marble`.
Screenshots were opened directly. Actual Jaipur desktop/mobile action clips were
recorded with CDP screencast and encoded to H.264/yuv420p MP4; no invented action,
effect, or animation was composited. Library delivery IDs are in the separate
delivery index, including the rejected first portrait fix preserved by version
history and the updated full-face actual-room capture.

## Branch integration and release limits

The latest landing branch is separately `redesign/across-the-distance` at
`24a6ec69eea712f632ee80e8f3cae863d38c769f`. It shares the game-link concept but
does **not** contain this game branch's complete implementation: before this
review, the app/core/games/styles trees differed across 77 files. Testing this
game branch does not prove that the currently shown landing/deployment serves
these exact game assets or fixes. No merge, origin push, or deployment was done.

Production Realtime/authentication, recovery on real devices, physical audio,
and the explicitly unreached game states above remain unverified. The reconnect
banner in evidence is a disclosed fixture limitation, not a normal-service
success claim. Technical pass and direct visual inspection are separate gates;
neither alone establishes readiness for release.
