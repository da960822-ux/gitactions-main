# Verification

The current revision uses 40 Marble spaces, six Golden Key spaces and 12 circulating event cards. Its automated checks include island escape/failed turns, train destinations and fares, fund deposits/collection, three building tiers, asset-based results, public-view isolation and legacy 18-space compatibility. The older 18-space browser evidence below remains regression evidence only; the fresh 40-space review is recorded separately below.

## Local checks

- `npm test -- --run` passed 123 tests across 23 files at 16:19 UTC on 2026-10-10. This includes all eight bilingual guides, legacy guide selection, reaction-only UI and server guards, Catchmind drawing/answers, Marble special rules and movement paths, feedback security/migration/expiry, and the HeroScene, GameRail, LandingMoments, and desktop notice tests. PGlite removes only unsupported `pgcrypto`/`pg_cron` declarations and supplies Supabase-like roles, `auth.users`, and `auth.uid()`.
- `npm run build` passed immediately afterward with the settled source, including TypeScript, the static site, and the authoritative shared game-engine bundle.
- `deno check supabase/functions/action/index.ts` could not be run in this environment because Deno is not installed. The shared engines used by Edge were bundled successfully, but a Deno check of the Edge handler and deployed Edge runtime remain unverified.

PGlite covers database policies and RPC behavior locally; it is not a live Supabase project. It does not verify Supabase Auth settings, deployed Realtime delivery, Edge Function secrets, the scheduled `pg_cron` job, or Cloudflare routing.

## Catchmind-only chat and translation

Every other game and the lobby expose five allowlisted reactions, without a text composer or translation notice. Old text/translated messages are hidden on those surfaces; earlier reaction messages are excluded from Catchmind answer/chat history. Client and authoritative HTTP handlers reject ordinary text outside Catchmind. Reactions are stored as original messages and never enter the translation path. Migration `202610100004_catchmind_translation.sql` independently prevents `reserve_translation` from allocating budget in a non-Catchmind room; tests also verify reactions cannot reserve budget and the Catchmind 400,000-character monthly guard still works.

Separate Korean and Dominican Spanish browser contexts joined an isolated fixture room at ports 54322/5191. The Spanish partner sent a heart through the UI and the Korean partner saw it after refresh. A direct authenticated request bypassing the client was rejected with `chat_not_allowed` in Marble. This verifies the shared authority and local HTTP protocol, not the deployed Deno Edge runtime. The fixture lacks Realtime, so it uses refresh for opponent delivery; no actual Google Translate call was made.

Root inspected the settled receiver screenshot and the corrected evidence JSON in `output/playwright/reaction-proof/`. The initially referenced YAML was a loading-state snapshot and was replaced as proof; the current JSON records the actual canonical message, sender, status and settled DOM entry.

## Fresh 40-space Marble review

Luna played a new room with separate Korean Min and Spanish Lis contexts through visible legal controls, without injecting a seed or state. The game ended naturally by bankruptcy on turn 62. Root inspected both terminal screenshots: Korean Min wins, Spanish Lis sees “Ganó tu rival”; their total assets are 2,947 and 1,863. Lis has 23 cash and cannot pay the landed property's rent. The run encountered eight event draws, island confinement and paid train routing. The common fund stayed at zero in this particular browser run; deposit/collection and the 120-turn asset comparison are covered by engine tests, not claimed as naturally exercised here.

Evidence is in `output/playwright/marble-40-final/`, including both final native screenshots, event captures, owned-cell captures and the final driver segment. `marble-40-actions-final.json` records the final 13-turn segment, not the complete run. Both desktop languages fit all 40 spaces at 1440×900 after board focus: KO ring y=75–835 and ES y=74–834. Owned Paris and La Vega retain readable names, flags, rent and tier markers. Guides remain below the board. Legacy 18-space rooms keep their existing state and have their own guide and new-room notice.

The current native motion recording `/mnt/data/marble-40-motion.mp4` is 6.12 seconds at 1920×1080/25fps and shows a real legal dice roll and pawn movement into a purchase decision. Root inspected a frame contact sheet and the media metadata. A bounded 18-roll recording search did not produce a new card draw, so this clip is not presented as an event-reveal demonstration. `/mnt/data/marble-event-reference.mp4` retains the earlier genuine 6.96-second dice/escape-pass reveal recording with the prior chat-strip layout, as an event reference only. Current reaction delivery is independently captured in `/mnt/data/game-reactions.png`.

