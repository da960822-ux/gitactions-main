# Splendor opponent details browser QA

## Result

Passed in local Chromium at 1440 × 1000 for 2-player and 4-player Splendor in Korean and Spanish. The test used the repository's installed Playwright 1.64.0 and `/usr/bin/chromium`; it downloaded or installed nothing. QA used the real React tables and CSS in an isolated Vite page, with deterministic fixtures created by the game engines. It did not connect to a room, backend, or external service.

Each fixture includes an opponent's actual acquired Tier 3 development card and one reserved card. For repeatability, only the fixture card's purchase cost is set to zero before buying through the engine. The reserved identity is removed from the public view; browser checks assert that the hidden card ID is absent. The images shown in the screenshots are served from the repository and returned HTTP 200.

## Checks performed in each variant and language

- Clicking the public status area opens the dialog; the same native button opens it with Enter when focused.
- Focus enters the dialog, Escape closes it and restores focus to the trigger, and the dialog close button works.
- The dialog shows the acquired card face, score, tokens, color bonuses, and a generic reservation back.
- The reservation back has a visible 34 × 44 px box; no reservation identity appears in the rendered view.
- The page has no horizontal overflow, browser console errors, or HTTP errors.

Detailed results and asset checks are in [browser-qa.json](browser-qa.json). Screenshots show the open detail dialog for all four combinations:

- [2-player Korean](splendor-2p-ko-dialog.png)
- [2-player Spanish](splendor-2p-es-dialog.png)
- [4-player Korean](splendor-4p-ko-dialog.png)
- [4-player Spanish](splendor-4p-es-dialog.png)

The temporary Vite fixture page used for these captures was removed; it is not part of the shipped app.
