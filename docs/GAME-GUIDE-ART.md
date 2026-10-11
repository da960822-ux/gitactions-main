# Beginner guide images

Six WebP images support the authorized Da Vinci, Catchmind and Marble beginner guides. Korean uses `-ko`; Dominican Spanish uses `-es`. They show the real browser game components and assets, not substitute emoji or invented game interfaces. Keep the localized alt text in the application rather than baking additional instructions into an image.

## Frame and provenance

Captured October 11, 2026 from the local Vite demo on port 5191 using Chromium `/usr/bin/chromium` and Playwright. Every room, nickname, hand and drawing was a newly created synthetic local demo. No remote service, real player identity, room invitation or multiplayer secret was captured. The room header and peripheral UI are outside every crop. Each locale was captured separately using the local demo's first seat and language preference, so Spanish examples do not contain Korean controls.

Sources are the existing rendered `DaVinciTable.tsx`, `CatchmindTable.tsx` and `MarbleBoard.tsx` components. Existing game art retains its existing provenance and rights; these screenshots introduce no third-party licensed assets or new license claims. Marble art comes from `public/images/marble/`, including the world map, city miniature family, property card frame and pawns. As recorded in [GAME-ART.md](GAME-ART.md), city miniatures are illustrations, not verified photographic representations of landmarks. Catchmind's house is an original synthetic practice drawing, with the answer hidden to avoid claiming that the drawing matches a sampled word.

The screenshot layout hides irrelevant score/setup/history panels. Da Vinci preserves both racks and the actual target/number/submit controls. Catchmind preserves the drawing canvas, palette and real tool controls. Marble preserves the 40-space board, roll button and selected Santo Domingo property card; its existing dashboard panels are arranged side by side to keep the example legible. These layout changes occurred only in the disposable screenshot browser, not in production code or styles.

PNG source captures were retained in `/tmp/guide-sources/`; capture helpers are `/tmp/capture-guides-three.mjs` and `/tmp/capture-guide-marble.mjs`. Sources were inspected before export. Pillow 12.3.0 converted screenshots to RGB, resized proportionally to width 900 with Lanczos, and exported WebP quality 87, method 6. No image generation or retouching was used. Files were reopened for verification, checked at native display size, and asserted to be width 900 and below 180,000 bytes.

| File in `public/images/guides/` | Source crop | Dimensions | Bytes |
|---|---|---:|---:|
| davinci-ko.webp | `.dv-table`, selected rival target and number 4 | 900 × 326 | 17,718 |
| davinci-es.webp | `.dv-table`, selected rival target and number 4 | 900 × 326 | 18,310 |
| catchmind-ko.webp | `.cm-play-area`, synthetic house and drawing tools | 900 × 539 | 13,452 |
| catchmind-es.webp | `.cm-play-area`, synthetic house and drawing tools | 900 × 539 | 13,968 |
| marble-ko.webp | `.mp-layout`, board, roll control, Santo Domingo card | 900 × 397 | 47,208 |
| marble-es.webp | `.mp-layout`, board, roll control, Santo Domingo card | 900 × 397 | 48,648 |

## Accessible alt suggestions

| Game | Korean | Dominican Spanish |
|---|---|---|
| Da Vinci | 상대의 숨은 타일과 숫자 4를 선택한 실제 게임판. 오른쪽 버튼으로 추측을 확정해요. | Mesa real con una ficha oculta del rival y el número 4 seleccionados; confirma tu intento con el botón de la derecha. |
| Catchmind | 집을 그린 실제 그림판. 오른쪽에서 펜, 색, 굵기와 지우개를 골라요. | Lienzo real con una casa dibujada; a la derecha eliges el pincel, el color, el grosor y el borrador. |
| Marble | 실제 40칸 보드와 주사위 버튼, 산토도밍고 도시 카드. 도시 카드에서 가격과 건설 단계별 통행료를 확인해요. | Tablero real de 40 casillas, botón para lanzar los dados y carta de Santo Domingo con su precio y renta por nivel. |

The guide text supplies the goals and three steps; these images show where those actions happen. They are explanatory stills, not current-state previews. No other game's guide or artwork was changed.