## Browser review

The latest desktop finish supersedes earlier landing captures below. Fresh KO/ES captures at 1440×900 and 1920×1080 are in `output/playwright/polished/`, with delivery screenshots `/mnt/data/landing-{ko,es}-polished.png` and a 34.24-second 1440×900/25fps native interaction recording `/mnt/data/landing-motion-demo-polished.mp4`. All eight cards remain visible, assets load, pointer effects reset and reduced motion disables effects. The Impeccable static final scan returned `[]`. Stable production-preview checks in `output/playwright/app-polish/` cover actual Catchmind drawing controls, both expanded guide languages and return anchors, and readable Splendor card faces. Independent feedback-page checks are in `output/playwright/feedback/`.

## Latest landing motion verification

The final source was exercised in isolated Chromium 154 Playwright contexts. `output/playwright/landing-motion-upgrade/motion-check.json` records the conversation initially below the 1440×600 viewport, partial text after entering view, then both complete messages immediately after reduced motion is enabled. It also records the open/closed letter states, focus outline, tilt reset under reduced motion, and that the 1440px rail fits without scrolling while a 760px rail overflows. Its hidden-tab pause/resume note is explicitly untested. `/mnt/data/landing-motion-root-review.json` records the final hero loop names, envelope preview opacity change, orbit draw completion, and reduced-motion values: animations stop, transforms return to zero, and the orbit remains visible. Screenshots for Korean and Spanish at 1024×900, 1440×900 and 1920×1080, plus a Korean moments capture, are in `output/playwright/landing-motion-upgrade/`.

The final `baseline-audit.json` reports 35/35 checks passed with no browser errors. It confirms the envelope preview opens through keyboard, click, and hover; the messages reveal in order; reduced-motion mode resolves the orbit and text; and a private pair space opened in two isolated contexts, where the composer accepted a post and the entry appeared in readback. The rail drag was tested where overflow exists: at a 1024px viewport it measured 976px client width and 1,223px scroll width; dragging moved `scrollLeft` from 0 to 247 without changing the URL. The 40.64-second, 1440×900 Chromium capture `/mnt/data/landing-motion-upgrade.mp4` follows the interaction sequence in `landing-motion-upgrade-timeline.json` and records no page errors. Separate captures cover overflow dragging (2.92 seconds at 1024×900) and the two-context feedback post flow (4.60 seconds at 1440×900): `/mnt/data/landing-motion-upgrade-drag.mp4` and `/mnt/data/landing-motion-upgrade-feedback.mp4`. Full-page KO/ES captures are `/mnt/data/landing-motion-upgrade-ko.png` and `/mnt/data/landing-motion-upgrade-es.png`. Screenshots and JSON evidence are also in `output/playwright/landing-motion-upgrade/`. The earlier 34.24-second `/mnt/data/landing-motion-demo-polished.mp4` predates the final HeroScene/LandingMoments source and remains a prior visual reference.

## Mami/Papi copy and landing layout

The final Korean and Spanish copy/navigation audit passed 42/42 browser checks with no recorded errors in `output/playwright/landing-motion-upgrade/copy-audit.json`. It verified the three how-to blocks, that translation is mentioned only for Catchmind, the original-message fallback note, five readable letter paragraphs, both hero actions and return navigation from `/feedback`. The eight game cards and their descriptions/CTAs fit the initial 1440×900 viewport (card bottom y=887); the letter remains readable below the game row. There was no horizontal overflow or broken image at 1440×900, and all eight cards plus full copy fit at 1920×1080.

Final copy captures: `/mnt/data/mami-papi-home-ko.png`, `/mnt/data/mami-papi-home-es.png`, `/mnt/data/mami-papi-feedback-ko.png`, and `/mnt/data/mami-papi-feedback-es.png`. The p2 writer composer is shown at 1440×900 in `/mnt/data/mami-papi-feedback-composer-ko.png` and `/mnt/data/mami-papi-feedback-composer-es.png`; `output/playwright/landing-motion-upgrade/feedback-composer-capture.json` records the PGlite fixture, visible composer, no browser errors, and that no post was submitted. The independent feedback verification below covers invite membership, post creation/readback, role-based status changes, and seven-day cleanup. This copy audit checks the setup screen and visible wording; it does not claim a live Supabase deployment.

