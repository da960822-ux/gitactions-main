# v53 integration QA — 2026-10-28

## Automated evidence
- Before the coupon-only summary fix: full `npm test` passed **178 files / 2,281 tests**; `npx tsc -b` exited 0. Logs: `/workspace/shared/v53-integrated-final-tests.log`, `/workspace/shared/v53-integrated-final-types.log`.
- After the coupon-only summary fix: `npx vitest run src/app/MarbleOwnershipDecision.test.tsx` passed **1 file / 7 tests**; `npx tsc -b` exited 0. Logs: `/workspace/shared/v53-coupon-summary-tests.log`, `/workspace/shared/v53-coupon-summary-types.log`.
- Guide checks cover 23 cards for event v4 versus 16 for saved v3, and bilingual/team tutorial tourism exceptions gated by event version.
- After final image integration and production freeze: full `npm test` passed **180 files / 2,287 tests**, exit 0 (69.80s); `npx tsc -b` exited 0. Logs: `/workspace/shared/v53-final-assets-tests.log`, `/workspace/shared/v53-final-assets-types.log`. This supersedes the earlier automated integration counts; it does not expand browser coverage.

## Browser evidence reported by root
These observations were performed by root, not independently repeated by this document's author.
- Tourist coupon acquisition charged 150: buyer cash 10,000 → 9,850; former owner 3,000 → 3,150; island ownership transferred and coupon removed.
- Root found the coupon-only primary summary incorrectly showing 300 / 9,700. After the fix, Korean and four-player Spanish summaries showed 150 / 9,850.
- Payment crisis: cash 0, obligation 500; borrowing 600 settled the obligation, leaving cash 100 and loan 660. Loan control remained visible with sales open.
- Selecting hotel also selected villa/building: total 324, rental 420. Native browser click on the construction title followed by `qa53.pressKey(null, 'space')` built once: cash 10,000 → 9,676 and NYC had villa/building/hotel. An earlier DOM `body.press` attempt failed as an automation operation; it is not gameplay failure evidence.
- At 1180 × 757, the persistent finance control was visible top-right and central construction UI fit. This does not establish every viewport or keyboard case; root reports 58 existing unit tests cover keyboard guards.

- Splendor: root observed four-player cards/nobles rendering with hashed small assets. The all-106 fixture contained 106 SVG images; screenshots inspected first-tier, mid-tier 2/3, and last-tier 3/all-nobles regions (including six extra nobles) without blank images in those regions. This is not individual pixel inspection of all 106 assets or cold-load timing. Root had separately verified full-size original detail in two-player mode.

## Limits
No production two-human session was run. No blanket multiplayer, keyboard, viewport, audible-playback, or final-asset visual pass is claimed. This QA work did not publish or commit.
