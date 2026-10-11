# Ponytail repository audit — 2026-10-11

What this repo does: This is a private-use Korean/Spanish two-person mini-game website. The static landing is separate from game rooms. We assumed two human players, bounded card decks and one free-tier backend, not a public matchmaking service.

The user requested the dedicated `.agents/skills/ponytail-audit/SKILL.md`, fixes, and a push. We installed the exact upstream audit and review skills, mapped the repository in three delegated scopes and a root integration scope, then fixed verified findings. Report-only is the audit default; the user's explicit fix request authorized the implementation pass.

## Map

`src/main.tsx` → App → static Landing or lazy PlayApp/FeedbackRoute. RoomClient chooses same-browser demo or Supabase from public configuration. Online actions pass through authenticated Edge → authoritative engine → version-checked transactional SQL commit → per-seat views → room snapshot/Realtime refresh. Only Catchmind accepts free text and translation; other games accept reactions. Feedback has independent private spaces and seven-day post retention. Vite builds the browser; esbuild generates the Edge engine bundle. The registry contains seven TypeScript engines; Rhythm uses the vendored original SWF/Ruffle player.

Root audited core room client, action authority, integration/configuration and changes. Sol audited engine flows and frontend call graphs. Luna audited Edge/DB boundaries, asset references and maintenance scripts. Changes were reviewed against the dedicated `ponytail-review` skill.

## Must fix — fixed

1. **Queued actions can cross into another room** (`src/core/client.ts`, `invoke`/`invokeNow`).
   - What this is: Online actions are queued so one player cannot race their own pending requests.
   - Problem: A queued action reads the current room ID when it finally sends. Opening another invite while the first request is pending can send the old queued action to the new room.
   - Fix: Capture the room ID at enqueue time and reject an operation if the active room changes before either send attempt. A regression test holds the first request, switches rooms, and confirms the old second action is never sent; a fresh new-room reaction still works.
   - If we skip it: A user can unintentionally act in a different room. Backend membership checks still restrict which rooms that user can change.

2. **Claiming a Splendor noble mutates the previous engine snapshot** (`src/games/splendor.ts`, `apply`).
   - What this is: Buying a card can claim one noble automatically or offer a choice among qualifying nobles.
   - Problem: The new state shares `availableNobles` with the input. Deleting the claimed noble also removes it from the earlier state.
   - Fix: Copy that collection before changing it. Two regression cases cover automatic and selected claims and compare the complete previous state.
   - If we skip it: Direct engine consumers can hold an earlier state whose score and noble list no longer agree. The online authority already clones input, so this is not evidence of remote data corruption.

3. **A Splendor player view shares nested bonus objects with state** (`src/games/splendor.ts`, `view`).
   - What this is: The public board shows both players' permanent gem bonuses.
   - Problem: Only the outer map was copied. Changing `view.board.ownedBonuses.p1.white` changes the underlying state.
   - Fix: Copy each player's nested bonus object. The regression modifies returned view data and checks the original state and the other seat's view.
   - If we skip it: A same-process view consumer could affect later purchase validation. The audit did not find the current UI performing that write.

## Should fix — fixed

4. **Unreachable old board UI and its styles remain in the room code** (`src/app/PlayApp.tsx`, former `GameBoards.tsx`/`BoardGames.tsx`).
   - What this is: Each of the eight supported game IDs already has a dedicated active board.
   - Problem: GenericBoard retains obsolete alternate implementations behind a branch none of the valid game IDs reaches. A forwarding BoardGames component is also kept mainly for historical tests. The unused GameArt switch has no callers.
   - Fix: Remove obsolete implementations, fallback actions and matching dead CSS. Import active boards directly. Extract the still-used HwatuCard unchanged, retain its active styles, and move useful historical assertions to active components instead of discarding coverage.
   - If we skip it: Maintainers can fix the wrong board and preserve duplicate UI and styles that users never see.

5. **Catchmind repeats the existing seeded shuffle algorithm** (`src/games/catchmind.ts`, `dealWords`).
   - What this is: Word choices are shuffled reproducibly from a game seed.
   - Problem: The same shuffle loop exists in `src/core/types.ts`.
   - Fix: Reuse that existing function. Full initial states for seeds 0, 1, 19 and 4294967295 were compared and stay identical.
   - If we skip it: Two implementations must be maintained together for the same behavior.

