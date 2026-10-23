# Splendor artwork and value readability follow-up

This review follows local commit `3972aa491520ac88fdc811e48e1fd11614dea927`
on `fix/actual-ingame-ui-review-20261017`. The reported apparent 3-versus-5
disagreement is a scan-font readability problem, not a confirmed rules mismatch.
The actual n0-room capture's first tier-3 card is `t3-16`, source `86.jpg`:
its printed point value is **5**, and its printed cost is white 3 / black 7.
The engine and adjacent UI show those same values.

## Complete source audit

All 90 development-card scans and 10 original noble scans were visually read.
An independent, static manual transcript was compared with `card-map.json`,
compiled canonical card data, and the loaded authority bundle. Noble requirements
were independently read from source and obtained from the authority's initial
states. All 100 rows match. n0/n1's approved runtime portraits contain no printed
numbers; their original scans 20001/20002 were checked separately.

The evidence package contains `manual-transcript.txt`, `printed-faces.json`,
`checklist-100.csv`, `checklist-100.json`, source-image SHA-256 hashes, contact
sheets, and the rebuild script. Printed values are read from the static transcript,
not populated from engine data. The rebuild computes each comparison.

## Changes

- P2 readability: scanned point/cost/bonus glyphs compete with the larger engine
  labels. A shared `SplendorArtwork` displays only the approved illustration:
  cards use source rectangle 85,90,165,260; printed nobles use 75,0,175,250.
  Personalized noble portraits retain their complete image. No source image,
  mapping, point, cost, requirement, deck, or rule was changed.
- The shared view covers the market, own reserve, selected-card/payment panel,
  acquired card, noble row, noble event, confirmed motion, and quick guide.
  A logical SVG clip rectangle prevents scanned glyphs leaking into `meet`
  letterboxing at other aspect ratios. A viewBox alone was insufficient.
- Engine points remain visible outside the 1200px fine-pointer layout. The
  narrow card grid now reserves space for the point label. Own reserved cards
  show their engine points, bonus, and cost even before opening the action panel;
  previous compact CSS hid those labels and relied on the scanned face.
- Existing accessible card names and guide descriptions remain. Opponent
  reserved contents remain private.

## Actual UI evidence and checks

Actual `/play` lobby creation, two independent seats, normal game consent, and
random fresh-room markets were used. No board/hand/score/seed injection or game
API writes were used to manufacture coverage. The final runtime report and
per-item screenshots identify every card and noble with its room and asset.
Sampling found 90/90 cards and 10/10 nobles across 90 random two-seat rooms.
A final pass revisited 22 sampled rooms through their normal authenticated routes:
90/90 rendered point/bonus/cost values and 10/10 noble requirements matched the
public snapshot, all 100 resources loaded with explicit clipping, and all 100
item bounds fit the 1440×900 viewport. Root opened the six actual-UI contact
sheets covering all 100 items. The final readback pass recorded no errors.

The before/after comparison uses actual room captures of the same `t3-16` card
in separate natural games; it is not a claim of an identical match state. The
original full before capture remains available. Source-only illustration contact
sheets are separately labeled and are not substituted for live UI evidence.

A focused actual room reserved a card and opened both market and own-reserved
payment panels. At 1024, 1200, 1440, and 1920px, all 12 market point/cost labels
and the reserved point/cost labels were visible with no horizontal page overflow.
These screens were opened directly, including the 1024px case that caught the
letterbox leak and the initially collapsing point column.

Validation: 58 test files / 509 tests passed, including all 90 engine-card render
checks and the noble/clip/accessibility regression tests. Production build passed
with the existing large-chunk advisory. Game engine and approved raster asset
diffs against `3972aa4` are empty.

One exploratory full-game driver accepted 42 UI actions / 535 checks, then timed
out after its selected-card panel disappeared before a purchase locator check.
It did not establish a new complete post-change match/replay. That interrupted
run is retained separately from the successful focused display checks and the
earlier baseline complete match; it is not reported as a complete pass.

## Other seven games

This follow-up rechecked source assets, UI callers, rules, and the earlier actual
gameplay captures. It did not repeat seven new full matches.

| Game | Semantic audit result |
| --- | --- |
| DaVinci | Joker portraits have no printed game values; numbered tiles and state labels derive from the live view. No additional conflicting value found. Prior portrait/rack/result fixes remain. |
| Jaipur | Decorative atlas has no baked values. Commodity values, pile counts and bonuses come from live data. Guide exchange/sale/hand-limit examples agree with the engine. |
| Domino | Pips are drawn from tile values; guide pips, 100/200 targets and blocked-pass thresholds agree with the current engine. |
| Catchmind | Guide's initial attempts 0 and width 6 agree with the default state. Live attempts and brush width are dynamic UI, distinct from the guide example. |
| Minhwatu | Card labels/points are model overlays, not baked SVG numbers. Guide categories, bonuses and scoring agree with current rules. |
| Marble | 24 landmark, four event and seven pawn illustrations have no baked gameplay prices/rents/amounts. Names/economics are engine text; the captured travel-cost 100 agrees with the cash change. Other event outcomes were reviewed statically. |
| Music Talk Talk | No wrapper/asset-label conflict observed. Internal scoring remains unverified because the game is an opaque SWF. |

## Limits

Capture URL: `http://127.0.0.1:5219/play` then actual `/room/:id` routes.
The local SQL/RLS/authority fixture at port 54329 does not implement production
Supabase Auth, PostgREST, or Realtime. Explicit read refresh was used. The
reconnecting banner and expected WebSocket 404s remain visible; operational
connection success is not claimed. Production credentials are unavailable.
Physical-device/audio verification and every gameplay branch remain unverified.
No push, merge into the separate landing branch, or deployment was performed.