The final full suite and production build results are recorded under Local checks above. The latest hero motion checks at 1440×900 and 1920×1080 in Korean and Spanish are recorded in the preceding motion evidence; root visually confirmed the hero bounds fit at both widths.

All eight games now show an expanded localized guide below the board, before the game switcher. Room entry does not open a rules modal. At 1440×900, Korean and Spanish browser checks confirmed unobscured gameplay and working guide anchors. Evidence: `output/playwright/ui-audit/game-guide-{ko,es}.png`. The lobby retains an optional pre-game preview. The final guide production build passed.

The final landing interaction video is `output/playwright/final/landing-motion-demo.mp4`: 1440×900, 30 fps, 34.97 seconds. It includes entrance animation, pointer depth/glow, floating image/envelope layers, heart bursts, button/card hover, language switching and scrolling. A 280-frame animated GIF and fresh full-page Korean capture are alongside it; user delivery copies are in `/mnt/data/yeonseok-lisbeth-landing-*`.

The final universe hero was inspected in Korean and Spanish at 1440×900 and 1920×900. All five hero images loaded, no page/console errors or horizontal overflow were observed, and the envelope/heart controls remained inside the hero bounds. Pointer movement changed layer transforms and reset on leave; clicking the heart produced five particles. Reduced-motion mode disabled animation and pointer shifts. The game anchor and `/play` action worked. Final captures are `output/playwright/final/hero-{ko,es}-{1440,1920}.png`; an interaction recording is `output/playwright/final/hero-motion.mp4`.

Final Splendor layout captures at `output/playwright/splendor-final-layout/` show all three card tiers, bank controls, own tableau, and nobles at 1440×900. Its representative image is the user-supplied box cover; actual development-card and noble faces remain inside the game.

Playwright review passed at 1440×900 in Korean and Spanish. Both screenshots show all eight games in one horizontal row within the first viewport, with no gallery or horizontal overflow. All images loaded, there were no page errors, and reduced-motion mode suppressed the sparkle motion. The reviewed screenshots are `output/playwright/home/game-first-desktop-ko.png` and `output/playwright/home/game-first-desktop-es.png`.

The same-browser demo passed room creation, peer agreement, and the first Domino tile move. Jaipur, Splendor, and Minhwatu were opened in demo games and visually reviewed in `output/playwright/home/jaipur-demo.png`, `output/playwright/home/splendor-demo.png`, and `output/playwright/home/minhwatu-demo.png`. The latest Minhwatu screenshot shows source-attributed Hwatu card faces; the latest Splendor screenshot shows source card and noble faces mapped to the engine. Direct card controls passed an original Splendor-card reservation and a Hwatu play; the hand shrank from 10 to 9, all visible card images loaded, and neither page overflowed. Mobile game play is intentionally gated; the responsive home and gate evidence are recorded separately below.

## Responsive home and desktop-only game gate

The final Chromium responsive audit passed 109/109 checks with no runner or browser errors in `output/playwright/landing-responsive/responsive-audit.json`. The Korean/Spanish home was checked at 320×844, 360×800, 390×844, 430×932, 768×1024 and 844×390 touch viewports, plus 1440×900 and 1920×1080 desktop sizes. It verified no page-width overflow, visible navigation and language controls, loaded hero art, touch-scrolling the game rail while preserving vertical page scroll, and folding/reopening the letter. Captures include `/mnt/data/landing-responsive-mobile-{ko,es}.png`, `/mnt/data/landing-responsive-desktop-{ko,es}.png`, and `/mnt/data/landing-responsive-mobile-game-notice-{ko,es}.png`.

Game entry is gated by `(min-width: 1024px) and (pointer: fine)`. On both locales, phone, tablet, landscape-phone and wide touch/coarse contexts showed the localized notice for `/play?game=jaipur` and a direct `/room/:id` invite, with no PlayApp/room modules loaded. At 1024×768 with a fine pointer, both lobby and direct invite routes opened. The landing `/` and independent `/feedback` route bypass the game gate in source. This is desktop-only gameplay: the responsive home works on small screens, but no mobile gameplay is claimed. Chromium device emulation was used; no physical phone or Safari run was performed. The fixture does not provide Supabase Realtime, so this audit does not establish production opponent push delivery. Spanish copy received an editorial review with ASALE and Dominican public-site references, not native-speaker certification; see `docs/SPANISH-DO-REVIEW.md`.

