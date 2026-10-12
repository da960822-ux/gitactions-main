# Desktop final capture — source 32d0a3d

This continuous desktop recording was captured from the exact source commit `32d0a3d52c2304602d143e2897cfbcb6ab93a2af` on `local/lusion-space-restart-20261012`, at `http://127.0.0.1:5265/landing-preview.html`. No application source files were changed for this capture.

## Video

- `landing-motion-1440x900.mp4`: H.264, 1440×900, 25 fps, 145.12 s, 3,628 frames, 32,336,141 bytes.
- `landing-motion-1440x900.webm`: original Playwright recording, VP9, 1440×900, 25 fps, 145.12 s, 3,628 frames, 67,423,412 bytes.
- The MP4 is a full-length re-encode of the original WebM. It has no cuts, reordered sections, speed changes, or audio track.

## Sequence and frame references

Times are approximate seconds in the video. PNGs in `frames/` are decoded screenshots from the recording, not separate or freshly rendered screenshots.

- Entry and settled hero, around 15–42 s.
- Foreground heart drag, visible cursor ring and displaced heart, around 63 s: `frames/heart-drag-63s.png`.
- Spring-returned heart and pointer moved away, around 68 s: `frames/heart-return-68s.png`.
- Scroll reaches the full eight-card game rail, around 79 s: `frames/game-rail-79s.png`.
- Spanish-language letter open, around 138 s: `frames/letter-open-138s.png`.
- Letter closed, around 144 s: `frames/letter-closed-144s.png`.

The sequence includes a 9-second idle, 0→720px scroll and return, KO→ES→KO→ES language changes, and Spanish letter open/close. All eight game-art backgrounds were present at the game rail. The dragged heart moved by about 152×87 px and its measured spring offset returned to zero.

## Capture limits and diagnostics

The video preserves the browser's native timing. The run took 145.43 s in this container even though deliberate waits are short. Chromium had no GPU device (`/dev/dri` is absent) and used software WebGL; the page's reported render count advanced only 17 frames during the 9-second idle. This produces visible held/stuttering scene frames in the recording. The video was not accelerated or edited to conceal that limitation.

All decoded DOM images succeeded, with no image HTTP errors and no failed requests. The browser recorded one generic console `404 (Not Found)` line. The preview's `/favicon.ico` endpoint independently returns 404, making it the likely source; this recording did not capture the console line's request URL, so that match is not confirmed. No page exceptions were recorded.

Machine-readable sequence and asset observations are in `capture-report.json`.
