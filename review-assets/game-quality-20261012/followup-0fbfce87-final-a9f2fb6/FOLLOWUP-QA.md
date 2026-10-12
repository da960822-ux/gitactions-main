# Follow-up desktop game QA

This folder records the current-source two-player UI pass and the Splendor readability follow-up.

## Source and verification

- Gameplay captures (Marble, Da Vinci Code, Jaipur, Domino, Minhwatu): source 0fbfce87a6b7b69fd27479e25fe6f62d71941d29.
- Splendor captures: the same source plus the desktop-only badge layout change committed as a9f2fb63b52a0a43006a832fa73411fb0641d902.
- Final code branch: games/product-quality-refine-20261012.
- npm test: 57 files, 506 tests passed.
- npm run build: passed; Vite reports the existing 524.06 kB PlayApp chunk-size warning.
- All multiplayer checks used two separate browser contexts (Korean p1 / Spanish p2) against the local SQL fixture. Cross-seat updates and reconnect checks used explicit snapshot refresh. The fixture has no Supabase Realtime, so production realtime/network reconnect is unverified.

## Results

- **Marble:** Legal UI purchase and stage 1→2→3 construction captured at 1366×768 and 1440×900 in both locales. A separate two-context page-reload check restored seats and matched the public initial board fields after fixture refresh. A full match, terminal state, and replay were not attempted; no artificial state seeding was used.
- **Da Vinci Code:** 39 legal UI actions reached a natural p2 win; reload restored the seat and phase; both players consented to replay and saw a fresh setup. Hidden opposing tile values and portrait URLs stayed private. The white indoor Joker was checked in the terminal run; the black waterfront Joker was checked in a separate bounded natural run.
- **Jaipur:** 87 legal moves reached a 2–0 p1 match result. Reload and mutual replay returned both contexts to a fresh round.
- **Domino:** 16 legal actions reached a natural terminal result; both contexts saw the result and completed replay consent into a fresh game. The report records 139 assertions.
- **Minhwatu:** 20 legal actions reached a natural 245–125 p2 win; p2 reload restored the saved game, and mutual replay created a fresh game.
- **Catchmind:** The earlier current-source two-context evidence is already in [refine-0fbfce87/catchmind-current-run](../refine-0fbfce87/catchmind-current-run/). It covers Korean/Spanish player views, simultaneous correct-answer handling, hidden guesser hint, drawing sync, timeout/deadline reload, late-answer rejection, and replay consent.
- **Splendor:** The updated screenshots show the +1 bonus and points in visibly separate stacked badges at desktop sizes; artwork and type size remain unchanged. Two-seat UI play checked the 10-gem return plan, hidden reservations, a noble purchase, a natural 15–6 terminal result, and replay reset.

## Evidence map

Jaipur mobile-sale and interrupted harness captures are intentionally omitted; only the successful desktop run is included. Existing Catchmind files are linked above rather than duplicated.

summary-0fbfce87.json records the primary run scope and its limitations. Some special game branches were not reached; this is a bounded QA pass, not exhaustive rules or translation coverage.
