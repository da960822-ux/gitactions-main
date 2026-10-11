# Rhythm polish

The original Music Talk Talk SWF remains the game. Its 11:9 stage sits inside a dark concert frame; fullscreen keeps the toolbar available and fits the original stage ratio to the screen. Loading, ready, error, retry, and fullscreen failure each have visible text. The keyboard-focus button moves focus through the Ruffle host into its game container, verified against the installed Ruffle build. A compact arrow/space guide has short key-press feedback. Those observations do not prevent, rewrite, or time keyboard events.

Rhythm adds no score or turn result to the room, and it does not synthesize game sounds. The SWF retains control of its own audio. The shared audio controller suppresses app-generated music and effects while this game is selected; this component does not own that controller.

Verification points: `RhythmBoard.test.ts` checks singleton loading under StrictMode, exact-case companion-resource rewriting, and that keycap feedback does not cancel key events and clears on release. TypeScript passes. A real isolated browser check confirmed that the Ruffle host can receive focus and transfers it to the internal game container. Full-game keyboard behavior, soundtrack playback, and all browsers have not been verified; the source page itself warns that its “Start” button may not work reliably.
