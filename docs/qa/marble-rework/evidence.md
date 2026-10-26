# Marble QA screenshots

Captured against the local QA branch in a real Chromium browser using Playwright. The Vite development server was served from this checkout; Chromium was the environment's existing `/usr/bin/chromium` executable (no browser download/install was attempted). Browser viewport was 1280×800. Screenshots are the raw PNG outputs; no cropping, compositing, or image edits were applied.

| Image | Route/state | Capture dimensions | Evidence |
|---|---|---:|---|
| `two-player-initial-1280x800.png` | AI 1v1, first roll phase | 1280×800 viewport | The whole board and action panel are in view; center CTA is “주사위 굴리기”. |
| `two-player-built-full-page-1280x1141.png` | AI 1v1, immediately after building level 1 in Puerto Plata | 1280×1141 full-page screenshot | Center shows current stage/toll, next build preview and persistent −70 receipt; board tile shows stage 1 and toll 80. Page height includes lower help/history content. |
| `team-initial-roll-1280x800.png` | AI 2×2 team, first roll phase | 1280×800 viewport | Center CTA is “주사위 굴리기”; optional loan remains secondary in the action sidebar. |
| `team-built-1280x800.png` | AI 2×2 team, immediately after building level 1 in Puerto Plata | 1280×800 full-page capture, which fits viewport | Center shows current stage/toll, next build preview and persistent −70 receipt; board tile shows stage 1 and toll 80. |

Both purchase/build flows were driven through the visible UI, not injected game state. In each run, the player landed on Puerto Plata, purchased it for 180, then accepted the first build for 70; the displayed toll changed from 40 to 80. The team screenshot also displays the corresponding player-to-bank transfer.