6. **Browser checks depend on one Codex machine** (`scripts/verify-*.mjs`, `capture-landing-upgrade-screens.mjs`).
   - What this is: These optional scripts check browser visuals and state-driven feedback.
   - Problem: An absolute Playwright module path and fixed system Chromium path fail on a fresh developer machine. A fixed artifact location also writes outside the project.
   - Fix: Use a small shared launcher with normal package resolution, optional module/browser overrides and a clear prerequisite error. Keep generated reports under ignored output by default.
   - If we skip it: Another session can clone the source but cannot run these checks without editing each script.

7. **Canceled recorders and obsolete Splendor art remain** (`scripts/record-*.mjs`, former `public/images/splendor-modern/`).
   - What this is: Two one-off scripts record the canceled video request; three assets belong to an abandoned card-art direction.
   - Problem: Whole-tree searches find no current code caller for the two scripts or the atlas/manifest files. Active Splendor uses the existing 90 card faces and 10 noble images elsewhere.
   - Fix: Remove those five files. The discarded atlas files total 733,112 bytes. Preserve source masters, active game art and installed skill assets.
   - If we skip it: Future work can accidentally pick obsolete art or revive an explicitly canceled deliverable.

## Retained deliberately

Actual AI/team modes, old saved-state compatibility, card identities, rule variants and user-installed skills have real callers or explicit user requirements. We did not delete them for being complex. Service-role/auth/version/RLS checks and translation spending limits stay in place. The generated Edge engine file is retained because deployment imports it; the production build refreshes it from source. Build output, dependencies, browser caches and credential files stay ignored. Small bounded deck operations do not justify a new performance framework.

## Validation and limits

Final validation and cleanup totals are appended below once the combined source is frozen. Engine-scoped verification passed 118 tests, and new Splendor regressions were observed failing before their fixes. The dedicated root client regression passed along with its six existing online client tests.

Not checked: Production Supabase Realtime, physical device audio, concurrent PostgreSQL load, complete original-source comparison of every dictionary/card row, every nested object alias in every game view, or commercial visual quality. Earlier visual layout issues remain separate work in `QUALITY-VISUAL-AUDIT.json`; this cleanup is not a game art redesign. Audit findings are concrete, not a claim that all possible debt is gone.

## Combined final verification

- Full suite: **326/326 passing**; frontend scoped178 and engine/authority scoped118 passed before integration. Four new regression cases are included; migrated frontend checks retain their count.
- Production TypeScript/Vite/Edge build passes; generated Edge bundle includes the engine fixes. `git diff --check` passes.
- Chromium demo smoke opens all eight game boards in both KO/ES (16 initial states), without missing board images or uncaught page errors. This invokes the actual demo client and mounts active Room components, not a live two-device match. Ruffle logs character-ID-collision messages from the original SWF; this pass does not certify Rhythm emulation or audio.
- The portable GameValue browser script runs with explicit installed-module/Chromium overrides: **7/7 checks**, no page errors. It checks positive/negative deltas, no invented initial/reset gains and cleanup. The remaining three browser scripts passed syntax checks, not fresh full execution.
- Active original Splendor faces and Hwatu faces are kept. The extracted Hwatu component body and active styles were compared to their previous definitions; native rendering was inspected.
- Frontend cleanup alone removes **1,210 net lines**; no package dependency was added or removed. Untracked/ignored output and browser caches are not committed; they are test evidence rather than production source.

Optional direct-script browser prerequisite: `npm install --no-save --no-package-lock playwright` and `npx playwright install chromium`. This is a developer tool, not an application dependency. `PLAYWRIGHT_MODULE` accepts another installed module specifier, `PLAYWRIGHT_EXECUTABLE_PATH` overrides the browser, `PLAYWRIGHT_NO_SANDBOX=1` is for environments that require it, `LANDING_URL` selects the running Vite URL, and `PLAYWRIGHT_ARTIFACT_DIR` overrides optional artifact copies. The existing vendored Playwright CLI wrapper remains available without changing the app dependency list.

Verdict: Ship the verified corrections and dead-code cleanup. Continue the separately recorded game-layout redesign; cleanup does not establish commercial visual quality.
Lean: Runtime source and scripts are reduced by 1363 lines; zero dependency changes. The audit/report skill instructions added to the repository are documentation, not runtime code.
Not checked: The production/live and original-data limits above remain.
