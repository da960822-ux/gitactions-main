# Game sound effects

There is no app-generated BGM. `src/audio/audio.ts` is a small browser-only Web Audio SFX controller; it downloads no audio, service, or library. Preferences are local per game under `dos-sfx-v1`, with a separate off-by-default toggle and volume for Da Vinci Code, Catchmind, Domino, Jaipur, Splendor, Minhwatu, and Marble. Rhythm has no app SFX preference: its original Ruffle player owns its audio.

Sound starts only after the user opens sound settings or otherwise calls `unlock()` from a gesture. `setScene(gameId)` only changes which game's effects are allowed; it never starts a sound. Cues require the same active game, enabled SFX, a running unlocked context, and a visible page. Scene changes stop old voices; hidden tabs stop voices and suspend the context; `dispose()` stops nodes, removes the visibility listener, and closes the context. Rhythm suppresses app-generated SFX. No setting enters the room snapshot.

Each game has its own frequency register and cue treatment. Da Vinci uses restrained triangular reveal/guess notes; Catchmind stays quiet during drawing and only cues correct answers, turns, and round edges; Domino gets a low triangular tile thud; Jaipur uses two filtered card-acquisition flutters and a three-note coin rise on sale; Splendor gets a paired high sine ping when selecting gems, a distinct ascending purchase chime, and a filtered card flick on reserve; Minhwatu uses a filtered card flutter; Marble uses filtered dice rattle and a low event thump. The single short noise buffer is made once per AudioContext and reused. The active-voice cap is eight.

The cue vocabulary is `select`, `place`, `draw`, `sell`, `buy`, `reveal`, `correct`, `error`, `turn`, `win`, `lose`, `dice`, and `event`. Callers play cues only after an action succeeds or an authoritative public-view change.

## Verification points

- Per-game preferences default off, persist independently, clamp volumes to 0–1, and tolerate malformed or unavailable storage.
- Selecting a scene does not create a context or play a cue; only the explicit gesture unlock does.
- The active game's volume alone controls the single SFX gain; a different game's preference has no effect.
- A cue is ignored before unlock, when muted, on another game's scene, while hidden, and during Rhythm.
- Domino placement, Jaipur acquisition/sale, Splendor gem selection/purchase/reserve, Minhwatu card draw, and Marble dice/event cues have distinct envelopes or short filtered textures; the shared texture buffer is reused and no loop or timer produces ongoing sound.
- Catchmind drawing stays silent; correct-answer and round/result edges are the audible events.
- Hidden-page transition stops active voices and suspends the context; returning resumes silently until another game event occurs.
- `dispose()` stops remaining voices, removes the visibility listener, and closes the context.
- Start with a low volume when enabling a game's effects; every game is muted by default.