No new motion-promo recording was made after the user canceled that video request; the earlier clips above remain prior interaction evidence. The final responsive result is represented by the JSON report and captures listed here.

## Seven-game two-player completion review

Luna agents completed seven games through visible legal UI actions with separate Korean and Dominican Spanish browser sessions against the PGlite HTTP fixture. Each flow included room creation, invitation/join, and both localized rules dialogs. Root inspected the action/result evidence and terminal screenshots, including correcting two agent narrative score/winner inversions; those were reporting errors, not engine changes.

| Game | Completed run and reviewed outcome | Evidence |
| --- | --- | --- |
| Jaipur | 116 actions; Korean host won two rounds | `output/playwright/local-fixture-jaipur-rerun/jaipur.json` |
| Splendor | 56 actions; Spanish player won 16–3 | `output/playwright/local-fixture-splendor-rerun/splendor.json` |
| Da Vinci | 73 actions; Korean host revealed all opposing tiles | `output/playwright/local-fixture-three-games/davinci.json` |
| Catchmind | Six rounds, real mouse drawing, strict accented answers; Spanish player won 12–11 | `output/playwright/catchmind-e2e/RUN.md` |
| Domino | Fresh 13-action rerun; Spanish player emptied their hand, remaining pips 0 vs 5; both terminal banners checked | `output/playwright/e2e/domino-rerun-p1.png`, `domino-rerun-p2.png` |
| Minhwatu | Fresh banner-visible rerun exhausted hands and deck; draw at 150–150 | `output/playwright/e2e/minhwatu-{ko,es}.png`, `output/playwright/e2e/RUN.md` |
| Marble | Natural 120-turn limit; Korean player won cash comparison 4,334–4,086 | `output/playwright/e2e/marble-{ko,es}.png` |

The Marble row above describes the pre-event engine. The newer eight-card version is reviewed separately below; do not treat the older score as evidence for the updated game.

The earlier blocked Domino screenshot was initially misreported: 19 vs 23 remaining pips makes the Korean player the winner under the lower-pips rule. The fresh rerun above supplies fully visible result-banner evidence. No runs forced engine state or manipulated seeds to finish. Because this fixture has no Realtime, the remote browser refreshed after opponent actions; WebSocket 404s and stale-version tick conflicts remain recorded. These completion checks do not establish production Realtime delivery, Supabase Auth/PostgREST, or deployed Deno Edge behavior. Original Rhythm gameplay was excluded as requested.

## Deployment limits

A live Supabase/Cloudflare deployment, two-device online session, real Google translation request or quota accounting, and complete original Rhythm gameplay have not been verified. Chromium accepted a load of the main SWF through Ruffle, with a hardware-acceleration warning; keyboard input, audio, and companion-SWF loading remain unverified. The source-page fallback is available, and the SWFs have no identified redistribution license. Supabase free projects may pause while inactive. Static files in `public/` are public to anyone who can reach the deployed site; Supabase room authentication does not protect the portrait or game images.

## Feedback browser verification

The independent feedback-invitation flow was reviewed in two isolated browser contexts against the local PGlite HTTP fixture. The owner created a private pair space, the Spanish partner joined from its invite, created a post, and the owner changed its status; a third identity was rejected. Closing an unrelated game room did not remove the post. Screenshots: `output/playwright/home/feedback-online-owner-ko.png` and `output/playwright/home/feedback-online-partner-es.png`. PGlite tests verify role isolation, legacy-post preservation, per-post seven-day expiry, and room-close independence. This fixture is not Supabase Auth, PostgREST, or Realtime, so deployed invitation behavior and cross-device push delivery remain unverified.

The Catchmind online protocol was also exercised in two isolated browser contexts against that fixture. The host saved a custom-only bilingual word list and a 60-second round; the guesser received only safe settings and no custom words or answer. The service rejected a forged `reveal-hint`, revealed a masked hint at the configured 20-second boundary, and scored a correct Spanish answer as 1 point for the drawer and 2 for the guesser. Screenshots: `output/playwright/home/catchmind-hint-online-es.png` and `output/playwright/home/catchmind-scoring-online-es.png`. This verifies the migration/RLS/action-bridge path and the bundled game authority against PGlite, not a deployed Deno Edge Function or Realtime delivery. Optimistic concurrent requests can return `stale_state`; clients refresh before retrying.

