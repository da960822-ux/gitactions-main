# Five game audit fixes — 2026-10-23

## Scope and skills

All five findings from the game skills audit are fixed. The existing eight games and Lisbeth domino rules are preserved. Work used the game-ui-ux layout-and-flow, input-systems, game-feel, and create-game-assets fallback/provenance guidance. Luna handled keyboard drawing, localized manuals, and asset fallback work in parallel; the parent agent integrated and verified it.

| Finding | Change | Verification |
| --- | --- | --- |
| Splendor focus lost after reservation | Restore focus to the reserved card, or remaining market card after the focused action disappears. Preserve outside focus and Escape/cancel behavior. | Real keyboard reservation ended on reserved card t1-13, not BODY. Helper tests cover removal, market fallback and no focus stealing. |
| Marble action behind 54 controls | Add a focus-visible link before the board to the enabled current action, or the action panel while waiting. | Tab from game navigation reached the link; Enter focused the dice button in Korean and the waiting panel in Spanish. |
| Catchmind pointer-only drawing | Arrow cursor, Space pen toggle, Enter fill/pick/dot, Escape and blur finish the stroke. Share existing ordered draw queue with pointer input; finish old strokes when switching input. | Keyboard line visible in canvas; Enter fill succeeded, pick returned to brush, Tab ended the stroke. Spanish opponent demo view received the fill and line without exposing the answer. KO/ES manuals updated. |
| Missing image presentation | Readable month/flower/kind-or-badge/points fallback for Hwatu cards and illustrated guide; failed pawn image uses existing SVG artwork. | Local server deliberately returned HTTP404 for January bright and Maltipoo. Text card and SVG pawn rendered; switching to another card/pawn loaded normal images. Guide had zero broken image elements after fallback. |
| Broken Hwatu credits | Add real author/license/source links to KO/ES guide; correct attribution JSON filename. | Browser showed authors and four real links; tests assert attribution and source-verification files exist. |

## Checks

- 31 test files, 425 tests passed (game engines, UI, clients, authority, audio, latest companion regression).
- `npm run build` passed, including TypeScript, Vite, static routes and edge generation.
- `git diff --check` passed.
- Existing build warnings remain: dependency `use client` directives and large chunks.
- Latest published homepage source d532caa is retained on top of the previously merged main game changes.

## Limits

Browser checks used the same-browser demo and real HTTP404 asset fixture. Live Supabase multiplayer and assistive hardware/screen readers were not exercised. No new dependency, game engine rule, sharing policy or Site was introduced.
