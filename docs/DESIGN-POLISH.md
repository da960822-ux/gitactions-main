# Desktop finish review

Method: dual-agent (A: `/root/luna_ui` · B: `/root/luna_motion`). Target: `src/landing/Landing.tsx`, with the lobby, room, inline guide and independent feedback page included in the finish path. The user's latest cosmic reference and desktop/game-first scope govern the direction.

## Assessment before edits

The named couple, preserved portrait, bilingual voice and cosmic rose environment make the page specific to this pair. The composition was nevertheless unfinished: free-floating props did not share the content grid, Spanish card wrapping pushed the row below the first viewport, and the lower sections shared generic box styling. App arrival then changed to a pale shell with residual green colors.

| Heuristic | Score / 4 | Evidence |
| --- | --- | --- |
| Status visibility | 2 | Demo status appears after room entry |
| Real-world match | 3 | Named couple and recognizable games |
| User control | 3 | Working game links and language switch |
| Consistency | 2 | Home/app palette and typography drift |
| Error prevention | 2 | Landing does not establish service availability |
| Recognition | 3 | All eight game choices visible with descriptions |
| Efficiency | n/a | Landing, not a repeated operation surface |
| Aesthetic hierarchy | 2 | Busy prop placement and generic lower boxes |
| Recovery | 2 | Few recovery states exposed on landing |
| Help/documentation | n/a | Guides belong inside games |

Initial design score: 19/32. This is reviewer judgment, not an automated quality certificate. Eight visible choices are a deliberate user requirement; additional choice groups should not compete with the game rail. First-time players need legible unfamiliar game names; a partner writing a message needs a clearly separate feedback destination.

## Browser and detector evidence before edits

Fresh Korean/Spanish contexts were checked at 1440×900 and 1920×1080. Static Impeccable detect exited 0 with `[]`; live detector overlays reported four categories: dark-glow, cream-palette, pulsing-dot, buried-raster. Glows/candle/star motifs are explicitly requested; the cream report refers to root CSS rather than the rendered dark landing. They are not evidence that the visual layout is good or bad. Audit tabs were isolated and the detector server was stopped afterward.

No horizontal overflow or page/console errors were seen. Focus rings, pointer reset and reduced motion worked. Before editing, the Spanish game row ended at y905 on a 900px viewport versus y870 in Korean. Game titles were 13px, subtitles 11px and lower body copy 12px. Solid card subtitle contrast measured 8.41:1; the principal weakness was size/hierarchy rather than that contrast. Initial raster resources totalled approximately 11.3 MB, supporting lossless derived-image optimization if it saves bytes.

## Priorities carried into polish

1. P1: reserve separate copy/art zones on a bounded grid shared by the hero and game rail; keep props away from the headline and inside the art stage.
2. P1: show the complete eight-game row in both desktop languages, with readable labels, consistent baselines and breathing room.
3. P2: distinguish the personal letter material from the chat explanation; localize its signature and shorten implementation-heavy copy.
4. P2: harmonize the app shell, lobby, chat and below-board guide with the midnight rose world, while preserving the actual game surfaces and card faces.
5. P2: improve feedback text/control size and contrast without changing its private membership or seven-day post lifecycle.

Questions skipped: the user already specified the visual reference, desktop-only priority, all affected surfaces and authorization to implement the finish. No new product decision is needed.

The correction pass must confirm both languages and desktop sizes, loaded assets, keyboard focus, reduced motion, working navigation, unobscured gameplay and a guide return anchor. An automated clean scan and unit suite do not establish publisher-original game quality or live two-device delivery.

## Completed correction pass

The hero now reserves copy and artwork zones within the same bounded grid as the eight-game rail. All eight cards fit through y870 in both languages at 1440×900, with larger 14/12px title/subtitle text. The personal letter has its own paper material and localized signature, while chat uses a restrained dark surface. The app, below-board guide and feedback page received typography, spacing and contrast corrections. Catchmind's light canvas and Splendor's printed faces retain their own board palettes. Guides remain fully expanded below play, with a return-to-board anchor.

Fresh landing checks covered KO/ES at 1440×900 and 1920×1080, assets, bounds, focus, pointer reset and reduced motion. Stable-preview captures also cover actual Catchmind controls, both guides and Splendor cards. The final Impeccable static scan returned `[]`; visual review, not the scan alone, determined these corrections. Official Impeccable critique/audit/polish guidance, Taste redesign guidance and the supplied visual brief were applied. A fresh 34.24-second landing interaction recording is delivered as `/mnt/data/landing-motion-demo-polished.mp4`.

The initial 18-space Marble update used collector-style city art and distinct SVG pawns rather than emoji, with eight real event effects. This version was rejected as too small and missing island/train rules. Its screenshots and checks are archived as regression evidence, not final delivery. The replacement follows the verified 40-space classic layout, with six explicit golden-key tiles, 12 circulating cards and actual island/train mechanics. Root inspected fresh KO/ES owned-cell and terminal captures, including the natural bankruptcy result on turn 62. Both languages fit the entire ring at 1440×900 after board focus. City names, flags, rent and tier markers share a compact tile hierarchy; opponent-only states no longer instruct the local player to choose an island/train action.

Catchmind alone retains text chat, exact-answer input and automatic translation. Other games and the lobby expose a five-expression SVG reaction strip below the board, without consuming a sidebar column or showing old text/translated messages. The strip is 106px tall in the verified 1440px-wide room. The independent partner inbox remains a separate page. Reduced motion disables reaction popping and uses immediate board focus.

A broader scan including Marble CSS reports one `border-accent-on-rounded` warning on the property color strip. The strip remains a visual identifier for paired cities. The current 40-space variant allows upgrades to any owned city; completing a color set is required only by the legacy 18-space rules. Tile labels prioritize city names, prices and ownership rather than repeating color captions.

## Landing motion implementation

The scene and game artwork are static local images. The hero's sense of depth comes from DOM layers: mouse movement shifts the backdrop, portrait and props by small amounts, and tilts the portrait by up to 1.8 degrees. CSS animations move decorative orbit and light details. This is pointer-driven parallax and rotation over a flat composition, not a live 3D model or rendered 3D scene. The game rail separately applies up to 5 degrees of mouse-position card rotation, scheduled through `requestAnimationFrame`; pointer exit and blur restore neutral values.

The lower chat illustration is an inert bilingual example, not a working chat. Its two messages type once when the section first enters the viewport; timers pause while the document is hidden. Enabling reduced motion at runtime cancels the typing and shows both full lines immediately. The letter's envelope flap rotates on hover, keyboard focus and click; its copy unfolds through a top-down clip reveal while retaining its layout space, and its separate feedback link remains available. Reduced-motion styling removes the reveal and flap transitions.

Both the hero and game rail listen for reduced-motion preference changes and reset their inline pointer transforms. The rail also tracks its temporary drag-suppression timers and cancels them, along with pending animation frames, on unmount. CSS disables the rail's hover transforms and the hero's decorative animation when reduced motion is active.