## Current game-polish source verification

On 2026-10-10 at 16:53 UTC, after the per-game sound, score-transition, and game-result updates, `npm test -- --run` passed 27 files / 151 tests. `npm run build` passed TypeScript project checks, Vite production bundling, and the shared Edge-engine bundle. The fresh static build is in `dist/`. This run includes CatchmindTable’s component tests and MinhwatuTable’s SSR tests. Catchmind checks include caller-specific role/phase labels, drawer-only tools and answer, masked guesser hints, terminal copy and public score values. Minhwatu checks include own-hand visibility and month matches, hidden opponent card IDs, engine-consistent yaku math/result scores, and capture choices restricted to the active seat.

This entry records the source test/build result; game-board browser polish checks remain separate. The full-suite/build result does not establish live Supabase Realtime or deployed Edge behavior.

The shared `GameValue` component received a separate isolated Chromium DOM check: `output/playwright/game-polish/game-value.json` reports 7/7 assertions and zero page errors. It checks no initial delta, signed increase/decrease, seat and round reset without fabricated changes, 1.6-second delta expiry, and unmount cleanup. The runnable check is `scripts/verify-game-value.mjs`. This validates the component behavior in Chromium, not every game’s rendered score layout or another browser engine.

## Catchmind game-polish browser check

The latest isolated browser run is `output/playwright/game-polish/catchmind-browser.json`: 13/13 checks passed with no page errors at 1600×1100. Two independent KO/ES browser contexts used the local PGlite HTTP action fixture. The run verified role/phase labels, hidden answer and public word length, selected color/pen/width, mouse drawing and peer canvas refresh, timer ticks without canvas clears, the new guess-row entrance, continued answer privacy after a wrong guess, and public answer/score after a correct guess. The observed deltas were +3 for the guesser and +1 for the drawer. Screenshots: `/mnt/data/game-polish-catchmind-ko.png` and `/mnt/data/game-polish-catchmind-es.png`.

This is browser evidence for the bundled client/action path against the PGlite fixture. The fixture has no Supabase Realtime, so the second browser explicitly refreshed to observe the committed canvas; it does not verify live push updates, deployed Supabase Auth/PostgREST, or the deployed Deno Edge function. The result is a round completion, not completion of the full six-round match.


## Final per-game polish review

After the Splendor gold-count regression test and final Rhythm/Hwatu readability changes, the full suite passed 27 files / 152 tests. The final TypeScript, Vite production, and Edge-engine build also passed. Root inspected current native-browser screenshots for all eight games. The SFX UI/component audit passed 17/17 checks with seven separate game cue profiles; Catchmind passed 13/13 browser checks. The three TableGames had no horizontal overflow or unexpected browser errors in Korean/Spanish at 1440×900. The updated Splendor token total includes gold once and its bank/tableau spacing is compact.

Rhythm has a centered original-player stage and localized manual-reload guidance. The follow-up preserved its 11:9 ratio through fullscreen and resize; the earlier blank-canvas observation did not reproduce in that follow-up. Escape may be consumed by Ruffle; the explicit fullscreen-exit control works. No automatic reload interrupts ongoing play. Original Rhythm full gameplay/audio and production Supabase Realtime remain unverified.


The final Domino/Marble/Minhwatu browser pass recorded 20/20 checks with no app/harness errors in `output/playwright/game-polish/boards-browser.json`. Each game used separate Korean/Spanish fixture sessions; checks cover initial layout, a legal placement/roll/capture action, and the opponent snapshot after refresh. Marble renders 40 spaces. The final Domino run uses the default two-human mode. Earlier fast-vote stale snapshots, bot-opening assumptions and a wrong Marble CSS selector were corrected in the harness before this final pass. This is a targeted polish check, not a new full-match completion run or proof of live Realtime.

The final Minhwatu KO/ES screenshots were refreshed after the readability fix: category/capture labels are dark on ivory, support captions are 12px, and both views have no broken images or horizontal document overflow.
