# Confirmed Marble motion restoration

Scope: shared 2p/4p tile effects and original airline SVG, not new character-plane assets (requires user review).

Root causes: construction dust selectors targeted only the retired 40-cell geometry; modifier application receipts were absent from effect mapping; airline overlay was removed and its older implementation required `lastMove.from === 30`. Latest move alone also cannot represent a chained card journey.

Changes: confirmed build/landmark receipt drives finite rise+dust on either board; confirmed festival/blackout resolutions map to confetti/single electric fade; upright persistent modifier labels remain derived from engine state. Catch-up snapshots are marked cosmetic-silent. New move receipts carry source through the engine owner's change; original SVG and seat livery map now run only for fresh train receipts to any tile. Original hashed cameo preload unchanged.

Managed CUA at 127.0.0.1:4173/__qa_marble.html, actual engine actions (no shell browser):
- 2p and 4p: selected villa and confirmed payment36 in New York. Consecutive screenshots showed dust cloud and structure transition on New York, not an isolated effect playground. DOM burst bound to actual tile at x133/y283,105×67 in 2p viewport.
- 4p: selected/confirmed New York landmark180. Screenshots showed Statue of Liberty rising on tile and original Lisbeth completion cameo.
- 2p Gwangju and 4p Seoul festival: selected target and applied. Particles observed on tile; upright `축제 ×2` persisted. After completion DOM reported zero bursts, zero flights, marker retained.
- 4p London blackout: applied targeted card. Consecutive screenshots showed darkened London then one yellow bolt, with no repeated strobe.
- 2p and 4p travel→island: actual destination+confirm. Restored plane was observed; 4p screenshot read `아시아나 · 둘의 상상 여행` and `세계여행 → 무인도`. Projection skew found in first capture was corrected; overlay raised above ownership ribbons.
- Managed screenshot output is one captured frame behind action execution: three consecutive captures were used to observe before/activation/settled rather than claiming the first stale image proved success.

Checks: TypeScript passed; 5 focused suites77 tests passed before final freshness gate addition; final effects/engine-action tests17 passed after gate addition. Seven engine/lifecycle tests cover both engines ordinary→landmark, blocked/pending/no-effect exclusions, all special travel targets0/8/12/16/24/30, both airline mappings, KO/ES destination copy, mount/repeated/reset/catch-up event suppression. Existing effects/cameo tests remain passing.

Not checked: mobile, multiplayer transport reconnect in a live room, and OS-level reduced-motion UI replay. Reduced-motion media/query handling is retained, but visual QA used normal motion. No commit or deployment by this agent. Test-only __qa_marble fixture edits must stay out of publication.

## Approved character-plane follow-up (10:20 UTC)
User approved both preview scenes (`Sentinel_2287c2553448819199055459724e6365`, “응 좋아”). The earlier note about not integrating new images is superseded by this approval. Both source PNGs were visually inspected, optimized with installed Sharp to transparent 1100×619 WebP, and retained outside the site; shipped provenance is `public/images/marble/airline-characters.json` (Library IDs, original hashes, optimized hashes). Runtime Asiana/Lisbeth is 142,906 bytes; JetBlue/Yeonseok is 135,262 bytes. No mirrored lettering, no replacement logos. Existing actor/airline assignment remains p1/p3 Asiana and p2/p4 JetBlue.

Managed CUA tab13, 4173 actual-engine fixture: observed Asiana/Lisbeth p1 train→island and JetBlue/Yeonseok p2 train→island at 420px, face and brand legible, moving left-to-right above the board. Repeated JetBlue in 4p and visually confirmed the same scene/route. These were engine `choose-train` receipts, not a manually dispatched cosmetic. Early capture initially showed labels only during fade-in; subsequent native screenshots showed the full approved bitmap, so verification did not rely on loaded DOM alone. Both assets preload at mount; display waits for successful image load and cleans up after 2.8s or hidden/unmount/reset. Pointer events remain disabled.

Reduced-motion fresh contiguous receipt batches show one static scene; mount baselines, gaps, oversized catch-up and hidden batches remain suppressed. Unit checks cover those guards; OS reduced-motion mode was not visually toggled. TypeScript passed; focused Flight/ConfirmedEffects/EventEffects suite: 20 tests passed. No production deploy performed by this agent. Test-only fixture files must remain excluded from publication.
