# Gate 1 baseline contracts for browser QA

Baseline source: `/tmp/yl-gate0-audit`, commit `24a6ec69eea712f632ee80e8f3cae863d38c769f`. Read-only contract review; this file describes expected behavior for the future browser QA pass.

## Eight game routes and languages

`src/games/catalog.ts` defines exactly these eight game IDs. Gallery launch links are `/play?game=<id>` (`src/landing/gallery/GameGallery.tsx`); the app also accepts `/room/<roomId>` for the game room (`src/app/App.tsx`, `src/app/PlayApp.tsx`). The locale is stored as `dos-language` in localStorage: `ko` or `es`; Spanish page language metadata is `es-DO`.

For each of the eight `/play?game=...` links below, verify the localized game title and instructions in Korean after setting `dos-language=ko`, then Spanish after `dos-language=es` (16 game/language assertions total). Preserve IDs and route targets:

| Game ID | Launch route | Korean / Spanish title |
| --- | --- | --- |
| `davinci` | `/play?game=davinci` | 다빈치 코드 / El código Da Vinci |
| `catchmind` | `/play?game=catchmind` | 캐치마인드 / Adivina el dibujo |
| `domino` | `/play?game=domino` | 도미노 / Dominó |
| `jaipur` | `/play?game=jaipur` | 자이푸르 / Jaipur |
| `splendor` | `/play?game=splendor` | 스플렌더 / Splendor |
| `minhwatu` | `/play?game=minhwatu` | 민화투 / Minhwatu |
| `marble` | `/play?game=marble` | 부루마블 (우리 규칙) / Marble · juego de bienes raíces |
| `rhythm` | `/play?game=rhythm` | 뮤직톡톡 / Music Talk Talk |

Shared route and display checks: `/` opens the landing; `/feedback` remains reachable in both locales; `/play` opens the lobby; a valid `/room/<roomId>` still opens the invite/room flow. Mobile allows the landing and letter, lobby, and room/join flow; only Jaipur may be played on mobile. Direct mobile game routes for other games must retain the existing desktop notice/guard. Desktop play gate is `(min-width: 1024px) and (pointer: fine)` (`src/core/display.ts`). Preserve the eight-game catalog and game behavior; these UI changes must not mutate rules, private views, online/demo distinction, or free-tier guards.

## Letter behavior to preserve

Landing navigation links to `#papi-letter`; the letter section keeps `id="papi-letter"`. The fold control remains a keyboard-operable button with `aria-expanded` and `aria-controls="moment-letter-copy"`; clicking/tapping toggles folded/open state without navigating away. Check visible body and signature content in both locales, `aria-hidden` on collapsed content, and that the hero’s letter link still reaches the same section. Preserve the five Korean and five Spanish paragraphs from `src/copy/home.ts`, plus title/address/signature and localized control labels (`편지 접기` / `편지 펼쳐 보기`, `Doblar la carta` / `Abrir la carta`). The reduced-motion experience remains readable and operable.

## Feedback behavior to preserve

Landing and room links still reach `/feedback`. The route retains its language switch, Korean and Spanish copy, document language (`ko` / `es-DO`), and localized page title. With no space selected, preserve create-private-space and join-by-invite-code flows and the demo-only notice when online feedback is unavailable. With `?space=<id>`, preserve loading/error/empty/list states, private access behavior, status controls, seven-day retention messaging, and invite-link copy. Preserve user-entered feedback and avoid clearing or altering stored feedback as part of presentation work. Do not use external side effects during baseline QA; exercise demo behavior only unless online QA credentials and explicit scope are already provided.

## Evidence files

- `protected-file-sha256.json`: SHA-256 and byte length for every Git-tracked baseline file except the explicit folded-hero allowlist.
- Source contracts: `src/app/App.tsx`, `src/app/PlayApp.tsx`, `src/app/FeedbackRoute.tsx`, `src/app/FeedbackPage.tsx`, `src/core/display.ts`, `src/games/catalog.ts`, `src/landing/Landing.tsx`, `src/landing/LandingMoments.tsx`, and `src/copy/home.ts` in the baseline checkout.
