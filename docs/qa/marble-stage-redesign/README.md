# Marble stage QA

## Integrated 32 cell match

`capture-live32.mjs` starts new matches with the production two and four player engines (`createInitialState`), builds their public views with `getPlayerView`, renders the production React boards in Chromium, and submits clicked actions through `applyAction`. It places the initial state at named positions to reach otherwise rare purchase, rent, and build situations. The profile, legal actions, prices, public ownership masks, tolls, and resulting money are supplied by the engines. No visual fixture tile list is substituted. To reproduce: run `npm run dev -- --port 5174`, then `node docs/qa/marble-stage-redesign/capture-live32.mjs`. The script uses the installed `/usr/bin/chromium` and `/usr/bin/ffmpeg`; it does not download a browser.

The actual `/play?game=marble` navigation was also opened in Chromium without replacing the app root. Both AI choices started a 32 cell match with 500만 cash: [2p app stage](live-app-2p-1280x800.png), [4p app stage](live-app-4p-1280x800.png). Real app roll examples: [2p](live-app-2p-after-roll-1280x800.png), [4p](live-app-4p-after-roll-1280x800.png). Separate real app purchases updated cash and tile owner in [2p](live-app-2p-tourism-purchased-1280x800.png) and [4p](live-app-4p-purchased-1280x800.png). Live app dice outcomes vary; the controlled engine captures below cover repeatable specific decisions.

| PC check | Two player | Four player |
| --- | --- | --- |
| Live board, 1280 × 800 | [stage](live32-2p-roll-ko-1280x800.png) | [stage](live32-4p-roll-ko-1280x800.png) |
| Live board, 1440 × 900 | [stage](live32-2p-roll-ko-1440x900.png) | [stage](live32-4p-roll-ko-1440x900.png) |
| Seoul 50만 purchase, 500만 → 450만 | [before](live32-2p-purchase-ko-1280x800.png), [after](live32-2p-purchase-resolved-ko-1280x800.png) | [before](live32-4p-purchase-ko-1280x800.png), [after](live32-4p-purchase-resolved-ko-1280x800.png) |
| Independent villa/building/hotel choice; hotel submitted | [choices](live32-2p-build-ko-1280x800.png), [hotel owned](live32-2p-build-resolved-ko-1280x800.png) | [choices](live32-4p-build-ko-1280x800.png), [hotel owned](live32-4p-build-resolved-ko-1280x800.png) |
| Bare, villa, building, hotel, landmark together | [five public masks](live32-2p-levels-ko-1280x800.png) | [five public masks](live32-4p-levels-ko-1280x800.png) |
| Rent 55만, then recipient/cost/after cash takeover 136만 | [rent](live32-2p-rent-ko-1280x800.png), [takeover](live32-2p-takeover-ko-1280x800.png) | [rent](live32-4p-rent-ko-1280x800.png), [takeover](live32-4p-takeover-ko-1280x800.png) |
| Held rent pass: pay and use pass both visible, then pass consumed with cash unchanged | [choice](live32-2p-rent-pass-ko-1280x800.png), [resolved](live32-2p-rent-pass-resolved-ko-1280x800.png) | [choice](live32-4p-rent-pass-ko-1280x800.png), [resolved](live32-4p-rent-pass-resolved-ko-1280x800.png) |
| Olympics: choose owned city or tourism site; skip remains visible | [Dokdo selected](live32-2p-olympics-selected-ko-1280x800.png), [×2 host](live32-2p-olympics-resolved-ko-1280x800.png), [no property skip](live32-2p-olympics-empty-ko-1280x800.png) | [Dokdo selected](live32-4p-olympics-selected-ko-1280x800.png), [×2 host](live32-4p-olympics-resolved-ko-1280x800.png), [no property skip](live32-4p-olympics-empty-ko-1280x800.png) |
| Bank tourism purchase | [Dokdo](live32-2p-tourism-ko-1280x800.png) | [Dokdo](live32-4p-tourism-ko-1280x800.png) |
| Insufficient cash | [40만 vs 50만](live32-2p-shortfall-ko-1280x800.png) | [40만 vs 50만](live32-4p-shortfall-ko-1280x800.png) |
| Spanish purchase | [2p](live32-2p-purchase-es-1280x800.png) | [4p](live32-4p-purchase-es-1280x800.png) |

At 1280 × 800, the 2p board is 1040 × 610 px; 4p is 1040 × 568 px, leaving the collapsed secondary controls within the viewport. Every edge of each 9 × 9 grid uses the same tile cell width and height. The board shows the canonical 18 cities and five tourism sites, 500만 opening cash and exact city prices from the versioned profile. The board and stage derive the building image from the full public component mask, and each build button sends the selected legal structure. The purchase/build/takeover sheets show the resulting cash and toll values; declines and end turn stay visible alongside the primary choice. The same owned Bangkok lot renders cash 500만 and net assets 505만 in both modes; Bangkok plus Dokdo renders net assets 530만 in both modes. Screenshots of the resolved states retain the real engine cash/property result.

### Live movement

[Two player motion recording](live32-2p-motion-ko-1280x800.mp4) and [four player motion recording](live32-4p-motion-ko-1280x800.mp4) use Chromium screencast frames sampled during actual roll actions and encoded with the system ffmpeg. A browser mutation trace confirmed six successive cells (Bangkok, Bonus Game, Beijing, Dokdo, Taipei, Dubai) in both modes; six sampled moving pawn markers were visible within those cells. The [dice frame](live32-2p-motion-first-ko-1280x800.jpg), [2p pawn step](live32-2p-motion-step-ko-1280x800.jpg), [4p pawn step](live32-4p-motion-step-ko-1280x800.jpg), and [landed frame](live32-2p-motion-landed-ko-1280x800.jpg) distinguish roll, movement, and arrival. The header says “dice result” before the pawn starts moving and “traveling” during cell steps. This samples the specific seeded roll, not every possible event timing. Reduced motion turns off intermediate animation in the components; engine actions still reach the same result.

### Reference special tiles: current behavior

| Map cell | Two player | Four player | Reference fidelity |
| --- | --- | --- | --- |
| Fortune Card (three cells) | Landing logs an unresolved effect; no card is drawn or applied. | Same. | No operation pending verified card rules. |
| Bonus Game | Landing logs an unresolved effect; no game or payout starts. | Same. | No operation pending verified rules. |
| Olympics | Landing offers an owned city or tourism site, or skip. The chosen global host gets ×2 to ×5 toll; each new host replaces the previous one. | Same. | Implemented for the active 32 cell profile; the target, multiplier, and resulting toll appear in the public view. |
| World Travel | **Currently activates the older train rule**: a destination choice becomes available next turn with a 100 fare. | Logs an unresolved effect; no destination choice. | Modes differ. The two player train behavior is inherited, not verified for this reference map. |
| National Tax Office | Logs an unresolved effect and charges nothing. | Same. | No operation pending verified amount/rule. |
| Desert Island | Applies a three turn stop with doubles or a held escape pass. | Same. | The inherited 100 payment exit is disabled for the new profile; an inferred 50만 fee is kept as a disabled configuration pending evidence. Older saved games retain their former rule. |

The start pass bonus is currently 75만 in both engines and marked as an inferred reference amount. These unverified rules and no operation cells are **not** presented as complete reproduction of the historical game.

### Provenance and legacy

`classic-world-32-fixture.json` was exported from `marble-reference-profile.ts` at logic QA commit `993b587`. The older `classic32-*` images and `capture-classic32.mjs` are isolated component presentation fixtures; they are superseded by the live engine captures above. The earlier `2p-*` / `4p-*` screenshots are 40 cell saved-game visual baselines, not evidence of the new profile. Saved 40 cell games keep their own versioned route and economic display. The test suite now creates explicit saved-match states for their visual regression checks instead of assuming a new match still starts on 40 cells.
